/* ============================================================
   Frontier Group — instruments index

   Renders the cards and the chart from window.SITES.
   Nothing here needs editing to add a site — edit sites.js.

   Everything is built with createElement / textContent, so a
   stray character in a name or description can never become
   markup. URLs are validated before they reach the DOM.
   ============================================================ */

(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var sites = Array.isArray(window.SITES) ? window.SITES : [];

  /* ---------- helpers ---------- */

  // Only absolute http/https links are allowed through. Anything
  // else — javascript:, data:, a typo — is treated as "no link".
  function safeUrl(value) {
    if (typeof value !== "string" || value.trim() === "") return null;
    try {
      var parsed = new URL(value, window.location.href);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      return parsed.href;
    } catch (err) {
      return null;
    }
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  /* ---------- normalise the data once ---------- */

  var instruments = sites.map(function (site, index) {
    return {
      index: index,
      name: String(site && site.name ? site.name : "Untitled"),
      tag: String(site && site.tag ? site.tag : ""),
      desc: String(site && site.desc ? site.desc : ""),
      url: safeUrl(site && site.url)
    };
  });

  /* ---------- cards ---------- */

  function buildCard(item) {
    var li = el("li");
    var card = el("a", item.url ? "item" : "item soon");

    if (item.url) {
      card.href = item.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      // The card is a link, but the visible label says only "open".
      // Spell out the destination for screen readers.
      card.setAttribute("aria-label", item.name + " — opens in a new tab");
    } else {
      card.setAttribute("role", "link");
      card.setAttribute("aria-disabled", "true");
    }

    card.appendChild(el("span", "wipe"));

    var meta = el("span", "meta");
    meta.appendChild(el("span", null, String(item.index + 1).padStart(2, "0")));
    meta.appendChild(el("span", "tick"));
    meta.appendChild(el("span", null, item.tag));
    card.appendChild(meta);

    card.appendChild(el("h3", "name", item.name));
    card.appendChild(el("p", "desc", item.desc));

    var go = el("span", "go");
    go.appendChild(el("span", null, item.url ? "Open" : "Not linked yet"));
    var rail = el("span", "rail");
    rail.appendChild(el("span"));
    go.appendChild(rail);
    if (item.url) {
      var arrow = el("span", "arw", "\u2192");
      arrow.setAttribute("aria-hidden", "true");
      go.appendChild(arrow);
    }
    card.appendChild(go);

    li.appendChild(card);
    return card;
  }

  /* ---------- chart ----------
     Decorative: it repeats what the cards already say, so it is
     hidden from assistive tech (aria-hidden on the container in
     the HTML) and holds nothing focusable. Mouse users get the
     link between a point and its card; keyboard users get the
     same effect from focusing the card.                        */

  var W = 1000, H = 292, PAD = 48;
  var HEIGHTS = [178, 116, 212, 94, 152];

  function buildChart(container) {
    if (!container || instruments.length === 0) return [];

    var step = (W - PAD * 2) / Math.max(instruments.length - 1, 1);
    var points = instruments.map(function (item, i) {
      return {
        x: instruments.length === 1 ? W / 2 : PAD + i * step,
        y: HEIGHTS[i % HEIGHTS.length]
      };
    });

    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + (H + 30),
      preserveAspectRatio: "xMidYMid meet",
      focusable: "false"
    });

    svg.appendChild(svgEl("line", { class: "axis", x1: PAD, y1: H, x2: W - PAD, y2: H }));
    svg.appendChild(svgEl("line", { class: "axis", x1: PAD, y1: 34, x2: PAD, y2: H }));

    var first = svgEl("text", { class: "axlab", x: PAD, y: H + 20 });
    first.textContent = "built first";
    svg.appendChild(first);

    var last = svgEl("text", { class: "axlab", x: W - PAD, y: H + 20, "text-anchor": "end" });
    last.textContent = "most recent";
    svg.appendChild(last);

    var d = points.map(function (p, i) {
      return (i === 0 ? "M" : "L") + p.x + " " + p.y;
    }).join(" ");
    svg.appendChild(svgEl("path", { class: "series", d: d }));

    var nodes = points.map(function (p, i) {
      var g = svgEl("g", { class: "node" });
      g.style.animationDelay = (1.05 + i * 0.11) + "s";
      g.appendChild(svgEl("line", { class: "cross", x1: p.x, y1: p.y, x2: p.x, y2: H }));
      g.appendChild(svgEl("circle", { class: "halo", cx: p.x, cy: p.y, r: 9 }));
      g.appendChild(svgEl("circle", { class: "hit", cx: p.x, cy: p.y, r: 28 }));
      g.appendChild(svgEl("circle", { class: "core", cx: p.x, cy: p.y, r: 6 }));

      var label = svgEl("text", { x: p.x, y: p.y - 22, "text-anchor": "middle" });
      label.textContent = instruments[i].name;
      g.appendChild(label);

      svg.appendChild(g);
      return g;
    });

    container.appendChild(svg);
    return nodes;
  }

  /* ---------- render ---------- */

  var list = document.getElementById("list");
  var chart = document.getElementById("chart");
  var empty = document.getElementById("empty");

  if (instruments.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }

  // Split the instruments into rows of at most three, never
  // leaving a single item stranded on the last row: 5 becomes
  // 3+2, 7 becomes 3+2+2, 4 becomes 2+2. Every row then spans
  // the full width, so an odd count never reads as unfinished.
  function rowSizes(count) {
    if (count <= 3) return [count];
    var rows = [];
    var left = count;
    while (left > 0) {
      if (left === 4) { rows.push(2); left = 2; continue; }
      if (left <= 3) { rows.push(left); left = 0; continue; }
      rows.push(3);
      left -= 3;
    }
    return rows;
  }

  // Six-column grid: three-up spans 2, two-up spans 3, one alone spans 6.
  var SPAN_CLASS = { 1: "span-6", 2: "span-3", 3: "span-2" };

  var layout = [];
  rowSizes(instruments.length).forEach(function (size) {
    for (var i = 0; i < size; i++) layout.push(size);
  });

  var cards = instruments.map(function (item, index) {
    var card = buildCard(item);
    var li = card.parentNode;
    var size = layout[index];
    li.className = SPAN_CLASS[size];
    // At the two-column breakpoint, a lone trailing card widens
    // instead of leaving a gap beside it.
    if (index === instruments.length - 1 && instruments.length % 2 === 1) {
      li.className += " odd-last";
    }
    list.appendChild(li);
    return card;
  });

  var nodes = buildChart(chart);

  /* ---------- link a card to its point, both ways ---------- */

  function highlight(index, on) {
    if (cards[index]) cards[index].classList.toggle("hot", on);
    if (nodes[index]) nodes[index].classList.toggle("hot", on);
  }

  cards.concat(nodes).forEach(function (element, position) {
    var index = position % instruments.length;
    element.addEventListener("mouseenter", function () { highlight(index, true); });
    element.addEventListener("mouseleave", function () { highlight(index, false); });
    element.addEventListener("focus", function () { highlight(index, true); });
    element.addEventListener("blur", function () { highlight(index, false); });
  });

  /* ---------- dark / light ---------- */

  var STORAGE_KEY = "frontier-mode";
  var root = document.documentElement;
  var toggle = document.getElementById("mode-toggle");
  var label = toggle ? toggle.querySelector(".mode-text") : null;

  function readStored() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === "dark" || stored === "light" ? stored : null;
    } catch (err) {
      return null;
    }
  }

  function store(mode) {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (err) {
      /* private browsing, or storage disabled — the toggle still
         works for this visit, it just won't be remembered. */
    }
  }

  // The button is labelled with what it will do, not with the
  // mode you are in — less ambiguous than a pressed/unpressed
  // toggle for both sighted and screen reader users.
  function applyMode(mode) {
    var next = mode === "dark" ? "light" : "dark";
    root.setAttribute("data-mode", mode);
    if (label) label.textContent = next === "dark" ? "Dark mode" : "Light mode";
    if (toggle) toggle.setAttribute("aria-label", "Switch to " + next + " mode");
  }

  var systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  applyMode(readStored() || (systemPrefersLight ? "light" : "dark"));

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-mode") === "dark" ? "light" : "dark";
      applyMode(next);
      store(next);
    });
  }
})();
