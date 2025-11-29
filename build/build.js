// build/build.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const marked = require('marked');

const BLOGS_DIR = path.join(__dirname, '..', 'src', 'blogs');
const OUT_INDEX = path.join(BLOGS_DIR, 'index.json');
const OUT_RSS = path.join(__dirname, '..', 'src', 'rss.xml');
const OUT_SITEMAP = path.join(__dirname, '..', 'src', 'sitemap.xml');

function readPosts(){
  const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(file => {
    const raw = fs.readFileSync(path.join(BLOGS_DIR,file), 'utf8');
    const { data, content } = matter(raw);
    const date = data.date || fs.statSync(path.join(BLOGS_DIR,file)).mtime.toISOString().slice(0,10);
    return {
      title: data.title || file.replace('.md',''),
      date,
      tags: data.tags || [],
      description: data.description || excerpt(content),
      file,
      slug: data.slug || slugify(file.replace('.md','')),
      draft: !!data.draft
    };
  });

  posts.sort((a,b) => new Date(b.date) - new Date(a.date));
  return posts;
}

function excerpt(md){
  const html = marked.parse(md);
  const text = html.replace(/<[^>]*>/g,'').slice(0,200);
  return text + (text.length>=200? '…':'');
}

function slugify(s){
  return s.toLowerCase().replace(/[^a-z0-9\-]+/g,'-').replace(/^-+|-+$/g,'');
}

function writeIndex(posts){
  fs.writeFileSync(OUT_INDEX, JSON.stringify(posts, null, 2), 'utf8');
  console.log('Wrote index.json');
}

function writeRSS(posts){
  const siteUrl = 'https://0xkiire.coredumped';
  const items = posts.map(p => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${siteUrl}/blogs/${p.file}</link>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>0xKiire.coredumped</title>
    <link>${siteUrl}</link>
    <description>RSS feed for 0xKiire.coredumped</description>
    ${items}
  </channel>
</rss>`;
  fs.writeFileSync(OUT_RSS, rss, 'utf8');
  console.log('Wrote rss.xml');
}

function writeSitemap(posts){
  const siteUrl = 'https://0xkiire.coredumped';
  const urls = posts.map(p => `<url><loc>${siteUrl}/blogs/${p.file}</loc><lastmod>${p.date}</lastmod></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}</loc></url>
  ${urls}
</urlset>`;
  fs.writeFileSync(OUT_SITEMAP, xml, 'utf8');
  console.log('Wrote sitemap.xml');
}

function escapeXml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function run(){
  const posts = readPosts();
  writeIndex(posts);
  writeRSS(posts);
  writeSitemap(posts);
}

run();
