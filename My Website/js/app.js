// Portfolio app script: render projects and small UI behaviors
document.addEventListener('DOMContentLoaded', () => {
    // set year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // load projects from local JSON
    const grid = document.getElementById('projectsGrid');
    if (grid) {
        fetch('projects.json')
            .then(r => r.json())
            .then(data => renderProjects(grid, data))
            .catch(() => {
                grid.innerHTML = '<p class="muted">No projects available.</p>';
            });
    }

    // mailto link fallback
    const mailto = document.getElementById('mailtoLink');
    if (mailto) mailto.setAttribute('href', 'mailto:you@example.com');
});

function renderProjects(container, projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
        container.innerHTML = '<p class="muted">No projects to show.</p>';
        return;
    }

    container.innerHTML = projects.map(p => projectCard(p)).join('\n');
}

function projectCard(p) {
    const url = p.link ? ` <a href="${p.link}" target="_blank" rel="noopener">→ demo</a>` : '';
    const tech = p.tech ? `<div class="tech">${escapeHtml(p.tech.join(' • '))}</div>` : '';
    return `
        <article class="card">
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.description)}${url}</p>
            ${tech}
        </article>
    `;
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
