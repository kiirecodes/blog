// app.js - Main client behavior

const ITEMS_PER_PAGE = 8;
let posts = [];
let filtered = [];
let currentPage = 1;

// DOM
const postListEl = document.getElementById('postList');
const tagListEl = document.getElementById('tagList');
const paginationEl = document.getElementById('pagination');
const contentEl = document.getElementById('content');
const searchEl = document.getElementById('search');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const themeToggle = document.getElementById('themeToggle');
const rssBtn = document.getElementById('rssBtn');

// Utilities
const byDateDesc = (a,b) => new Date(b.date) - new Date(a.date);
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

menuToggle && menuToggle.addEventListener('click', ()=> {
  sidebar.classList.toggle('open');
});

themeToggle && themeToggle.addEventListener('click', ()=>{
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
});

// Load posts index
async function loadIndex(){
  try {
    const res = await fetch('/blogs/index.json', {cache: "no-store"});
    posts = (await res.json()).filter(p => !p.draft).sort(byDateDesc);
    filtered = posts;
    renderTags();
    renderList();
  } catch(e){
    console.error('Failed to fetch index.json', e);
  }
}

function renderList(){
  postListEl.innerHTML = '';
  const start = (currentPage-1)*ITEMS_PER_PAGE;
  const pagePosts = filtered.slice(start, start + ITEMS_PER_PAGE);

  pagePosts.forEach(p => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.innerHTML = `<strong>${escapeHtml(p.title)}</strong><div class="muted">${p.description || ''}</div>`;
    li.addEventListener('click', ()=> openPost(p));
    li.addEventListener('keypress', (e)=>{ if(e.key==='Enter') openPost(p); });
    postListEl.appendChild(li);
  });

  renderPagination();
}

function renderPagination(){
  paginationEl.innerHTML = '';
  const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  for(let i=1;i<=total;i++){
    const btn = document.createElement('button');
    btn.textContent = i;
    if(i===currentPage) btn.disabled = true;
    btn.addEventListener('click', ()=> { currentPage = i; renderList(); });
    paginationEl.appendChild(btn);
  }
}

function renderTags(){
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || []))).sort();
  tagListEl.innerHTML = '';
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag';
    btn.textContent = tag;
    btn.addEventListener('click', ()=> {
      filtered = posts.filter(p => (p.tags||[]).includes(tag));
      currentPage = 1;
      renderList();
    });
    tagListEl.appendChild(btn);
  });
}

searchEl && searchEl.addEventListener('input', (e)=>{
  const q = e.target.value.toLowerCase().trim();
  if(!q){ filtered = posts; currentPage=1; renderList(); return; }
  filtered = posts.filter(p => (p.title + ' ' + (p.description||'') + ' ' + (p.tags||[]).join(' ')).toLowerCase().includes(q));
  currentPage = 1;
  renderList();
});

async function openPost(p){
  try {
    const res = await fetch('/blogs/' + p.file);
    let md = await res.text();

    // Optional frontmatter removal if present
    md = md.replace(/^---[\\s\\S]*?---\\n?/,'');
    const html = marked.parse(md, { mangle: false, headerIds: true });

    // Create article container
    contentEl.innerHTML = `<article class="article">${html}
      <div class="meta">
        <small>${new Date(p.date).toLocaleDateString()} • ${estimateReadTime(md)} read</small>
        <div class="share">
          <button onclick="navigator.clipboard?.writeText(location.href)">Copy link</button>
          <button onclick="window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent('${p.title} ' + location.href),'_blank')">Share</button>
        </div>
      </div>
      <div id="postComments"></div>
    </article>`;

    // Render code highlighting (Prism)
    if(window.Prism) Prism.highlightAll();

    // Render KaTeX for math blocks (if present)
    if(window.renderMathInElement){
      renderMathInElement(contentEl, {delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]});
    }

    // Lazy load images
    const imgs = contentEl.querySelectorAll('img');
    imgs.forEach(img => {
      if(!img.loading) img.loading = 'lazy';
    });

    // Insert Giscus comments
    insertComments(p);

    // Scroll to top of content
    window.scrollTo({top:0,behavior:'smooth'});

  } catch(e){
    console.error('Failed to load post', e);
    contentEl.innerHTML = '<p>Error loading post.</p>';
  }
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function estimateReadTime(text){
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

function insertComments(p){
  const holder = document.getElementById('postComments');
  if(!holder) return;
  // Remove old script if any
  holder.innerHTML = '';
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', 'kiirecodes/0xkiire.coredumped');
  script.setAttribute('data-repo-id', 'R_kgDO123456'); // replace with actual
  script.setAttribute('data-category', 'General');
  script.setAttribute('data-category-id', 'DIC_kwDO1234564Ce345'); // replace with actual
  script.setAttribute('data-mapping', 'pathname');
  script.setAttribute('data-theme', document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  script.async = true;
  holder.appendChild(script);
}

// Register service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker?.register('/sw.js').catch(err => console.warn('SW registration failed', err));
  });
}

// Initialize
loadIndex();
