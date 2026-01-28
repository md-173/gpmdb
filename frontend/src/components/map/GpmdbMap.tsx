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

    return (
        <div style={{ height }} className="rounded-lg overflow-hidden">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render data points */}
                {points.map((point) => (
                    <CircleMarker
                        key={point.id}
                        center={[point.lat, point.lon]}
                        radius={6}
                        pathOptions={{
                            color: '#cc7a60',
                            fillColor: '#cc7a60',
                            fillOpacity: 0.7,
                            weight: 1,
                        }}
                        eventHandlers={{
                            click: () => onPointClick?.(point),
                        }}
                    >
                        <Popup>
                            <div className="text-sm">
                                {point.label && (
                                    <div className="font-semibold">{point.label}</div>
                                )}
                                {point.rockName && (
                                    <div><strong>Rock:</strong> {point.rockName}</div>
                                )}
                                {point.age && (
                                    <div><strong>Age:</strong> {point.age} Ma</div>
                                )}
                                {point.continent && (
                                    <div><strong>Continent:</strong> {point.continent}</div>
                                )}
                                <div className="text-xs text-gray-500">
                                    {point.lat.toFixed(2)}°, {point.lon.toFixed(2)}°
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}
