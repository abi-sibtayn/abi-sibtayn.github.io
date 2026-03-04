async function load(file){
const res = await fetch(file,{cache:"no-store"});
return await res.json();
}

function card(item,label="OPEN"){
return `
<article class="card">
<div>
<h3>${item.title||item.name}</h3>
<div class="card-meta">${item.meta||item.description||""}</div>
</div>
<a class="card-open" href="${item.href||"#"}">${label}</a>
</article>
`;
}

async function renderPage(){

const path=window.location.pathname;

if(path.endsWith("ebooks.html")){
const data=await load("data/ebooks.json");
document.querySelector("#content").innerHTML=
`<div class="grid">${data.map(x=>card(x)).join("")}</div>`;
}

if(path.endsWith("qasidat.html")){
const data=await load("data/qasidat.json");
document.querySelector("#content").innerHTML=
`<div class="grid">${data.map(x=>card(x)).join("")}</div>`;
}

if(path.endsWith("links.html")){
const data=await load("data/links.json");
document.querySelector("#content").innerHTML=
`<div class="grid">${data.map(x=>card(x)).join("")}</div>`;
}

if(path.endsWith("lecturers.html")){
const data=await load("data/lecturers.json");

document.querySelector("#content").innerHTML=
`<div class="grid">${
data.map(l=>`
<article class="card">
<div>
<h3>${l.name}</h3>
<div class="card-meta">${l.description}</div>
</div>
<button class="card-open" onclick="openLecturer('${l.id}')">VIEW</button>
</article>
`).join("")
}</div>`;

window.lecturers=data;
}

if(path.endsWith("index.html")||path=="/"){
const ebooks=await load("data/ebooks.json");
const qasidat=await load("data/qasidat.json");
const links=await load("data/links.json");
const lecturers=await load("data/lecturers.json");

document.querySelector("#home-ebooks").innerHTML=ebooks.slice(0,6).map(x=>card(x)).join("");
document.querySelector("#home-qasidat").innerHTML=qasidat.slice(0,6).map(x=>card(x)).join("");
document.querySelector("#home-links").innerHTML=links.slice(0,6).map(x=>card(x)).join("");
document.querySelector("#home-lecturers").innerHTML=
lecturers.slice(0,6).map(x=>card({title:x.name,meta:x.description},"VIEW")).join("");
}

}

function openLecturer(id){

const l=window.lecturers.find(x=>x.id==id);

const modal=`
<div style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;">
<div style="background:white;padding:30px;max-width:600px">

<h2>${l.name}</h2>

<p>${l.description}</p>

${l.links.map(a=>`<p><a href="${a.url}" target="_blank">${a.label}</a></p>`).join("")}

<button onclick="closeModal()">Close</button>

</div>
</div>
`;

document.querySelector("#modal-root").innerHTML=modal;

}

function closeModal(){
document.querySelector("#modal-root").innerHTML="";
}

renderPage();
