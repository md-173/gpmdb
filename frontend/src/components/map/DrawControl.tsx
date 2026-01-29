'use client';

import { useEffect, useRef } from 'react';
import { useControl, useMap } from 'react-map-gl';
import maplibregl from 'maplibre-gl';

interface DrawControlProps {
    onCreated?: (polygon: [number, number][]) => void;
}

export default function DrawControl({ onCreated }: DrawControlProps) {
    const { current: mapRef } = useMap();
    const isApplyingRef = useRef(false);
    const draw = useControl(
        () => {
            if (typeof window !== 'undefined' && !(window as any).mapboxgl) {
                (window as any).mapboxgl = maplibregl;
            }
            const MapboxDrawModule = require('@mapbox/mapbox-gl-draw');
            const DrawClass = MapboxDrawModule.default ?? MapboxDrawModule;
            return new DrawClass({
                displayControlsDefault: false,
                controls: {
                    polygon: true,
                    trash: true,
                },
                styles: [
                    // Polygon fill
                    {
                        id: 'gl-draw-polygon-fill',
                        type: 'fill',
                        filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                        paint: {
                            'fill-color': '#b35c44',
                            'fill-opacity': 0.5,
                        },
                    },
                    // Polygon outline
                    {
                        id: 'gl-draw-polygon-stroke-active',
                        type: 'line',
                        filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round',
                        },
                        paint: {
                            'line-color': '#9c4b36',
                            'line-width': 3,
                        },
                    },
                    // Vertex points
                    {
                        id: 'gl-draw-vertex',
                        type: 'circle',
                        filter: ['all', ['==', 'meta', 'vertex'], ['!=', 'mode', 'static']],
                        paint: {
                            'circle-radius': 4.5,
                            'circle-color': '#d3765b',
                            'circle-stroke-color': '#6d3426',
                            'circle-stroke-width': 1.25,
                        },
                    },
                    // Active vertex
                    {
                        id: 'gl-draw-vertex-active',
                        type: 'circle',
                        filter: ['all', ['==', 'meta', 'vertex'], ['==', 'active', 'true']],
                        paint: {
                            'circle-radius': 5.5,
                            'circle-color': '#ffb08a',
                            'circle-stroke-color': '#6d3426',
                            'circle-stroke-width': 1.25,
                        },
                    },
                ],
            });
        },
        { position: 'top-right' }
    );

    useEffect(() => {
        const map = mapRef?.getMap?.();
        if (!map) return;

        const handleCreate = (event: { features: Array<{ geometry: { coordinates: number[][][] } }> }) => {
            if (isApplyingRef.current) return;
            const feature = event.features?.[0];
            if (!feature) return;

            const coords = feature.geometry.coordinates?.[0];
            if (!coords) return;

            isApplyingRef.current = true;
            const featureId = (feature as any).id;
            if (featureId) {
                draw.changeMode('direct_select', { featureId });
            }

            const polygon = coords.map(([lng, lat]) => [lng, lat] as [number, number]);
            if (onCreated) {
                onCreated(polygon);
            }
            const customEvent = new CustomEvent('gpmdb:polygon-search', { detail: polygon });
            window.dispatchEvent(customEvent);

            window.setTimeout(() => {
                isApplyingRef.current = false;
            }, 0);
        };

        map.on('draw.create', handleCreate as any);
        map.on('draw.update', handleCreate as any);

        const handleClear = () => {
            draw.deleteAll();
            draw.changeMode('simple_select');
        };
        window.addEventListener('gpmdb:polygon-clear', handleClear);
        return () => {
            map.off('draw.create', handleCreate as any);
            map.off('draw.update', handleCreate as any);
            window.removeEventListener('gpmdb:polygon-clear', handleClear);
        };
    }, [draw, onCreated, mapRef]);

    return null;
}
