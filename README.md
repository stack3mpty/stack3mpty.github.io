# stack3mpty.cn

Hugo source for <https://stack3mpty.cn/>.

## Local Development

Install Hugo, then run:

```sh
hugo server -D
```

Create posts under `content/posts/`, or import an external Markdown file:

```sh
hugo new posts/my-post.md
python3 scripts/import-post.py /absolute/path/to/article.md --slug my-post
```

## Deployment

GitHub Actions builds the site and publishes the generated `public/` directory to GitHub Pages.

The custom domain must be configured in GitHub repository Settings > Pages.
`static/CNAME` is kept so Hugo includes the domain marker in the published
artifact, but it does not replace the GitHub Pages custom domain setting.

## Publishing SOP

See `docs/publishing-sop.md` for the standard AI-assisted workflow:
provide a local Markdown file path, let Codex import it into Hugo, then review
and merge the generated pull request.
