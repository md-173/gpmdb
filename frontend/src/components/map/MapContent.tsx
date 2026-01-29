'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Map, { Layer, Popup, Source, type LayerProps } from 'react-map-gl';
import maplibregl, { type MapLayerMouseEvent } from 'maplibre-gl';
import { MapPoint } from './GpmdbMap';
import DrawControl from './DrawControl';

interface MapContentProps {
    points: MapPoint[];
    center: [number, number];
    zoom: number;
    onPointClick?: (point: MapPoint) => void;
    enableDraw?: boolean;
}

const pointLayer: LayerProps = {
    id: 'points',
    type: 'circle',
    paint: {
        'circle-radius': 5,
        'circle-color': [
            'case',
            ['==', ['get', 'selected'], true],
            '#ef4444',
            '#cc7a60',
        ],
        'circle-stroke-color': [
            'case',
            ['==', ['get', 'selected'], true],
            '#ef4444',
            '#111827',
        ],
        'circle-stroke-width': [
            'case',
            ['==', ['get', 'selected'], true],
            2.5,
            1.5,
        ],
        'circle-opacity': 0.9,
    },
};

const OSM_STYLE = {
    version: 8 as const,
    sources: {
        osm: {
            type: 'raster' as const,
            tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
        },
    },
    layers: [
        {
            id: 'osm',
            type: 'raster' as const,
            source: 'osm',
        },
    ],
};

const SATELLITE_STYLE = {
    version: 8 as const,
    sources: {
        esri: {
            type: 'raster' as const,
            tiles: [
                'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        },
    },
    layers: [
        {
            id: 'esri-imagery',
            type: 'raster' as const,
            source: 'esri',
        },
    ],
};

if (typeof window !== 'undefined') {
    (window as any).mapboxgl = maplibregl;
}

export default function MapContent({
    points,
    center,
    zoom,
    onPointClick,
    enableDraw = false,
}: MapContentProps) {
    const [popupInfo, setPopupInfo] = useState<MapPoint | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [lastPolygon, setLastPolygon] = useState<[number, number][] | null>(null);
    const [basemap, setBasemap] = useState<'streets' | 'satellite'>('satellite');

    const geojson = useMemo(() => {
        return {
            type: 'FeatureCollection',
            features: points.map((point) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [point.lon, point.lat],
                },
                properties: {
                    id: point.id,
                    lat: point.lat,
                    lon: point.lon,
                    label: point.label ?? '',
                    rockName: point.rockName ?? '',
                    age: point.age ?? '',
                    continent: point.continent ?? '',
                    selected: selectedIds.has(String(point.id)),
                },
            })),
        };
    }, [points, selectedIds]);

    const isPointInPolygon = (lon: number, lat: number, polygon: [number, number][]) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0];
            const yi = polygon[i][1];
            const xj = polygon[j][0];
            const yj = polygon[j][1];

            const intersect =
                yi > lat !== yj > lat &&
                lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    };

    useEffect(() => {
        if (!lastPolygon) return;
        const next = new Set<string>();
        points.forEach((point) => {
            if (isPointInPolygon(point.lon, point.lat, lastPolygon)) {
                next.add(String(point.id));
            }
        });
        setSelectedIds(next);
    }, [points, lastPolygon]);

    const handleClick = useCallback(
        (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            if (!feature || feature.layer.id !== 'points') {
                setPopupInfo(null);
                return;
            }

            const props = feature.properties || {};
            const point: MapPoint = {
                id: props.id ?? feature.id ?? '',
                lat: Number(props.lat),
                lon: Number(props.lon),
                label: props.label || undefined,
                rockName: props.rockName || undefined,
                age: props.age || undefined,
                continent: props.continent || undefined,
            };
            setPopupInfo(point);
            onPointClick?.(point);
        },
        [onPointClick]
    );

    useEffect(() => {
        const handlePolygonSearch = (event: Event) => {
            const customEvent = event as CustomEvent<[number, number][]>;
            if (customEvent.detail) {
                setLastPolygon(customEvent.detail);
            }
        };
        const handlePolygonClear = () => {
            setLastPolygon(null);
            setSelectedIds(new Set());
        };
        window.addEventListener('gpmdb:polygon-search', handlePolygonSearch);
        window.addEventListener('gpmdb:polygon-clear', handlePolygonClear);
        return () => {
            window.removeEventListener('gpmdb:polygon-search', handlePolygonSearch);
            window.removeEventListener('gpmdb:polygon-clear', handlePolygonClear);
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            <Map
                mapLib={maplibregl}
                initialViewState={{ longitude: center[1], latitude: center[0], zoom }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={basemap === 'satellite' ? SATELLITE_STYLE : OSM_STYLE}
                interactiveLayerIds={['points']}
                onClick={handleClick}
                cursor="default"
                reuseMaps={true}
            >
                {enableDraw && <DrawControl />}

                <Source id="points" type="geojson" data={geojson}>
                    <Layer {...pointLayer} />
                </Source>

                {popupInfo && (
                    <Popup
                        longitude={popupInfo.lon}
                        latitude={popupInfo.lat}
                        onClose={() => setPopupInfo(null)}
                        closeButton
                        closeOnClick={false}
                        anchor="top"
                    >
                        <div className="text-sm">
                            {popupInfo.label && (
                                <div className="font-semibold">{popupInfo.label}</div>
                            )}
                            {popupInfo.rockName && (
                                <div><strong>Rock:</strong> {popupInfo.rockName}</div>
                            )}
                            {popupInfo.age && (
                                <div><strong>Age:</strong> {popupInfo.age} Ma</div>
                            )}
                            {popupInfo.continent && (
                                <div><strong>Continent:</strong> {popupInfo.continent}</div>
                            )}
                            <div className="text-xs text-gray-500">
                                {popupInfo.lat.toFixed(2)}°, {popupInfo.lon.toFixed(2)}°
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            <div className="absolute left-3 top-3 z-10 flex items-center gap-2 pointer-events-auto">
                <button
                    onClick={() => setBasemap('streets')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                        basemap === 'streets'
                            ? 'bg-[var(--accent-coral)] text-white border-[var(--accent-coral)]'
                            : 'bg-white text-[var(--text-primary)] border-[var(--border-gray)]'
                    }`}
                >
                    Streets
                </button>
                <button
                    onClick={() => setBasemap('satellite')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                        basemap === 'satellite'
                            ? 'bg-[var(--accent-coral)] text-white border-[var(--accent-coral)]'
                            : 'bg-white text-[var(--text-primary)] border-[var(--border-gray)]'
                    }`}
                >
                    Satellite
                </button>
            </div>
        </div>
    );
}
