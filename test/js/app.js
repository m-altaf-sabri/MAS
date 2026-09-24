const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-icon');
const themeLabel = document.querySelector('.theme-label');

const applyTheme = (theme) => {
    const resolvedTheme = theme === 'light' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', resolvedTheme);

    if (themeIcon) {
        themeIcon.textContent = resolvedTheme === 'light' ? '☀️' : '🌙';
    }

    if (themeLabel) {
        themeLabel.textContent = resolvedTheme === 'light' ? 'Light' : 'Dark';
    }

    if (themeToggle) {
        const nextTheme = resolvedTheme === 'light' ? 'dark' : 'light';
        themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    }

    localStorage.setItem('portfolio-theme', resolvedTheme);
};

const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme) {
    applyTheme(savedTheme);
} else {
    applyTheme('light');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
    });
}

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');

if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mainNav?.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        navLinks.forEach(item => item.classList.remove('active'));
        link.classList.add('active');
    });
});

const sections = document.querySelectorAll('main section[id], section[id="contact"]');

const setActiveNav = () => {
    const scrollPosition = window.scrollY + 120;
    let activeId = 'home';

    sections.forEach(section => {
        if (scrollPosition >= section.offsetTop) {
            activeId = section.id;
        }
    });

    navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${activeId}`;
        link.classList.toggle('active', isActive);
    });
};

window.addEventListener('scroll', setActiveNav, { passive: true });
window.addEventListener('load', setActiveNav);

const contactForm = document.getElementById('contactForm');
const contactEmail = 'mohdaltafsabri@gmail.com';

if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = (formData.get('name') || '').toString().trim();
        const email = (formData.get('email') || '').toString().trim();
        const subject = (formData.get('subject') || '').toString().trim();
        const message = (formData.get('message') || '').toString().trim();

        if (!name || !email || !subject || !message) {
            return;
        }

        const mailtoBody = encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nPlease reply to: ${email}`
        );
        const mailtoSubject = encodeURIComponent(subject);
        window.location.href = `mailto:${contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;
        contactForm.reset();
    });
}
