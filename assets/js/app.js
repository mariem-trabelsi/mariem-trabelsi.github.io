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

  /* ---------------------------------------------------------------- langues */
  const UI = {
    en: {
      full: 'Full portfolio', brief: 'Recruiter brief', posts: 'Posts', contact: 'Contact', state: 'state', dlcv: 'Download CV', email: 'Email me',
      about: 'About', aboutTitle: 'Processes as models, decisions as rules, facts as events.', selected: 'Selected work', projects: 'Projects',
      openCard: 'Open a card to see the screens and the recorded demos.', all: 'All', noKw: 'No project with this keyword yet.',
      path: 'Path', experience: 'Experience', education: 'Education', certifications: 'Certifications', toolbox: 'Toolbox', skills: 'Skills',
      beyond: 'Beyond code', stagePh: 'A photo from a hosted public speaking event will appear here.', writing: 'Writing', latest: 'Latest posts',
      latestSub: 'Thoughts on process automation, architecture and the craft.', allPosts: 'All posts', postsSub: 'What I build, what I learn, what I think.',
      themes: 'Themes', noPost: 'No post yet.', minRead: 'min read', pinned: 'Pinned', replyMail: 'Reply by e-mail', copyLink: 'Copy link', linkCopied: 'Link copied',
      previous: 'Previous', next: 'Next', endEvent: 'End event', talk: "Let's talk about your next project.", answer: 'I answer every message. Write me an e-mail, or reach me directly on WhatsApp.',
      yourName: 'Your name', company: 'Company', message: 'Message', msgPh: 'The role, the team, and how to reach you', sendMail: 'Send by e-mail', sendWa: 'Send on WhatsApp',
      keyProjects: 'Key projects', seeScreens: 'See screens and demo', coreSkills: 'Core skills', certified: 'Certified', openFull: 'Open the full portfolio',
      availability: 'Availability', location: 'Location', degree: 'Degree', languages: 'Languages', theme: 'Theme', openModel: 'Open the live model', dragZoom: 'drag to pan · scroll to zoom',
      apisImpl: 'Open APIs implemented', loveThis: 'Love this profile', youLove: 'You love this profile', searchPosts: 'Search posts', noMatch: 'No post matches your search.',
      recommendations: 'Recommendations', whatOthers: 'What people say', caseStudy: 'Read the case study', videos: 'video', images: 'image', liveModel: 'Live BPMN model',
      notExist: 'This post does not exist.', seeAll: 'See all posts', comments: 'Comments', playJourney: '▶ Play an order through the model', stopJourney: '■ Stop', illustration: 'Illustration of the subject, not a screenshot.',
    },
    fr: {
      full: 'Portfolio complet', brief: 'Vue recruteur', posts: 'Publications', contact: 'Contact', state: 'état', dlcv: 'Télécharger le CV', email: 'M’écrire',
      about: 'À propos', aboutTitle: 'Les processus en modèles, les décisions en règles, les faits en événements.', selected: 'Réalisations', projects: 'Projets',
      openCard: 'Ouvrez une carte pour voir les écrans et les démos enregistrées.', all: 'Tous', noKw: 'Aucun projet avec ce mot-clé pour l’instant.',
      path: 'Parcours', experience: 'Expérience', education: 'Formation', certifications: 'Certifications', toolbox: 'Boîte à outils', skills: 'Compétences',
      beyond: 'Au-delà du code', stagePh: 'Une photo d’un événement de prise de parole apparaîtra ici.', writing: 'Écrits', latest: 'Dernières publications',
      latestSub: 'Réflexions sur l’automatisation des processus, l’architecture et le métier.', allPosts: 'Toutes les publications', postsSub: 'Ce que je construis, ce que j’apprends, ce que je pense.',
      themes: 'Thèmes', noPost: 'Aucune publication pour l’instant.', minRead: 'min de lecture', pinned: 'Épinglé', replyMail: 'Répondre par e-mail', copyLink: 'Copier le lien', linkCopied: 'Lien copié',
      previous: 'Précédent', next: 'Suivant', endEvent: 'Événement de fin', talk: 'Parlons de votre prochain projet.', answer: 'Je réponds à chaque message. Écrivez-moi un e-mail, ou joignez-moi directement sur WhatsApp.',
      yourName: 'Votre nom', company: 'Entreprise', message: 'Message', msgPh: 'Le poste, l’équipe, et comment vous joindre', sendMail: 'Envoyer par e-mail', sendWa: 'Envoyer sur WhatsApp',
      keyProjects: 'Projets clés', seeScreens: 'Voir les écrans et la démo', coreSkills: 'Compétences clés', certified: 'Certifiée', openFull: 'Ouvrir le portfolio complet',
      availability: 'Disponibilité', location: 'Localisation', degree: 'Diplôme', languages: 'Langues', theme: 'Thème', openModel: 'Ouvrir le modèle interactif', dragZoom: 'glisser pour déplacer · molette pour zoomer',
      apisImpl: 'Open APIs implémentées', loveThis: 'J’aime ce profil', youLove: 'Vous aimez ce profil', searchPosts: 'Rechercher une publication', noMatch: 'Aucune publication ne correspond.',
      recommendations: 'Recommandations', whatOthers: 'Ce qu’on dit de moi', caseStudy: 'Lire l’étude de cas', videos: 'vidéo', images: 'image', liveModel: 'Modèle BPMN interactif',
      notExist: 'Cette publication n’existe pas.', seeAll: 'Voir toutes les publications', comments: 'Commentaires', playJourney: '▶ Faire traverser une commande', stopJourney: '■ Arrêter', illustration: 'Illustration du sujet, pas une capture d’écran.',
    },
  };
  let LANG = 'en';
  const T = (k) => (UI[LANG] && UI[LANG][k]) || UI.en[k] || k;
  // superpose la traduction : objets fusionnes, listes d'objets rapprochees par id ou par position
  function overlay(base, tr) {
    if (tr === undefined || tr === null) return base;
    if (Array.isArray(base) && Array.isArray(tr)) {
      return base.map((b, i) => {
        const t = b && typeof b === 'object' && b.id !== undefined ? tr.find((x) => x && x.id === b.id) : tr[i];
        return t === undefined ? b : overlay(b, t);
      });
    }
    if (base && typeof base === 'object' && !Array.isArray(base) && tr && typeof tr === 'object' && !Array.isArray(tr)) {
      const o = { ...base };
      Object.keys(tr).forEach((k) => { o[k] = k in base ? overlay(base[k], tr[k]) : tr[k]; });
      return o;
    }
    return tr;
  }
  function localize(raw, lang) {
    if (lang === 'en' || !raw.translations || !raw.translations[lang]) return raw;
    return overlay(raw, raw.translations[lang]);
  }

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

  /* ------------------------------------------------- provenance et region
     D'ou vient le visiteur, et depuis quelle region du monde. Aucune des deux
     mesures n'identifie personne : la provenance est l'en-tete que le
     navigateur envoie deja a tous les sites, la region vient du fuseau horaire
     declare par le systeme. Ni cookie, ni adresse IP conservee, ni service
     tiers supplementaire — ce sont les memes compteurs que les visites. */
  const SOURCES = ['linkedin', 'google', 'github', 'facebook', 'instagram',
                   'twitter', 'whatsapp', 'bing', 'duckduckgo', 'youtube', 'reddit', 'medium'];
  function provenance() {
    let h;
    try { h = new URL(document.referrer).hostname.toLowerCase(); } catch (e) { return 'direct'; }
    if (!h || h === location.hostname) return 'direct';
    h = h.replace(/^www\./, '');
    for (const s of SOURCES) if (h === s + '.com' || h.startsWith(s + '.') || h.includes('.' + s + '.')) return s;
    if (h.includes('lnkd.in') || h.includes('linkedin')) return 'linkedin';
    if (h.includes('google')) return 'google';
    return 'other';
  }
  const REGIONS = ['africa', 'europe', 'america', 'asia', 'australia'];
  function region() {
    let z;
    try { z = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase(); } catch (e) { return 'unknown'; }
    const tete = z.split('/')[0];
    if (['america', 'us', 'canada', 'brazil', 'mexico'].includes(tete)) return 'america';
    return REGIONS.includes(tete) ? tete : 'other';
  }

  /* ---------------------------------------------------------------- liens contact */
  function mailto(p, subject, body) {
    return `mailto:${p.email}?subject=${encodeURIComponent(subject || 'Opportunity for ' + p.name)}&body=${encodeURIComponent(body || 'Hello ' + p.name.split(' ')[0] + ',\n\n')}`;
  }
  function wa(p, text) {
    return `https://wa.me/${String(p.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(text || 'Hello ' + p.name.split(' ')[0] + ', I saw your portfolio and would like to talk about an opportunity.')}`;
  }

  /* ------------------------------------------------- case study: figures, table */
  // Une etude de cas qui ne porte que du texte oblige le lecteur a croire sur
  // parole. Une figure et un tableau se verifient d'un coup d'oeil.
  function caseFigures(sec) {
    const figs = sec.figures || (sec.figure ? [sec.figure] : []);
    if (!figs.length) return '';
    return figs.map((f) => `<figure class="case-fig"><img src="${esc(f.src)}" alt="${esc(f.caption || '')}" loading="lazy">${f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ''}</figure>`).join('');
  }

  function caseTable(sec) {
    const t = sec.table;
    if (!t || !(t.rows || []).length) return '';
    const head = (t.head || []).length ? `<thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : '';
    const body = `<tbody>${t.rows.map((r) => `<tr>${r.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<div class="case-table-wrap"><table class="case-table">${head}${body}</table>${t.caption ? `<p class="case-table-cap">${esc(t.caption)}</p>` : ''}</div>`;
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
  /* vignettes dessinees, pour les projets dont aucune capture n existe.
     Ce sont des ILLUSTRATIONS du sujet, jamais des fausses captures d ecran. */
  const ART_INK = '#0f1d33', ART_PAPER = '#eef2f8', ART_OR = '#d08a33';
  const ART = {
    // detection d objets : trois boites englobantes sur des pieces, dont une retenue
    'object-detection': () => `
      <g stroke="${ART_PAPER}" stroke-opacity=".07">${[20,40,60,80,100,120,140].map((y)=>`<line x1="0" y1="${y}" x2="320" y2="${y}"/>`).join('')}${[40,80,120,160,200,240,280].map((x)=>`<line x1="${x}" y1="0" x2="${x}" y2="150"/>`).join('')}</g>
      <rect x="0" y="126" width="320" height="2" fill="${ART_PAPER}" opacity=".16"/>
      <circle cx="78" cy="96" r="21" fill="${ART_PAPER}" opacity=".14"/>
      <rect x="144" y="72" width="44" height="46" rx="3" fill="${ART_PAPER}" opacity=".14"/>
      <path d="M226 118 l24-42 24 42z" fill="${ART_PAPER}" opacity=".14"/>
      <g fill="none" stroke="${ART_PAPER}" stroke-opacity=".42" stroke-width="1.5">
        <rect x="54" y="72" width="48" height="48"/><rect x="222" y="74" width="56" height="46"/></g>
      <rect x="138" y="66" width="56" height="58" fill="none" stroke="${ART_OR}" stroke-width="2"/>
      <rect x="138" y="52" width="40" height="13" fill="${ART_OR}"/>
      <text x="142" y="62" font-family="ui-monospace,Menlo,monospace" font-size="8" fill="${ART_INK}">0.94</text>`,
    // partage d articles scientifiques : une publication et son fil de discussion
    'academia': () => `
      <rect x="40" y="38" width="98" height="104" rx="2" fill="${ART_PAPER}" opacity=".12"/>
      <rect x="34" y="32" width="98" height="104" rx="2" fill="${ART_PAPER}" opacity=".2"/>
      <rect x="28" y="26" width="98" height="104" rx="2" fill="${ART_PAPER}" opacity=".93"/>
      <rect x="38" y="38" width="56" height="5" rx="1" fill="${ART_INK}" opacity=".8"/>
      <g fill="${ART_INK}" opacity=".3">${[52,60,68,80,88,96,108,116].map((y,i)=>`<rect x="38" y="${y}" width="${[78,70,58,78,64,74,52,68][i]}" height="3" rx="1"/>`).join('')}</g>
      <rect x="38" y="118" width="26" height="8" rx="2" fill="${ART_OR}"/>
      <g fill="none" stroke="${ART_PAPER}" stroke-opacity=".34" stroke-width="1.5">
        <path d="M168 46 h104 a4 4 0 0 1 4 4 v22 a4 4 0 0 1 -4 4 h-92 l-8 8 v-8 a4 4 0 0 1 -4 -4 v-22 a4 4 0 0 1 4 -4z"/>
        <path d="M184 118 h88 a4 4 0 0 1 4 4 v18 a4 4 0 0 1 -4 4 h-88 a4 4 0 0 1 -4 -4 v-18 a4 4 0 0 1 4 -4z"/></g>
      <path d="M176 84 h96 a4 4 0 0 1 4 4 v20 a4 4 0 0 1 -4 4 h-84 l-8 8 v-8 a4 4 0 0 1 -4 -4 v-20 a4 4 0 0 1 4 -4z" fill="none" stroke="${ART_OR}" stroke-width="2"/>
      <g fill="${ART_PAPER}" opacity=".4">${[[176,56,74],[176,64,52],[192,128,60],[192,136,40]].map(([x,y,w])=>`<rect x="${x}" y="${y}" width="${w}" height="3" rx="1"/>`).join('')}</g>
      <g fill="${ART_OR}" opacity=".8"><rect x="186" y="94" width="68" height="3" rx="1"/><rect x="186" y="102" width="46" height="3" rx="1"/></g>
      <path d="M132 76 C 148 70 154 62 170 60" stroke="${ART_OR}" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>`,
    // quiz temps reel : le depouillement en direct et les joueurs connectes
    // quiz temps reel facon Mentimeter : code de session, question, depouillement en direct
    'quiz-app': () => `
      <rect x="22" y="14" width="276" height="17" rx="4" fill="${ART_PAPER}" opacity=".12"/>
      <text x="32" y="26" font-family="ui-monospace,Menlo,monospace" font-size="8" letter-spacing="1.1" fill="${ART_PAPER}" fill-opacity=".55">JOIN  ·  CODE</text>
      <text x="112" y="26" font-family="ui-monospace,Menlo,monospace" font-size="9" letter-spacing="2.6" fill="${ART_OR}">48 92 17</text>
      <circle cx="233" cy="22.5" r="3.5" fill="${ART_OR}"/>
      <text x="242" y="26" font-family="ui-monospace,Menlo,monospace" font-size="8" letter-spacing="1.1" fill="${ART_PAPER}" fill-opacity=".55">12 LIVE</text>
      <rect x="22" y="42" width="168" height="5" rx="2" fill="${ART_PAPER}" opacity=".55"/>
      <rect x="22" y="52" width="104" height="5" rx="2" fill="${ART_PAPER}" opacity=".26"/>
      ${[[42,58,''],[98,34,''],[154,76,''],[210,50,''],[266,86,'or']].map(([x,h,or_])=>`
        <rect x="${x}" y="${142-Number(h)}" width="36" height="${h}" rx="3" fill="${or_?ART_OR:ART_PAPER}" opacity="${or_?1:.3}"/>
        <text x="${Number(x)+18}" y="${136-Number(h)}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="7.5" fill="${ART_PAPER}" fill-opacity="${or_?.85:.45}">${h}</text>`).join('')}
      <rect x="22" y="142" width="276" height="1.5" fill="${ART_PAPER}" opacity=".3"/>
`,
    // refonte front avec theme : le meme ecran dans deux themes, et la bascule
    'allacarta': () => `
      <rect x="22" y="30" width="118" height="104" rx="5" fill="${ART_PAPER}" opacity=".93"/>
      <rect x="22" y="30" width="118" height="18" rx="5" fill="${ART_OR}"/>
      <rect x="22" y="43" width="118" height="5" fill="${ART_OR}"/>
      <g fill="${ART_INK}" opacity=".26">${[58,72,86,100].map((y,i)=>`<rect x="32" y="${y}" width="${[88,70,94,56][i]}" height="5" rx="2"/>`).join('')}</g>
      <rect x="32" y="114" width="40" height="11" rx="3" fill="${ART_INK}" opacity=".8"/>
      <rect x="180" y="30" width="118" height="104" rx="5" fill="#17253a" stroke="${ART_PAPER}" stroke-opacity=".2"/>
      <rect x="180" y="30" width="118" height="18" rx="5" fill="${ART_PAPER}" opacity=".16"/>
      <rect x="180" y="43" width="118" height="5" fill="${ART_PAPER}" opacity=".16"/>
      <g fill="${ART_PAPER}" opacity=".3">${[58,72,86,100].map((y,i)=>`<rect x="190" y="${y}" width="${[88,70,94,56][i]}" height="5" rx="2"/>`).join('')}</g>
      <rect x="190" y="114" width="40" height="11" rx="3" fill="${ART_OR}"/>
      <rect x="146" y="74" width="28" height="15" rx="7.5" fill="${ART_PAPER}" opacity=".22"/>
      <circle cx="166" cy="81.5" r="5.5" fill="${ART_OR}"/>`,
    // partage d experiences de stage : un formulaire a champs variables et ce qu il publie
    'internship-share': () => `
      <rect x="22" y="28" width="132" height="110" rx="4" fill="${ART_PAPER}" opacity=".93"/>
      <rect x="32" y="38" width="48" height="5" rx="1" fill="${ART_INK}" opacity=".75"/>
      ${[52,74].map((y)=>`<rect x="32" y="${y}" width="112" height="14" rx="3" fill="${ART_INK}" opacity=".08"/><rect x="38" y="${Number(y)+5}" width="${y===52?62:44}" height="4" rx="1" fill="${ART_INK}" opacity=".3"/>`).join('')}
      <rect x="32" y="96" width="112" height="14" rx="3" fill="none" stroke="${ART_OR}" stroke-width="1.5" stroke-dasharray="4 3"/>
      <g stroke="${ART_OR}" stroke-width="1.5"><line x1="82" y1="99" x2="82" y2="107"/><line x1="78" y1="103" x2="86" y2="103"/></g>
      <rect x="32" y="118" width="44" height="12" rx="3" fill="${ART_OR}"/>
      ${[30,86].map((y,i)=>`<rect x="184" y="${y}" width="114" height="48" rx="4" fill="${ART_PAPER}" opacity="${i?.14:.22}"/>
        <circle cx="200" cy="${Number(y)+16}" r="8" fill="${ART_OR}" opacity="${i?.5:1}"/>
        <rect x="214" y="${Number(y)+10}" width="54" height="4" rx="1" fill="${ART_PAPER}" opacity=".5"/>
        <rect x="214" y="${Number(y)+19}" width="36" height="4" rx="1" fill="${ART_PAPER}" opacity=".3"/>
        <g fill="${ART_PAPER}" opacity=".22"><rect x="196" y="${Number(y)+32}" width="88" height="3.5" rx="1"/><rect x="196" y="${Number(y)+39}" width="64" height="3.5" rx="1"/></g>`).join('')}
      <path d="M156 84 h22" stroke="${ART_OR}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <path d="M176 80 l6 4 -6 4z" fill="${ART_OR}"/>`,
  };
  function genCover(p) {
    // ~49 caracteres tiennent sur la largeur : au-dela on retire un mot-cle,
    // sinon la ligne sort du cadre au lieu d etre coupee proprement.
    const kw = p.keywords || [];
    let lab = kw.slice(0, 3).join(' · ').toUpperCase();
    if (lab.length > 44) lab = kw.slice(0, 2).join(' · ').toUpperCase();
    if (lab.length > 44) lab = lab.slice(0, 43) + '…';
    const art = ART[p.id];
    if (art) return `<div class="gen-cover art"><svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.name)}"><rect width="320" height="180" fill="${ART_INK}"/>${art()}<text x="22" y="166" font-family="ui-monospace,Menlo,monospace" font-size="7.5" letter-spacing="1.3" fill="${ART_PAPER}" fill-opacity=".5">${esc(lab)}</text></svg></div>`;
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
  async function mountBpmn(host, url, journey) {
    host.innerHTML = `<div class="bpmn-canvas"><p class="bpmn-wait">Loading the model…</p></div>
      <div class="bpmn-tools" role="toolbar" aria-label="Model controls">
        <button type="button" data-z="in" aria-label="Zoom in">+</button>
        <button type="button" data-z="out" aria-label="Zoom out">−</button>
        <button type="button" data-z="fit">Fit</button>
        <button type="button" data-z="full">Full screen</button>
      </div>
      ${journey && journey.length ? `<button type="button" class="bpmn-play" data-play>${T('playJourney')}</button><div class="bpmn-caption" aria-live="polite" hidden></div>` : ''}`;
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
      const play = host.querySelector('[data-play]');
      if (play) {
        const reg = viewer.get('elementRegistry');
        const steps = journey.filter((j) => reg.get(j.id));
        const cap = host.querySelector('.bpmn-caption');
        let timer = null, k = 0;
        const clear = () => steps.forEach((j) => { canvas.removeMarker(j.id, 'pf-active'); canvas.removeMarker(j.id, 'pf-done'); });
        const stop = () => { clearTimeout(timer); timer = null; play.textContent = T('playJourney'); };
        const tick = () => {
          if (k > 0) { canvas.removeMarker(steps[k - 1].id, 'pf-active'); canvas.addMarker(steps[k - 1].id, 'pf-done'); }
          if (k >= steps.length) { stop(); return; }
          const j = steps[k];
          canvas.addMarker(j.id, 'pf-active');
          if (j.key) { cap.hidden = false; cap.innerHTML = `<b>${k + 1} / ${steps.length}</b> ${esc(LANG === 'fr' ? j.fr : j.en)}`; }
          try { if (canvas.scrollToElement && j.key) canvas.scrollToElement(reg.get(j.id), { top: 120, bottom: 120, left: 160, right: 160 }); } catch (e) { /* vue inchangee */ }
          k += 1;
          timer = setTimeout(tick, j.key ? 1300 : 380);
        };
        play.addEventListener('click', () => {
          if (timer) { stop(); return; }
          clear(); k = 0; fit(); canvas.zoom(canvas.zoom() * 2.2);
          play.textContent = T('stopJourney'); Counter.hit('bpmn-play'); tick();
        });
      }
      return viewer;
    } catch (e) {
      host.querySelector('.bpmn-canvas').innerHTML = `<p class="bpmn-wait">The model could not be displayed. <a href="${esc(url)}" download>Download the .bpmn file</a>.</p>`;
      return null;
    }
  }

  /* ---------------------------------------------------------------- publications */
  const ALLOWED = { P: [], H2: [], H3: [], STRONG: [], B: [], EM: [], I: [], U: [], S: [], BLOCKQUOTE: [], UL: [], OL: [], LI: [], A: ['href'], IMG: ['src', 'alt'],
    VIDEO: ['src', 'controls', 'poster'], FIGURE: [], FIGCAPTION: [], CODE: [], PRE: [], BR: [], HR: [], SPAN: [], DIV: [], MARK: [] };
  function clean(html) {
    const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
    const walk = (node) => {
      [...node.children].forEach((el) => {
        const allow = ALLOWED[el.tagName];
        if (!allow) { if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(el.tagName)) el.remove(); else { el.replaceWith(...el.childNodes); } return; }
        [...el.attributes].forEach((a) => {
          const ok = allow.includes(a.name) || (a.name === 'class' && /^(align-(left|center|right)|wide|note)$/.test(a.value));
          if (!ok) el.removeAttribute(a.name);
          else if ((a.name === 'href' || a.name === 'src') && /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
        });
        if (el.tagName === 'A') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
        if (el.tagName === 'VIDEO') { el.setAttribute('controls', ''); el.setAttribute('playsinline', ''); }
        if (el.tagName === 'IMG') el.setAttribute('loading', 'lazy');
        walk(el);
      });
    };
    walk(doc.body.firstChild);
    return doc.body.firstChild.innerHTML;
  }
  function fmtDate(d) {
    const t = new Date(d + 'T12:00:00');
    return isNaN(t) ? d || '' : t.toLocaleDateString(LANG === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function readMin(html) { return Math.max(1, Math.round(String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200)); }
  function postCover(p, cls = '') {
    const c = p.cover;
    if (!c || !c.src) return `<div class="post-cover gen ${cls}">${genCover({ id: p.id, name: p.title, keywords: p.tags || [] })}</div>`;
    return `<div class="post-cover ${cls}">${c.type === 'video' ? `<video src="${esc(c.src)}" muted playsinline loop autoplay preload="metadata"></video>` : `<img src="${esc(c.src)}" alt="" loading="lazy">`}</div>`;
  }

  const MOD_FONTS = {
    site: {}, serif: { body: 'var(--serif)' }, sans: { body: 'var(--sans)' }, mono: { body: 'var(--mono)' },
    elegant: { title: '"Cormorant Garamond", Georgia, serif', body: '"Cormorant Garamond", Georgia, serif', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap' },
    script: { title: '"Caveat", cursive', url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap' },
    typewriter: { title: '"Special Elite", monospace', body: '"Courier Prime", monospace', url: 'https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:ital@0;1&display=swap' },
  };
  function moduleStyle(m) {
    if (!m) return '';
    const f = MOD_FONTS[m.font] || {};
    if (f.url && !document.querySelector(`link[href="${f.url}"]`)) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = f.url; document.head.appendChild(l); }
    let st = '';
    if (m.accent) st += `--accent:${m.accent};--accent-ink:${m.accent};`;
    if (m.bgStyle === 'image' && m.bgImage && m.bgImage.src) st += `--mod-bg:url("${m.bgImage.src}") center / cover fixed, ${m.background || '#ffffff'};`;
    else if (m.bgStyle === 'gradient' && m.background) st += `--mod-bg:linear-gradient(160deg, ${m.background}, ${m.accent || m.background}33);`;
    else if (m.background) st += `--mod-bg:${m.background};`;
    if (f.body) st += `--post-font:${f.body};`;
    if (f.title) st += `--mod-title:${f.title};`;
    if (m.pattern && m.pattern !== 'none' && window.PFDesign) {
      const k = { small: 0.7, medium: 1, large: 1.6 }[m.patternSize] || 1;
      const c1 = m.patternColor || m.accent || '#b8741f';
      st += `--mod-pattern:${window.PFDesign.pattern(m.pattern, c1, m.patternColor2 || c1, k)};--mod-pattern-op:${Number(m.patternOpacity) || 0.12};`;
    }
    if (m.titleColor) st += `--mod-title-color:${m.titleColor};`;
    return st;
  }

  /* ---------------------------------------------------------------- coeur */
  const Love = {
    loved() { return store.get('pf_loved', '') === '1'; },
    count: null,
    paint() {
      $$('[data-love]').forEach((b) => {
        b.setAttribute('aria-pressed', String(Love.loved()));
        b.title = Love.loved() ? T('youLove') : T('loveThis');
        const n = $('.love-n', b); if (n) n.textContent = Love.count === null ? '' : Love.count;
      });
    },
    sync() {
      Love.paint();
      if (Love.count === null) Counter.get('likes').then((v) => { if (v !== null) { Love.count = v; Love.paint(); } });
    },
    click(btn) {
      if (Love.loved()) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); return; }
      store.set('pf_loved', '1');
      Love.count = (Love.count || 0) + 1;
      Love.paint();
      $$('[data-love]').forEach((b) => { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
      for (let i = 0; i < 7; i++) {
        const h = document.createElement('span'); h.className = 'float-heart'; h.textContent = '❤';
        const r = btn.getBoundingClientRect();
        h.style.left = (r.left + r.width / 2 + (Math.random() * 60 - 30)) + 'px';
        h.style.top = (r.top) + 'px';
        h.style.animationDelay = (i * 60) + 'ms';
        document.body.appendChild(h); setTimeout(() => h.remove(), 1400);
      }
      // le proprietaire et les copies locales ne sont pas comptes
      if (!Counter.isAdminBrowser() && !Counter.isLocal()) fetch(`${Counter.base}/hit/${Counter.ns()}/likes`).then((r) => r.json()).then((j) => { if (j && j.value) { Love.count = j.value; Love.paint(); } }).catch(() => {});
    },
  };

  /* ---------------------------------------------------------------- application */
  const App = {
    data: null,
    filter: null,
    layout: store.get('pf_layout', 'grid'),

    async init() {
      const res = await fetch('data/portfolio.json?v=' + Date.now(), { cache: 'no-store' });
      const raw = await res.json();
      const q = new URLSearchParams(location.search).get('lang');
      const saved = store.get('pf_lang', '');
      LANG = q === 'fr' || q === 'en' ? q : saved || ((navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en');
      this.setData(raw);
      this.render();
      this.bindGlobal();
      const view = new URLSearchParams(location.search).get('view') || store.get('pf_view', 'full');
      if (!this.route()) this.setView(view === 'brief' ? 'brief' : 'full', false);
      window.addEventListener('hashchange', () => this.route());
      if (!store.sget('pf_counted')) {
        store.sset('pf_counted', '1');
        Counter.hit('visits');
        Counter.hit('day-' + new Date().toISOString().slice(0, 10).replace(/-/g, ''));
        Counter.hit('src-' + provenance());
        Counter.hit('zone-' + region());
        Counter.hit('dev-' + (window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop'));
      }
      document.dispatchEvent(new CustomEvent('pf:ready'));
    },

    setData(raw) {
      this.base = raw;
      this.data = localize(raw, LANG);
      document.documentElement.lang = LANG;
    },
    setLang(l) {
      if (l === LANG) return;
      LANG = l; store.set('pf_lang', l);
      this.setData(this.base);
      this.render();
      Counter.hit('lang-' + l);
    },
    visible() { return (this.data.projects || []).filter((p) => p.visible !== false); },

    render() {
      const d = this.data, p = d.profile;
      document.title = `${p.name}, ${p.title}`;
      $$('.view-switch button').forEach((b) => { b.textContent = T(b.dataset.view); });
      $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
      const cta = $('.top-actions .btn-solid'); if (cta) cta.textContent = T('contact');
      $$('[data-cv]').forEach((a) => { a.href = p.cv; a.setAttribute('download', p.cv.split('/').pop()); });
      this.renderHero(); this.renderSpotlight(); this.renderWork(); this.renderExperience(); this.renderSkills(); this.renderStage(); this.renderTestimonials();
      this.renderWriting(); this.renderContact(); this.renderBrief(); this.renderFooter();
      this.route();
      if (!$('#love-fab')) document.body.insertAdjacentHTML('beforeend', '<button type="button" id="love-fab" class="love fab" data-love aria-pressed="false" aria-label="Love this profile"><span class="heart" aria-hidden="true">❤</span><span class="love-n">0</span></button>');
      Love.sync();
      if (window.PFDesign) window.PFDesign.apply(d.design);
      this.observe();
    },

    renderHero() {
      const p = this.data.profile, q = this.data.quote;
      const [first, ...rest] = p.name.split(' ');
      $('#top').innerHTML = `
        <div class="hero-text reveal">
          <span class="state"><i class="dot"></i>${T('state')}: <b>${esc(p.availability || 'Open to opportunities')}</b></span>
          <h1>${esc(first)} <em>${esc(rest.join(' '))}</em></h1>
          <div class="role">${esc(p.title)}</div>
          <p class="headline">${esc(p.headline)}</p>
          <div class="hero-cta">
            <a class="btn btn-solid" data-cv data-count="cv" href="${esc(p.cv)}" download>${ICON.download} ${T('dlcv')}</a>
            <a class="btn" data-count="contact-email" href="${esc(mailto(p))}">${ICON.mail} ${T('email')}</a>
            <a class="btn" data-count="contact-whatsapp" href="${esc(wa(p))}" target="_blank" rel="noopener">${ICON.wa} WhatsApp</a>
            <a class="btn btn-ghost" href="${esc(p.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON.in}</a>
            <a class="btn btn-ghost" href="${esc(p.github)}" target="_blank" rel="noopener" aria-label="GitHub">${ICON.gh}</a>
            <button type="button" class="love" data-love aria-pressed="false" aria-label="${T('loveThis')}"><span class="heart" aria-hidden="true">❤</span><span class="love-n">0</span></button>
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
            <div class="apis-head"><b>${(t.apis || []).length}</b> ${T('apisImpl')}</div>
            <ul class="apis">${(t.apis || []).map((a) => `<li><span class="mono">${esc(a.id)}</span>${esc(a.name)}</li>`).join('')}</ul>
            ${t.proof ? `<p class="proof">${esc(t.proof)}</p>` : ''}
            ${t.cert ? `<p class="cert"><span aria-hidden="true">✓</span>${esc(t.cert)}</p>` : ''}
          </article>
          <article class="spot-card bpmn reveal">
            <div class="spot-label"><span class="logo-mark gw" aria-hidden="true"></span>BPMN 2.0, executed by Kogito</div>
            <p>${esc(b.text)}</p>
            <div class="bstats">${(b.stats || []).map((x) => `<div><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join('')}</div>
            <div class="bpmn-host" id="spot-bpmn" data-src="${esc(b.file)}">
              <button type="button" class="bpmn-start">◇ ${T('openModel')}<small>${T('dragZoom')}</small></button>
            </div>
          </article>
        </div></div>`;
      const host = $('#spot-bpmn');
      if (host && b.file) {
        $('.bpmn-start', host).addEventListener('click', () => { Counter.hit('bpmn-viewer'); mountBpmn(host, b.file, b.journey); });
      }
    },

    renderWork() {
      const d = this.data, p = d.profile;
      const kws = {};
      this.visible().forEach((pr) => (pr.keywords || []).forEach((k) => { kws[k] = (kws[k] || 0) + 1; }));
      const top = Object.keys(kws).sort((a, b) => kws[b] - kws[a] || a.localeCompare(b)).slice(0, 14);
      $('#work').innerHTML = `
        <div class="about reveal">
          <div><span class="eyebrow">${T('about')}</span><h2 style="font-size:clamp(28px,3.4vw,38px);margin-top:8px">${T('aboutTitle')}</h2></div>
          <div>${(p.about || []).map((t) => `<p>${esc(t)}</p>`).join('')}</div>
        </div>
        <div class="section-head reveal">
          <div><span class="eyebrow">${T('selected')}</span><h2>${T('projects')}</h2>
          <p>${T('openCard')}</p></div>
        </div>
        <div class="toolbar reveal">
          <div class="filters" role="group" aria-label="Filter by keyword">
            <button class="chip" type="button" data-filter="" aria-pressed="${!this.filter}">${T('all')}</button>
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
      if (!list.length) { grid.innerHTML = `<p class="empty">${T('noKw')}</p>`; return; }
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
        <div class="section-head reveal"><div><span class="eyebrow">${T('path')}</span><h2>${T('experience')}</h2></div></div>
        <div class="two-col">
          <ol class="timeline reveal">${(d.experience || []).map((x) => `<li>
            <h3>${esc(x.role)}</h3><span class="when">${esc(x.period)}</span>
            <div class="org">${esc(x.company)}</div>
            ${(x.points || []).length ? `<ul>${x.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          </li>`).join('')}</ol>
          <div class="reveal">
            <div class="side-card"><h3>${T('education')}</h3>${(d.education || []).map((e) => `<div class="item"><b>${esc(e.degree)}</b><span>${esc(e.school)} · ${esc(e.period)}</span></div>`).join('')}</div>
            <div class="side-card"><h3>${T('certifications')}</h3>${(d.certifications || []).map((c) => `<div class="item"><b>${esc(c.name)}</b><span>${esc(c.issuer)} · ${esc(c.year)}${c.id ? ` · <span class="mono" style="font-size:11.5px">ID ${esc(c.id)}</span>` : ''}</span></div>`).join('')}</div>
          </div>
        </div>`;
    },

    renderSkills() {
      const d = this.data;
      $('#skills').innerHTML = `
        <div class="section-head reveal"><div><span class="eyebrow">${T('toolbox')}</span><h2>${T('skills')}</h2></div></div>
        <div class="skills reveal">${(d.skills || []).map((g) => `<div class="skill-group"><h3>${esc(g.group)}</h3><div class="tags">${g.items.map((i) => `<span class="tag">${esc(i)}</span>`).join('')}</div></div>`).join('')}</div>
        <div class="langs reveal">${(d.profile.languages || []).map((l) => `<span><b>${esc(l.name)}</b>${esc(l.level)}</span>`).join('')}</div>`;
    },

    renderStage() {
      const s = this.data.speaking;
      if (!s) { $('#stage').hidden = true; return; }
      const media = s.media || [];
      $('#stage').innerHTML = `
        <div class="section-head reveal"><div><span class="eyebrow">${T('beyond')}</span><h2>${esc(s.title || 'On stage')}</h2></div></div>
        <div class="stage">
          <div class="reveal">
            <p class="mic">${esc(s.text)}</p>
            ${(s.items || []).map((i) => `<div class="side-card" style="margin-bottom:10px"><div class="item"><b>${esc(i.name)}</b><span>${esc(i.detail)} · ${esc(i.year)}</span></div></div>`).join('')}
          </div>
          <div class="stage-media reveal ${media.length > 1 ? 'gallery' : ''}">${media.length ? media.map((m, i) => `<figure style="margin:0" class="zoomable" data-zoom="${i}">${mediaEl(m, { controls: true })}${m.caption ? `<figcaption class="meta" style="margin-top:6px">${esc(m.caption)}</figcaption>` : ''}</figure>`).join('')
            : `<div class="stage-placeholder">${T('stagePh')}</div>`}</div>
        </div>`;
    },

    posts() {
      const today = new Date().toISOString().slice(0, 10);
      return (this.data.posts || []).filter((p) => p.visible !== false && (!p.date || p.date <= today))
        .sort((a, b) => (b.pinned === true) - (a.pinned === true) || String(b.date).localeCompare(String(a.date)));
    },
    module(id) { return (this.data.modules || []).find((m) => m.id === id); },
    postCard(p) {
      const m = this.module(p.module);
      return `<a class="post-card" href="#/post/${esc(p.id)}" style="${esc(moduleStyle(m))}">
        ${m ? `<span class="mod-chip">${esc(m.emoji || '')} ${esc(m.name)}</span>` : ''}
        ${postCover(p)}
        <div class="pc-body">
          <div class="meta">${p.pinned ? `<span class="company">${T('pinned')}</span>` : ''}<span>${esc(fmtDate(p.date))}</span><span>${readMin(p.body)} ${T('minRead')}</span></div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.excerpt || '')}</p>
          <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div></a>`;
    },
    renderWriting() {
      const list = this.posts();
      const el = $('#writing');
      if (!list.length) { el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = `<div class="section-head reveal"><div><span class="eyebrow">${T('writing')}</span><h2>${T('latest')}</h2><p>${T('latestSub')}</p></div>
        <a class="btn" href="#/posts">${T('allPosts')}</a></div>
        <div class="post-grid reveal">${list.slice(0, 3).map((p) => this.postCard(p)).join('')}</div>`;
    },
    renderPostsList(tag) {
      const all = this.posts();
      const tags = [...new Set(all.flatMap((p) => p.tags || []))];
      const list = tag ? all.filter((p) => (p.tags || []).includes(tag)) : all;
      const hay = (p) => (p.title + ' ' + (p.excerpt || '') + ' ' + (p.tags || []).join(' ') + ' ' + String(p.body || '').replace(/<[^>]+>/g, ' ')).toLowerCase();
      this.resetModuleBg();
      const mods = (this.data.modules || []).filter((m) => all.some((p) => p.module === m.id));
      $('#view-posts').innerHTML = `<div class="posts-page">
        <header class="section-head"><div><span class="eyebrow">${T('writing')}</span><h2>${T('posts')}</h2><p>${T('postsSub')}</p></div></header>
        ${mods.length ? `<h3 class="mods-title">${T('themes')}</h3><div class="mod-grid">${mods.map((m) => `<a class="mod-card" href="#/module/${esc(m.id)}" style="${esc(moduleStyle(m))}">
          ${m.cover && m.cover.src ? `<img src="${esc(m.cover.src)}" alt="" loading="lazy">` : ''}
          <span class="mod-emoji">${esc(m.emoji || '✦')}</span><b>${esc(m.name)}</b><small>${esc(m.description || '')}</small>
          <em>${all.filter((p) => p.module === m.id).length} posts</em></a>`).join('')}</div><h3 class="mods-title">${T('allPosts')}</h3>` : ''}
        ${tags.length ? `<div class="filters" style="margin-bottom:22px"><a class="chip" href="#/posts" aria-pressed="${!tag}">All</a>${tags.map((t) => `<a class="chip" href="#/posts/${encodeURIComponent(t)}" aria-pressed="${t === tag}">${esc(t)}</a>`).join('')}</div>` : ''}
        <input type="search" class="post-search" id="post-search" placeholder="${T('searchPosts')}" aria-label="${T('searchPosts')}">
        <div id="post-results">${list.length ? `<div class="post-grid">${list.map((p) => this.postCard(p)).join('')}</div>` : `<p class="empty">${T('noPost')}</p>`}</div>
      </div>`;
      const box = $('#post-search');
      box.addEventListener('input', () => {
        const q = box.value.trim().toLowerCase();
        const hits = q ? list.filter((p) => q.split(/\s+/).every((w) => hay(p).includes(w))) : list;
        $('#post-results').innerHTML = hits.length ? `<div class="post-grid">${hits.map((p) => this.postCard(p)).join('')}</div>` : `<p class="empty">${T('noMatch')}</p>`;
      });
    },
    renderCase(id) {
      this.resetModuleBg();
      const pr = (this.data.projects || []).find((x) => x.id === id);
      const c = pr && pr.caseStudy;
      const v = $('#view-posts');
      if (!c) { v.innerHTML = `<div class="posts-page"><p class="empty">${T('notExist')}</p></div>`; return; }
      Counter.hit('case-' + id);
      const cover = (pr.media || [])[pr.cover || 0];
      v.innerHTML = `<article class="post case">
        <a class="back" href="#work">← ${T('projects')}</a>
        <header><div class="meta"><span class="company">${esc(pr.company)}</span><span>${esc(pr.period)}</span></div>
          <h1>${esc(c.title || pr.name)}</h1><p class="lede">${esc(c.tagline || pr.summary)}</p></header>
        ${cover && cover.type === 'image' ? `<div class="post-cover hero-inline"><img src="${esc(cover.src)}" alt=""></div>` : ''}
        <div class="case-kpis">${(c.kpis || []).map((k) => `<div><b>${esc(k.value)}</b><span>${esc(k.label)}</span></div>`).join('')}</div>
        ${(c.sections || []).map((sec) => `<section class="case-sec"><span class="eyebrow">${esc(sec.label)}</span><h2>${esc(sec.title)}</h2>
          ${(sec.paragraphs || []).map((t) => `<p>${esc(t)}</p>`).join('')}
          ${(sec.points || []).length ? `<ul>${sec.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          ${caseFigures(sec)}${caseTable(sec)}</section>`).join('')}
        <footer class="post-foot"><a class="btn" href="${esc(mailto(this.data.profile, 'About your case study: ' + pr.name))}">${ICON.mail} ${T('replyMail')}</a>
          <button class="btn" type="button" data-project="${esc(pr.id)}">${T('seeScreens')}</button></footer>
      </article>`;
      document.title = `${c.title || pr.name}, ${this.data.profile.name}`;
    },
    resetModuleBg() { const v = $('#view-posts'); v.removeAttribute('style'); v.className = ''; },
    applyModule(m) {
      const v = $('#view-posts');
      v.setAttribute('style', moduleStyle(m));
      v.className = ['in-module', 'mc-' + (m.cardStyle || 'solid'), 'mh-' + (m.headerStyle || 'banner'), 'ml-' + (m.listLayout || 'grid'), 'mr-' + (m.radius || 'soft')].join(' ');
    },
    renderModule(id) {
      const m = this.module(id);
      const v = $('#view-posts');
      if (!m) { this.renderPostsList(); return; }
      Counter.hit('module-' + m.id);
      const list = this.posts().filter((p) => p.module === m.id);
      this.applyModule(m);
      v.innerHTML = `<div class="posts-page">
        <a class="back" href="#/posts">← All posts</a>
        <header class="mod-hero">${m.cover && m.cover.src ? `<img src="${esc(m.cover.src)}" alt="">` : ''}
          <span class="mod-emoji big">${esc(m.emoji || '✦')}</span>
          <h2>${esc(m.name)}</h2><p>${esc(m.description || '')}</p><span class="meta">${list.length} post${list.length > 1 ? 's' : ''}</span></header>
        ${list.length ? `<div class="post-grid">${list.map((p) => this.postCard(p)).join('')}</div>` : '<p class="empty">No post in this module yet.</p>'}
      </div>`;
      document.title = `${m.name}, ${this.data.profile.name}`;
    },
    renderPost(id) {
      const p = this.posts().find((x) => x.id === id);
      const box = $('#view-posts');
      if (!p) { box.innerHTML = `<div class="posts-page"><p class="empty">${T('notExist')} <a href="#/posts">${T('seeAll')}</a>.</p></div>`; return; }
      Counter.hit('post-' + p.id);
      const st = p.style || {};
      const mod = this.module(p.module);
      const v = $('#view-posts');
      if (mod) this.applyModule(mod); else this.resetModuleBg();
      const font = { serif: 'var(--serif)', sans: 'var(--sans)', mono: 'var(--mono)' }[st.font] || '';
      const all = this.posts(); const i = all.findIndex((x) => x.id === p.id);
      const prev = all[i + 1], next = all[i - 1];
      box.innerHTML = `<article class="post layout-${esc(st.layout || 'standard')}" style="${st.accent ? `--accent:${esc(st.accent)};--accent-ink:${esc(st.accent)};` : ''}${font ? `--post-font:${font};` : ''}">
        <a class="back" href="${mod ? '#/module/' + esc(mod.id) : '#/posts'}">← ${mod ? esc((mod.emoji || '') + ' ' + mod.name) : T('allPosts')}</a>
        <header>
          <div class="meta"><span>${esc(fmtDate(p.date))}</span><span>${readMin(p.body)} ${T('minRead')}</span>${(p.tags || []).map((t) => `<a class="tag" href="#/posts/${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>
          <h1>${esc(p.title)}</h1>
          ${p.excerpt ? `<p class="lede">${esc(p.excerpt)}</p>` : ''}
          <div class="byline"><img src="${esc(this.data.profile.photo)}" alt=""><span>${esc(this.data.profile.name)}<small>${esc(this.data.profile.title)}</small></span></div>
        </header>
        ${st.coverDisplay !== 'none' && p.cover && p.cover.src ? postCover(p, 'hero-' + (st.coverDisplay || 'full')) : ''}
        <div class="post-body">${clean(p.body)}</div>
        <footer class="post-foot">
          <button type="button" class="love" data-love aria-pressed="false"><span class="heart" aria-hidden="true">❤</span><span class="love-n"></span></button>
          <a class="btn" href="${esc(mailto(this.data.profile, 'About your post: ' + p.title))}">${ICON.mail} ${T('replyMail')}</a>
          <button class="btn" type="button" data-share="${esc(p.id)}">${T('copyLink')}</button>
        </footer>
        <nav class="post-nav">${prev ? `<a href="#/post/${esc(prev.id)}"><small>${T('previous')}</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/post/${esc(next.id)}" style="text-align:right"><small>${T('next')}</small>${esc(next.title)}</a>` : ''}</nav>
      </article>`;
      Love.sync();
      document.title = `${p.title}, ${this.data.profile.name}`;
      const cs = this.data.settings || {};
      if (cs.comments) {
        const box = document.createElement('section'); box.className = 'comments';
        box.innerHTML = `<h2>${T('comments')}</h2>`;
        const sc = document.createElement('script');
        sc.src = 'https://utteranc.es/client.js'; sc.async = true; sc.crossOrigin = 'anonymous';
        sc.setAttribute('repo', `${cs.owner}/${cs.repo}`); sc.setAttribute('issue-term', 'post: ' + p.id);
        sc.setAttribute('label', 'comments'); sc.setAttribute('theme', document.documentElement.dataset.theme === 'dark' ? 'github-dark' : 'github-light');
        box.appendChild(sc); $('.post', box.ownerDocument).appendChild(box);
      }
    },

    route() {
      const h = decodeURIComponent(location.hash || '');
      let m;
      if ((m = h.match(/^#\/post\/(.+)$/))) { this.setView('posts', false); this.renderPost(m[1]); window.scrollTo({ top: 0 }); return true; }
      if ((m = h.match(/^#\/case\/(.+)$/))) { this.setView('posts', false); this.renderCase(m[1]); window.scrollTo({ top: 0 }); return true; }
      if ((m = h.match(/^#\/module\/(.+)$/))) { this.setView('posts', false); this.renderModule(m[1]); window.scrollTo({ top: 0 }); return true; }
      if ((m = h.match(/^#\/posts(?:\/(.+))?$/))) { this.setView('posts', false); this.renderPostsList(m[1]); window.scrollTo({ top: 0 }); document.title = `Posts, ${this.data.profile.name}`; return true; }
      if (!$('#view-posts').hidden) { this.setView(store.get('pf_view', 'full') === 'brief' ? 'brief' : 'full', false); document.title = `${this.data.profile.name}, ${this.data.profile.title}`; }
      return false;
    },

    renderTestimonials() {
      const list = (this.data.testimonials || []).filter((t) => t.visible !== false && t.quote);
      let el = $('#testimonials');
      if (!el) { el = document.createElement('section'); el.id = 'testimonials'; el.className = 'block'; el.dataset.section = ''; $('#stage').after(el); }
      if (!list.length) { el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = `<div class="section-head reveal"><div><span class="eyebrow">${T('recommendations')}</span><h2>${T('whatOthers')}</h2></div></div>
        <div class="testi-grid reveal">${list.map((t) => `<figure class="testi">
          <blockquote>“${esc(t.quote)}”</blockquote>
          <figcaption>${t.photo ? `<img src="${esc(t.photo)}" alt="">` : `<span class="ini">${esc(initials(t.name || '?'))}</span>`}
          <span><b>${esc(t.name)}</b><small>${esc(t.role || '')}${t.company ? ', ' + esc(t.company) : ''}</small></span>
          ${t.link ? `<a href="${esc(t.link)}" target="_blank" rel="noopener" aria-label="Profile">↗</a>` : ''}</figcaption></figure>`).join('')}</div>`;
    },

    renderContact() {
      const p = this.data.profile;
      $('#contact').innerHTML = `<div class="inner">
        <div>
          <span class="eyebrow">${T('endEvent')}</span>
          <h2>${T('talk')}</h2>
          <p>${T('answer')}</p>
          <div class="contact-actions">
            <a class="btn btn-accent" data-count="contact-email" href="${esc(mailto(p))}">${ICON.mail} ${esc(p.email)}</a>
            <a class="btn" data-count="contact-whatsapp" href="${esc(wa(p))}" target="_blank" rel="noopener">${ICON.wa} WhatsApp</a>
            <a class="btn" data-count="cv" data-cv href="${esc(p.cv)}" download>${ICON.download} CV (PDF)</a>
            <a class="btn" href="${esc(p.linkedin)}" target="_blank" rel="noopener">${ICON.in} LinkedIn</a>
          </div>
        </div>
        <form class="form" id="contact-form" novalidate>
          <div class="row">
            <label>${T('yourName')}<input name="name" autocomplete="name" required></label>
            <label>${T('company')}<input name="company" autocomplete="organization"></label>
          </div>
          <label>${T('message')}<textarea name="message" required placeholder="${T('msgPh')}"></textarea></label>
          <div class="send">
            <button class="btn btn-accent" type="submit" data-channel="email">${ICON.mail} ${T('sendMail')}</button>
            <button class="btn" type="submit" data-channel="whatsapp">${ICON.wa} ${T('sendWa')}</button>
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
            <a class="btn btn-solid" data-cv data-count="cv" href="${esc(p.cv)}" download>${ICON.download} ${T('dlcv')}</a>
            <a class="btn" data-count="contact-email" href="${esc(mailto(p))}">${ICON.mail} E-mail</a>
            <a class="btn" data-count="contact-whatsapp" href="${esc(wa(p))}" target="_blank" rel="noopener">${ICON.wa} WhatsApp</a>
          </div>
        </header>
        <dl class="brief-grid" style="margin:0">
          <div><dt>${T('availability')}</dt><dd>${esc(p.availability)}</dd></div>
          <div><dt>${T('location')}</dt><dd>${esc(p.location)}</dd></div>
          <div><dt>${T('degree')}</dt><dd>${esc(((d.education || [])[0] || {}).degree || '')}</dd></div>
          <div><dt>${T('languages')}</dt><dd>${(p.languages || []).map((l) => esc(l.name + ' ' + l.level.replace(/\s*\(.*\)/, ''))).join(', ')}</dd></div>
        </dl>
        <div class="brief-body">
          <section>
            <h2>${T('keyProjects')}</h2>
            ${key.map((x) => `<div class="bp"><b>${esc(x.name)}</b> <span class="meta" style="display:inline">· ${esc(x.company)} · ${esc(x.role)}</span>
              <p style="margin:4px 0 6px;font-size:14.5px">${esc(x.summary)}</p>
              ${(x.highlights || []).length ? `<p style="margin:0 0 6px;font-size:13.5px;color:var(--muted)">${esc(x.highlights.slice(0, 2).join('. '))}.</p>` : ''}
              <button type="button" data-project="${esc(x.id)}">${T('seeScreens')}</button></div>`).join('')}
          </section>
          <section>
            <h2>${T('experience')}</h2>
            ${(d.experience || []).map((x) => `<div class="xp"><div><b>${esc(x.role)}</b><br><small style="color:var(--muted)">${esc(x.company)}</small></div><span>${esc(x.period)}</span></div>`).join('')}
            <h2 style="margin-top:22px">${T('coreSkills')}</h2>
            <div class="tags" style="padding:0">${allSkills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>
            <p class="brief-note">${T('certified')}: ${(d.certifications || []).slice(0, 3).map((c) => esc(c.issuer)).join(', ')}. <a href="?view=full" data-goview="full">${T('openFull')}</a>.</p>
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
            ${pr.caseStudy ? `<p style="margin-top:16px"><a class="btn btn-accent" href="#/case/${esc(pr.id)}">${T('caseStudy')} →</a></p>` : ''}
            ${(pr.links || []).length ? `<div class="hero-cta" style="margin:18px 0 0">${pr.links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>` : ''}
          </div>
        </div>`;
      const stage = $('.pd-stage', dlg), cap = $('.pd-caption', dlg);
      const show = (i) => {
        if (!media.length) { stage.innerHTML = `<div style="position:relative;width:100%;height:280px">${genCover(pr)}</div>`; cap.textContent = T('illustration'); return; }
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

    lightbox(media, i) {
      let box = $('#lightbox');
      if (!box) { box = document.createElement('dialog'); box.id = 'lightbox'; box.className = 'lightbox'; document.body.appendChild(box); }
      const show = (k) => {
        i = (k + media.length) % media.length; const m = media[i];
        box.innerHTML = `<button class="pd-close" type="button" aria-label="Close">×</button>
          ${m.type === 'video' ? `<video src="${esc(m.src)}" controls autoplay></video>` : `<img src="${esc(m.src)}" alt="${esc(m.caption || '')}">`}
          ${m.caption ? `<p>${esc(m.caption)}</p>` : ''}
          ${media.length > 1 ? '<div class="lb-nav"><button type="button" data-lb="-1">←</button><button type="button" data-lb="1">→</button></div>' : ''}`;
        $('.pd-close', box).onclick = () => box.close();
        $$('[data-lb]', box).forEach((b) => b.onclick = () => show(i + +b.dataset.lb));
      };
      show(i);
      box.onclick = (e) => { if (e.target === box) box.close(); };
      box.onkeydown = (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); };
      box.showModal();
    },

    /* ---------------------------------------------------------------- vues */
    setView(v, save = true) {
      $('#view-full').hidden = v !== 'full';
      $('#view-brief').hidden = v !== 'brief';
      $('#view-posts').hidden = v !== 'posts';
      $$('.view-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
      if (save) {
        if (v === 'posts') { location.hash = '#/posts'; return; }
        store.set('pf_view', v); Counter.hit('view-' + v); window.scrollTo({ top: 0 });
        if (/^#\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
      }
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
        const z = e.target.closest('[data-zoom]');
        if (z && e.target.tagName === 'IMG') { this.lightbox((this.data.speaking.media || []), +z.dataset.zoom); return; }
        const pi = e.target.closest('.post-body img');
        if (pi) { this.lightbox([{ type: 'image', src: pi.getAttribute('src'), caption: pi.alt }], 0); return; }
        const lg = e.target.closest('[data-lang]');
        if (lg) { this.setLang(lg.dataset.lang); return; }
        const sh = e.target.closest('[data-share]');
        if (sh) { const u = location.origin + location.pathname + '#/post/' + sh.dataset.share; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { sh.textContent = T('linkCopied'); }).catch(() => prompt('Copy this link', u)); return; }
        const lv = e.target.closest('[data-love]');
        if (lv) { Love.click(lv); return; }
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
