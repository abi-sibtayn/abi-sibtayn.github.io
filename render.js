async function loadJSON(path) {
  const res = await fetch(path);
  return await res.json();
}

function createCard(item) {
  return `
    <div class="card">
      <div>
        <h3>${item.title}</h3>
        <div class="card-meta">${item.meta || ""}</div>
      </div>
      <a href="${item.href}" target="_blank">OPEN</a>
    </div>
  `;
}

async function renderSection(title, jsonPath, link) {
  const items = await loadJSON(jsonPath);

  const section = document.createElement("section");
  section.className = "section";

  section.innerHTML = `
    <div class="section-header">
      <h2>${title}</h2>
      <a class="see-all" href="${link}">See all →</a>
    </div>
    <div class="carousel">
      ${items.slice(0,5).map(createCard).join("")}
    </div>
  `;

  document.getElementById("home-sections").appendChild(section);
}

async function renderHome() {
  await renderSection("eBooks", "data/ebooks.json", "ebooks.html");
  await renderSection("Majālis", "data/majalis.json", "majalis.html");
  await renderSection("Qasīdat", "data/qasidat.json", "qasidat.html");
  await renderSection("Resources", "data/links.json", "links.html");
}
