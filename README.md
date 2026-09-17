# Meriem Trabelsi, portfolio

Static portfolio served by GitHub Pages. The content lives in `data/portfolio.json`.

## Views
- **Full portfolio**: profile, projects, experience, skills, on stage, contact.
- **Recruiter brief**: one-page summary. Direct link: `?view=brief`.

## Owner studio
Open the site with `#studio` at the end of the address. Sign in with a fine-grained
personal access token limited to this repository, permission *Contents: Read and write*.
Saving commits `data/portfolio.json` and uploads media under `assets/uploads/`.
GitHub Pages republishes in about a minute.

Visit counts use the free Abacus counter service. Visits from a browser signed in to the
studio are not counted.

## Local preview
```
python3 -m http.server 8000
```
then open http://localhost:8000
