let currentItems = [];

// FETCH DATA
fetch("ebooks.json")
  .then(res => res.json())
  .then(data => {
    // SORT (SAFE WITH TRANSLITERATION)
    data.sort((a, b) =>
      a.title.normalize("NFKD").localeCompare(b.title.normalize("NFKD"))
    );

    currentItems = data;

    createLetterNav(data);
    renderItems(data);
  });


// RENDER BOOKS
function renderItems(items) {
  const container = document.getElementById("books");
  container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "book";

    div.innerHTML = `
      <a href="${item.href}" target="_blank">
        <h3>${item.title}</h3>
      </a>
      <p>${item.meta}</p>
    `;

    container.appendChild(div);
  });
}


// SEARCH
function searchItems(query) {
  const q = query.toLowerCase();

  const filtered = currentItems.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.meta.toLowerCase().includes(q)
  );

  renderItems(filtered);
}


// LETTER NAV
function createLetterNav(items) {
  const nav = document.getElementById("letter-nav");
  const letters = new Set();

  items.forEach(item => {
    letters.add(item.title[0].toUpperCase());
  });

  const sortedLetters = Array.from(letters).sort();

  nav.innerHTML = `<span onclick="filterByLetter('ALL')">All</span>`;

  sortedLetters.forEach(letter => {
    nav.innerHTML += `<span onclick="filterByLetter('${letter}')">${letter}</span>`;
  });
}


// FILTER BY LETTER
function filterByLetter(letter) {
  if (letter === "ALL") {
    renderItems(currentItems);
    return;
  }

  const filtered = currentItems.filter(item =>
    item.title.toUpperCase().startsWith(letter)
  );

  renderItems(filtered);
}
