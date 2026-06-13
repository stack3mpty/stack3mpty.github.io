# Blog Publishing SOP

This repository uses Hugo only as the publishing layer. Drafting can happen
anywhere. The standard publishing input is a local Markdown file path.

## User Request Format

Send Codex a message like this:

```text
发布博客：/absolute/path/to/article.md
标题：文章标题
slug: stable-url-slug
tags: AI, engineering
```

Only the file path is required. `title`, `slug`, `tags`, `category`, and
`description` are optional. For Chinese titles, provide an ASCII `slug` when
you care about stable readable URLs.

## Codex Responsibilities

1. Read the local Markdown file and related local assets.
2. Create a branch named `codex/publish-<slug>`.
3. Run `scripts/import-post.py` to create a Hugo post bundle under
   `content/posts/<slug>/`.
4. Normalize front matter:
   - `title`
   - `date`
   - `draft: false`
   - `slug`
   - `description` when available
   - `tags` and `categories` when provided or inferable
5. Make light editorial fixes when requested, but do not rewrite the author's
   voice unless explicitly asked.
6. Run a local Hugo build when Hugo is installed. If not, rely on the pull
   request GitHub Actions build.
7. Push the branch and open a pull request against `main`.
8. Report the pull request URL and any validation gaps.

## User Responsibilities

1. Review the pull request diff.
2. Confirm title, URL slug, tags, and any copied images.
3. Merge the pull request when the GitHub Actions build is green.

After merge, the `Build and deploy` workflow publishes the site to GitHub
Pages.

## Import Command

The import script can be run manually:

```sh
python3 scripts/import-post.py /absolute/path/to/article.md \
  --slug stable-url-slug \
  --title "Article title" \
  --tags "AI,engineering"
```

By default, the script creates:

```text
content/posts/<slug>/index.md
```

Using post bundles lets local images live beside the article. Relative Markdown
image links are copied into:

```text
content/posts/<slug>/assets/
```

External image URLs are left untouched.

## Markdown Guidelines

- Use Markdown as the source of truth.
- Keep local image paths relative to the Markdown file when possible.
- Avoid spaces in image filenames for cleaner links.
- Use `draft: false` for content that should publish.
- Do not commit generated `public/` output.

## Review Checklist

- The PR only changes the intended post and related assets.
- The post has a stable slug.
- Images render from local bundle paths or trusted external URLs.
- `draft` is `false`.
- GitHub Actions `Build and deploy` is green.
