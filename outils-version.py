#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
outils-version.py — accroche l'empreinte de chaque fichier a son adresse.

Pourquoi : index.html est reservi a chaque visite, mais style.css et app.js
restent en cache. Un visiteur deja venu se retrouve alors avec le nouveau HTML
et l'ancienne CSS, et les deux se contredisent — c'est ce qui a entoure le logo
d'un cercle apres son remplacement. Une empreinte dans l'adresse force le
navigateur a reprendre le fichier des qu'il change, et seulement alors.

A relancer apres toute modification de style.css, design.js, app.js, admin.js
ou favicon.svg :  python3 outils-version.py
"""
import hashlib, io, os, re, sys

ICI = os.path.dirname(os.path.abspath(__file__))
CIBLES = ['assets/css/style.css', 'assets/js/design.js', 'assets/js/app.js',
          'assets/js/admin.js', 'assets/img/favicon.svg']

def empreinte(chemin):
    with open(os.path.join(ICI, chemin), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]

def main():
    p = os.path.join(ICI, 'index.html')
    s = io.open(p, encoding='utf-8').read()
    avant, change = s, []
    for c in CIBLES:
        if not os.path.exists(os.path.join(ICI, c)):
            print('absent, ignore :', c); continue
        v = empreinte(c)
        motif = re.compile(r'(["\'])' + re.escape(c) + r'(\?v=[0-9a-f]+)?\1')
        if not motif.search(s):
            print('non reference dans index.html :', c); continue
        ancien = motif.search(s).group(2) or ''
        s = motif.sub(lambda m: '%s%s?v=%s%s' % (m.group(1), c, v, m.group(1)), s)
        if ancien != '?v=' + v:
            change.append('%-26s %s -> ?v=%s' % (c, ancien or '(aucune)', v))
    if s == avant:
        print('rien a changer, toutes les empreintes sont a jour'); return 0
    io.open(p, 'w', encoding='utf-8').write(s)
    for l in change: print(l)
    return 0

if __name__ == '__main__':
    sys.exit(main())
