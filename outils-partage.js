#!/usr/bin/env node
/*
 * outils-partage.js — regenere les pages de partage et le sitemap.
 *
 * Le panneau d'administration le fait seul a chaque publication. A lancer a la
 * main apres une modification directe de data/portfolio.json :
 *     node outils-partage.js
 */
const fs = require('fs');
const path = require('path');
const { build } = require('./assets/js/share-pages.js');

const ICI = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(ICI, 'data/portfolio.json'), 'utf8'));
for (const f of build(data)) {
  const cible = path.join(ICI, f.path);
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  const avant = fs.existsSync(cible) ? fs.readFileSync(cible, 'utf8') : null;
  if (avant !== f.content) { fs.writeFileSync(cible, f.content); console.log('ecrit   ' + f.path); }
}
