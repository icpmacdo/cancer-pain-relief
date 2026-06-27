# cancer-pain-relief

A minimalist, single-page working document. The content lives in
[`cancer-pain-relief.md`](cancer-pain-relief.md) and is rendered live in the
browser with [marked.js](https://marked.js.org/) into a black-and-white style
matching [ian-macdonald.me](https://ian-macdonald.me).

## Editing

Edit `cancer-pain-relief.md` — that's the whole document. No build step.

## Preview locally

Because the page fetches the markdown file, open it over HTTP rather than
`file://`:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy (GitHub Pages)

Push to a GitHub repo named `cancer-pain-relief`, then enable Pages
(Settings → Pages → Deploy from branch → `main` / root). It will be served at:

```
https://icpmacdo.github.io/cancer-pain-relief/
```

## Structure

- `index.html` — page shell
- `css/main.css` — minimalist styles + markdown prose
- `js/script.js` — fetches and renders the markdown
- `cancer-pain-relief.md` — the document content
