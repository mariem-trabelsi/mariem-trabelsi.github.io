/* Portfolio public : rendu depuis data/portfolio.json, deux vues, compteur de visites. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
    sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* idem */ } },
  };

  const ICON = {
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    in: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4V9.5Z"/></svg>',
    gh: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  };

  /* ---------------------------------------------------------------- compteur */
  const Counter = {
    base: 'https://abacus.jasoncameron.dev',
    ns() { return (App.data && App.data.settings && App.data.settings.counterNamespace) || 'mariem-trabelsi-portfolio'; },
    key(k) { return String(k).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 60); },
    isAdminBrowser() { return store.get('pf_is_admin', '') === '1'; },
    // une copie locale ou un apercu ne sont jamais comptes
    isLocal() { return !/github\.io$/.test(location.hostname); },
    hit(k) {
      if (Counter.isAdminBrowser() || Counter.isLocal()) return Promise.resolve(null);
      return fetch(`${Counter.base}/hit/${Counter.ns()}/${Counter.key(k)}`).then((r) => r.ok ? r.json() : null).catch(() => null);
    },
    get(k) {
      return fetch(`${Counter.base}/get/${Counter.ns()}/${Counter.key(k)}`).then((r) => r.ok ? r.json() : { value: 0 }).then((j) => j.value || 0).catch(() => null);
    },
  };

  /* ---------------------------------------------------------------- liens contact */
  function mailto(p, subject, body) {
    return `mailto:${p.email}?subject=${encodeURIComponent(subject || 'Opportunity for ' + p.name)}&body=${encodeURIComponent(body || 'Hello ' + p.name.split(' ')[0] + ',\n\n')}`;
  }
  function wa(p, text) {
    return `https://wa.me/${String(p.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(text || 'Hello ' + p.name.split(' ')[0] + ', I saw your portfolio and would like to talk about an opportunity.')}`;
  }

  /* ---------------------------------------------------------------- media */
  function mediaEl(m, opts = {}) {
    if (!m) return '';
    if (m.type === 'bpmn') {
      return `<div class="bpmn-thumb"><span>BPMN</span><small>${esc((m.src || '').split('/').pop())}</small></div>`;
    }
    if (m.type === 'video') {
      return `<video src="${esc(m.src)}" ${opts.poster ? `poster="${esc(opts.poster)}"` : ''} muted playsinline loop preload="metadata" ${opts.controls ? 'controls' : ''} aria-label="${esc(m.caption || 'Project video')}"></video>`;
    }
    return `<img src="${esc(m.src)}" alt="${esc(m.caption || '')}" loading="lazy">`;
  }
  function initials(name) {
    return name.split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
  function genCover(p) {
    const k = Math.abs([...p.id].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)) % 5;
    return `<div class="gen-cover"><b>${esc(initials(p.name))}</b><div class="nodes">${[0, 1, 2, 3, 4].map((i) => `<i class="${i === k ? 'on' : ''}"></i>`).join('')}</div><small>${esc((p.keywords || []).slice(0, 3).join(' · '))}</small></div>`;
  }
  function coverHTML(p) {
    const media = p.media || [];
    const c = media[p.cover || 0] || media[0];
    const videos = media.filter((m) => m.type === 'video');
    const models = media.filter((m) => m.type === 'bpmn').length;
    const imgs = media.length - videos.length - models;
    const poster = (media.find((m) => m.type === 'image') || {}).src;
    let inner = c ? mediaEl(c, { poster }) : genCover(p);
    // une image en couverture et une video dans le projet : la video apparait au survol
    if (c && c.type === 'image' && videos.length) inner += `<video class="hover-video" src="${esc(videos[0].src)}" muted playsinline loop preload="none" aria-hidden="true"></video>`;
    let badges = '';
    if (videos.length) badges += '<span class="badge">▶ Video</span>';
    if (models) badges += '<span class="badge bpmn">◇ Live BPMN model</span>';
    if (media.length > 1) badges += `<span class="badge count">${[videos.length ? videos.length + ' video' + (videos.length > 1 ? 's' : '') : '', imgs ? imgs + ' image' + (imgs > 1 ? 's' : '') : ''].filter(Boolean).join(' · ')}</span>`;
    return `<div class="cover">${inner}${badges}</div>`;
  }

  /* ---------------------------------------------------------------- visualiseur BPMN */
  const BPMN_CDN = 'https://cdn.jsdelivr.net/npm/bpmn-js@17.11.1/dist/';
  let bpmnLib = null;
  function loadBpmn() {
    if (bpmnLib) return bpmnLib;
    bpmnLib = new Promise((resolve, reject) => {
      ['assets/diagram-js.css', 'assets/bpmn-js.css', 'assets/bpmn-font/css/bpmn-embedded.css'].forEach((c) => {
        const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = BPMN_CDN + c; document.head.appendChild(l);
      });
      const sc = document.createElement('script');
      sc.src = BPMN_CDN + 'bpmn-navigated-viewer.production.min.js';
      sc.onload = () => resolve(window.BpmnJS);
      sc.onerror = () => { bpmnLib = null; reject(new Error('BPMN viewer unavailable')); };
      document.head.appendChild(sc);
    });
    return bpmnLib;
  }
  async function mountBpmn(host, url) {
    host.innerHTML = `<div class="bpmn-canvas"><p class="bpmn-wait">Loading the model…</p></div>
      <div class="bpmn-tools" role="toolbar" aria-label="Model controls">
        <button type="button" data-z="in" aria-label="Zoom in">+</button>
        <button type="button" data-z="out" aria-label="Zoom out">−</button>
        <button type="button" data-z="fit">Fit</button>
        <button type="button" data-z="full">Full screen</button>
      </div>`;
    try {
      const [Viewer, xml] = await Promise.all([loadBpmn(), fetch(url).then((r) => { if (!r.ok) throw new Error('Model not found'); return r.text(); })]);
      const canvasEl = host.querySelector('.bpmn-canvas');
      canvasEl.innerHTML = '';
      const viewer = new Viewer({ container: canvasEl });
      await viewer.importXML(xml);
      const canvas = viewer.get('canvas');
      const fit = () => { canvas.zoom('fit-viewport', 'auto'); };
      fit();
      host.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
        const z = b.dataset.z;
        if (z === 'fit') fit();
        else if (z === 'full') { (host.requestFullscreen ? host.requestFullscreen() : Promise.resolve()).then(() => setTimeout(() => { canvas.resized(); fit(); }, 150)).catch(() => {}); }
        else canvas.zoom(canvas.zoom() * (z === 'in' ? 1.25 : 0.8));
      }));
      document.addEventListener('fullscreenchange', () => setTimeout(() => { canvas.resized(); fit(); }, 150));
      return viewer;
    } catch (e) {
      host.querySelector('.bpmn-canvas').innerHTML = `<p class="bpmn-wait">The model could not be displayed. <a href="${esc(url)}" download>Download the .bpmn file</a>.</p>`;
      return null;
    }
  }

  /* ---------------------------------------------------------------- application */
  const App = {
    data: null,
    filter: null,
    layout: store.get('pf_layout', 'grid'),

    async init() {
      const preview = window.__PF_PREVIEW__;
      if (preview) this.data = preview;
      else {
        const res = await fetch('data/portfolio.json?v=' + Date.now(), { cache: 'no-store' });
        this.data = await res.json();
      }
      this.render();
      this.bindGlobal();
      const view = new URLSearchParams(location.search).get('view') || store.get('pf_view', 'full');
      this.setView(view === 'brief' ? 'brief' : 'full', false);
      if (!store.sget('pf_counted')) { store.sset('pf_counted', '1'); Counter.hit('visits'); }
      document.dispatchEvent(new CustomEvent('pf:ready'));
    },

    visible() { return (this.data.projects || []).filter((p) => p.visible !== false); },

    render() {
      const d = this.data, p = d.profile;
      document.title = `${p.name}, ${p.title}`;
      $$('[data-cv]').forEach((a) => { a.href = p.cv; a.setAttribute('download', p.cv.split('/').pop()); });
      this.renderHero(); this.renderSpotlight(); this.renderWork(); this.renderExperience(); this.renderSkills(); this.renderStage();
      this.renderContact(); this.renderBrief(); this.renderFooter();
      if (window.PFDesign) window.PFDesign.apply(d.design);
      this.observe();
    },

    renderHero() {
      const p = this.data.profile, q = this.data.quote;
      const [first, ...rest] = p.name.split(' ');
      $('#top').innerHTML = `
        <div class="hero-text reveal">
          <span class="state"><i class="dot"></i>state: <b>${esc(p.availability || 'Open to opportunities')}</b></span>
          <h1>${esc(first)} <em>${esc(rest.join(' '))}</em></h1>
          <div class="role">${esc(p.title)}</div>
          <p class="headline">${esc(p.headline)}</p>
          <div class="hero-cta">
            <a class="btn btn-solid" data-cv data-count="cv" href="${esc(p.cv)}" download>${ICON.download} Download CV</a>
            <a class="btn" data-count="contact-email" href="${esc(mailto(p))}">${ICON.mail} Email me</a>
            <a class="btn" data-count="contact-whatsapp" href="${esc(wa(p))}" target="_blank" rel="noopener">${ICON.wa} WhatsApp</a>
            <a class="btn btn-ghost" href="${esc(p.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON.in}</a>
            <a class="btn btn-ghost" href="${esc(p.github)}" target="_blank" rel="noopener" aria-label="GitHub">${ICON.gh}</a>
          </div>
          <div class="facts">${(p.facts || []).map((f) => `<div class="fact"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join('')}</div>
        </div>
        <figure class="hero-photo reveal">
          <div class="frame"><img src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}"></div>
          <figcaption><span>${esc(p.location)}</span><span>${(p.languages || []).map((l) => esc(l.name)).join(' · ')}</span></figcaption>
        </figure>
        ${q && q.text ? `<blockquote class="quote reveal" style="grid-column:1/-1">
          <p>“${esc(q.text)}”</p>${q.original ? `<p class="orig" lang="fr">« ${esc(q.original)} »</p>` : ''}
          <cite>${esc(q.author)}${q.source ? `, <i>${esc(q.source)}</i>` : ''}</cite></blockquote>` : ''}`;
    },

    renderSpotlight() {
      const sp = this.data.spotlight, el = $('#standards');
      if (!sp) { el.hidden = true; return; }
      el.hidden = false;
      const t = sp.tmforum || {}, b = sp.bpmn || {};
      el.innerHTML = `<div class="spot-inner">
        <div class="spot-head reveal">
          <span class="eyebrow">${esc(sp.eyebrow)}</span>
          <h2>${esc(sp.title)}</h2>
          <p>${esc(sp.intro)}</p>
        </div>
        <div class="spot-grid">
          <article class="spot-card tmf reveal">
            <div class="spot-label"><span class="logo-mark">TM</span>TM Forum</div>
            <p>${esc(t.text)}</p>
            <ol class="fw">${(t.frameworks || []).map((f) => `<li><b>${esc(f.name)}</b><span class="mono">${esc(f.ref)}</span><em>${esc(f.role)}</em></li>`).join('')}</ol>
            <div class="apis-head"><b>${(t.apis || []).length}</b> Open APIs implemented</div>
            <ul class="apis">${(t.apis || []).map((a) => `<li><span class="mono">${esc(a.id)}</span>${esc(a.name)}</li>`).join('')}</ul>
            ${t.proof ? `<p class="proof">${esc(t.proof)}</p>` : ''}
            ${t.cert ? `<p class="cert"><span aria-hidden="true">✓</span>${esc(t.cert)}</p>` : ''}
          </article>
          <article class="spot-card bpmn reveal">
            <div class="spot-label"><span class="logo-mark gw" aria-hidden="true"></span>BPMN 2.0, executed by Kogito</div>
            <p>${esc(b.text)}</p>
            <div class="bstats">${(b.stats || []).map((x) => `<div><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join('')}</div>
            <div class="bpmn-host" id="spot-bpmn" data-src="${esc(b.file)}">
              <button type="button" class="bpmn-start">◇ Open the live model<small>drag to pan · scroll to zoom</small></button>
            </div>
          </article>
        </div></div>`;
      const host = $('#spot-bpmn');
      if (host && b.file) {
        $('.bpmn-start', host).addEventListener('click', () => { Counter.hit('bpmn-viewer'); mountBpmn(host, b.file); });
      }
    },

    renderWork() {
      const d = this.data, p = d.profile;
      const kws = {};
      this.visible().forEach((pr) => (pr.keywords || []).forEach((k) => { kws[k] = (kws[k] || 0) + 1; }));
      const top = Object.keys(kws).sort((a, b) => kws[b] - kws[a] || a.localeCompare(b)).slice(0, 14);
      $('#work').innerHTML = `
        <div class="about reveal">
          <div><span class="eyebrow">About</span><h2 style="font-size:clamp(28px,3.4vw,38px);margin-top:8px">Processes as models, decisions as rules, facts as events.</h2></div>
          <div>${(p.about || []).map((t) => `<p>${esc(t)}</p>`).join('')}</div>
        </div>
        <div class="section-head reveal">
          <div><span class="eyebrow">Selected work</span><h2>Projects</h2>
          <p>Open a card to see the screens and the recorded demos.</p></div>
        </div>
        <div class="toolbar reveal">
          <div class="filters" role="group" aria-label="Filter by keyword">
            <button class="chip" type="button" data-filter="" aria-pressed="${!this.filter}">All</button>
            ${top.map((k) => `<button class="chip" type="button" data-filter="${esc(k)}" aria-pressed="${this.filter === k}">${esc(k)}</button>`).join('')}
          </div>
          <div class="layout-toggle" role="group" aria-label="Layout">
            <button type="button" data-layout="grid" aria-pressed="${this.layout === 'grid'}" title="Grid">${ICON.grid}<span class="sr" hidden>Grid</span></button>
            <button type="button" data-layout="list" aria-pressed="${this.layout === 'list'}" title="List">${ICON.list}<span hidden>List</span></button>
          </div>
        </div>
        <div class="grid ${this.layout === 'list' ? 'list' : ''}" id="project-grid"></div>`;
      this.renderCards();
    },

    renderCards() {
      const list = this.visible().filter((pr) => !this.filter || (pr.keywords || []).includes(this.filter));
      const grid = $('#project-grid');
      grid.className = 'grid' + (this.layout === 'list' ? ' list' : '');
      if (!list.length) { grid.innerHTML = '<p class="empty">No project with this keyword yet.</p>'; return; }
      grid.innerHTML = list.map((pr) => {
        const kw = pr.keywords || [];
        const shown = kw.slice(0, pr.featured ? 7 : 5);
        return `<button type="button" class="card ${pr.featured && this.layout === 'grid' && !this.filter ? 'featured' : ''}" data-project="${esc(pr.id)}" aria-label="Open ${esc(pr.name)}">
          ${coverHTML(pr)}
          <div class="card-body">
            <div class="meta"><span class="company">${esc(pr.company)}</span><span>${esc(pr.period)}</span></div>
            <h3>${esc(pr.name)}</h3>
            <div class="role-line">${esc(pr.role)}</div>
            <p class="sum">${esc(pr.summary)}</p>
            <div class="tags">${shown.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}${kw.length > shown.length ? `<span class="tag more">+${kw.length - shown.length}</span>` : ''}</div>
          </div></button>`;
      }).join('');
      $$('.card', grid).forEach((c) => {
        const v = $('.hover-video', c) || $('video', c);
        if (!v) return;
        c.addEventListener('mouseenter', () => v.play().catch(() => {}));
        c.addEventListener('mouseleave', () => v.pause());
        c.addEventListener('focus', () => v.play().catch(() => {}));
        c.addEventListener('blur', () => v.pause());
      });
      // la vidéo principale joue seule quand elle est visible, si le mouvement est permis
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const io = new IntersectionObserver((es) => es.forEach((e) => { const v = $('.hover-video', e.target) || $('video', e.target); if (!v) return; e.target.classList.toggle('playing', e.isIntersecting); e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }), { threshold: .6 });
        $$('.card.featured', grid).forEach((c) => io.observe(c));
      }
    },

    renderExperience() {
      const d = this.data;
      $('#experience').innerHTML = `
        <div class="section-head reveal"><div><span class="eyebrow">Path</span><h2>Experience</h2></div></div>
        <div class="two-col">
          <ol class="timeline reveal">${(d.experience || []).map((x) => `<li>
            <h3>${esc(x.role)}</h3><span class="when">${esc(x.period)}</span>
            <div class="org">${esc(x.company)}</div>
            ${(x.points || []).length ? `<ul>${x.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          </li>`).join('')}</ol>
          <div class="reveal">
            <div class="side-card"><h3>Education</h3>${(d.education || []).map((e) => `<div class="item"><b>${esc(e.degree)}</b><span>${esc(e.school)} · ${esc(e.period)}</span></div>`).join('')}</div>
            <div class="side-card"><h3>Certifications</h3>${(d.certifications || []).map((c) => `<div class="item"><b>${esc(c.name)}</b><span>${esc(c.issuer)} · ${esc(c.year)}${c.id ? ` · <span class="mono" style="font-size:11.5px">ID ${esc(c.id)}</span>` : ''}</span></div>`).join('')}</div>
          </div>
        </div>`;
    },

    renderSkills() {
      const d = this.data;
      $('#skills').innerHTML = `
        <div class="section-head reveal"><div><span class="eyebrow">Toolbox</span><h2>Skills</h2></div></div>
        <div class="skills reveal">${(d.skills || []).map((g) => `<div class="skill-group"><h3>${esc(g.group)}</h3><div class="tags">${g.items.map((i) => `<span class="tag">${esc(i)}</span>`).join('')}</div></div>`).join('')}</div>
        <div class="langs reveal">${(d.profile.languages || []).map((l) => `<span><b>${esc(l.name)}</b>${esc(l.level)}</span>`).join('')}</div>`;
    },

    renderStage() {
      const s = this.data.speaking;
      if (!s) { $('#stage').hidden = true; return; }
      const media = s.media || [];
      $('#stage').innerHTML = `
        <div class="section-head reveal"><div><span class="eyebrow">Beyond code</span><h2>${esc(s.title || 'On stage')}</h2></div></div>
        <div class="stage">
          <div class="reveal">
            <p class="mic">${esc(s.text)}</p>
            ${(s.items || []).map((i) => `<div class="side-card" style="margin-bottom:10px"><div class="item"><b>${esc(i.name)}</b><span>${esc(i.detail)} · ${esc(i.year)}</span></div></div>`).join('')}
          </div>
          <div class="stage-media reveal">${media.length ? media.map((m) => `<figure style="margin:0">${mediaEl(m, { controls: true })}${m.caption ? `<figcaption class="meta" style="margin-top:6px">${esc(m.caption)}</figcaption>` : ''}</figure>`).join('')
            : '<div class="stage-placeholder">A photo from a hosted public speaking event will appear here.</div>'}</div>
        </div>`;
    },

    renderContact() {
      const p = this.data.profile;
      $('#contact').innerHTML = `<div class="inner">
        <div>
          <span class="eyebrow">End event</span>
          <h2>Let's talk about your next project.</h2>
          <p>I answer every message. Write me an e-mail, or reach me directly on WhatsApp.</p>
          <div class="contact-actions">
            <a class="btn btn-accent" data-count="contact-email" href="${esc(mailto(p))}">${ICON.mail} ${esc(p.email)}</a>
            <a class="btn" data-count="contact-whatsapp" href="${esc(wa(p))}" target="_blank" rel="noopener">${ICON.wa} WhatsApp</a>
            <a class="btn" data-count="cv" data-cv href="${esc(p.cv)}" download>${ICON.download} CV (PDF)</a>
            <a class="btn" href="${esc(p.linkedin)}" target="_blank" rel="noopener">${ICON.in} LinkedIn</a>
          </div>
        </div>
        <form class="form" id="contact-form" novalidate>
          <div class="row">
            <label>Your name<input name="name" autocomplete="name" required></label>
            <label>Company<input name="company" autocomplete="organization"></label>
          </div>
          <label>Message<textarea name="message" required placeholder="The role, the team, and how to reach you"></textarea></label>
          <div class="send">
            <button class="btn btn-accent" type="submit" data-channel="email">${ICON.mail} Send by e-mail</button>
            <button class="btn" type="submit" data-channel="whatsapp">${ICON.wa} Send on WhatsApp</button>
          </div>
        </form>
      </div>`;
      const form = $('#contact-form');
      let channel = 'email';
      $$('button[data-channel]', form).forEach((b) => b.addEventListener('click', () => { channel = b.dataset.channel; }));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const name = (f.get('name') || '').trim(), company = (f.get('company') || '').trim(), msg = (f.get('message') || '').trim();
        if (!name || !msg) { form.reportValidity(); return; }
        const text = `Hello ${p.name.split(' ')[0]},\n\n${msg}\n\n${name}${company ? ', ' + company : ''}`;
        if (channel === 'whatsapp') { Counter.hit('contact-whatsapp'); window.open(wa(p, text), '_blank', 'noopener'); }
        else { Counter.hit('contact-email'); location.href = mailto(p, `Opportunity${company ? ' at ' + company : ''}, from ${name}`, text); }
      });
    },

    renderBrief() {
      const d = this.data, p = d.profile;
      const key = this.visible().filter((x) => x.featured).slice(0, 4);
      const allSkills = (d.skills || []).flatMap((g) => g.items).slice(0, 16);
      $('#view-brief').innerHTML = `<article class="brief">
        <header class="brief-head">
          <img src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}">
          <div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><p style="margin:6px 0 0;color:var(--muted)">${esc(p.headline)}</p></div>
          <div class="brief-cta">
            <a class="btn btn-solid" data-cv data-count="cv" href="${esc(p.cv)}" download>${ICON.download} Download CV</a>
            <a class="btn" data-count="contact-email" href="${esc(mailto(p))}">${ICON.mail} Email</a>
            <a class="btn" data-count="contact-whatsapp" href="${esc(wa(p))}" target="_blank" rel="noopener">${ICON.wa} WhatsApp</a>
          </div>
        </header>
        <dl class="brief-grid" style="margin:0">
          <div><dt>Availability</dt><dd>${esc(p.availability)}</dd></div>
          <div><dt>Location</dt><dd>${esc(p.location)}</dd></div>
          <div><dt>Degree</dt><dd>${esc(((d.education || [])[0] || {}).degree || '')}</dd></div>
          <div><dt>Languages</dt><dd>${(p.languages || []).map((l) => esc(l.name + ' ' + l.level.replace(/\s*\(.*\)/, ''))).join(', ')}</dd></div>
        </dl>
        <div class="brief-body">
          <section>
            <h2>Key projects</h2>
            ${key.map((x) => `<div class="bp"><b>${esc(x.name)}</b> <span class="meta" style="display:inline">· ${esc(x.company)} · ${esc(x.role)}</span>
              <p style="margin:4px 0 6px;font-size:14.5px">${esc(x.summary)}</p>
              ${(x.highlights || []).length ? `<p style="margin:0 0 6px;font-size:13.5px;color:var(--muted)">${esc(x.highlights.slice(0, 2).join('. '))}.</p>` : ''}
              <button type="button" data-project="${esc(x.id)}">See screens and demo</button></div>`).join('')}
          </section>
          <section>
            <h2>Experience</h2>
            ${(d.experience || []).map((x) => `<div class="xp"><div><b>${esc(x.role)}</b><br><small style="color:var(--muted)">${esc(x.company)}</small></div><span>${esc(x.period)}</span></div>`).join('')}
            <h2 style="margin-top:22px">Core skills</h2>
            <div class="tags" style="padding:0">${allSkills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>
            <p class="brief-note">Certified: ${(d.certifications || []).slice(0, 3).map((c) => esc(c.issuer)).join(', ')}. <a href="?view=full" data-goview="full">Open the full portfolio</a>.</p>
          </section>
        </div>
      </article>`;
    },

    renderFooter() {
      const p = this.data.profile;
      $('#footer').innerHTML = `<span>© ${new Date().getFullYear()} ${esc(p.name)}</span>
        <span id="public-visits"></span>
        <span><a href="${esc(p.github)}" target="_blank" rel="noopener">GitHub</a> · <a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a> · <button type="button" id="theme-btn">Theme</button></span>`;
      if (this.data.settings && this.data.settings.showVisitsPublicly) {
        Counter.get('visits').then((v) => { if (v !== null) $('#public-visits').textContent = `${v} visits`; });
      }
    },

    /* ---------------------------------------------------------------- dialogue */
    openProject(id) {
      const pr = (this.data.projects || []).find((x) => x.id === id);
      if (!pr) return;
      Counter.hit('project-' + id);
      const dlg = $('#project-dialog');
      const media = pr.media || [];
      let idx = Math.min(pr.cover || 0, Math.max(media.length - 1, 0));
      dlg.innerHTML = `<button class="pd-close" type="button" aria-label="Close">×</button>
        <div class="pd">
          <div class="pd-media">
            <div class="pd-stage"></div>
            ${media.length > 1 ? '<div class="pd-nav"><button type="button" data-step="-1">← Previous</button><button type="button" data-step="1">Next →</button></div>' : ''}
            <div class="pd-caption"></div>
            ${media.length > 1 ? `<div class="pd-thumbs">${media.map((m, i) => `<button type="button" data-i="${i}" aria-label="${esc(m.caption || 'Media ' + (i + 1))}">${m.type === 'video' ? `<video src="${esc(m.src)}#t=1" muted preload="metadata"></video><span class="play">▶</span>` : m.type === 'bpmn' ? '<span class="play bpmn-t">◇ BPMN</span>' : `<img src="${esc(m.src)}" alt="" loading="lazy">`}</button>`).join('')}</div>` : ''}
          </div>
          <div class="pd-info">
            <div class="meta"><span class="company">${esc(pr.company)}</span><span>${esc(pr.period)}</span></div>
            <h2 id="pd-title">${esc(pr.name)}</h2>
            <div class="role-line">${esc(pr.role)}</div>
            <p>${esc(pr.summary)}</p>
            ${(pr.highlights || []).length ? `<ul>${pr.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
            <div class="tags">${(pr.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>
            ${(pr.links || []).length ? `<div class="hero-cta" style="margin:18px 0 0">${pr.links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>` : ''}
          </div>
        </div>`;
      const stage = $('.pd-stage', dlg), cap = $('.pd-caption', dlg);
      const show = (i) => {
        if (!media.length) { stage.innerHTML = `<div style="position:relative;width:100%;height:280px">${genCover(pr)}</div>`; cap.textContent = 'Screens coming soon.'; return; }
        idx = (i + media.length) % media.length;
        const m = media[idx];
        if (m.type === 'bpmn') { stage.innerHTML = '<div class="bpmn-host in-dialog"></div>'; mountBpmn($('.bpmn-host', stage), m.src); }
        else stage.innerHTML = m.type === 'video' ? `<video src="${esc(m.src)}" controls autoplay muted playsinline></video>` : `<img src="${esc(m.src)}" alt="${esc(m.caption || '')}">`;
        cap.textContent = `${idx + 1} / ${media.length}${m.caption ? '  ·  ' + m.caption : ''}`;
        $$('.pd-thumbs button', dlg).forEach((b) => b.setAttribute('aria-current', String(+b.dataset.i === idx)));
      };
      show(idx);
      $$('.pd-thumbs button', dlg).forEach((b) => b.addEventListener('click', () => show(+b.dataset.i)));
      $$('[data-step]', dlg).forEach((b) => b.addEventListener('click', () => show(idx + +b.dataset.step)));
      $('.pd-close', dlg).addEventListener('click', () => dlg.close());
      dlg.onkeydown = (e) => { if (e.target.closest && e.target.closest('.bpmn-host')) return; if (e.key === 'ArrowRight') show(idx + 1); if (e.key === 'ArrowLeft') show(idx - 1); };
      dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
      dlg.onclose = () => { stage.innerHTML = ''; };
      dlg.showModal();
    },

    /* ---------------------------------------------------------------- vues */
    setView(v, save = true) {
      $('#view-full').hidden = v !== 'full';
      $('#view-brief').hidden = v !== 'brief';
      $$('.view-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
      if (save) { store.set('pf_view', v); Counter.hit('view-' + v); window.scrollTo({ top: 0 }); }
    },

    bindGlobal() {
      if (this._bound) return; this._bound = true;
      document.addEventListener('click', (e) => {
        const t = e.target.closest('[data-project]');
        if (t) { e.preventDefault(); this.openProject(t.dataset.project); return; }
        const f = e.target.closest('[data-filter]');
        if (f) { this.filter = f.dataset.filter || null; $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.filter || null) === this.filter))); this.renderCards(); return; }
        const l = e.target.closest('[data-layout]');
        if (l) { this.layout = l.dataset.layout; store.set('pf_layout', this.layout); $$('[data-layout]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === this.layout))); this.renderCards(); return; }
        const v = e.target.closest('.view-switch button, [data-goview]');
        if (v) { e.preventDefault(); this.setView(v.dataset.view || v.dataset.goview); return; }
        const c = e.target.closest('[data-count]');
        if (c) Counter.hit(c.dataset.count);
        if (e.target.id === 'theme-btn') {
          const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          const next = cur === 'dark' ? 'light' : 'dark';
          document.documentElement.dataset.theme = next; store.set('pf_theme', next);
        }
      });
    },

    observe() {
      const reveal = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } }), { threshold: .08 });
      $$('.reveal').forEach((el) => reveal.observe(el));
      const links = $$('.rail a');
      const order = links.map((a) => a.getAttribute('href').slice(1));
      const spy = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = order.indexOf(e.target.id);
          links.forEach((a, k) => { a.classList.toggle('active', k === i); a.classList.toggle('done', k < i); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('[data-section]').forEach((s) => spy.observe(s));
    },
  };

  const t = store.get('pf_theme', '');
  if (t) document.documentElement.dataset.theme = t;

  window.PF = { App, Counter, esc, store };
  App.init().catch((err) => {
    console.error(err);
    document.getElementById('main').innerHTML = '<p style="padding:40px">The portfolio could not load its data. Please refresh the page.</p>';
  });
})();
