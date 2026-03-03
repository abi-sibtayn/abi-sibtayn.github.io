// Rendering utilities for homepage rows + list pages
async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  return await res.json();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardHtml(item) {
  const title = escapeHtml(item.title);
  const meta = escapeHtml(item.meta || "");
  const href = escapeHtml(item.href || "#");
  const openText = item.openText ? escapeHtml(item.openText) : "OPEN";
  const external = href.startsWith("http://") || href.startsWith("https://");
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `
    <article class="card">
      <div class="card-body">
        <h3 class="card-title">${title}</h3>
        ${meta ? `<div class="card-meta">${meta}</div>` : `<div class="card-meta muted">&nbsp;</div>`}
      </div>
      <a class="card-open"${target} href="${href}">${openText}</a>
    </article>
  `;
}

function buildRow(section, items, limit=6) {
  const row = document.createElement("section");
  row.className = "row";
  row.innerHTML = `
    <div class="row-header">
      <h2>${escapeHtml(section.title)}</h2>
      <a class="see-all" href="${escapeHtml(section.seeAll)}">See all →</a>
    </div>
    <div class="row-shell">
      <button class="row-btn left" aria-label="Scroll left">‹</button>
      <div class="carousel" tabindex="0"></div>
      <button class="row-btn right" aria-label="Scroll right">›</button>
    </div>
  `;

  const carousel = row.querySelector(".carousel");
  carousel.innerHTML = items.slice(0, limit).map(cardHtml).join("");

  const scrollByCards = (dir) => {
    const card = carousel.querySelector(".card");
    const amount = card ? card.getBoundingClientRect().width + 16 : 320;
    carousel.scrollBy({ left: dir * amount * 2, behavior: "smooth" });
  };

  row.querySelector(".row-btn.left").addEventListener("click", () => scrollByCards(-1));
  row.querySelector(".row-btn.right").addEventListener("click", () => scrollByCards(1));

  return row;
}

async function renderHome() {
  const cfg = await ABI.loadSiteConfig();
  const host = document.querySelector("#home-rows");
  if (!host) return;

  for (const section of cfg.homeSections) {
    const items = await fetchJson(section.source);
    host.appendChild(buildRow(section, items, 6));
  }
}

async function renderListPage(categoryKey) {
  const cfg = await ABI.loadSiteConfig();
  const section = cfg.homeSections.find(s => s.key === categoryKey);
  const titleEl = document.querySelector("#page-title");
  const host = document.querySelector("#list");
  if (!section || !host) return;

  if (titleEl) titleEl.textContent = section.title;

  const items = await fetchJson(section.source);
  host.innerHTML = items.map(cardHtml).join("");
}

window.ABI_RENDER = { renderHome, renderListPage, fetchJson };
