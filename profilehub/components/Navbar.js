"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <Link href="/" className="logo">
                ProfileHub
            </Link>

            <button
                className="menu-button"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                ☰
            </button>

            <div className={`nav-links ${menuOpen ? "open" : ""}`}>
                <Link href="/" onClick={() => setMenuOpen(false)}>
                    Home
                </Link>

                <Link href="/login" onClick={() => setMenuOpen(false)}>
                    Login
                </Link>

                <Link href="/register" onClick={() => setMenuOpen(false)}>
                    Register
                </Link>
            </div>
        </nav>
    );
}