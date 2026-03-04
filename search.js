/* ======================================================
   Jamaat Abi Sibtayn — Search (JSTOR-like)
   Searches:
   - eBooks (data/ebooks.json)
   - Lecturers (data/lecturers.json)
   - Qasīdat (data/qasidat.json)
   - External Resources (data/links.json)
   ====================================================== */

(function () {
  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function norm(s) {
    return String(s ?? "").toLowerCase().trim();
  }

  function score(query, text) {
    if (!query) return 0;
    const q = norm(query);
    const t = norm(text);
    if (!q) return 0;
    if (t.includes(q)) return 100;

    const parts = q.split(/\s+/).filter(Boolean);
    let hits = 0;
    for (const p of parts) if (t.includes(p)) hits++;
    return hits;
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed ${path}`);
    return await res.json();
  }

  function groupBy(arr, keyFn) {
    const m = new Map();
    for (const x of arr) {
      const k = keyFn(x);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return m;
  }

  function renderCard(item) {
    // lecturers use VIEW modal button
    if (item.type === "Lecturers") {
      const name = esc(item.name ?? item.title ?? "Lecturer");
      const role = esc(item.role ?? item.meta ?? "");
      return `
        <article class="card">
          <div>
            <h3>${name}</h3>
            ${role ? `<div class="card-meta">${role}</div>` : `<div class="card-meta muted">&nbsp;</div>`}
          </div>
          <button class="btn" type="button" data-search-lecturer="${item._idx}">VIEW</button>
        </article>
      `;
    }

    // normal OPEN cards
    const title = esc(item.title ?? "Untitled");
    const meta = esc(item.meta ?? "");
    const href = esc(item.href ?? "#");
    const external = /^https?:\/\//i.test(item.href || "");
    const target = external ? ` target="_blank" rel="noopener noreferrer"` : "";

    return `
      <article class="card">
        <div>
          <h3>${title}</h3>
          ${meta ? `<div class="card-meta">${meta}</div>` : `<div class="card-meta muted">&nbsp;</div>`}
        </div>
        <a class="card-open"${target} href="${href}">OPEN</a>
      </article>
    `;
  }

  function renderResults(results, lecturersRaw) {
    const host = document.getElementById("results");
    if (!host) return;

    if (!results.length) {
      host.innerHTML = `<div class="empty">No results.</div>`;
      return;
    }

    const groups = groupBy(results, (r) => r.type);
    host.innerHTML = "";

    for (const [title, items] of groups.entries()) {
      const block = document.createElement("section");
      block.className = "section";
      block.innerHTML = `
        <div class="section-header">
          <h2>${esc(title)}</h2>
          <a class="see-all" href="${title === "eBooks" ? "ebooks.html"
            : title === "Lecturers" ? "lecturers.html"
            : title === "Qasīdat" ? "qasidat.html"
            : "links.html"}">See all →</a>
        </div>
        <div class="grid">
          ${items.slice(0, 30).map(renderCard).join("")}
        </div>
      `;
      host.appendChild(block);
    }

    // wire lecturer VIEW buttons
    host.querySelectorAll("[data-search-lecturer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-search-lecturer"));
        const lec = lecturersRaw[idx];
        if (lec && window.JA && typeof window.JA.openLecturerModal === "function") {
          window.JA.openLecturerModal(lec);
        }
      });
    });
  }

  async function initSearch() {
    const input = document.getElementById("q");
    const status = document.getElementById("status");
    if (!input || !status) return;

    let ebooks = [];
    let lecturers = [];
    let qasidat = [];
    let links = [];

    try {
      [ebooks, lecturers, qasidat, links] = await Promise.all([
        fetchJson("data/ebooks.json"),
        fetchJson("data/lecturers.json"),
        fetchJson("data/qasidat.json"),
        fetchJson("data/links.json"),
      ]);
    } catch (e) {
      console.error(e);
      const host = document.getElementById("results");
      if (host) host.innerHTML = `<div class="empty">Failed to load search index.</div>`;
      return;
    }

    // build search index
    const index = [];

    ebooks.forEach((x) => index.push({
      type: "eBooks",
      title: x.title,
      meta: x.meta,
      href: x.href,
      _text: `${x.title ?? ""} ${x.meta ?? ""}`,
    }));

    lecturers.forEach((x, i) => index.push({
      type: "Lecturers",
      name: x.name ?? x.title,
      role: x.role ?? x.meta,
      description: x.description ?? x.bio,
      _idx: i,
      _text: `${x.name ?? x.title ?? ""} ${x.role ?? x.meta ?? ""} ${x.description ?? x.bio ?? ""}`,
    }));

    qasidat.forEach((x) => index.push({
      type: "Qasīdat",
      title: x.title,
      meta: x.meta,
      href: x.href,
      _text: `${x.title ?? ""} ${x.meta ?? ""}`,
    }));

    links.forEach((x) => index.push({
      type: "External Resources",
      title: x.title,
      meta: x.meta,
      href: x.href,
      _text: `${x.title ?? ""} ${x.meta ?? ""} ${x.href ?? ""}`,
    }));

    function run() {
      const q = norm(input.value);
      if (!q) {
        status.textContent = "Type to search…";
        renderResults([], lecturers);
        return;
      }

      const ranked = index
        .map((it) => ({ it, s: score(q, it._text) }))
        .filter((o) => o.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((o) => o.it);

      status.textContent = `${ranked.length} result(s)`;
      renderResults(ranked, lecturers);
    }

    input.addEventListener("input", run);
    run();
  }

  window.addEventListener("DOMContentLoaded", initSearch);
})();
