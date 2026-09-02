# Frontier instruments index

Landing page for the research desk's micro-sites. Static, no build step, no
dependencies. Everything runs in the browser.

## Adding or changing a site

Edit `assets/sites.js`. That is the only file you need to touch.

```js
{
  name: "Prometheus",
  tag:  "Inflation",
  url:  "https://username.github.io/prometheus/",
  desc: "CCPI heatmap, category contributions and scenario simulation."
}
```

- Leave `url` as `""` to show the card dimmed and unclickable, marked
  "Not linked yet". Useful for announcing something before it ships.
- Order matters: top to bottom in the array is left to right on the chart,
  so keep them in the order they were built.
- The chart sizes itself to however many entries exist. Add a sixth and the
  line extends; remove one and it redraws.
- `desc` reads best at roughly 12–18 words.

Only `http://` and `https://` links are accepted. Anything else is ignored
and the card falls back to the dimmed state.

## Deploying

1. Push these files to the root of a repository.
2. Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. It appears at `https://<username>.github.io/<repo>/` within a minute or two.

`.nojekyll` is included so GitHub serves the files as-is rather than running
them through Jekyll.

## Changing the look

All colour lives in the two variable blocks at the top of `assets/styles.css` —
one for dark, one for light. Change a value there and it moves everywhere it is
used. The named roles are `--bg`, `--grid`, `--ink`, `--dim`, `--line`, `--acc`,
`--card`, `--edge`, `--hot`.

If you swap colours, keep text against its background above 4.5:1 contrast, and
the series line above 3:1. The current values clear both.

## Notes on how it is built

- **Safety.** Cards are assembled with `createElement` and `textContent`, never
  `innerHTML`, so no value in `sites.js` can become markup. URLs are parsed and
  protocol-checked before use. External links carry `rel="noopener noreferrer"`.
  A Content-Security-Policy meta tag in `index.html` blocks inline script,
  network calls and framing; if you later add a script or a stylesheet from
  somewhere new, add its origin to that tag or it will be blocked.
- **Accessibility.** Skip link, one `h1`, real landmarks, visible focus rings,
  and a mode button labelled with the action it performs. The chart repeats what
  the cards already say, so it is marked `aria-hidden` and holds nothing
  focusable — keyboard users get the same highlight by focusing a card.
  `prefers-reduced-motion` shuts the animation down.
- **Mode.** First visit follows the operating system setting. After that, your
  choice is remembered in `localStorage`; if storage is unavailable the toggle
  still works for the session.
