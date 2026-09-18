/* Espace proprietaire. S'ouvre avec l'adresse #studio. Ecrit dans le depot GitHub avec un jeton personnel,
   garde seulement dans ce navigateur. Sans jeton valide, rien ne peut etre modifie. */
(function () {
  'use strict';
  const HASH = '#studio';
  const { App, Counter, esc, store } = window.PF;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item';

  const S = { token: '', user: '', draft: null, dirty: false, tab: 'visitors', editing: null, blobs: {} };

  /* ---------------------------------------------------------------- GitHub */
  const GH = {
    cfg() { return S.draft ? S.draft.settings : App.data.settings; },
    async api(path, opts = {}) {
      const res = await fetch('https://api.github.com' + path, {
        ...opts,
        headers: { Authorization: 'Bearer ' + S.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) },
      });
      if (!res.ok && res.status !== 404) {
        let msg = res.status + ' ' + res.statusText;
        try { msg += ': ' + (await res.json()).message; } catch (e) { /* corps vide */ }
        throw new Error(msg);
      }
      return res.status === 404 ? null : res.json();
    },
    async check() {
      const c = this.cfg();
      const repo = await this.api(`/repos/${c.owner}/${c.repo}`);
      if (!repo) throw new Error(`Repository ${c.owner}/${c.repo} not found, or the token cannot see it.`);
      if (!repo.permissions || !repo.permissions.push) throw new Error('This token cannot write to the repository.');
      const me = await this.api('/user');
      return me ? me.login : c.owner;
    },
    async sha(path) {
      const c = this.cfg();
      const r = await this.api(`/repos/${c.owner}/${c.repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(c.branch)}`);
      return r && r.sha ? r.sha : undefined;
    },
    async put(path, base64, message) {
      const c = this.cfg();
      const sha = await this.sha(path);
      return this.api(`/repos/${c.owner}/${c.repo}/contents/${encodeURI(path)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: base64, branch: c.branch, sha }),
      });
    },
  };

  function b64Text(str) {
    const bytes = new TextEncoder().encode(str);
    return b64Bytes(bytes);
  }
  function b64Bytes(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  async function shrinkImage(file, max = 1800) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 900000) return file;
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.86));
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  }
  async function upload(file, dir) {
    const f = await shrinkImage(file);
    if (f.size > 40 * 1024 * 1024) throw new Error(`${file.name} is larger than 40 MB. Compress it first.`);
    const ext = (f.name.match(/\.(\w+)$/) || [, 'bin'])[1].toLowerCase();
    const path = `assets/uploads/${slug(dir)}/${Date.now()}-${slug(f.name.replace(/\.\w+$/, ''))}.${ext}`;
    toast(`Uploading ${f.name}…`, 0);
    await GH.put(path, b64Bytes(new Uint8Array(await f.arrayBuffer())), `Upload ${path}`);
    S.blobs[path] = URL.createObjectURL(f);
    toast(`${f.name} uploaded`);
    return { path, type: /\.(bpmn|xml)$/i.test(f.name) ? 'bpmn' : f.type.startsWith('video') ? 'video' : 'image' };
  }
  const src = (p) => S.blobs[p] || p;

  /* ---------------------------------------------------------------- interface */
  let toastTimer;
  function toast(msg, ms = 2600) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }
  function markDirty() { S.dirty = true; const d = $('.admin-bar .dirty'); if (d) d.textContent = 'Unsaved changes'; }
  const root = () => $('#admin-root');

  function open() {
    document.body.style.overflow = 'hidden';
    root().hidden = false;
    S.token = S.token || store.get('pf_gh_token', '');
    if (!S.draft) S.draft = clone(App.data);
    if (S.token && S.user) return shell();
    if (S.token) { GH.check().then((u) => { S.user = u; store.set('pf_is_admin', '1'); shell(); }).catch(() => login()); return; }
    login();
  }
  function close() {
    root().hidden = true; root().innerHTML = '';
    document.body.style.overflow = '';
    if (location.hash === HASH) history.replaceState(null, '', location.pathname + location.search);
  }

  function login(err) {
    const c = S.draft.settings;
    root().innerHTML = `<div class="admin"><div class="panel login">
      <span class="eyebrow">Owner studio</span>
      <h2>Sign in with GitHub</h2>
      <p class="hint">Changes are saved as commits to your repository, so the site stays free and static. Paste a fine-grained personal access token limited to this repository, with <b>Contents: Read and write</b>. It stays in this browser only.</p>
      ${err ? `<div class="notice">${esc(err)}</div>` : ''}
      <form id="login-form" class="fields">
        <label class="field"><span>Owner</span><input name="owner" value="${esc(c.owner)}" required></label>
        <label class="field"><span>Repository</span><input name="repo" value="${esc(c.repo)}" required></label>
        <label class="field full"><span>Personal access token</span><input name="token" type="password" autocomplete="off" required placeholder="github_pat_…"></label>
        <label class="check full"><input type="checkbox" name="remember" checked> Remember on this device</label>
        <div class="full" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-solid" type="submit">Sign in</button>
          <button class="btn" type="button" data-close>Back to the site</button>
          <a class="btn btn-ghost" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Create a token</a>
        </div>
      </form></div></div>`;
    $('[data-close]', root()).onclick = close;
    $('#login-form').onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      S.draft.settings.owner = f.get('owner').trim(); S.draft.settings.repo = f.get('repo').trim();
      S.token = f.get('token').trim();
      try {
        S.user = await GH.check();
        if (f.get('remember')) store.set('pf_gh_token', S.token);
        store.set('pf_is_admin', '1');
        shell();
      } catch (er) { S.token = ''; login(er.message); }
    };
  }

  const TABS = [['visitors', 'Visitors'], ['posts', 'Posts'], ['design', 'Design'], ['profile', 'Profile'], ['projects', 'Projects'], ['sections', 'Other sections'], ['settings', 'Settings']];

  function shell() {
    root().innerHTML = `<div class="admin">
      <div class="admin-bar">
        <b>Studio</b><span class="mono" style="font-size:12px;opacity:.7">@${esc(S.user)}</span>
        <span class="spacer"></span><span class="dirty">${S.dirty ? 'Unsaved changes' : ''}</span>
        <button class="btn" type="button" data-act="preview">Preview</button>
        <button class="btn btn-accent" type="button" data-act="publish">Save and publish</button>
        <button class="btn" type="button" data-act="close">Close</button>
      </div>
      <div class="admin-wrap">
        <nav class="admin-tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" type="button" data-tab="${k}" aria-selected="${S.tab === k}">${l}</button>`).join('')}</nav>
        <div id="admin-panel"></div>
      </div></div>`;
    $$('[data-tab]', root()).forEach((b) => b.onclick = () => { S.tab = b.dataset.tab; S.editing = null; S.editingPost = null; S.editingModule = null; shell(); });
    $('[data-act="close"]', root()).onclick = () => { if (!S.dirty || confirm('Leave the studio? Unsaved changes stay in memory until you reload the page.')) close(); };
    $('[data-act="preview"]', root()).onclick = preview;
    $('[data-act="publish"]', root()).onclick = publish;
    ({ visitors: tabVisitors, posts: tabPosts, design: tabDesign, profile: tabProfile, projects: tabProjects, sections: tabSections, settings: tabSettings })[S.tab]();
  }

  function preview() {
    const data = clone(S.draft);
    const fix = (m) => { if (m && S.blobs[m.src]) m.src = S.blobs[m.src]; };
    data.projects.forEach((p) => (p.media || []).forEach(fix));
    (data.speaking && data.speaking.media || []).forEach(fix);
    if (S.blobs[data.profile.photo]) data.profile.photo = S.blobs[data.profile.photo];
    (data.modules || []).forEach((m) => fix(m.cover));
    (data.posts || []).forEach((p) => { fix(p.cover); p.body = String(p.body || '').replace(/src="([^"]+)"/g, (m, u) => S.blobs[u] ? `src="${S.blobs[u]}"` : m); });
    App.data = data; App.render();
    close();
    const bar = document.createElement('div');
    bar.className = 'toast';
    bar.innerHTML = 'Preview of your changes. <button class="btn" style="margin-left:8px;padding:4px 10px" type="button">Back to the studio</button>';
    document.body.appendChild(bar);
    bar.querySelector('button').onclick = () => { bar.remove(); location.hash = HASH; };
  }

  async function publish() {
    try {
      const json = JSON.stringify(S.draft, null, 2) + '\n';
      JSON.parse(json);
      toast('Publishing…', 0);
      await GH.put('data/portfolio.json', b64Text(json), 'Update portfolio content');
      S.dirty = false;
      App.data = clone(S.draft);
      App.render();
      shell();
      toast('Published. GitHub Pages updates the live site in about a minute.', 5000);
    } catch (e) { toast('Publishing failed: ' + e.message, 8000); }
  }

  /* ---------------------------------------------------------------- onglet visiteurs */
  async function tabVisitors() {
    const d = S.draft;
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel"><h2>Visitors</h2>
      <p class="hint">Counted once per browser session. Your own visits on this device are not counted.</p>
      <div class="stats" id="stats">Loading…</div>
      <h3 style="font-size:18px;margin:6px 0 10px">Project openings</h3><div class="bars" id="bars"></div></div>`;
    const keys = [['visits', 'Visits'], ['likes', '❤ Profile loves'], ['cv', 'CV downloads'], ['bpmn-viewer', 'BPMN model opened'], ['contact-email', 'E-mail clicks'], ['contact-whatsapp', 'WhatsApp clicks'], ['view-brief', 'Recruiter brief views'], ['view-full', 'Full view switches']];
    const vals = await Promise.all(keys.map(([k]) => Counter.get(k)));
    $('#stats').innerHTML = keys.map(([, l], i) => `<div class="stat"><b>${vals[i] === null ? '–' : vals[i]}</b><span>${l}</span></div>`).join('');
    const pv = await Promise.all(d.projects.map((x) => Counter.get('project-' + x.id)));
    const max = Math.max(1, ...pv.map((v) => v || 0));
    const posts = d.posts || [];
    const ps = await Promise.all(posts.map((x) => Counter.get('post-' + x.id)));
    const pmax = Math.max(1, ...ps.map((v) => v || 0));
    $('#bars').insertAdjacentHTML('afterend', posts.length ? `<h3 style="font-size:18px;margin:18px 0 10px">Post reads</h3><div class="bars">${posts.map((x, i) => `<div><span>${esc(x.title || 'Untitled')}</span><i style="width:${((ps[i] || 0) / pmax) * 100}%"></i><em>${ps[i] ?? '–'}</em></div>`).join('')}</div>` : '');
    $('#bars').innerHTML = d.projects.map((x, i) => `<div><span>${esc(x.name)}</span><i style="width:${((pv[i] || 0) / max) * 100}%"></i><em>${pv[i] ?? '–'}</em></div>`).join('');
    if (vals.every((v) => v === null)) $('#stats').insertAdjacentHTML('afterend', '<div class="notice">The counter service did not answer. Try again later.</div>');
  }

  /* ---------------------------------------------------------------- onglet publications */
  function tabPosts() {
    const list = S.draft.posts = S.draft.posts || [];
    const mods = S.draft.modules = S.draft.modules || [];
    if (S.editingModule != null && mods[S.editingModule]) return editModule(mods[S.editingModule]);
    if (S.editingPost != null && list[S.editingPost]) return editPost(list[S.editingPost]);
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:end">
      <div><h2>Modules</h2><p class="hint">Themes that group your posts, each with its own look: Romans, Tech notes, Travel…</p></div>
      <button class="btn btn-solid" type="button" id="new-mod">New module</button></div>
      <div class="rows">${mods.map((m, i) => `<div class="prow">
        <div class="thumb" style="display:grid;place-items:center;font-size:22px;background:${esc(m.background || 'var(--surface-2)')};border:2px solid ${esc(m.accent || 'transparent')}">${esc(m.emoji || '✦')}</div>
        <div class="t"><b>${esc(m.name)}</b><span>${list.filter((x) => x.module === m.id).length} posts · ${esc(m.description || '')}</span></div>
        <div class="acts"><button class="icon-btn" type="button" data-medit="${i}">Edit</button><button class="icon-btn danger" type="button" data-mdel="${i}">Delete</button></div>
      </div>`).join('') || '<p class="hint">No module yet.</p>'}</div></div>
    <div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:end">
      <div><h2>Posts</h2><p class="hint">Your thoughts, published on your portfolio. Drafts stay hidden until you make them visible.</p></div>
      <button class="btn btn-solid" type="button" id="new-post">Write a post</button></div>
      <div class="rows">${list.map((x, i) => `<div class="prow">
        <div class="thumb">${x.cover && x.cover.src ? (x.cover.type === 'video' ? `<video src="${esc(src(x.cover.src))}" muted></video>` : `<img src="${esc(src(x.cover.src))}" alt="">`) : ''}</div>
        <div class="t"><b>${esc(x.title || 'Untitled')}</b><span>${esc(x.date)}${x.visible === false ? ' · draft' : ' · published'}${x.pinned ? ' · pinned' : ''}</span></div>
        <div class="acts">
          <button class="icon-btn" type="button" data-pvis="${i}">${x.visible === false ? 'Publish' : 'Unpublish'}</button>
          <button class="icon-btn" type="button" data-pedit="${i}">Edit</button>
          <button class="icon-btn danger" type="button" data-pdel="${i}">Delete</button>
        </div></div>`).join('') || '<p class="hint">No post yet.</p>'}</div></div>`;
    $('#new-mod').onclick = () => {
      mods.push({ id: 'module-' + Date.now().toString(36), name: 'New module', description: '', emoji: '✦', accent: '#b8741f', background: '#fbf6ee', pattern: 'none', patternOpacity: 0.12, font: 'site', cover: null });
      S.editingModule = mods.length - 1; markDirty(); tabPosts();
    };
    $$('[data-medit]', p).forEach((b) => b.onclick = () => { S.editingModule = +b.dataset.medit; tabPosts(); });
    $$('[data-mdel]', p).forEach((b) => b.onclick = () => {
      const m = mods[+b.dataset.mdel];
      if (confirm(`Delete the module “${m.name}”? Its posts stay, without a module.`)) { list.forEach((x) => { if (x.module === m.id) x.module = ''; }); mods.splice(+b.dataset.mdel, 1); markDirty(); tabPosts(); }
    });
    $('#new-post').onclick = () => {
      list.unshift({ id: 'post-' + Date.now().toString(36), title: '', date: new Date().toISOString().slice(0, 10), tags: [], excerpt: '', cover: null, body: '<p></p>',
        style: { layout: 'standard', font: 'site', accent: '', coverDisplay: 'full' }, visible: false, pinned: false });
      S.editingPost = 0; markDirty(); tabPosts();
    };
    $$('[data-pvis]', p).forEach((b) => b.onclick = () => { const x = list[+b.dataset.pvis]; x.visible = x.visible === false; markDirty(); tabPosts(); });
    $$('[data-pedit]', p).forEach((b) => b.onclick = () => { S.editingPost = +b.dataset.pedit; tabPosts(); });
    $$('[data-pdel]', p).forEach((b) => b.onclick = () => { const x = list[+b.dataset.pdel]; if (confirm(`Delete “${x.title || 'this post'}”?`)) { list.splice(+b.dataset.pdel, 1); markDirty(); tabPosts(); } });
  }

  function editModule(m) {
    const D = window.PFDesign;
    const fonts = { site: 'Site font', serif: 'Serif', sans: 'Sans', mono: 'Mono', elegant: 'Elegant', script: 'Handwritten titles', typewriter: 'Typewriter' };
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel">
      <button class="btn btn-ghost" type="button" id="mback">← Posts and modules</button>
      <h2 style="margin-top:12px">${esc(m.emoji || '')} ${esc(m.name)}</h2>
      <p class="hint">Posts in this module take its colours, background and font.</p>
      <div class="fields" id="mf">
        <label class="field"><span>Name</span><input name="name" value="${esc(m.name)}"></label>
        <label class="field"><span>Symbol or emoji</span><input name="emoji" value="${esc(m.emoji || '')}" maxlength="4"></label>
        <label class="field full"><span>Description</span><textarea name="description" style="min-height:60px">${esc(m.description || '')}</textarea></label>
        <label class="field"><span>Accent colour</span><input type="color" name="accent" value="${esc(m.accent || '#b8741f')}"></label>
        <label class="field"><span>Background colour</span><input type="color" name="background" value="${esc(m.background || '#ffffff')}"></label>
        <label class="field"><span>Background pattern</span><select name="pattern">${Object.entries(D.PATTERNS).map(([k, l]) => `<option value="${k}" ${m.pattern === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Pattern strength</span><input type="range" name="patternOpacity" min="3" max="50" value="${Math.round((Number(m.patternOpacity) || 0.12) * 100)}"></label>
        <label class="field"><span>Font</span><select name="font">${Object.entries(fonts).map(([k, l]) => `<option value="${k}" ${m.font === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="field"><span>Cover image</span><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${m.cover && m.cover.src ? `<img src="${esc(src(m.cover.src))}" alt="" style="width:120px;height:68px;object-fit:cover;border-radius:6px">` : ''}
          <label class="btn" style="cursor:pointer">Upload<input type="file" id="mcover" accept="image/*" hidden></label>
          ${m.cover ? '<button class="btn" type="button" id="mcover-rm">Remove</button>' : ''}</div></div>
      </div>
      <h3 style="font-size:18px;margin:20px 0 10px">Preview</h3>
      <div id="mprev" style="max-width:320px"></div>
    </div>`;
    const prev = () => {
      const pat = m.pattern && m.pattern !== 'none' ? D.pattern(m.pattern, m.accent, m.accent, 1) : 'none';
      $('#mprev').innerHTML = `<div class="mod-card" style="--accent:${esc(m.accent)};--mod-bg:${esc(m.background)};--mod-pattern:${esc(pat)};--mod-pattern-op:${Number(m.patternOpacity) || 0.12}">
        <span class="mod-emoji">${esc(m.emoji || '✦')}</span><b>${esc(m.name)}</b><small>${esc(m.description || '')}</small><em>posts</em></div>`;
    };
    prev();
    $('#mback').onclick = () => { S.editingModule = null; tabPosts(); };
    $$('#mf [name]', p).forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      const n = el.name;
      m[n] = n === 'patternOpacity' ? el.value / 100 : el.value;
      if (n === 'name' && /^module-/.test(m.id)) m.id = slug(el.value) + '-' + m.id.slice(7);
      markDirty(); prev();
    }));
    $('#mcover').onchange = async (e) => { try { const r = await upload(e.target.files[0], 'modules'); m.cover = { type: 'image', src: r.path }; markDirty(); editModule(m); } catch (er) { toast(er.message, 6000); } };
    if ($('#mcover-rm')) $('#mcover-rm').onclick = () => { m.cover = null; markDirty(); editModule(m); };
  }

  function editPost(x) {
    x.style = x.style || {};
    const st = x.style;
    const segP = (key, opts) => `<div class="seg">${Object.entries(opts).map(([k, l]) => `<button type="button" data-ps="${key}" data-v="${k}" aria-pressed="${(st[key] || '') === k}">${l}</button>`).join('')}</div>`;
    // les medias televerses s'affichent depuis le navigateur, le chemin reel est garde a cote
    const bodyForEdit = String(x.body || '').replace(/src="([^"]+)"/g, (m, u) => S.blobs[u] ? `src="${S.blobs[u]}" data-path="${u}"` : m);
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel">
      <button class="btn btn-ghost" type="button" id="pback">← All posts</button>
      <div class="fields" style="margin-top:14px" id="pf">
        <label class="field full"><span>Title</span><input name="title" value="${esc(x.title)}" placeholder="What is this post about?"></label>
        <label class="field"><span>Date</span><input name="date" type="date" value="${esc(x.date)}"></label>
        <label class="field"><span>Tags, separated by commas</span><input name="tags" value="${esc((x.tags || []).join(', '))}"></label>
        <label class="field"><span>Module</span><select name="module"><option value="">No module</option>${(S.draft.modules || []).map((m) => `<option value="${esc(m.id)}" ${x.module === m.id ? 'selected' : ''}>${esc((m.emoji || '') + ' ' + m.name)}</option>`).join('')}</select></label>
        <label class="field full"><span>Short summary, shown on the cards</span><textarea name="excerpt" style="min-height:60px">${esc(x.excerpt)}</textarea></label>
        <label class="check"><input type="checkbox" name="visible" ${x.visible !== false ? 'checked' : ''}> Published (visible to visitors)</label>
        <label class="check"><input type="checkbox" name="pinned" ${x.pinned ? 'checked' : ''}> Pinned at the top</label>
      </div>

      <div class="design-block"><h3>Cover</h3>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <div class="thumb" style="width:160px;height:90px;border-radius:6px;overflow:hidden;background:var(--surface-2)">${x.cover && x.cover.src ? (x.cover.type === 'video' ? `<video src="${esc(src(x.cover.src))}" muted style="width:100%;height:100%;object-fit:cover"></video>` : `<img src="${esc(src(x.cover.src))}" alt="" style="width:100%;height:100%;object-fit:cover">`) : ''}</div>
          <label class="btn" style="cursor:pointer">Upload an image or video<input type="file" id="pcover" accept="image/*,video/mp4,video/webm" hidden></label>
          ${x.cover ? '<button class="btn" type="button" id="pcover-rm">Remove the cover</button>' : ''}
        </div>
      </div>

      <div class="design-block"><h3>Text</h3>
        <div class="rte-bar" role="toolbar" aria-label="Formatting">
          <select id="rte-block" aria-label="Paragraph style"><option value="p">Paragraph</option><option value="h2">Heading</option><option value="h3">Subheading</option><option value="blockquote">Quote</option><option value="pre">Code block</option></select>
          <span class="sep"></span>
          <button type="button" data-cmd="bold" title="Bold"><b>B</b></button>
          <button type="button" data-cmd="italic" title="Italic"><i>I</i></button>
          <button type="button" data-cmd="underline" title="Underline"><u>U</u></button>
          <button type="button" data-cmd="strikeThrough" title="Strike"><s>S</s></button>
          <button type="button" data-wrap="mark" title="Highlight">▮</button>
          <button type="button" data-wrap="code" title="Inline code">&lt;/&gt;</button>
          <span class="sep"></span>
          <button type="button" data-cmd="insertUnorderedList" title="Bullet list">• List</button>
          <button type="button" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
          <button type="button" data-align="left" title="Align left">⇤</button>
          <button type="button" data-align="center" title="Centre">↔</button>
          <button type="button" data-align="right" title="Align right">⇥</button>
          <span class="sep"></span>
          <button type="button" id="rte-link" title="Link">🔗 Link</button>
          <label style="cursor:pointer;padding:5px 8px;font-size:13px">🖼 Image<input type="file" id="rte-img" accept="image/*" hidden></label>
          <label style="cursor:pointer;padding:5px 8px;font-size:13px">🎬 Video<input type="file" id="rte-vid" accept="video/mp4,video/webm" hidden></label>
          <button type="button" data-cmd="insertHorizontalRule" title="Divider">―</button>
          <button type="button" data-cmd="removeFormat" title="Clear formatting">✕ Format</button>
        </div>
        <div class="rte post-body" id="rte" contenteditable="true" spellcheck="true">${bodyForEdit}</div>
      </div>

      <div class="design-block"><h3>Post style</h3>
        <div class="fields">
          <div class="field"><span>Layout</span>${segP('layout', { standard: 'Standard', wide: 'Wide', centered: 'Centred title' })}</div>
          <div class="field"><span>Body font</span>${segP('font', { site: 'Site font', serif: 'Serif', sans: 'Sans', mono: 'Mono' })}</div>
          <div class="field"><span>Cover display</span>${segP('coverDisplay', { full: 'Large', inline: 'In the column', none: 'Hidden' })}</div>
          <label class="field"><span>Accent colour for this post</span><div style="display:flex;gap:8px;align-items:center"><input type="color" id="paccent" value="${esc(st.accent || '#b8741f')}" style="width:60px"><button class="btn" type="button" id="paccent-rm">Use the site accent</button></div></label>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
        <button class="btn" type="button" id="pview">Preview this post</button>
      </div>
    </div>`;
    const ed = $('#rte');
    const sync = () => {
      const tmp = ed.cloneNode(true);
      tmp.querySelectorAll('[data-path]').forEach((el) => { el.setAttribute('src', el.dataset.path); el.removeAttribute('data-path'); });
      x.body = tmp.innerHTML; markDirty();
    };
    ed.addEventListener('input', sync);
    $('#pback').onclick = () => { sync(); S.editingPost = null; tabPosts(); };
    $$('#pf [name]', p).forEach((el) => el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
      const n = el.name;
      if (el.type === 'checkbox') x[n] = el.checked;
      else if (n === 'tags') x.tags = el.value.split(',').map((t) => t.trim()).filter(Boolean);
      else x[n] = el.value;
      if (n === 'title' && /^post-/.test(x.id)) x.id = slug(el.value) + '-' + x.id.slice(5);
      markDirty();
    }));
    const exec = (c, v = null) => { ed.focus(); document.execCommand(c, false, v); sync(); };
    $$('[data-cmd]', p).forEach((b) => b.onmousedown = (e) => { e.preventDefault(); exec(b.dataset.cmd); });
    $('#rte-block').onchange = (e) => { exec('formatBlock', e.target.value); e.target.value = 'p'; };
    $$('[data-wrap]', p).forEach((b) => b.onmousedown = (e) => {
      e.preventDefault(); const sel = getSelection(); if (!sel.rangeCount || sel.isCollapsed) return;
      const w = document.createElement(b.dataset.wrap); try { sel.getRangeAt(0).surroundContents(w); } catch (er) { toast('Select text inside one paragraph'); } sync();
    });
    $$('[data-align]', p).forEach((b) => b.onmousedown = (e) => {
      e.preventDefault(); const sel = getSelection(); if (!sel.rangeCount) return;
      let n = sel.anchorNode; while (n && n.parentNode !== ed) n = n.parentNode;
      if (n && n.nodeType === 1) { n.classList.remove('align-left', 'align-center', 'align-right'); if (b.dataset.align !== 'left') n.classList.add('align-' + b.dataset.align); sync(); }
    });
    $('#rte-link').onmousedown = (e) => { e.preventDefault(); const u = prompt('Link address (https://…)'); if (u && /^(https?:|mailto:|#)/.test(u)) exec('createLink', u); };
    let saved = null;
    ed.addEventListener('blur', () => { const sel = getSelection(); if (sel.rangeCount) saved = sel.getRangeAt(0).cloneRange(); });
    const insertMedia = async (file, kind) => {
      try {
        const r = await upload(file, 'posts/' + x.id);
        const blob = S.blobs[r.path];
        const cap = prompt('Caption (optional)') || '';
        const html = kind === 'video'
          ? `<figure><video src="${blob}" data-path="${r.path}" controls></video>${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure><p></p>`
          : `<figure><img src="${blob}" data-path="${r.path}" alt="${esc(cap)}">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure><p></p>`;
        ed.focus();
        if (saved) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(saved); }
        document.execCommand('insertHTML', false, html);
        sync();
      } catch (er) { toast(er.message, 6000); }
    };
    $('#rte-img').onchange = (e) => { if (e.target.files[0]) insertMedia(e.target.files[0], 'image'); e.target.value = ''; };
    $('#rte-vid').onchange = (e) => { if (e.target.files[0]) insertMedia(e.target.files[0], 'video'); e.target.value = ''; };
    $('#pcover').onchange = async (e) => {
      try { const r = await upload(e.target.files[0], 'posts/' + x.id); x.cover = { type: r.type, src: r.path }; sync(); editPost(x); } catch (er) { toast(er.message, 6000); }
    };
    if ($('#pcover-rm')) $('#pcover-rm').onclick = () => { x.cover = null; sync(); editPost(x); };
    $$('[data-ps]', p).forEach((b) => b.onclick = () => { sync(); st[b.dataset.ps] = b.dataset.v; markDirty(); editPost(x); });
    $('#paccent').oninput = (e) => { st.accent = e.target.value; markDirty(); };
    $('#paccent-rm').onclick = () => { st.accent = ''; markDirty(); toast('This post uses the site accent'); };
    $('#pview').onclick = () => { sync(); const vis = x.visible; x.visible = true; const id = x.id; preview(); x.visible = vis; location.hash = '#/post/' + id; };
  }

  /* ---------------------------------------------------------------- onglet design */
  function tabDesign() {
    const D = window.PFDesign;
    const d = S.draft.design = S.draft.design || {};
    d.colors = d.colors || {}; d.hide = d.hide || {}; d.stickers = d.stickers || [];
    const live = () => { D.apply(d); markDirty(); };
    const seg = (key, opts) => `<div class="seg" data-seg="${key}">${Object.entries(opts).map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${(d[key] || '') === k}">${l}</button>`).join('')}</div>`;
    const cur = D.PRESETS[d.preset] || D.PRESETS['ink-ochre'];
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel"><h2>Design</h2>
      <p class="hint">Every change applies at once behind this panel. Use Preview to see it, then Save and publish.</p>

      <div class="design-block"><h3>Theme</h3>
        <div class="presets">${Object.entries(D.PRESETS).map(([k, v]) => `<button type="button" class="preset" data-preset="${k}" aria-pressed="${d.preset === k}">
          <span class="sw"><i style="background:${v.light.ink}"></i><i style="background:${v.light.ink2}"></i><i style="background:${v.light.accent}"></i><i style="background:${v.light.paper}"></i></span>${esc(v.name)}</button>`).join('')}</div>
      </div>

      <div class="design-block"><h3>Your own colours</h3>
        <div class="fields">
          <label class="field"><span>Main colour</span><input type="color" data-color="ink" value="${esc(d.colors.ink || cur.light.ink)}"></label>
          <label class="field"><span>Accent colour</span><input type="color" data-color="accent" value="${esc(d.colors.accent || cur.light.accent)}"></label>
          <label class="field"><span>Secondary colour</span><input type="color" data-color="ink2" value="${esc(d.colors.ink2 || cur.light.ink2)}"></label>
          <label class="field"><span>Background</span><input type="color" data-color="paper" value="${esc(d.colors.paper || cur.light.paper)}"></label>
        </div>
        <button class="btn" type="button" id="reset-colors" style="margin-top:10px">Back to the theme colours</button>
      </div>

      <div class="design-block"><h3>Background painting</h3>
        <p class="hint">A pattern painted behind the whole site, in your theme colours.</p>
        <div class="presets" id="pats">${Object.entries(D.PATTERNS).map(([k, l]) => `<button type="button" class="preset" data-pat="${k}" aria-pressed="${(d.pattern || 'none') === k}">
          <span class="sw pat-sw" style="background:${cur.light.paper}"><i style="background:${k === 'none' ? 'none' : D.pattern(k, (d.colors.accent || cur.light.accent) + '66', (d.colors.ink2 || cur.light.ink2) + '55', 0.5)}"></i></span>${l}</button>`).join('')}</div>
        <div class="fields" style="margin-top:12px">
          <div class="field"><span>Pattern colours</span>${seg('patternColor', { both: 'Accent and secondary', accent: 'Accent only', main: 'Main colours' })}</div>
          <div class="field"><span>Pattern size</span>${seg('patternSize', { small: 'Small', medium: 'Medium', large: 'Large' })}</div>
          <label class="field"><span>Strength: <b id="op-v">${Math.round((Number(d.patternOpacity) || 0.12) * 100)}%</b></span><input type="range" min="3" max="60" value="${Math.round((Number(d.patternOpacity) || 0.12) * 100)}" id="pat-op"></label>
          <div class="field"><span>Where</span>${seg('patternArea', { page: 'Whole page', hero: 'Top section only' })}</div>
        </div>
      </div>

      <div class="design-block"><h3>Cards and buttons</h3>
        <div class="fields">
          <div class="field"><span>Cards</span>${seg('cards', { bordered: 'Bordered', flat: 'Flat', elevated: 'Floating' })}</div>
          <div class="field"><span>Buttons</span>${seg('buttons', { rounded: 'Rounded', pill: 'Pill', square: 'Square' })}</div>
        </div>
      </div>

      <div class="design-block"><h3>Layout and motion</h3>
        <div class="fields">
          <div class="field"><span>Photo position</span>${seg('heroLayout', { 'photo-right': 'Photo right', 'photo-left': 'Photo left' })}</div>
          <div class="field"><span>Title size</span>${seg('titleSize', { compact: 'Compact', normal: 'Normal', large: 'Large' })}</div>
          <div class="field"><span>Animations</span>${seg('motion', { on: 'On', off: 'Off' })}</div>
        </div>
      </div>

      <div class="design-block"><h3>Photo background</h3>
        <p class="hint">Your photo is cut out, so its background can take any colour.</p>
        ${seg('photoBg', { original: 'Original', accent: 'Accent', main: 'Main colour', soft: 'Soft tint', gradient: 'Gradient', color: 'My colour' })}
        <label class="field" style="max-width:220px;margin-top:10px"><span>My colour</span><input type="color" id="photo-bg-color" value="${esc(d.photoBgColor || cur.light.accent)}"></label>
      </div>

      <div class="design-block"><h3>Mode</h3>${seg('mode', { auto: 'Follow the visitor', light: 'Light', dark: 'Dark' })}</div>
      <div class="design-block"><h3>Typography</h3>${seg('font', Object.fromEntries(Object.entries(D.FONTS).map(([k, v]) => [k, v.name])))}</div>
      <div class="design-block"><h3>Corners</h3>${seg('radius', { sharp: 'Sharp', soft: 'Soft', round: 'Round' })}</div>
      <div class="design-block"><h3>Photo shape</h3>${seg('photo', { arch: 'Arch', circle: 'Circle', square: 'Square' })}</div>

      <div class="design-block"><h3>Sections</h3>
        ${[['standards', 'Hide the Standards section'], ['stage', 'Hide the On stage section'], ['quote', 'Hide the quote'], ['rail', 'Hide the side navigation']].map(([k, l]) => `<label class="check"><input type="checkbox" data-hide="${k}" ${d.hide[k] ? 'checked' : ''}> ${l}</label>`).join('')}
      </div>

      <div class="design-block"><h3>Stickers</h3>
        <p class="hint">Pick a symbol, write a short label, choose where it goes.</p>
        <div class="emojis">${D.STICKERS.map((e) => `<button type="button" data-add="${esc(e)}" aria-label="Add sticker ${esc(e)}">${esc(e)}</button>`).join('')}
          <button type="button" data-add="" style="width:auto;padding:0 10px;font-size:13px">Text only</button></div>
        <div class="rows" style="margin-top:12px">${d.stickers.map((st, i) => `<div class="st-row">
          <input data-s="${i}" data-k="emoji" value="${esc(st.emoji || '')}" placeholder="Symbol" aria-label="Symbol">
          <input data-s="${i}" data-k="text" value="${esc(st.text || '')}" placeholder="Label" aria-label="Label">
          <select data-s="${i}" data-k="section" aria-label="Section">${Object.entries(D.SECTIONS).map(([k, l]) => `<option value="${k}" ${st.section === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <select data-s="${i}" data-k="pos" aria-label="Position">${['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((k) => `<option ${st.pos === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
          <select data-s="${i}" data-k="style" aria-label="Style">${[['ink', 'Dark pill'], ['accent', 'Accent pill'], ['outline', 'Dashed'], ['paper', 'Paper'], ['circle', 'Round badge']].map(([k, l]) => `<option value="${k}" ${st.style === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <input data-s="${i}" data-k="rotate" type="number" min="-30" max="30" value="${esc(st.rotate || 0)}" aria-label="Rotation in degrees">
          <button class="icon-btn danger" type="button" data-srm2="${i}" aria-label="Remove sticker">✕</button>
        </div>`).join('')}</div>
      </div></div>`;
    $$('[data-preset]', p).forEach((b) => b.onclick = () => { d.preset = b.dataset.preset; d.colors = {}; live(); tabDesign(); });
    $$('[data-color]', p).forEach((el) => el.oninput = () => { d.colors[el.dataset.color] = el.value; live(); });
    $('#reset-colors').onclick = () => { d.colors = {}; live(); tabDesign(); };
    $$('[data-seg]', p).forEach((g) => $$('button', g).forEach((b) => b.onclick = () => { d[g.dataset.seg] = b.dataset.v; live(); tabDesign(); }));
    $$('[data-pat]', p).forEach((b) => b.onclick = () => { d.pattern = b.dataset.pat; if (!d.patternOpacity) d.patternOpacity = 0.12; live(); tabDesign(); });
    $('#photo-bg-color').oninput = (e) => { d.photoBgColor = e.target.value; d.photoBg = 'color'; live(); };
    $('#pat-op').oninput = (e) => { d.patternOpacity = e.target.value / 100; $('#op-v').textContent = e.target.value + '%'; live(); };
    $$('[data-hide]', p).forEach((el) => el.onchange = () => { d.hide[el.dataset.hide] = el.checked; live(); });
    $$('[data-add]', p).forEach((b) => b.onclick = () => { d.stickers.push({ emoji: b.dataset.add, text: b.dataset.add ? '' : 'Hello', section: 'top', pos: 'top-right', rotate: -4, style: 'accent' }); live(); tabDesign(); });
    $$('[data-s]', p).forEach((el) => el.oninput = el.onchange = () => { const st = d.stickers[+el.dataset.s]; st[el.dataset.k] = el.dataset.k === 'rotate' ? Number(el.value) : el.value; live(); });
    $$('[data-srm2]', p).forEach((b) => b.onclick = () => { d.stickers.splice(+b.dataset.srm2, 1); live(); tabDesign(); });
  }

  /* ---------------------------------------------------------------- onglet profil */
  function tabProfile() {
    const pr = S.draft.profile;
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel"><h2>Profile</h2><p class="hint">What recruiters read first.</p>
      <div class="fields" id="pf">
        ${field('name', 'Name', pr.name)}${field('title', 'Title', pr.title)}
        ${field('headline', 'Headline', pr.headline, 'full', 'textarea')}
        ${field('about', 'About, one paragraph per block (blank line between)', (pr.about || []).join('\n\n'), 'full', 'textarea')}
        ${field('location', 'Location', pr.location)}${field('availability', 'Availability', pr.availability)}
        ${field('email', 'E-mail', pr.email)}${field('whatsapp', 'WhatsApp number, with country code', pr.whatsapp)}
        ${field('linkedin', 'LinkedIn URL', pr.linkedin)}${field('github', 'GitHub URL', pr.github)}
        ${field('languages', 'Languages, one per line: Name | level', (pr.languages || []).map((l) => `${l.name} | ${l.level}`).join('\n'), '', 'textarea')}
        ${field('facts', 'Key figures, one per line: value | label', (pr.facts || []).map((f) => `${f.value} | ${f.label}`).join('\n'), '', 'textarea')}
        <div class="field"><span>Photo</span><img src="${esc(src(pr.photo))}" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:50%"><input type="file" accept="image/*" id="up-photo"></div>
        <div class="field"><span>CV (PDF)</span><a class="btn" href="${esc(src(pr.cv))}" target="_blank" rel="noopener">Current CV</a><input type="file" accept="application/pdf" id="up-cv"></div>
        <h3 class="full" style="font-size:18px;margin-top:8px">Quote</h3>
        ${field('q_text', 'Quote (English)', S.draft.quote.text, 'full', 'textarea')}
        ${field('q_original', 'Original wording', S.draft.quote.original, 'full')}
        ${field('q_author', 'Author', S.draft.quote.author)}${field('q_source', 'Source', S.draft.quote.source)}
      </div></div>`;
    $$('#pf [name]').forEach((el) => el.addEventListener('input', () => {
      const v = el.value, n = el.name;
      if (n === 'about') pr.about = v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
      else if (n === 'languages') pr.languages = lines(v).map((l) => { const [a, b] = l.split('|'); return { name: a.trim(), level: (b || '').trim() }; });
      else if (n === 'facts') pr.facts = lines(v).map((l) => { const [a, b] = l.split('|'); return { value: a.trim(), label: (b || '').trim() }; });
      else if (n.startsWith('q_')) S.draft.quote[n.slice(2)] = v;
      else pr[n] = v;
      markDirty();
    }));
    $('#up-photo').onchange = async (e) => { try { const r = await upload(e.target.files[0], 'profile'); pr.photo = r.path; markDirty(); tabProfile(); } catch (er) { toast(er.message, 6000); } };
    $('#up-cv').onchange = async (e) => { try { const r = await upload(e.target.files[0], 'cv'); pr.cv = r.path; markDirty(); tabProfile(); } catch (er) { toast(er.message, 6000); } };
  }
  function field(name, label, value, cls = '', kind = 'input') {
    const v = esc(value ?? '');
    return `<label class="field ${cls}"><span>${label}</span>${kind === 'textarea' ? `<textarea name="${name}">${v}</textarea>` : `<input name="${name}" value="${v}">`}</label>`;
  }
  const lines = (v) => String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);

  /* ---------------------------------------------------------------- onglet projets */
  function tabProjects() {
    if (S.editing !== null) return editProject();
    const list = S.draft.projects;
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:end">
      <div><h2>Projects</h2><p class="hint">Order here is the order on the site. Featured projects get a wide card.</p></div>
      <button class="btn btn-solid" type="button" id="add-project">Add a project</button></div>
      <div class="rows">${list.map((x, i) => {
        const m = (x.media || [])[x.cover || 0];
        return `<div class="prow">
          <div class="thumb">${m ? (m.type === 'video' ? `<video src="${esc(src(m.src))}#t=1" muted></video>` : `<img src="${esc(src(m.src))}" alt="">`) : ''}</div>
          <div class="t"><b>${esc(x.name)}</b><span>${esc(x.company)} · ${esc(x.role)}${x.visible === false ? ' · hidden' : ''}${x.featured ? ' · featured' : ''}</span></div>
          <div class="acts">
            <button class="icon-btn" type="button" data-mv="${i}" data-d="-1" aria-label="Move up">↑</button>
            <button class="icon-btn" type="button" data-mv="${i}" data-d="1" aria-label="Move down">↓</button>
            <button class="icon-btn" type="button" data-vis="${i}">${x.visible === false ? 'Show' : 'Hide'}</button>
            <button class="icon-btn" type="button" data-edit="${i}">Edit</button>
            <button class="icon-btn danger" type="button" data-del="${i}">Delete</button>
          </div></div>`;
      }).join('')}</div></div>`;
    $('#add-project').onclick = () => {
      list.unshift({ id: 'project-' + Date.now().toString(36), name: 'New project', company: '', role: '', period: '', keywords: [], summary: '', highlights: [], media: [], cover: 0, featured: false, visible: false, links: [] });
      S.editing = 0; markDirty(); tabProjects();
    };
    $$('[data-mv]', p).forEach((b) => b.onclick = () => { const i = +b.dataset.mv, j = i + +b.dataset.d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; markDirty(); tabProjects(); });
    $$('[data-vis]', p).forEach((b) => b.onclick = () => { const x = list[+b.dataset.vis]; x.visible = x.visible === false; markDirty(); tabProjects(); });
    $$('[data-edit]', p).forEach((b) => b.onclick = () => { S.editing = +b.dataset.edit; tabProjects(); });
    $$('[data-del]', p).forEach((b) => b.onclick = () => { const x = list[+b.dataset.del]; if (confirm(`Delete “${x.name}”? The files stay in the repository.`)) { list.splice(+b.dataset.del, 1); markDirty(); tabProjects(); } });
  }

  function editProject() {
    const x = S.draft.projects[S.editing];
    x.media = x.media || [];
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel">
      <button class="btn btn-ghost" type="button" id="back">← All projects</button>
      <h2 style="margin-top:12px">${esc(x.name)}</h2><p class="hint">The card shows the name, company, title and keywords.</p>
      <div class="fields" id="pe">
        ${field('name', 'Project name', x.name)}${field('company', 'Company', x.company)}
        ${field('role', 'Your title', x.role)}${field('period', 'Period', x.period)}
        ${field('keywords', 'Keywords, separated by commas', (x.keywords || []).join(', '), 'full')}
        ${field('summary', 'Summary', x.summary, 'full', 'textarea')}
        ${field('highlights', 'Highlights, one per line', (x.highlights || []).join('\n'), 'full', 'textarea')}
        ${field('links', 'Links, one per line: label | https://…', (x.links || []).map((l) => `${l.label} | ${l.url}`).join('\n'), 'full', 'textarea')}
        <label class="check"><input type="checkbox" name="featured" ${x.featured ? 'checked' : ''}> Featured (wide card)</label>
        <label class="check"><input type="checkbox" name="visible" ${x.visible !== false ? 'checked' : ''}> Visible on the site</label>
      </div>
      <h3 style="font-size:18px;margin:22px 0 8px">Images and videos</h3>
      <p class="hint">Images are resized before upload. Videos: MP4 or WebM, under 40 MB. BPMN files (.bpmn) open in the interactive viewer. The outlined item is the card cover.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <label class="btn btn-solid" style="cursor:pointer">Upload files<input type="file" id="up-media" accept="image/*,video/mp4,video/webm,.bpmn,.xml" multiple hidden></label>
        <button class="btn" type="button" id="add-url">Add by path or URL</button>
      </div>
      <div class="media-list">${x.media.map((m, i) => `<div class="mitem ${i === (x.cover || 0) ? 'is-cover' : ''}">
        <div class="mv">${m.type === 'video' ? `<video src="${esc(src(m.src))}#t=1" muted preload="metadata"></video>` : m.type === 'bpmn' ? '<div class="bpmn-thumb"><span>BPMN</span></div>' : `<img src="${esc(src(m.src))}" alt="">`}</div>
        <input data-cap="${i}" value="${esc(m.caption || '')}" placeholder="Caption">
        <div class="acts">
          <button class="icon-btn" type="button" data-cover="${i}">Cover</button>
          <button class="icon-btn" type="button" data-mm="${i}" data-d="-1" aria-label="Move left">←</button>
          <button class="icon-btn" type="button" data-mm="${i}" data-d="1" aria-label="Move right">→</button>
          <button class="icon-btn danger" type="button" data-rm="${i}" aria-label="Remove">✕</button>
        </div></div>`).join('')}</div>
    </div>`;
    $('#back').onclick = () => { S.editing = null; tabProjects(); };
    $$('#pe [name]').forEach((el) => el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
      const n = el.name;
      if (el.type === 'checkbox') x[n] = el.checked;
      else if (n === 'keywords') x.keywords = el.value.split(',').map((s) => s.trim()).filter(Boolean);
      else if (n === 'highlights') x.highlights = lines(el.value);
      else if (n === 'links') x.links = lines(el.value).map((l) => { const k = l.lastIndexOf('|'); return { label: l.slice(0, k).trim(), url: l.slice(k + 1).trim() }; }).filter((l) => /^https?:\/\//.test(l.url));
      else x[n] = el.value;
      if (n === 'name' && x.id.startsWith('project-')) x.id = slug(el.value) + '-' + x.id.slice(8);
      markDirty();
    }));
    $('#up-media').onchange = async (e) => {
      for (const f of e.target.files) {
        try { const r = await upload(f, x.id); x.media.push({ type: r.type, src: r.path, caption: '' }); markDirty(); } catch (er) { toast(er.message, 6000); }
      }
      editProject();
    };
    $('#add-url').onclick = () => {
      const u = prompt('Path in the repository (assets/…) or a direct image/video URL');
      if (!u) return;
      x.media.push({ type: /\.(mp4|webm|mov)(\?|$)/i.test(u) ? 'video' : /\.bpmn(\?|$)/i.test(u) ? 'bpmn' : 'image', src: u.trim(), caption: '' });
      markDirty(); editProject();
    };
    $$('[data-cap]', p).forEach((el) => el.oninput = () => { x.media[+el.dataset.cap].caption = el.value; markDirty(); });
    $$('[data-cover]', p).forEach((b) => b.onclick = () => { x.cover = +b.dataset.cover; markDirty(); editProject(); });
    $$('[data-mm]', p).forEach((b) => b.onclick = () => {
      const i = +b.dataset.mm, j = i + +b.dataset.d; if (j < 0 || j >= x.media.length) return;
      [x.media[i], x.media[j]] = [x.media[j], x.media[i]];
      if (x.cover === i) x.cover = j; else if (x.cover === j) x.cover = i;
      markDirty(); editProject();
    });
    $$('[data-rm]', p).forEach((b) => b.onclick = () => {
      const i = +b.dataset.rm; x.media.splice(i, 1);
      if ((x.cover || 0) >= x.media.length) x.cover = 0; else if (x.cover > i) x.cover--;
      markDirty(); editProject();
    });
  }

  /* ---------------------------------------------------------------- autres sections */
  function tabSections() {
    const d = S.draft;
    const secs = [['spotlight', 'Standards section (TM Forum and BPMN)'], ['experience', 'Experience'], ['education', 'Education'], ['certifications', 'Certifications'], ['skills', 'Skills'], ['speaking', 'On stage (text and items)']];
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel"><h2>Other sections</h2>
      <p class="hint">Edited as structured text. Keep the same shape as the existing entries; the field turns red until it is valid.</p>
      <div class="fields">${secs.map(([k, l]) => `<label class="field full"><span>${l}</span><textarea class="code" data-sec="${k}" spellcheck="false">${esc(JSON.stringify(d[k], null, 2))}</textarea></label>`).join('')}
      <div class="field full"><span>BPMN model shown in the Standards section</span>
        <input value="${esc((d.spotlight && d.spotlight.bpmn && d.spotlight.bpmn.file) || '')}" readonly>
        <label class="btn" style="cursor:pointer;justify-self:start">Replace with a .bpmn file<input type="file" id="up-spot-bpmn" accept=".bpmn,.xml" hidden></label>
      </div>
      <div class="field full"><span>Photos for the On stage section</span>
        <div class="media-list">${(d.speaking.media || []).map((m, i) => `<div class="mitem"><div class="mv">${m.type === 'video' ? `<video src="${esc(src(m.src))}" muted></video>` : `<img src="${esc(src(m.src))}" alt="">`}</div><input data-scap="${i}" value="${esc(m.caption || '')}" placeholder="Caption"><div class="acts"><button class="icon-btn danger" type="button" data-srm="${i}">✕</button></div></div>`).join('')}</div>
        <label class="btn btn-solid" style="cursor:pointer;justify-self:start;margin-top:8px">Upload a photo or video<input type="file" id="up-stage" accept="image/*,video/mp4,video/webm" multiple hidden></label>
      </div></div></div>`;
    $$('[data-sec]', p).forEach((ta) => ta.oninput = () => {
      try {
        const v = JSON.parse(ta.value);
        if (ta.dataset.sec === 'speaking') v.media = d.speaking.media || [];
        d[ta.dataset.sec] = v; ta.style.borderColor = ''; markDirty();
      } catch (e) { ta.style.borderColor = '#b3261e'; }
    });
    d.speaking.media = d.speaking.media || [];
    $$('[data-scap]', p).forEach((el) => el.oninput = () => { d.speaking.media[+el.dataset.scap].caption = el.value; markDirty(); });
    $$('[data-srm]', p).forEach((b) => b.onclick = () => { d.speaking.media.splice(+b.dataset.srm, 1); markDirty(); tabSections(); });
    $('#up-spot-bpmn').onchange = async (e) => {
      try { const r = await upload(e.target.files[0], 'models'); d.spotlight.bpmn.file = r.path; markDirty(); tabSections(); } catch (er) { toast(er.message, 6000); }
    };
    $('#up-stage').onchange = async (e) => {
      for (const f of e.target.files) {
        try { const r = await upload(f, 'stage'); d.speaking.media.push({ type: r.type, src: r.path, caption: '' }); markDirty(); } catch (er) { toast(er.message, 6000); }
      }
      tabSections();
    };
  }

  /* ---------------------------------------------------------------- reglages */
  function tabSettings() {
    const c = S.draft.settings;
    const p = $('#admin-panel');
    p.innerHTML = `<div class="panel"><h2>Settings</h2>
      <div class="fields" id="st">
        ${field('owner', 'GitHub owner', c.owner)}${field('repo', 'Repository', c.repo)}
        ${field('branch', 'Branch', c.branch)}${field('counterNamespace', 'Counter name (changing it restarts the counts)', c.counterNamespace)}
        <label class="check full"><input type="checkbox" name="showVisitsPublicly" ${c.showVisitsPublicly ? 'checked' : ''}> Show the visit count in the public footer</label>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
        <button class="btn" type="button" id="dl">Download the content file</button>
        <button class="btn" type="button" id="forget-counting">Count my visits again on this device</button>
        <button class="btn danger" type="button" id="logout">Sign out and forget the token</button>
      </div></div>`;
    $$('#st [name]', p).forEach((el) => el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => { c[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); markDirty(); }));
    $('#dl').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S.draft, null, 2)], { type: 'application/json' }));
      a.download = 'portfolio.json'; a.click();
    };
    $('#forget-counting').onclick = () => { store.set('pf_is_admin', ''); toast('Your visits on this device will be counted.'); };
    $('#logout').onclick = () => { store.set('pf_gh_token', ''); S.token = ''; S.user = ''; toast('Signed out'); login(); };
  }

  /* ---------------------------------------------------------------- routage */
  const route = () => { if (location.hash === HASH) open(); };
  window.addEventListener('hashchange', route);
  document.addEventListener('pf:ready', route, { once: true });
})();
