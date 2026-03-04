// ======================================================
// Jamaat Abi Sibtayn — Clean Data Renderer
// Uses /data/*.json
// No dynamic header/footer
// No ABI
// ======================================================

// Escape HTML safely
function esc(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// Render cards into container
function renderCards(items, container) {
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="empty">No content available.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="grid">
      ${items.map(x => {
        const title = esc(x.title);
        const meta  = esc(x.meta || "");
        const href  = esc(x.href || "#");
        const external = href.startsWith("http");
        const target = external ? ` target="_blank" rel="noopener noreferrer"` : "";

        return `
          <article class="card">
            <div class="card-body">
              <h3 class="card-title">${title}</h3>
              ${meta 
                ? `<div class="card-meta">${meta}</div>` 
                : `<div class="card-meta muted">&nbsp;</div>`
              }
            </div>
            <a class="card-open"${target} href="${href}">OPEN</a>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

// Detect page type and load correct JSON
async function initPage() {
  const container = document.querySelector("#content");
  if (!container) return;

  const path = window.location.pathname;

  let file = null;

  if (path.includes("ebooks")) file = "data/ebooks.json";
  else if (path.includes("majalis")) file = "data/majalis.json";
  else if (path.includes("qasidat")) file = "data/qasidat.json";
  else if (path.includes("library") || path.includes("links")) file = "data/links.json";
  else return; // index or other page

  try {
    const res = await fetch(file, { cache: "no-store" });
    const data = await res.json();
    renderCards(data, container);
  } catch (err) {
    console.error("Failed to load data:", err);
    container.innerHTML = `<div class="empty">Failed to load content.</div>`;
  }
}

window.addEventListener("DOMContentLoaded", initPage);
