'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'info';
    isLoading?: boolean;
}

const variants = {
    primary: 'bg-[var(--accent-coral)] text-white hover:bg-[var(--accent-coral-hover)]',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    info: 'bg-[var(--accent-blue)] text-white hover:bg-blue-700',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className = '',
        variant = 'primary',
        isLoading = false,
        disabled,
        children,
        ...props
    }, ref) => {
        return (
            <button
                ref={ref}
                className={`
          px-4 py-2 rounded-md text-sm font-medium
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${className}
        `}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? 'Loading...' : children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
