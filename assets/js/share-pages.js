/*
 * share-pages.js — une vraie adresse pour chaque contenu du portfolio.
 *
 * Le site est une seule page : ses contenus vivent derriere un « # »
 * (#/post/why-bpmn). LinkedIn, WhatsApp et les moteurs de recherche ignorent
 * tout ce qui suit le « # » : ils lisent la page d'accueil et affichent son
 * titre et son image. D'ou l'impression qu'un lien « ouvre l'accueil ».
 *
 * Ce module fabrique, pour chaque publication, projet, etude de cas, theme et
 * pour le modele BPMN, une petite page statique a une vraie adresse
 * (post/why-bpmn/index.html). Elle porte son propre titre, sa description et
 * son image pour l'apercu, puis renvoie le visiteur vers le contenu dans le
 * site. Le sitemap et le flux RSS suivent.
 *
 * Utilise par le panneau d'administration a chaque publication, et en ligne
 * de commande pour tout regenerer :   node outils-partage.js
 */
(function (root) {
  'use strict';
  const BASE = 'https://mariem-trabelsi.github.io/';
  const DEFAULT_IMAGE = 'assets/img/og-image.png';

  const esc = (v) => String(v == null ? '' : v).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]));
  const abs = (src) => (/^https?:\/\//.test(src) ? src : BASE + String(src || DEFAULT_IMAGE).replace(/^\.?\//, ''));
  const plain = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const cut = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t);
  const firstImage = (media, i) => {
    const list = media || [];
    const pick = list[i || 0];
    if (pick && pick.type === 'image') return pick.src;
    const img = list.find((m) => m.type === 'image');
    return img ? img.src : '';
  };

  /* Les chemins publics : la meme fonction sert aux boutons « Copier le lien ». */
  const PATHS = {
    post: (id) => `post/${id}/`,
    project: (id) => `project/${id}/`,
    case: (id) => `case/${id}/`,
    module: (id) => `module/${id}/`,
    posts: () => 'posts/',
    bpmn: () => 'bpmn/',
  };
  const url = (kind, id) => BASE + PATHS[kind](id);

  function page(o) {
    const target = '/#/' + o.route;
    const title = esc(o.title);
    const desc = esc(cut(o.description || '', 200));
    const image = esc(abs(o.image));
    const link = esc(BASE + o.path);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${link}">
  <meta property="og:type" content="${o.type || 'website'}">
  <meta property="og:site_name" content="${esc(o.site)}">
  <meta property="og:url" content="${link}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${image}">
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  <script>var l = location.search.match(/[?&]lang=(en|fr)/); location.replace('/' + (l ? '?lang=' + l[1] : '') + ${JSON.stringify(target.slice(1))});</script>
  <style>body{font:16px/1.5 system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;color:#1a1a1a;background:#f4f5f9}a{color:#A4145A}</style>
</head>
<body>
  <p><a href="${esc(target)}">${title}</a></p>
</body>
</html>
`;
  }

  /* Toutes les pages a publier, avec le sitemap. Renvoie [{ path, content }]. */
  function build(d) {
    const site = (d.profile && d.profile.name) || 'Portfolio';
    const today = new Date().toISOString().slice(0, 10);
    const out = [];
    const add = (o) => out.push({ path: o.path + 'index.html', content: page(Object.assign({ site }, o)) });

    // Une publication programmee a deja sa page : le lien posté sur LinkedIn le jour J
    // a son apercu tout de suite. Le flux et le sitemap attendent la date.
    const visible = (d.posts || []).filter((p) => p.visible !== false);
    const posts = visible.filter((p) => !p.date || p.date <= today);
    visible.forEach((p) => add({
      path: PATHS.post(p.id), route: 'post/' + p.id, type: 'article',
      title: `${p.title}, ${site}`, description: p.excerpt || plain(p.body),
      image: p.cover && p.cover.src,
    }));
    add({ path: PATHS.posts(), route: 'posts', title: `Posts, ${site}`,
      description: 'Posts on process automation, BPMN, business rules, telecom standards and software engineering.' });

    (d.modules || []).filter((m) => posts.some((p) => p.module === m.id)).forEach((m) => add({
      path: PATHS.module(m.id), route: 'module/' + m.id,
      title: `${m.name}, ${site}`, description: m.description || '', image: m.cover && m.cover.src,
    }));

    (d.projects || []).filter((p) => p.visible !== false).forEach((p) => {
      add({ path: PATHS.project(p.id), route: 'project/' + p.id,
        title: `${p.name}, ${site}`, description: p.summary || '', image: firstImage(p.media, p.cover) });
      if (p.caseStudy) add({ path: PATHS.case(p.id), route: 'case/' + p.id, type: 'article',
        title: `${p.caseStudy.title || p.name}, ${site}`, description: p.caseStudy.tagline || p.summary || '',
        image: firstImage(p.media, p.cover) });
    });

    const sp = d.spotlight || {};
    if (sp.bpmn && sp.bpmn.file) {
      const o2a = (d.projects || []).find((p) => (p.media || []).some((m) => m.type === 'bpmn'));
      add({ path: PATHS.bpmn(), route: 'bpmn', title: `The executable BPMN model, ${site}`,
        description: sp.bpmn.text || '', image: o2a ? firstImage(o2a.media, o2a.cover) : '' });
    }

    // Le flux RSS : chaque publication pointe vers sa propre adresse.
    const x = (v) => String(v == null ? '' : v).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
    const recent = posts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    out.push({ path: 'feed.xml', content: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${x(site)}, posts</title>
    <link>${BASE}</link>
    <description>${x((d.profile || {}).headline)}</description>
    <language>en</language>
${recent.map((p) => `    <item>
      <title>${x(p.title)}</title>
      <link>${url('post', x(p.id))}</link>
      <guid isPermaLink="false">${x(p.id)}</guid>
      <pubDate>${new Date((p.date || today) + 'T09:00:00Z').toUTCString()}</pubDate>
      <description>${x(p.excerpt || '')}</description>
${(p.tags || []).map((t) => `      <category>${x(t)}</category>`).join('\n')}
    </item>`).join('\n')}
  </channel>
</rss>
` });

    const urls = [BASE, BASE + '?view=brief', BASE + 'assets/cv/Meriem_Trabelsi_CV.pdf']
      .concat(out.filter((f) => /index\.html$/.test(f.path)).map((f) => BASE + f.path.replace(/index\.html$/, ''))
        .filter((u) => !visible.some((p) => !posts.includes(p) && u === url('post', p.id))));
    out.push({ path: 'sitemap.xml', content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}
</urlset>
` });
    return out;
  }

  const api = { build, url, PATHS, BASE };
  root.PFShare = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
