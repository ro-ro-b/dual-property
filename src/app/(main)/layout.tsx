'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Marble texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5 mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, #ffffff 0%, transparent 50%), radial-gradient(circle at 80% 80%, #f5f0eb 0%, transparent 50%)',
        }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#c9a84c] to-[#a68832] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#0a0e1a] text-xl">
                  domain
                </span>
              </div>
              <div>
                <h1 className="text-xl font-serif italic font-bold text-white">
                  DUAL
                </h1>
                <p className="text-xs text-[#c9a84c] font-medium">Property</p>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 relative group"
              >
                Properties
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c9a84c] to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/portfolio"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 relative group"
              >
                Portfolio
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c9a84c] to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/trade"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 relative group"
              >
                Trade
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c9a84c] to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/distribute"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 relative group"
              >
                Distribute
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c9a84c] to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 relative group"
              >
                Admin
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c9a84c] to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-white/[0.08] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined text-white">menu</span>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-white/[0.06] pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Link
                href="/"
                className="block text-sm font-medium text-white/70 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Properties
              </Link>
              <Link
                href="/portfolio"
                className="block text-sm font-medium text-white/70 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Portfolio
              </Link>
              <Link
                href="/trade"
                className="block text-sm font-medium text-white/70 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Trade
              </Link>
              <Link
                href="/distribute"
                className="block text-sm font-medium text-white/70 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Distribute
              </Link>
              <Link
                href="/admin"
                className="block text-sm font-medium text-white/70 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Admin
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-0">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#0a0e1a] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-serif italic text-white mb-4">
                DUAL Property
              </h3>
              <p className="text-xs text-white/50">
                Institutional real estate. Fractional access.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/70 mb-4 uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-white/50 hover:text-white/70">
                <li>
                  <a href="/">Properties</a>
                </li>
                <li>
                  <a href="/portfolio">Portfolio</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/70 mb-4 uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-2 text-xs text-white/50">
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/70 mb-4 uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-2 text-xs text-white/50">
                <li>
                  <a href="#">Terms</a>
                </li>
                <li>
                  <a href="#">Privacy</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8">
            <p className="text-xs text-white/40 text-center">
              © 2026 DUAL Property. All rights reserved. Powered by DUAL Network.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
