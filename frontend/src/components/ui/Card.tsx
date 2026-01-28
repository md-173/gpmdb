'use client';

import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div
            className={`
        bg-white rounded-lg border border-[var(--border-gray)]
        shadow-sm
        ${className}
      `}
        >
            {children}
        </div>
    );
}

interface SectionHeaderProps {
    children: ReactNode;
}

export function SectionHeader({ children }: SectionHeaderProps) {
    return (
        <div className="bg-[var(--dark)] text-white px-3 py-2 border-l-4 border-[var(--accent-coral)] text-sm font-medium">
            {children}
        </div>
    );
}
