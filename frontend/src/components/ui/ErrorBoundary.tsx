'use client';

import { Component, ReactNode } from 'react';
import Link from 'next/link';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[300px] flex items-center justify-center">
                    <div className="text-center p-8 max-w-md">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">
                            Something went wrong
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 bg-[var(--accent-coral)] text-white rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Error display component for API errors
interface ErrorDisplayProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    showHome?: boolean;
}

export function ErrorDisplay({
    title = 'Error',
    message,
    onRetry,
    showHome = false
}: ErrorDisplayProps) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">❌</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
            <p className="text-red-600 mb-4">{message}</p>
            <div className="flex justify-center gap-3">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                )}
                {showHome && (
                    <Link
                        href="/"
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                        Go Home
                    </Link>
                )}
            </div>
        </div>
    );
}

// Empty state component
interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
            {description && (
                <p className="text-[var(--text-secondary)] mb-4 max-w-md mx-auto">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 bg-[var(--accent-coral)] text-white rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
