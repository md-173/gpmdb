'use client';

/**
 * Skeleton loading components for GPMDB
 */

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gray-200 rounded ${className}`}
        />
    );
}

export function StatsSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="border-b border-[var(--border-gray)]">
            <td className="px-3 py-2"><Skeleton className="h-4 w-12" /></td>
            <td className="px-3 py-2"><Skeleton className="h-4 w-14" /></td>
            <td className="px-3 py-2"><Skeleton className="h-4 w-40" /></td>
            <td className="px-3 py-2"><Skeleton className="h-4 w-12" /></td>
            <td className="px-3 py-2"><Skeleton className="h-4 w-24" /></td>
            <td className="px-3 py-2"><Skeleton className="h-4 w-20" /></td>
            <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
        </tr>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="border border-[var(--border-gray)] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-[var(--dark)] px-3 py-3 flex gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-16 bg-gray-600" />
                ))}
            </div>
            {/* Rows */}
            <table className="w-full">
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function MapSkeleton() {
    return (
        <div className="bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center h-[350px]">
            <div className="text-center">
                <div className="animate-spin text-4xl mb-2">🌍</div>
                <p className="text-[var(--text-secondary)]">Loading map...</p>
            </div>
        </div>
    );
}

export function ChartSkeleton({ height = 250 }: { height?: number }) {
    return (
        <div
            className="bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center"
            style={{ height }}
        >
            <div className="text-center">
                <Skeleton className="h-32 w-32 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-lg border border-[var(--border-gray)] p-4">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
