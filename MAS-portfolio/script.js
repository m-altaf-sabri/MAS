// Set this to your form endpoint (Cloudflare Worker, Formspree, etc.). Leave empty to open the visitor's email app instead.
const FORM_ENDPOINT = '';
const FALLBACK_EMAIL = 'mohdaltafsabri@gmail.com';

const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const menuBtn = document.getElementById('menu');
const navLinks = document.getElementById('navLinks');

// Theme
function setTheme(t) {
    root.dataset.theme = t;
    themeBtn.textContent = t === 'dark' ? 'Light' : 'Dark';
    themeBtn.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} theme`);
    try { localStorage.setItem('theme', t); } catch { }
}
let saved = null;
try { saved = localStorage.getItem('theme'); } catch { }
setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeBtn.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

// Mobile menu
menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
});
navLinks.addEventListener('click', e => {
    if (e.target.tagName === 'A') { navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }
});

// Mark JS as running (enables reveal styles)
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero name: split into words and letters for the rise-in
const h1 = document.getElementById('name');
let n = 0;
h1.innerHTML = h1.textContent.split(' ').map(w =>
    `<span class="w" aria-hidden="true">${[...w].map(c => `<span class="c" style="--i:${n++}">${c}</span>`).join('')}</span>`).join(' ');

// Scroll progress bar
const bar = document.getElementById('progress');
// About text lights up word by word as you scroll
const about = document.getElementById('aboutText');
about.innerHTML = about.textContent.split(' ').map(w => `<span class="wd">${w}</span>`).join(' ');
const wds = [...about.querySelectorAll('.wd')];
function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    const r = about.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (r.height + innerHeight * .3)));
    wds.forEach((w, i) => w.classList.toggle('lit', i / wds.length < p));
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Reveal on scroll
const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; rv.observe(el); });

// Cursor ring and magnetic buttons (mouse only)
if (!reduce && matchMedia('(hover: hover)').matches) {
    const cur = document.getElementById('cursor');
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    (function loop() { x += (tx - x) * .18; y += (ty - y) * .18; cur.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(loop); })();
    document.querySelectorAll('a,button,.skills li,.row').forEach(el => {
        el.addEventListener('mouseenter', () => cur.classList.add('big'));
        el.addEventListener('mouseleave', () => cur.classList.remove('big'));
    });
    document.querySelectorAll('.magnetic').forEach(b => {
        b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
        b.addEventListener('mouseleave', () => b.style.transform = '');
    });
}

// Highlight current section in nav
const links = [...navLinks.querySelectorAll('a')];
const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
        if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.hash === '#' + en.target.id));
    });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section').forEach(s => io.observe(s));

// Contact form
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitButton');

form.addEventListener('submit', async e => {
    e.preventDefault();
    status.className = '';
    if (!form.checkValidity()) { status.textContent = 'Fill in your name, a valid email and a message.'; status.className = 'error'; form.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(form));
    if (!FORM_ENDPOINT) {
        location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent('Message from ' + data.name)}&body=${encodeURIComponent(data.message + '\n\n' + data.email)}`;
        return;
    }
    submitBtn.disabled = true; submitBtn.textContent = 'Sending...';
    try {
        const res = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error();
        form.reset(); status.textContent = 'Message sent. I will reply soon.';
    } catch {
        status.textContent = `Message not sent. Check your connection and try again, or email ${FALLBACK_EMAIL}.`; status.className = 'error';
    } finally { submitBtn.disabled = false; submitBtn.textContent = 'Send message'; }
});