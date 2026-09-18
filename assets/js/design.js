/* Design du portfolio : palettes, polices, formes, stickers. Lu par le site, modifie depuis le studio. */
(function () {
  'use strict';
  const PRESETS = {
    'ink-ochre': { name: 'Ink and ochre', light: { ink: '#0f1d33', ink2: '#1f3a60', accent: '#b8741f', paper: '#f3f5f8' }, dark: { ink: '#e6edf7', ink2: '#b9cbe4', accent: '#e0a052', paper: '#0b1320' } },
    'teal-coral': { name: 'Deep teal and coral', light: { ink: '#0d3b3e', ink2: '#1c5d61', accent: '#d8604a', paper: '#f2f6f5' }, dark: { ink: '#e3f1ef', ink2: '#a9d3cf', accent: '#f08a74', paper: '#0a1a1b' } },
    'plum-gold': { name: 'Plum and gold', light: { ink: '#2e1a3d', ink2: '#4b2d63', accent: '#c29a2e', paper: '#f6f3f8' }, dark: { ink: '#efe6f5', ink2: '#cdb6de', accent: '#e2c065', paper: '#140c1a' } },
    'forest-sand': { name: 'Forest and sand', light: { ink: '#16311f', ink2: '#2a5237', accent: '#b0823a', paper: '#f4f5f0' }, dark: { ink: '#e4efe6', ink2: '#b3d0ba', accent: '#d9aa63', paper: '#0b160f' } },
    'graphite-blue': { name: 'Graphite and electric blue', light: { ink: '#1c1f24', ink2: '#3a414c', accent: '#2f6fed', paper: '#f4f5f7' }, dark: { ink: '#eceef2', ink2: '#c3c8d2', accent: '#6f9bff', paper: '#0e1013' } },
    'rose-ink': { name: 'Ink and rose', light: { ink: '#1b2140', ink2: '#343d6b', accent: '#c2466a', paper: '#f7f4f6' }, dark: { ink: '#eceaf6', ink2: '#c3c5e6', accent: '#ea7897', paper: '#0e1020' } },
  };
  const FONTS = {
    editorial: { name: 'Editorial serif', serif: '"Newsreader", Georgia, serif', sans: '"Public Sans", system-ui, sans-serif', url: '' },
    modern: { name: 'Modern geometric', serif: '"Sora", system-ui, sans-serif', sans: '"Sora", system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap' },
    classic: { name: 'Classic elegant', serif: '"Cormorant Garamond", Georgia, serif', sans: '"Nunito Sans", system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Nunito+Sans:wght@400;600;700&display=swap' },
    tech: { name: 'Technical', serif: '"IBM Plex Sans Condensed", system-ui, sans-serif', sans: '"IBM Plex Sans", system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap' },
  };
  const RADIUS = { sharp: '2px', soft: '6px', round: '16px' };
  const STICKERS = ['◇', '✦', '★', '☕', '🚀', '🎙️', '📐', '💡', '🧩', '⚡', '🌍', '✅', '💬', '📚', '🎯', '🔥', '👩‍💻', '🇹🇳'];
  const SECTIONS = { top: 'Top (photo and name)', standards: 'Standards', work: 'Projects', experience: 'Experience', skills: 'Skills', stage: 'On stage', contact: 'Contact' };

  const PATTERNS = {
    none: 'None', circles: 'Soft circles', flowers: 'Flowers', dots: 'Dots', grid: 'Grid paper', waves: 'Waves',
    stars: 'Stars', bpmn: 'BPMN nodes', leaves: 'Leaves', confetti: 'Confetti', hexagons: 'Hexagons', rings: 'Rings',
  };
  const svgUrl = (w, h, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;
  function flower(cx, cy, r, c, c2) {
    let g = '';
    for (let i = 0; i < 5; i++) g += `<ellipse cx='${cx}' cy='${cy - r}' rx='${r * 0.55}' ry='${r}' fill='${c}' transform='rotate(${i * 72} ${cx} ${cy})'/>`;
    return g + `<circle cx='${cx}' cy='${cy}' r='${r * 0.45}' fill='${c2}'/>`;
  }
  function pattern(kind, c1, c2, k) {
    const S = (n) => Math.round(n * k);
    switch (kind) {
      case 'dots': return svgUrl(S(24), S(24), `<circle cx='${S(12)}' cy='${S(12)}' r='${S(1.8)}' fill='${c1}'/>`);
      case 'grid': return svgUrl(S(32), S(32), `<path d='M${S(32)} 0H0V${S(32)}' fill='none' stroke='${c1}' stroke-width='1'/>`);
      case 'waves': return svgUrl(S(120), S(40), `<path d='M0 ${S(20)} Q ${S(30)} ${S(4)} ${S(60)} ${S(20)} T ${S(120)} ${S(20)}' fill='none' stroke='${c1}' stroke-width='${Math.max(1, S(1.6))}'/>`);
      case 'stars': return svgUrl(S(140), S(140), [[20, 30, 6], [90, 20, 4], [60, 80, 7], [120, 100, 5], [25, 115, 4]].map(([x, y, r], i) =>
        `<path d='M${S(x)} ${S(y - r)} L${S(x + r * .3)} ${S(y - r * .3)} L${S(x + r)} ${S(y)} L${S(x + r * .3)} ${S(y + r * .3)} L${S(x)} ${S(y + r)} L${S(x - r * .3)} ${S(y + r * .3)} L${S(x - r)} ${S(y)} L${S(x - r * .3)} ${S(y - r * .3)}Z' fill='${i % 2 ? c2 : c1}'/>`).join(''));
      case 'flowers': return svgUrl(S(160), S(160), flower(S(40), S(44), S(13), c1, c2) + flower(S(118), S(122), S(10), c2, c1) + `<circle cx='${S(120)}' cy='${S(40)}' r='${S(3)}' fill='${c1}'/><circle cx='${S(40)}' cy='${S(125)}' r='${S(2.5)}' fill='${c2}'/>`);
      case 'leaves': return svgUrl(S(120), S(120), `<path d='M${S(30)} ${S(80)} C ${S(30)} ${S(40)} ${S(60)} ${S(25)} ${S(80)} ${S(22)} C ${S(78)} ${S(50)} ${S(62)} ${S(78)} ${S(30)} ${S(80)}Z' fill='${c1}'/><path d='M${S(30)} ${S(80)} L${S(74)} ${S(30)}' stroke='${c2}' stroke-width='1.2'/><path d='M${S(92)} ${S(112)} C ${S(92)} ${S(94)} ${S(104)} ${S(86)} ${S(114)} ${S(84)} C ${S(112)} ${S(98)} ${S(106)} ${S(110)} ${S(92)} ${S(112)}Z' fill='${c2}'/>`);
      case 'confetti': return svgUrl(S(150), S(150), [[20, 25, 20, c1], [80, 15, -30, c2], [120, 60, 45, c1], [40, 90, -15, c2], [100, 120, 70, c1], [15, 135, 30, c2], [70, 60, 10, c2]].map(([x, y, a, c]) =>
        `<rect x='${S(x)}' y='${S(y)}' width='${S(10)}' height='${S(4)}' rx='${S(1.5)}' fill='${c}' transform='rotate(${a} ${S(x)} ${S(y)})'/>`).join(''));
      case 'hexagons': { const w = S(56), h = S(97), r = S(28); const hx = (x, y) => `<path d='M${x} ${y - r}L${x + r * .866} ${y - r / 2}L${x + r * .866} ${y + r / 2}L${x} ${y + r}L${x - r * .866} ${y + r / 2}L${x - r * .866} ${y - r / 2}Z' fill='none' stroke='${c1}' stroke-width='1'/>`;
        return svgUrl(w, h, hx(w / 2, r) + hx(0, r + h / 2) + hx(w, r + h / 2)); }
      case 'rings': return svgUrl(S(90), S(90), `<circle cx='${S(45)}' cy='${S(45)}' r='${S(18)}' fill='none' stroke='${c1}' stroke-width='${Math.max(1, S(2))}'/><circle cx='${S(0)}' cy='${S(0)}' r='${S(10)}' fill='none' stroke='${c2}' stroke-width='${Math.max(1, S(2))}'/><circle cx='${S(90)}' cy='${S(90)}' r='${S(10)}' fill='none' stroke='${c2}' stroke-width='${Math.max(1, S(2))}'/>`);
      case 'bpmn': return svgUrl(S(220), S(120), `<g fill='none' stroke='${c1}' stroke-width='1.5'><circle cx='${S(20)}' cy='${S(40)}' r='${S(9)}'/><path d='M${S(29)} ${S(40)}H${S(60)}'/><rect x='${S(60)}' y='${S(26)}' width='${S(44)}' height='${S(28)}' rx='${S(5)}'/><path d='M${S(104)} ${S(40)}H${S(128)}'/><path d='M${S(140)} ${S(28)}L${S(152)} ${S(40)}L${S(140)} ${S(52)}L${S(128)} ${S(40)}Z'/><path d='M${S(152)} ${S(40)}H${S(180)}'/><circle cx='${S(190)}' cy='${S(40)}' r='${S(9)}' stroke-width='3'/></g><path d='M${S(140)} ${S(34)}L${S(146)} ${S(40)}L${S(140)} ${S(46)}L${S(134)} ${S(40)}Z' fill='${c2}'/><circle cx='${S(60)}' cy='${S(95)}' r='${S(4)}' fill='${c2}'/>`);
      case 'circles': return `radial-gradient(circle at 12% 18%, ${c1} 0 ${S(160)}px, transparent ${S(161)}px), radial-gradient(circle at 88% 30%, ${c2} 0 ${S(110)}px, transparent ${S(111)}px), radial-gradient(circle at 70% 85%, ${c1} 0 ${S(200)}px, transparent ${S(201)}px), radial-gradient(circle at 25% 75%, ${c2} 0 ${S(80)}px, transparent ${S(81)}px)`;
      default: return 'none';
    }
  }

  const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

  function vars(p) {
    return `--ink:${p.ink};--ink-2:${p.ink2};--accent:${p.accent};--paper:${p.paper};`;
  }
  function apply(design) {
    const d = design || {};
    const pre = PRESETS[d.preset] || PRESETS['ink-ochre'];
    const c = d.colors || {};
    const light = { ...pre.light, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v)) };
    const dark = { ...pre.dark, ...(c.accent ? { accent: mix(c.accent, '#ffffff', 0.25) } : {}) };
    const lightExtra = `--accent-soft:${mix(light.accent, light.paper, 0.85)};--accent-ink:${mix(light.accent, '#000000', 0.35)};--surface-2:${mix(light.ink, '#ffffff', 0.9)};`;
    const darkExtra = `--accent-soft:${mix(dark.accent, dark.paper, 0.82)};--accent-ink:${mix(dark.accent, '#ffffff', 0.3)};`;
    const f = FONTS[d.font] || FONTS.editorial;
    const r = RADIUS[d.radius] || RADIUS.soft;
    let css = `:root{${vars(light)}${lightExtra}--serif:${f.serif};--sans:${f.sans};--radius:${r};}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars(dark)}${darkExtra}}}
:root[data-theme="dark"]{${vars(dark)}${darkExtra}}
.spot{background:${mix(light.ink, '#000000', 0.08)}}
.contact{background:${light.ink}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .contact{background:${mix(dark.paper, '#ffffff', 0.04)}}}
:root[data-theme="dark"] .contact{background:${mix(dark.paper, '#ffffff', 0.04)}}`;
    const photo = { arch: '50% 50% var(--radius) var(--radius)', circle: '50%', square: 'var(--radius)' }[d.photo] || '50% 50% var(--radius) var(--radius)';
    css += `.hero-photo .frame,.hero-photo::before{border-radius:${photo}}`;
    if (d.photo === 'circle') css += '.hero-photo .frame{aspect-ratio:1}.hero-photo::before{aspect-ratio:1;inset:-14px 14px auto -14px}';
    // motif de fond
    const pat = d.pattern || 'none';
    if (pat !== 'none') {
      const k = { small: 0.7, medium: 1, large: 1.5 }[d.patternSize] || 1;
      const col = d.patternColor || 'both';
      const c1 = col === 'main' ? light.ink2 : light.accent;
      const c2 = col === 'accent' ? light.accent : col === 'main' ? light.ink : light.ink2;
      const op = Math.min(0.6, Math.max(0.03, Number(d.patternOpacity) || 0.12));
      const area = d.patternArea === 'hero' ? '#top' : 'body';
      const fixed = pat === 'circles' ? 'fixed' : 'scroll';
      const blur = pat === 'circles' ? 'filter:blur(40px);' : '';
      css += `${area === 'body' ? 'body' : '#top'}{position:relative}
${area}::before{content:"";position:${area === 'body' ? 'fixed' : 'absolute'};inset:0;z-index:${area === 'body' ? '-1' : '0'};pointer-events:none;background:${pattern(pat, c1, c2, k)};background-attachment:${fixed};opacity:${op};${blur}}
${area === '#top' ? '#top>*{position:relative;z-index:1}' : ''}`;
    }
    // cartes, boutons, animations, mise en page
    if (d.cards === 'flat') css += '.card,.skill-group,.side-card{border-color:transparent;box-shadow:none;background:var(--surface-2)}';
    if (d.cards === 'elevated') css += '.card,.skill-group,.side-card{border-color:transparent;box-shadow:0 10px 30px rgba(15,29,51,.12)}';
    if (d.buttons === 'pill') css += '.btn{border-radius:999px}';
    if (d.buttons === 'square') css += '.btn{border-radius:0}';
    if (d.motion === 'off') css += '.reveal{opacity:1!important;transform:none!important;transition:none!important}.sticker{animation:none}';
    if (d.heroLayout === 'photo-left') css += '@media (min-width:861px){.hero-photo{order:-1}}';
    if (d.titleSize === 'large') css += '.hero h1{font-size:clamp(52px,9vw,112px)}.section-head h2{font-size:clamp(34px,5vw,56px)}';
    if (d.titleSize === 'compact') css += '.hero h1{font-size:clamp(40px,6vw,68px)}.section-head h2{font-size:clamp(26px,3.4vw,36px)}';
    const h = d.hide || {};
    if (h.standards) css += '#standards{display:none}';
    if (h.stage) css += '#stage{display:none}';
    if (h.quote) css += '.quote{display:none}';
    if (h.rail) css += '.rail{display:none}';
    let st = document.getElementById('pf-design');
    if (!st) { st = document.createElement('style'); st.id = 'pf-design'; document.head.appendChild(st); }
    st.textContent = css;
    if (f.url && !document.querySelector(`link[href="${f.url}"]`)) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = f.url; document.head.appendChild(l);
    }
    // mode par defaut, sauf si le visiteur a choisi lui-meme
    let chosen = ''; try { chosen = localStorage.getItem('pf_theme') || ''; } catch (e) { /* rien */ }
    if (!chosen) { if (d.mode === 'light' || d.mode === 'dark') document.documentElement.dataset.theme = d.mode; else delete document.documentElement.dataset.theme; }
    stickers(d.stickers || []);
    photoBg(d, light);
  }
  function photoBg(d, light) {
    const mode = d.photoBg || 'original';
    const data = (window.PF && window.PF.App && window.PF.App.data) || {};
    const p = data.profile || {};
    const imgs = document.querySelectorAll('.hero-photo img, .brief-head img');
    const cut = p.photoCutout;
    const bg = {
      accent: light.accent, main: light.ink, soft: mix(light.accent, '#ffffff', 0.78),
      gradient: `linear-gradient(160deg, ${light.accent}, ${light.ink})`, color: d.photoBgColor || light.accent,
    }[mode];
    imgs.forEach((img) => {
      if (mode === 'original' || !cut) { if (p.photo) img.src = p.photo; img.parentElement.style.background = ''; img.style.background = ''; return; }
      img.src = cut;
      const holder = img.closest('.frame') || img;
      holder.style.background = bg;
    });
  }
  function stickers(list) {
    document.querySelectorAll('.sticker').forEach((s) => s.remove());
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    list.forEach((s) => {
      const host = document.getElementById(s.section);
      if (!host) return;
      host.classList.add('has-stickers');
      const el = document.createElement('span');
      el.className = `sticker st-${s.style || 'ink'} pos-${s.pos || 'top-right'}`;
      el.style.setProperty('--rot', (Number(s.rotate) || 0) + 'deg');
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `${s.emoji ? `<i>${esc(s.emoji)}</i>` : ''}${s.text ? `<b>${esc(s.text)}</b>` : ''}`;
      host.appendChild(el);
    });
  }
  window.PFDesign = { apply, PATTERNS, pattern, PRESETS, FONTS, RADIUS, STICKERS, SECTIONS };
})();
