'use client';

import { useEffect, useState } from 'react';
import MapContent from './MapContent';

export interface MapPoint {
    id: number | string;
    lat: number;
    lon: number;
    label?: string;
    rockName?: string;
    age?: string;
    continent?: string;
}

interface GpmdbMapProps {
    points?: MapPoint[];
    center?: [number, number];
    zoom?: number;
    height?: string;
    onPointClick?: (point: MapPoint) => void;
    enableDraw?: boolean;
}

export default function GpmdbMap({
    points = [],
    center = [0, 0],
    zoom = 2,
    height = '400px',
    onPointClick,
    enableDraw = false,
}: GpmdbMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        // Show loading placeholder during SSR
        return (
            <div
                className="bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)]"
                style={{ height }}
            >
                <div className="text-center">
                    <div className="text-2xl mb-2">🗺️</div>
                    <p>Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div style={{ height }} className="rounded-lg overflow-hidden z-0">
                <MapContent
                    points={points}
                    center={center}
                    zoom={zoom}
                    onPointClick={onPointClick}
                    enableDraw={enableDraw}
                />
            </div>
        </div>
    );
}
