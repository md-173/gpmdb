'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components (they don't work with SSR)
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import('react-leaflet').then((mod) => mod.CircleMarker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

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
}

export default function GpmdbMap({
    points = [],
    center = [0, 0],
    zoom = 2,
    height = '400px',
    onPointClick,
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

    // Dynamically import MapContent (client-side only)
    const MapContent = dynamic(
        () => import('./MapContent'),
        { ssr: false }
    );

    return (
        <div className="relative">
            <div style={{ height }} className="rounded-lg overflow-hidden z-0">
                <MapContent
                    points={points}
                    center={center}
                    zoom={zoom}
                    onPointClick={onPointClick}
                />
            </div>
        </div>
    );
}
