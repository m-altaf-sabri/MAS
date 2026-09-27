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
    localStorage.setItem('portfolio-theme', resolvedTheme);

    if (themeIcon) {
        themeIcon.textContent = resolvedTheme === 'light' ? '☀️' : '🌙';
    }

    if (themeLabel) {
        themeLabel.textContent = resolvedTheme === 'light' ? 'Light' : 'Dark';
    }

    if (themeToggle) {
        const nextTheme = resolvedTheme === 'light' ? 'dark' : 'light';
        themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
        themeToggle.classList.toggle('is-dark', resolvedTheme === 'dark');
        themeToggle.classList.toggle('is-light', resolvedTheme === 'light');
    }
};

const savedTheme = localStorage.getItem('portfolio-theme');
const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(initialTheme);

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

navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        mainNav?.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        navLinks.forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
    });
});

const sections = document.querySelectorAll('main section[id], section[id="contact"]');

const setActiveNav = () => {
    const scrollPosition = window.scrollY + 120;
    let activeId = 'home';

    sections.forEach((section) => {
        if (scrollPosition >= section.offsetTop) {
            activeId = section.id;
        }
    });

    navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${activeId}`;
        link.classList.toggle('active', isActive);
    });
};

window.addEventListener('scroll', setActiveNav, { passive: true });
window.addEventListener('load', setActiveNav);

const animatedElements = document.querySelectorAll('.section-divider, .section-divider1, .section-dividers, .section-block, .contact-card, .form-panel');

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    animatedElements.forEach((element) => revealObserver.observe(element));
} else {
    animatedElements.forEach((element) => element.classList.add('is-visible'));
}

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("form-status");

contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    formStatus.textContent = "Sending message...";
    formStatus.style.color = "#2563eb";

    try {
        const response = await fetch("http://localhost:5000/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                subject,
                message
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to send message.");
        }

        formStatus.textContent = data.message;
        formStatus.style.color = "#16a34a";

        contactForm.reset();
    } catch (error) {
        formStatus.textContent = error.message;
        formStatus.style.color = "#dc2626";

        console.error("Contact form error:", error);
    }
});