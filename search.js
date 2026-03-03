// Search across all categories (ebooks, majalis, qasidat, links)
function norm(s) {
  return String(s ?? "").toLowerCase();
}

function scoreItem(q, item) {
  const hay = (norm(item.title) + " " + norm(item.meta));
  if (!q) return 0;
  if (hay.includes(q)) return 10;
  // partial score
  const parts = q.split(/\s+/).filter(Boolean);
  let hits = 0;
  for (const p of parts) if (hay.includes(p)) hits++;
  return hits;
}

function groupBy(arr, keyFn) {
  const map = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(x);
  }
  return map;
}

async function loadAll() {
  const cfg = await ABI.loadSiteConfig();
  const out = [];
  for (const sec of cfg.homeSections) {
    const items = await ABI_RENDER.fetchJson(sec.source);
    items.forEach(it => out.push({ ...it, _section: sec }));
  }
  return out;
}

function renderResults(results) {
  const host = document.querySelector("#results");
  if (!host) return;

  if (!results.length) {
    host.innerHTML = `<div class="empty">No results.</div>`;
    return;
  }

  const groups = groupBy(results, r => r._section.title);
  host.innerHTML = "";

  for (const [title, items] of groups.entries()) {
    const block = document.createElement("section");
    block.className = "results-block";
    block.innerHTML = `
      <div class="row-header">
        <h2>${title}</h2>
        <a class="see-all" href="${items[0]._section.seeAll}">See all →</a>
      </div>
      <div class="grid"></div>
    `;
    const grid = block.querySelector(".grid");
    grid.innerHTML = items.slice(0, 30).map(ABI_RENDER ? (x => {
      // reuse card renderer with same schema
      const tmp = document.createElement("div");
      tmp.innerHTML = (function(){
        const title = (x.title ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
        const meta = (x.meta ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
        const href = (x.href ?? "#").replaceAll('"',"&quot;");
        const external = href.startsWith("http://") || href.startsWith("https://");
        const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `
          <article class="card">
            <div class="card-body">
              <h3 class="card-title">${title}</h3>
              ${meta ? `<div class="card-meta">${meta}</div>` : `<div class="card-meta muted">&nbsp;</div>`}
            </div>
            <a class="card-open"${target} href="${href}">OPEN</a>
          </article>
        `;
      })();
      return tmp.innerHTML;
    })(null) : "").join("");

    // Fix: above is messy; instead rebuild safely without dependency.
    grid.innerHTML = items.slice(0, 30).map(x => {
      const esc = s => String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
      const title = esc(x.title);
      const meta = esc(x.meta || "");
      const href = esc(x.href || "#");
      const external = href.startsWith("http://") || href.startsWith("https://");
      const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `
        <article class="card">
          <div class="card-body">
            <h3 class="card-title">${title}</h3>
            ${meta ? `<div class="card-meta">${meta}</div>` : `<div class="card-meta muted">&nbsp;</div>`}
          </div>
          <a class="card-open"${target} href="${href}">OPEN</a>
        </article>
      `;
    }).join("");

    host.appendChild(block);
  }
}

async function initSearch() {
  const input = document.querySelector("#q");
  const status = document.querySelector("#status");
  const all = await loadAll();

  function run() {
    const q = norm(input.value).trim();
    const ranked = all
      .map(x => ({ x, s: scoreItem(q, x) }))
      .filter(o => q ? o.s > 0 : true)
      .sort((a,b) => b.s - a.s)
      .map(o => o.x);

    status.textContent = q ? `${ranked.length} result(s)` : `Type to search…`;
    renderResults(ranked);
  }

  input.addEventListener("input", run);
  run();
}

window.addEventListener("DOMContentLoaded", initSearch);
