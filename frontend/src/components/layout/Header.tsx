'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Resources', href: '/resources' },
  { name: 'IGCP 648', href: '/igcp' },
  { name: 'Help', href: '/help' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Additions', href: '/additions' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
      <header className="bg-white border-b border-[var(--border-gray)] font-mono text-sm">
      {/* Top Logo Section */}
      <div className="page-container py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--dark)] rounded-lg flex items-center justify-center text-white text-2xl">
              🧭
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--dark)] tracking-tighter">
                GPMDB
              </div>
              <div className="text-xs font-bold text-[var(--text-secondary)] -mt-1 tracking-widest">
                GLOBAL PALEOMAGNETIC DATABASE
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation Bar - Clean Style */}
      <nav className="border-t border-gray-100 bg-white">
        <div className="page-container py-2">
          <div className="flex items-center justify-between">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 overflow-x-auto no-scrollbar">
              <Link href="/search" className="text-gray-600 hover:text-[var(--accent-coral)] font-medium transition-colors whitespace-nowrap">
                Search Data
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-[var(--accent-coral)] font-medium transition-colors whitespace-nowrap">
                About
              </Link>
              <Link href="/resources" className="text-gray-600 hover:text-[var(--accent-coral)] font-medium transition-colors whitespace-nowrap">
                Resources
              </Link>
              <Link href="/igcp" className="text-gray-600 hover:text-[var(--accent-coral)] font-medium transition-colors whitespace-nowrap">
                IGCP 648
              </Link>
              <Link href="/additions" className="text-gray-600 hover:text-[var(--accent-coral)] font-medium transition-colors whitespace-nowrap">
                Additions
              </Link>
              <Link href="/help" className="text-gray-600 hover:text-[var(--accent-coral)] font-medium transition-colors whitespace-nowrap">
                Help
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-4 ml-4">
              <button className="text-gray-600 text-sm font-bold hover:text-gray-800">
                EN
              </button>
              <Link href="/login" className="px-4 py-2 bg-[var(--accent-coral)] text-white rounded-md hover:bg-[var(--accent-coral-hover)] transition-colors whitespace-nowrap font-medium text-sm">
                Sign In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-2 border-t border-gray-100 mt-2 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
