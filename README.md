# stack3mpty.cn

Hugo source for <https://stack3mpty.cn/>.

## Local Development

Install Hugo, then run:

```sh
hugo server -D
```

Create posts under `content/posts/`:

```sh
hugo new posts/my-post.md
```

## Deployment

GitHub Actions builds the site and publishes the generated `public/` directory to GitHub Pages.

The custom domain is configured through `static/CNAME`, which Hugo copies into the published site root.
