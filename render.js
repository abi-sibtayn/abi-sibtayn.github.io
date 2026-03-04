/* ======================================================
   Jamaat Abi Sibtayn — Data Renderer (JSTOR-like)
   - Uses /data/*.json
   - Static header in HTML (no site.json needed)
   - Home page renders 4 sections:
       eBooks, Lecturers, Qasīdat, External Resources
   - Lecturers: VIEW opens a modal using /data/lecturers.json
   ====================================================== */

(function () {
  // ---------- utils ----------
  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isExternal(href) {
    return /^https?:\/\//i.test(href || "");
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return await res.json();
  }

  // ---------- modal (for lecturers) ----------
  function ensureModalStyles() {
    if (document.getElementById("ja-modal-styles")) return;
    const style = document.createElement("style");
    style.id = "ja-modal-styles";
    style.textContent = `
      .ja-modal-backdrop{
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.35);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        z-index: 9999;
      }
      .ja-modal{
        width: min(780px, 100%);
        background: #fff;
        border: 1px solid #d9d9d9;
        padding: 22px;
      }
      .ja-modal-top{
        display:flex;
        align-items:flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }
      .ja-modal h2{
        margin: 0;
        font-family: "JASerif", Georgia, "Times New Roman", serif;
        font-weight: 600;
        font-size: 26px;
        line-height: 1.2;
      }
      .ja-modal .ja-sub{
        margin-top: 6px;
        color: #666;
        font-size: 13px;
      }
      .ja-close{
        border: 1px solid #111;
        background: #111;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 12px;
        cursor: pointer;
        transition: background .15s ease, border-color .15s ease;
      }
      .ja-close:hover{
        background: #b10000;
        border-color: #b10000;
      }
      .ja-body{
        color: #111;
        font-size: 14px;
        line-height: 1.6;
        margin-top: 6px;
        white-space: pre-wrap;
      }
      .ja-links{
        display:flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }
      .ja-links a{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding: 9px 14px;
        border: 1px solid #111;
        background: #111;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        text-decoration:none;
        transition: background .15s ease, border-color .15s ease;
      }
      .ja-links a:hover{
        background: #b10000;
        border-color: #b10000;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLecturerModal() {
    ensureModalStyles();
    let backdrop = document.getElementById("jaLecturerBackdrop");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.className = "ja-modal-backdrop";
    backdrop.id = "jaLecturerBackdrop";
    backdrop.innerHTML = `
      <div class="ja-modal" role="dialog" aria-modal="true" aria-label="Lecturer profile">
        <div class="ja-modal-top">
          <div>
            <h2 id="jaLecturerName">Lecturer</h2>
            <div class="ja-sub" id="jaLecturerRole"></div>
          </div>
          <button class="ja-close" id="jaLecturerClose" type="button">CLOSE</button>
        </div>
        <div class="ja-body" id="jaLecturerDesc"></div>
        <div class="ja-links" id="jaLecturerLinks"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    function close() {
      backdrop.style.display = "none";
      document.body.style.overflow = "";
    }

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
    backdrop.querySelector("#jaLecturerClose").addEventListener("click", close);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && backdrop.style.display === "flex") close();
    });

    backdrop._close = close;
    return backdrop;
  }

  function openLecturerModal(lec) {
    const backdrop = ensureLecturerModal();

    // backwards compatibility:
    // old schema: {title, meta, href}
    // new schema: {name, role, description, links:[{label,url}]}
    const name = lec.name ?? lec.title ?? "Lecturer";
    const role = lec.role ?? (lec.meta && lec.meta !== "Profile" ? lec.meta : "") ?? "";
    const desc = lec.description ?? lec.bio ?? "";

    const links = Array.isArray(lec.links) ? lec.links : [];
    const legacyHref = (lec.href && String(lec.href).trim()) ? [{ label: "Link", url: lec.href }] : [];
    const finalLinks = links.length ? links : legacyHref;

    backdrop.querySelector("#jaLecturerName").textContent = name;
    backdrop.querySelector("#jaLecturerRole").textContent = role;
    backdrop.querySelector("#jaLecturerDesc").textContent = desc || "No description yet.";

    const linksHost = backdrop.querySelector("#jaLecturerLinks");
    linksHost.innerHTML = "";

    if (finalLinks.length) {
      for (const L of finalLinks) {
        const label = esc(L.label ?? "Link");
        const url = String(L.url ?? "").trim();
        if (!url) continue;
        const a = document.createElement("a");
        a.innerHTML = label;
        a.href = url;
        if (isExternal(url)) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        linksHost.appendChild(a);
      }
    }

    backdrop.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  // expose modal opener (for search.js)
  window.JA = window.JA || {};
  window.JA.openLecturerModal = openLecturerModal;

  // ---------- card render ----------
  function cardHTML(item, buttonText = "OPEN") {
    const title = esc(item.title ?? item.name ?? "Untitled");
    const meta = esc(item.meta ?? item.role ?? "");
    const hrefRaw = String(item.href ?? "#");
    const href = esc(hrefRaw);
    const external = isExternal(hrefRaw);
    const target = external ? ` target="_blank" rel="noopener noreferrer"` : "";

    return `
      <article class="card">
        <div>
          <h3>${title}</h3>
          ${meta ? `<div class="card-meta">${meta}</div>` : `<div class="card-meta muted">&nbsp;</div>`}
        </div>
        <a class="card-open"${target} href="${href}">${esc(buttonText)}</a>
      </article>
    `;
  }

  function lecturerCardHTML(lec, index) {
    const name = esc(lec.name ?? lec.title ?? "Lecturer");
    const role = esc(lec.role ?? (lec.meta && lec.meta !== "Profile" ? lec.meta : "") ?? "");
    // button uses JS modal (no href)
    return `
      <article class="card">
        <div>
          <h3>${name}</h3>
          ${role ? `<div class="card-meta">${role}</div>` : `<div class="card-meta muted">&nbsp;</div>`}
        </div>
        <button class="btn" type="button" data-lecturer-index="${index}">VIEW</button>
      </article>
    `;
  }

  function wireLecturerButtons(lecturers, scopeEl) {
    const host = scopeEl || document;
    host.querySelectorAll("[data-lecturer-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-lecturer-index"));
        const lec = lecturers[idx];
        if (lec) openLecturerModal(lec);
      });
    });
  }

  function renderCarousel(items, host, limit = 6, customRenderer) {
    if (!host) return;
    const slice = items.slice(0, limit);

    if (!slice.length) {
      host.innerHTML = `<div class="empty">No content available.</div>`;
      return;
    }

    host.innerHTML = `
      <div class="carousel">
        ${slice.map((x, i) => (customRenderer ? customRenderer(x, i) : cardHTML(x))).join("")}
      </div>
    `;
  }

  function renderGrid(items, host, customRenderer) {
    if (!host) return;

    if (!items.length) {
      host.innerHTML = `<div class="empty">No content available.</div>`;
      return;
    }

    host.innerHTML = `
      <div class="grid">
        ${items.map((x, i) => (customRenderer ? customRenderer(x, i) : cardHTML(x))).join("")}
      </div>
    `;
  }

  // ---------- page inits ----------
  async function initHome() {
    // expects these containers to exist in index.html:
    // #home-ebooks, #home-lecturers, #home-qasidat, #home-links
    const ebooksHost = document.getElementById("home-ebooks");
    const lecturersHost = document.getElementById("home-lecturers");
    const qasidatHost = document.getElementById("home-qasidat");
    const linksHost = document.getElementById("home-links");

    try {
      const [ebooks, lecturers, qasidat, links] = await Promise.all([
        fetchJson("data/ebooks.json"),
        fetchJson("data/lecturers.json"),
        fetchJson("data/qasidat.json"),
        fetchJson("data/links.json"),
      ]);

      renderCarousel(ebooks, ebooksHost, 6);
      renderCarousel(qasidat, qasidatHost, 6);

      // lecturers: VIEW modal
      renderCarousel(lecturers, lecturersHost, 6, (x, i) => lecturerCardHTML(x, i));
      wireLecturerButtons(lecturers, lecturersHost);

      renderCarousel(links, linksHost, 6);

    } catch (err) {
      console.error(err);
      const fail = `<div class="empty">Failed to load content.</div>`;
      if (ebooksHost) ebooksHost.innerHTML = fail;
      if (lecturersHost) lecturersHost.innerHTML = fail;
      if (qasidatHost) qasidatHost.innerHTML = fail;
      if (linksHost) linksHost.innerHTML = fail;
    }
  }

  async function initListPage(kind) {
    const host = document.getElementById("content");
    if (!host) return;

    try {
      if (kind === "ebooks") {
        const data = await fetchJson("data/ebooks.json");
        renderGrid(data, host);
      } else if (kind === "qasidat") {
        const data = await fetchJson("data/qasidat.json");
        renderGrid(data, host);
      } else if (kind === "links") {
        const data = await fetchJson("data/links.json");
        renderGrid(data, host);
      } else if (kind === "lecturers") {
        const data = await fetchJson("data/lecturers.json");
        renderGrid(data, host, (x, i) => lecturerCardHTML(x, i));
        wireLecturerButtons(data, host);
      }
    } catch (err) {
      console.error(err);
      host.innerHTML = `<div class="empty">Failed to load content.</div>`;
    }
  }

  // ---------- bootstrap ----------
  window.addEventListener("DOMContentLoaded", () => {
    const page = document.body.getAttribute("data-page");

    if (page === "home") initHome();
    else if (page === "ebooks") initListPage("ebooks");
    else if (page === "qasidat") initListPage("qasidat");
    else if (page === "links") initListPage("links");
    else if (page === "lecturers") initListPage("lecturers");
  });
})();
