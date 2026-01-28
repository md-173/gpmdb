'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

interface DrawControlProps {
    onCreated: (polygon: [number, number][]) => void;
}

export default function DrawControl({ onCreated }: DrawControlProps) {
    const map = useMap();
    const drawControlRef = useRef<L.Control.Draw | null>(null);

    useEffect(() => {
        if (!map) return;

        // Initialize feature group for drawn items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Initialize draw control
        const drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                },
                polyline: false,
                rectangle: {},
                circle: false,
                marker: false,
                circlemarker: false,
            },
            edit: {
                featureGroup: drawnItems,
                remove: true,
            },
        });

        map.addControl(drawControl);
        drawControlRef.current = drawControl;

        // Event handlers
        const onDrawCreated = (e: any) => {
            const layer = e.layer;
            drawnItems.clearLayers(); // Only allow one polygon at a time
            drawnItems.addLayer(layer);

            // Extract coordinates
            if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                const latlngs = layer.getLatLngs()[0] as L.LatLng[];
                const coords = latlngs.map((ll) => [ll.lng, ll.lat] as [number, number]);
                // Close the loop
                coords.push(coords[0]);
                onCreated(coords);
            }
        };

        map.on(L.Draw.Event.CREATED, onDrawCreated);

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, onDrawCreated);
            map.removeLayer(drawnItems);
        };
    }, [map, onCreated]);

    return null;
}
