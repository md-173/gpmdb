'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import DrawControl from './DrawControl';
import { MapPoint } from './GpmdbMap';
import 'leaflet/dist/leaflet.css';

interface MapContentProps {
    points: MapPoint[];
    center: [number, number];
    zoom: number;
    onPointClick?: (point: MapPoint) => void;
}

export default function MapContent({
    points,
    center,
    zoom,
    onPointClick,
}: MapContentProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite (Esri)">
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Dark Matter (CartoDB)">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            {/* Draw Control Toggle */}
            {onPointClick && (
                <DrawControl onCreated={(polygon) => {
                    console.log('Polygon created:', polygon);
                    const event = new CustomEvent('gpmdb:polygon-search', { detail: polygon });
                    window.dispatchEvent(event);
                }} />
            )}

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
    );
}
