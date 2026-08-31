# stack3mpty.cn

Personal profile page — a single static, zero-dependency terminal-style page served via GitHub Pages at <https://stack3mpty.cn/>.

No build step: `index.html` is the terminal-style homepage and `writing/` holds the article index and individual article pages. `.nojekyll` disables Jekyll processing; the custom domain is set via `CNAME`.

## Add an article

Copy an existing article page in `writing/`, then add its link to `writing/index.html` and to `WRITING` in `index.html`.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
