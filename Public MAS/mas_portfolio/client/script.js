// ========================================
// PORTFOLIO SCRIPT.JS
// ========================================


// ========================================
// 1. MOBILE MENU
// ========================================

const menu = document.getElementById("menu");
const navLinksContainer = document.getElementById("navLinks");

if (menu && navLinksContainer) {

    menu.addEventListener("click", () => {
        navLinksContainer.classList.toggle("open");
    });

    // Close menu after clicking a navigation link
    navLinksContainer.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinksContainer.classList.remove("open");
        });
    });
}


// ========================================
// 2. ACTIVE NAVBAR
// ========================================

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("#navLinks a");

function updateActiveNavigation() {

    let currentSection = "home";

    sections.forEach(section => {

        const sectionTop = section.getBoundingClientRect().top;

        if (sectionTop <= 180) {
            currentSection = section.id;
        }

    });

    navLinks.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + currentSection) {
            link.classList.add("active");
        }

    });
}

window.addEventListener("scroll", updateActiveNavigation);
window.addEventListener("load", updateActiveNavigation);

updateActiveNavigation();


// ========================================
// 3. DARK / LIGHT THEME
// ========================================

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {

    // Load saved theme
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        themeToggle.textContent = "☀️";
    } else {
        document.body.classList.remove("dark-theme");
        themeToggle.textContent = "🌙";
    }


    // Toggle theme
    themeToggle.addEventListener("click", () => {

        document.body.classList.toggle("dark-theme");

        const isDark =
            document.body.classList.contains("dark-theme");

        if (isDark) {
            themeToggle.textContent = "☀️";
            localStorage.setItem("theme", "dark");
        } else {
            themeToggle.textContent = "🌙";
            localStorage.setItem("theme", "light");
        }

    });

}


// ========================================
// 4. SCROLL REVEAL ANIMATION
// ========================================

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
    (entries, observer) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("active");

                observer.unobserve(entry.target);
            }

        });

    },
    {
        threshold: 0.15
    }
);


// Observe every .reveal element
revealElements.forEach(element => {
    revealObserver.observe(element);
});


// ========================================
// 5. INITIAL HERO ANIMATION
// ========================================

// Make hero elements visible immediately
window.addEventListener("load", () => {

    document.querySelectorAll(".hero .reveal").forEach(element => {
        element.classList.add("active");
    });

});

// ========================================
// CONTACT FORM → BACKEND
// ========================================

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const submitButton = document.getElementById("submitButton");

if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();

        if (!name || !email || !message) {
            formStatus.textContent = "Please fill in all fields.";
            formStatus.className = "error";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        formStatus.textContent = "";
        formStatus.className = "";

        try {
            const response = await fetch("http://localhost:5000/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, message })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                formStatus.textContent = "Message sent successfully! Thank you.";
                formStatus.className = "success";
                contactForm.reset();
            } else {
                formStatus.textContent = data.message || "Unable to send message.";
                formStatus.className = "error";
            }
        } catch (error) {
            console.error("Backend connection error:", error);
            formStatus.textContent = "Unable to connect to the server.";
            formStatus.className = "error";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Send Message ↗";
        }
    });
}