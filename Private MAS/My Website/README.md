# My Website (scaffold)

This repository is a minimal portfolio template.

Quick start

1. Run the lightweight local server (no npm packages required):

```powershell
node serve.js
```

2. Open http://localhost:5500/ in your browser.

Alternative: if you prefer live-reload during development and have a working npm installation, you can install live-server and run it:

```powershell
npm install --save-dev live-server
npm run start
```

What this project contains

- `index.html` — the portfolio page (hero, about, projects, contact)
- `css/styles.css` — styles for layout and cards
- `js/app.js` — client script that loads `projects.json` and renders the projects
- `projects.json` — sample project entries
- `serve.js` — tiny Node static server (use `node serve.js` to preview)

Edit `projects.json` to add your own projects, update the contact email in `index.html`, and replace placeholder text with your real bio.
