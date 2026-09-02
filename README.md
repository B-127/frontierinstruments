# Frontier Instruments 

Landing page for the research desk's micro-sites. 

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
