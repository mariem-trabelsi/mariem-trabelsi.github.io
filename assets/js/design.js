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
  window.PFDesign = { apply, PRESETS, FONTS, RADIUS, STICKERS, SECTIONS };
})();
