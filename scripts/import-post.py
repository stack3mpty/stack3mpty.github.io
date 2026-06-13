#!/usr/bin/env python3
"""Import an external Markdown file as a Hugo post bundle."""

from __future__ import annotations

import argparse
import datetime as dt
import re
import shutil
import sys
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlparse


FRONT_MATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*(?:\n|\Z)", re.DOTALL)
IMAGE_RE = re.compile(r"(!\[[^\]]*\]\()([^) \t\n]+)([^)]*)(\))")


def split_front_matter(text: str) -> tuple[dict[str, object], str]:
    match = FRONT_MATTER_RE.match(text)
    if not match:
        return {}, text.lstrip()

    meta = parse_simple_yaml(match.group(1))
    body = text[match.end() :].lstrip()
    return meta, body


def parse_simple_yaml(raw: str) -> dict[str, object]:
    meta: dict[str, object] = {}
    current_key: str | None = None

    for line in raw.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue

        list_item = re.match(r"^\s*-\s+(.+?)\s*$", line)
        if list_item and current_key:
            meta.setdefault(current_key, [])
            if isinstance(meta[current_key], list):
                meta[current_key].append(clean_scalar(list_item.group(1)))
            continue

        key_value = re.match(r"^([A-Za-z0-9_-]+):\s*(.*?)\s*$", line)
        if not key_value:
            current_key = None
            continue

        key, value = key_value.groups()
        current_key = key
        if value == "":
            meta[key] = []
        else:
            meta[key] = clean_scalar(value)

    return meta


def clean_scalar(value: str) -> object:
    value = value.strip()
    if value in {"true", "false"}:
        return value == "true"
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [clean_scalar(part.strip()) for part in inner.split(",")]
    return value


def first_heading(body: str) -> tuple[str | None, str]:
    lines = body.splitlines()
    for index, line in enumerate(lines):
        match = re.match(r"^#\s+(.+?)\s*$", line)
        if match:
            title = match.group(1).strip()
            without_heading = "\n".join(lines[:index] + lines[index + 1 :]).lstrip()
            return title, without_heading
    return None, body


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^A-Za-z0-9]+", "-", ascii_value).strip("-").lower()
    return re.sub(r"-{2,}", "-", slug)


def csv_values(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


def meta_list(meta: dict[str, object], key: str) -> list[str]:
    value = meta.get(key)
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        parsed = csv_values(value)
        return parsed if parsed else [value]
    return []


def yaml_quote(value: object) -> str:
    text = str(value)
    escaped = text.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def yaml_list(key: str, values: list[str]) -> list[str]:
    if not values:
        return []
    lines = [f"{key}:"]
    lines.extend(f"  - {yaml_quote(value)}" for value in values)
    return lines


def is_external_link(url: str) -> bool:
    parsed = urlparse(url)
    return bool(parsed.scheme) or url.startswith("/") or url.startswith("#")


def copy_markdown_assets(body: str, source_dir: Path, target_dir: Path) -> tuple[str, list[Path]]:
    copied: list[Path] = []
    assets_dir = target_dir / "assets"
    used_names: set[str] = set()

    def replacement(match: re.Match[str]) -> str:
        prefix, raw_url, suffix, closing = match.groups()
        if is_external_link(raw_url):
            return match.group(0)

        local_ref = unquote(raw_url.split("#", 1)[0].split("?", 1)[0])
        source_path = (source_dir / local_ref).resolve()
        if not source_path.is_file():
            return match.group(0)

        assets_dir.mkdir(parents=True, exist_ok=True)
        base_name = source_path.name
        target_name = base_name
        stem = source_path.stem
        extension = source_path.suffix
        counter = 2
        while target_name in used_names or (assets_dir / target_name).exists():
            target_name = f"{stem}-{counter}{extension}"
            counter += 1

        used_names.add(target_name)
        target_path = assets_dir / target_name
        shutil.copy2(source_path, target_path)
        copied.append(target_path)
        return f"{prefix}assets/{target_name}{suffix}{closing}"

    return IMAGE_RE.sub(replacement, body), copied


def build_front_matter(args: argparse.Namespace, meta: dict[str, object], title: str, slug: str) -> str:
    date_value = args.date or str(meta.get("date") or "")
    if not date_value:
        date_value = dt.datetime.now().astimezone().isoformat(timespec="seconds")

    description = args.description or str(meta.get("description") or "").strip()
    tags = csv_values(args.tags) or meta_list(meta, "tags")
    categories = csv_values(args.category) or meta_list(meta, "categories")

    lines = [
        "---",
        f"title: {yaml_quote(title)}",
        f"date: {yaml_quote(date_value)}",
        f"draft: {'true' if args.draft else 'false'}",
        f"slug: {yaml_quote(slug)}",
    ]

    if description:
        lines.append(f"description: {yaml_quote(description)}")

    lines.extend(yaml_list("tags", tags))
    lines.extend(yaml_list("categories", categories))
    lines.append("---")
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import an external Markdown file into content/posts/<slug>/index.md."
    )
    parser.add_argument("source", help="Path to the external Markdown file.")
    parser.add_argument("--slug", help="Stable URL slug. Recommended for Chinese titles.")
    parser.add_argument("--title", help="Post title. Defaults to front matter, first H1, or file name.")
    parser.add_argument("--description", help="Short post description.")
    parser.add_argument("--tags", help="Comma-separated tags.")
    parser.add_argument("--category", help="Comma-separated categories.")
    parser.add_argument("--date", help="Publication date. Defaults to source front matter or now.")
    parser.add_argument("--draft", action="store_true", help="Mark the imported post as draft.")
    parser.add_argument("--force", action="store_true", help="Overwrite an existing post bundle.")
    parser.add_argument(
        "--keep-title-heading",
        action="store_true",
        help="Keep the first H1 heading in the body when it is used as the title.",
    )
    parser.add_argument(
        "--no-copy-assets",
        action="store_true",
        help="Do not copy relative Markdown image assets.",
    )
    parser.add_argument(
        "--output-dir",
        default="content/posts",
        help="Post output directory. Defaults to content/posts.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    source = Path(args.source).expanduser().resolve()

    if not source.is_file():
        print(f"Source Markdown file not found: {source}", file=sys.stderr)
        return 1

    text = source.read_text(encoding="utf-8")
    meta, body = split_front_matter(text)
    heading, body_without_heading = first_heading(body)

    title = args.title or str(meta.get("title") or "").strip() or heading or source.stem
    if heading and not args.keep_title_heading:
        body = body_without_heading

    slug = args.slug or str(meta.get("slug") or "").strip() or slugify(source.stem)
    if not slug:
        slug = f"post-{dt.datetime.now().strftime('%Y%m%d-%H%M%S')}"

    output_root = Path(args.output_dir)
    if not output_root.is_absolute():
        output_root = repo_root / output_root
    target_dir = output_root / slug
    target_file = target_dir / "index.md"

    if target_file.exists() and not args.force:
        print(f"Target post already exists: {target_file}", file=sys.stderr)
        print("Use --force to overwrite it.", file=sys.stderr)
        return 1

    target_dir.mkdir(parents=True, exist_ok=True)
    copied_assets: list[Path] = []
    if not args.no_copy_assets:
        body, copied_assets = copy_markdown_assets(body, source.parent, target_dir)

    front_matter = build_front_matter(args, meta, title, slug)
    target_file.write_text(f"{front_matter}\n\n{body.rstrip()}\n", encoding="utf-8")

    print(f"Imported post: {target_file}")
    if copied_assets:
        print("Copied assets:")
        for asset in copied_assets:
            print(f"- {asset}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
