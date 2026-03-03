// Shared header/footer + nav highlighting
async function loadSiteConfig() {
  const res = await fetch("data/site.json", { cache: "no-store" });
  return await res.json();
}

function setActiveNav(navEl, activeKey) {
  const links = navEl.querySelectorAll("a[data-nav]");
  links.forEach(a => {
    if (a.getAttribute("data-nav") === activeKey) a.classList.add("active");
    else a.classList.remove("active");
  });
}

function buildHeader(cfg, activeKey) {
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="brand">
      <div class="brand-title">${cfg.siteName}</div>
      <div class="brand-tagline">${cfg.tagline}</div>
    </div>
    <nav class="site-nav"></nav>
  `;

  const nav = header.querySelector(".site-nav");
  cfg.nav.forEach(item => {
    const a = document.createElement("a");
    a.href = item.href;
    a.textContent = item.label;
    a.setAttribute("data-nav", item.key);
    nav.appendChild(a);
  });

  setActiveNav(nav, activeKey);
  return header;
}

function buildFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="footer-inner">
      <div>© ${year} Jamaat Abi Sibtayn</div>
      <div class="footer-links">
        <a href="index.html">Home</a>
        <a href="search.html">Search</a>
      </div>
    </div>
  `;
  return footer;
}

async function mountChrome(activeKey) {
  const cfg = await loadSiteConfig();
  const app = document.querySelector("#app");
  if (!app) return;

  const header = buildHeader(cfg, activeKey);
  const footer = buildFooter();

  app.prepend(header);
  app.appendChild(footer);

  // Keep tagline in <title> pages if not set
  if (!document.title || document.title.trim() === "") {
    document.title = cfg.siteName;
  }
}

window.ABI = { loadSiteConfig, mountChrome };
