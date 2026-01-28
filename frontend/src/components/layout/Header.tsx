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
    <header className="bg-white border-b border-[var(--border-gray)]">
      {/* Top Logo Section */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            {/* Compass icon placeholder - you can replace with your actual compass.png */}
            <div className="w-14 h-14 bg-[var(--dark)] rounded-lg flex items-center justify-center text-white text-2xl">
              🧭
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--dark)]">
                GP
              </div>
              <div className="text-lg font-bold text-[var(--text-secondary)] -mt-2">
                GLOBAL PALEOMAGNETIC DATABASE
              </div>
            </div>
          </Link>

          {/* Three icons on right - placeholder */}
          <div className="hidden md:flex items-center gap-1">
            <span className="text-2xl">🌍</span>
            <span className="text-2xl">🏠</span>
            <span className="text-2xl">🔨</span>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-[var(--dark)] border-t border-[#333]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Desktop Navigation */}
            <ul className="hidden md:flex">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="block px-4 py-2 text-white text-sm font-medium hover:text-[var(--accent-coral)] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-2 border-t border-[#333]">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-white text-sm hover:text-[var(--accent-coral)] transition-colors"
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
