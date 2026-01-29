'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoAzimuthalEqualArea } from 'd3-geo';
import type { PaleomagneticResult, LegacyStereoPoint, StereonetMean } from '@/lib/api';
import { getPlottedMean, getSelectedMeans, getStereonetStats } from '@/lib/api';

type StereoPoint = {
    id: string;
    source: 'db' | 'custom';
    resultNo?: number;
    label: string;
    plat: number;
    plong: number;
    rockName?: string;
    loMagAge?: number | null;
    hiMagAge?: number | null;
    dp?: number | null;
    dm?: number | null;
    a95?: number | null;
    circle?: [number, number][] | null;
};

const WIDTH = 520;
const HEIGHT = 520;
const RADIUS = 240;
const SCALE = 170;

function clampLon(lon: number) {
    return lon > 180 ? lon - 360 : lon;
}

function lowerHemisphereLat(lat: number) {
    return lat <= 0 ? lat : -lat;
}

export default function StereonetPanel({ data }: { data: PaleomagneticResult[] }) {
    const dbPoints: StereoPoint[] = useMemo(() => {
        return data
            .filter((row) => row.pLat !== null && row.pLon !== null)
            .map((row) => ({
                id: `db-${row.resultNo}`,
                source: 'db' as const,
                resultNo: row.resultNo,
                label: row.rockName ? row.rockName : `#${row.resultNo}`,
                plat: row.pLat as number,
                plong: row.pLon as number,
                rockName: row.rockName,
                loMagAge: row.loMagAge ?? null,
                hiMagAge: row.hiMagAge ?? null,
                dp: row.dp ?? null,
                dm: row.dm ?? null,
            }));
    }, [data]);

    const [customPoints, setCustomPoints] = useState<StereoPoint[]>([]);
    const customIdRef = useRef(1);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
    const [colorByAge, setColorByAge] = useState(false);
    const [meanStats, setMeanStats] = useState<StereonetMean | null>(null);
    const [meanCircle, setMeanCircle] = useState<[number, number][] | null>(null);
    const [selectedMean, setSelectedMean] = useState<StereonetMean | null>(null);
    const [selectedMeanCircle, setSelectedMeanCircle] = useState<[number, number][] | null>(null);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [poleSearch, setPoleSearch] = useState('');
    const [customPoint, setCustomPoint] = useState<{ lat: string; lon: string; a95: string }>({
        lat: '',
        lon: '',
        a95: '',
    });

    useEffect(() => {
        setSelectedIds(new Set());
        setHiddenIds(new Set());
        setMeanStats(null);
        setMeanCircle(null);
        setSelectedMean(null);
        setSelectedMeanCircle(null);
        setShowSelectedOnly(false);
        setPoleSearch('');
    }, [data]);

    const allPoints = useMemo(() => [...dbPoints, ...customPoints], [dbPoints, customPoints]);

    const visiblePoints = useMemo(() => {
        const base = allPoints.filter((p) => !hiddenIds.has(p.id));
        if (!showSelectedOnly) return base;
        return base.filter((p) => selectedIds.has(p.id));
    }, [allPoints, hiddenIds, selectedIds, showSelectedOnly]);

    const filteredPoints = useMemo(() => {
        const term = poleSearch.trim().toLowerCase();
        if (!term) return visiblePoints;
        return visiblePoints.filter((p) => p.label.toLowerCase().includes(term));
    }, [visiblePoints, poleSearch]);

    const ageDomain = useMemo(() => {
        const ages = visiblePoints
            .map((p) => p.loMagAge)
            .filter((a): a is number => typeof a === 'number' && Number.isFinite(a));
        if (ages.length === 0) return { min: 0, max: 1 };
        return { min: Math.min(...ages), max: Math.max(...ages) };
    }, [visiblePoints]);

    const projection = useMemo(() => {
        return geoAzimuthalEqualArea()
            .scale(SCALE)
            .translate([WIDTH / 2, HEIGHT / 2])
            .rotate([0, 90, 0]);
    }, []);

    const projectCoord = (lon: number, lat: number) => {
        const adjLon = clampLon(lon);
        const adjLat = lowerHemisphereLat(lat);
        const projected = projection([adjLon, adjLat]);
        return projected ?? [WIDTH / 2, HEIGHT / 2];
    };

    const pointBaseColor = '#111111';

    const pointAgeColor = (point: StereoPoint) => {
        if (point.loMagAge === null || point.loMagAge === undefined) return pointBaseColor;
        const range = ageDomain.max - ageDomain.min || 1;
        const t = (point.loMagAge - ageDomain.min) / range;
        const hue = 260 - 260 * Math.min(Math.max(t, 0), 1);
        return `hsl(${hue}, 70%, 45%)`;
    };

    const circlePath = (coords: [number, number][]) => {
        if (!coords || coords.length === 0) return '';
        const parts = coords.map(([lon, lat], idx) => {
            const [x, y] = projectCoord(lon, lat);
            return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
        });
        return `${parts.join(' ')} Z`;
    };

    const normalizeCoordinates = (coords: unknown): [number, number][] | null => {
        if (!Array.isArray(coords) || coords.length === 0) return null;
        const first = coords[0];
        if (!Array.isArray(first)) return null;
        if (typeof first[0] === 'number') {
            return coords as [number, number][];
        }
        if (Array.isArray(first[0])) {
            return first as [number, number][];
        }
        return null;
    };

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const hidePoint = (id: string) => {
        setHiddenIds((prev) => new Set(prev).add(id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const resetTableState = () => {
        setHiddenIds(new Set());
        setSelectedIds(new Set());
        setShowSelectedOnly(false);
        setPoleSearch('');
        setSelectedMean(null);
        setSelectedMeanCircle(null);
    };

    const buildLegacyPayload = (items: StereoPoint[]): LegacyStereoPoint[] => {
        return items.map((p) => ({
            RESULTNO: p.resultNo,
            PLAT: p.plat,
            PLONG: p.plong,
            ROCKNAME: p.rockName,
            LOMAGAGE: p.loMagAge ?? undefined,
            HIMAGAGE: p.hiMagAge ?? undefined,
            DP: p.dp ?? undefined,
            DM: p.dm ?? undefined,
        }));
    };

    const handleComputeMean = async () => {
        if (visiblePoints.length === 0) return;
        try {
            const response = await getStereonetStats(buildLegacyPayload(visiblePoints));
            setMeanStats(response.calculations);
            const coords = normalizeCoordinates(response.circle?.coordinates);
            setMeanCircle(coords);
        } catch (error) {
            console.error('Failed to compute mean stats', error);
        }
    };

    const handleSelectedMean = async () => {
        const selectedPoints = allPoints.filter(
            (p) => selectedIds.has(p.id) && !hiddenIds.has(p.id)
        );
        if (selectedPoints.length === 0) return;
        try {
            const payload = selectedPoints.reduce<Record<string, LegacyStereoPoint>>((acc, p) => {
                acc[p.id] = {
                    RESULTNO: p.resultNo,
                    PLAT: p.plat,
                    PLONG: p.plong,
                };
                return acc;
            }, {});
            const response = await getSelectedMeans(payload);
            setSelectedMean(response.calculations);
            const circle = normalizeCoordinates(response.circle?.coordinates);
            setSelectedMeanCircle(circle);
        } catch (error) {
            console.error('Failed to compute selected mean', error);
        }
    };

    const handleAddCustom = async () => {
        const lat = Number(customPoint.lat);
        const lon = Number(customPoint.lon);
        const a95 = Number(customPoint.a95);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        const id = `custom-${customIdRef.current++}`;
        let circle: [number, number][] | null = null;
        if (Number.isFinite(a95) && a95 > 0) {
            try {
                const response = await getPlottedMean({ PLAT: lat, PLONG: lon, a95 });
                circle = normalizeCoordinates(response.circle?.coordinates);
            } catch (error) {
                console.error('Failed to plot custom circle', error);
            }
        }

        const point: StereoPoint = {
            id,
            source: 'custom',
            label: `Custom ${customIdRef.current - 1}`,
            plat: lat,
            plong: lon,
            loMagAge: null,
            hiMagAge: null,
            a95: Number.isFinite(a95) ? a95 : null,
            circle,
        };
        setCustomPoints((prev) => [...prev, point]);
        setCustomPoint({ lat: '', lon: '', a95: '' });
    };

    const removeCustom = (id: string) => {
        setCustomPoints((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        setHiddenIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const invertSelection = () => {
        const next = new Set<string>();
        allPoints
            .filter((p) => !hiddenIds.has(p.id))
            .forEach((p) => {
                if (!selectedIds.has(p.id)) {
                    next.add(p.id);
                }
            });
        setSelectedIds(next);
    };

    const meanPoint = meanStats ? projectCoord(meanStats.dec, meanStats.inc) : null;
    const selectedMeanPoint = selectedMean
        ? projectCoord(selectedMean.dec, selectedMean.inc)
        : null;

    const angles = useMemo(() => Array.from({ length: 24 }, (_, i) => i * 15), []);
    const dashOffsets = useMemo(
        () => Array.from({ length: 24 }, (_, i) => -RADIUS + i * 20).filter((v) => v !== 0),
        []
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-[var(--bg-secondary)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-sm font-semibold">Poles</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                            {visiblePoints.length} plotted poles
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setColorByAge((v) => !v)}
                            className="px-3 py-1.5 text-xs rounded-md border border-[var(--border-gray)] bg-white hover:bg-gray-50"
                        >
                            {colorByAge ? 'Color: Age' : 'Color: Hemisphere'}
                        </button>
                    </div>
                </div>

                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="w-full h-auto"
                    role="img"
                    aria-label="Stereonet plot"
                >
                    <circle
                        cx={WIDTH / 2}
                        cy={HEIGHT / 2}
                        r={RADIUS}
                        fill="none"
                        stroke="black"
                        strokeWidth={2}
                    />

                    {angles.map((angle) => {
                        const rad = (angle * Math.PI) / 180;
                        const x1 = WIDTH / 2 + (RADIUS - 10) * Math.cos(rad);
                        const y1 = HEIGHT / 2 + (RADIUS - 10) * Math.sin(rad);
                        const x2 = WIDTH / 2 + RADIUS * Math.cos(rad);
                        const y2 = HEIGHT / 2 + RADIUS * Math.sin(rad);
                        return (
                            <line
                                key={`tick-${angle}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="black"
                                strokeWidth={2}
                            />
                        );
                    })}

                    <line
                        x1={WIDTH / 2 - 10}
                        y1={HEIGHT / 2}
                        x2={WIDTH / 2 + 10}
                        y2={HEIGHT / 2}
                        stroke="black"
                        strokeWidth={2}
                    />
                    <line
                        x1={WIDTH / 2}
                        y1={HEIGHT / 2 - 10}
                        x2={WIDTH / 2}
                        y2={HEIGHT / 2 + 10}
                        stroke="black"
                        strokeWidth={2}
                    />

                    {dashOffsets.map((offset) => (
                        <line
                            key={`x-dash-${offset}`}
                            x1={WIDTH / 2 + offset}
                            y1={HEIGHT / 2 - 5}
                            x2={WIDTH / 2 + offset}
                            y2={HEIGHT / 2 + 5}
                            stroke="black"
                            strokeWidth={1}
                        />
                    ))}
                    {dashOffsets.map((offset) => (
                        <line
                            key={`y-dash-${offset}`}
                            x1={WIDTH / 2 - 5}
                            y1={HEIGHT / 2 + offset}
                            x2={WIDTH / 2 + 5}
                            y2={HEIGHT / 2 + offset}
                            stroke="black"
                            strokeWidth={1}
                        />
                    ))}

                    {meanCircle && (
                        <path
                            d={circlePath(meanCircle)}
                            fill="none"
                            stroke="#111827"
                            strokeWidth={2}
                            opacity={0.7}
                        />
                    )}

                    {selectedMeanCircle && (
                        <path
                            d={circlePath(selectedMeanCircle)}
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth={2}
                            opacity={0.85}
                        />
                    )}

                    {visiblePoints
                        .filter((point) => point.circle && point.source === 'custom')
                        .map((point) => (
                            <path
                                key={`circle-${point.id}`}
                                d={circlePath(point.circle as [number, number][])}
                                fill="none"
                                stroke="#9333ea"
                                strokeWidth={1.5}
                                opacity={0.85}
                            />
                        ))}

                    {visiblePoints.map((point) => {
                        const [x, y] = projectCoord(point.plong, point.plat);
                        const isSelected = selectedIds.has(point.id);
                        const baseColor = colorByAge ? pointAgeColor(point) : pointBaseColor;
                        const pointColor = isSelected ? '#ef4444' : baseColor;
                        return (
                            <circle
                                key={point.id}
                                cx={x}
                                cy={y}
                                r={4}
                                fill={pointColor}
                                stroke={pointColor}
                                strokeWidth={isSelected ? 2 : 1.5}
                                onClick={() => toggleSelected(point.id)}
                            >
                                <title>
                                    {`Lat: ${point.plat}, Lon: ${point.plong}${
                                        point.rockName ? ` | ${point.rockName}` : ''
                                    }`}
                                </title>
                            </circle>
                        );
                    })}

                    {meanPoint && (
                        <circle
                            cx={meanPoint[0]}
                            cy={meanPoint[1]}
                            r={5}
                            fill="#ef4444"
                            stroke="#111827"
                            strokeWidth={2}
                        >
                            <title>
                                {`Mean Lat: ${meanStats?.inc.toFixed(2)}, Mean Lon: ${meanStats?.dec.toFixed(2)}`}
                            </title>
                        </circle>
                    )}

                    {selectedMeanPoint && (
                        <circle
                            cx={selectedMeanPoint[0]}
                            cy={selectedMeanPoint[1]}
                            r={5}
                            fill="#0ea5e9"
                            stroke="#111827"
                            strokeWidth={2}
                        >
                            <title>
                                {`Selected Mean Lat: ${selectedMean?.inc.toFixed(2)}, Lon: ${selectedMean?.dec.toFixed(2)}`}
                            </title>
                        </circle>
                    )}

                </svg>
            </div>

            <div className="bg-white rounded-lg border border-[var(--border-gray)] p-4 space-y-4">

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Selected Mean</div>
                        <button
                            onClick={handleSelectedMean}
                            className="px-2 py-1 text-xs rounded-md border border-[var(--border-gray)] hover:bg-gray-50"
                        >
                            Compute
                        </button>
                    </div>
                    {selectedMean ? (
                        <div className="text-xs text-[var(--text-secondary)] space-y-1">
                            <div>Dec: {selectedMean.dec.toFixed(2)}</div>
                            <div>Inc: {selectedMean.inc.toFixed(2)}</div>
                            <div>N: {selectedMean.n}</div>
                            <div>α95: {selectedMean.alpha95.toFixed(2)}</div>
                        </div>
                    ) : null}
                </div>

                <div>
                    <div className="text-sm font-semibold mb-2">Plot Your Own Data</div>
                    <div className="text-xs text-[var(--text-secondary)] mb-2">
                        Add multiple poles and include them in the mean with database poles.
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <input
                            type="number"
                            step="any"
                            placeholder="Lat"
                            value={customPoint.lat}
                            onChange={(e) => setCustomPoint({ ...customPoint, lat: e.target.value })}
                            className="px-2 py-1 border border-[var(--border-gray)] rounded-md text-xs"
                        />
                        <input
                            type="number"
                            step="any"
                            placeholder="Lon"
                            value={customPoint.lon}
                            onChange={(e) => setCustomPoint({ ...customPoint, lon: e.target.value })}
                            className="px-2 py-1 border border-[var(--border-gray)] rounded-md text-xs"
                        />
                        <input
                            type="number"
                            step="any"
                            placeholder="A95"
                            value={customPoint.a95}
                            onChange={(e) => setCustomPoint({ ...customPoint, a95: e.target.value })}
                            className="px-2 py-1 border border-[var(--border-gray)] rounded-md text-xs"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddCustom}
                            className="px-3 py-1.5 text-xs rounded-md bg-[var(--accent-blue)] text-white hover:bg-blue-700"
                        >
                            Add Pole
                        </button>
                        <button
                            onClick={() => setCustomPoint({ lat: '', lon: '', a95: '' })}
                            className="px-3 py-1.5 text-xs rounded-md border border-[var(--border-gray)] hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {customPoints.length > 0 && (
                    <div>
                        <div className="text-sm font-semibold mb-2">User-Added Poles</div>
                        <div className="max-h-40 overflow-auto border border-[var(--border-gray)] rounded-md">
                            <table className="w-full text-xs">
                                <thead className="bg-[var(--bg-secondary)]">
                                    <tr>
                                        <th className="text-left px-2 py-1">Select</th>
                                        <th className="text-left px-2 py-1">Lat</th>
                                        <th className="text-left px-2 py-1">Lon</th>
                                        <th className="text-left px-2 py-1">A95</th>
                                        <th className="text-left px-2 py-1">Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customPoints.map((point) => (
                                        <tr key={`custom-${point.id}`} className="border-t border-[var(--border-gray)]">
                                            <td className="px-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(point.id)}
                                                    onChange={() => toggleSelected(point.id)}
                                                />
                                            </td>
                                            <td className="px-2 py-1">{point.plat.toFixed(2)}</td>
                                            <td className="px-2 py-1">{point.plong.toFixed(2)}</td>
                                            <td className="px-2 py-1">
                                                {point.a95 ?? '-'}
                                            </td>
                                            <td className="px-2 py-1">
                                                <button
                                                    onClick={() => removeCustom(point.id)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Poles</div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const next = new Set<string>();
                                    allPoints
                                        .filter((p) => !hiddenIds.has(p.id))
                                        .forEach((p) => next.add(p.id));
                                    setSelectedIds(next);
                                }}
                                className="px-2 py-1 text-xs rounded-md border border-[var(--border-gray)] hover:bg-gray-50"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setShowSelectedOnly((v) => !v)}
                                className="px-2 py-1 text-xs rounded-md border border-[var(--border-gray)] hover:bg-gray-50"
                            >
                                {showSelectedOnly ? 'Show All' : 'Show Selected'}
                            </button>
                            <button
                                onClick={invertSelection}
                                className="px-2 py-1 text-xs rounded-md border border-[var(--border-gray)] hover:bg-gray-50"
                            >
                                Invert
                            </button>
                            <button
                                onClick={resetTableState}
                                className="px-2 py-1 text-xs rounded-md border border-[var(--border-gray)] hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                    <div className="max-h-64 overflow-auto border border-[var(--border-gray)] rounded-md">
                        <table className="w-full text-xs">
                            <thead className="bg-[var(--bg-secondary)]">
                                <tr>
                                    <th className="text-left px-2 py-1">Select</th>
                                    <th className="text-left px-2 py-1">Rock</th>
                                    <th className="text-left px-2 py-1">Lo/Hi</th>
                                    <th className="text-left px-2 py-1">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-[var(--border-gray)]">
                                    <td className="px-2 py-2" colSpan={4}>
                                        <input
                                            type="text"
                                            value={poleSearch}
                                            onChange={(e) => setPoleSearch(e.target.value)}
                                            placeholder="Search rock name..."
                                            className="w-full px-2 py-1 border border-[var(--border-gray)] rounded-md text-xs"
                                        />
                                    </td>
                                </tr>
                                {filteredPoints.map((point) => (
                                    <tr key={`row-${point.id}`} className="border-t border-[var(--border-gray)]">
                                        <td className="px-2 py-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(point.id)}
                                                onChange={() => toggleSelected(point.id)}
                                            />
                                        </td>
                                        <td className="px-2 py-1">
                                            {point.label}
                                        </td>
                                        <td className="px-2 py-1">
                                            {point.loMagAge ?? '-'} / {point.hiMagAge ?? '-'}
                                        </td>
                                        <td className="px-2 py-1">
                                            {point.source === 'custom' ? (
                                                <button
                                                    onClick={() => removeCustom(point.id)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => hidePoint(point.id)}
                                                    className="text-[var(--accent-coral)] hover:underline"
                                                >
                                                    Hide
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredPoints.length === 0 && (
                                    <tr>
                                        <td className="px-2 py-3 text-center text-[var(--text-secondary)]" colSpan={4}>
                                            No plot-ready poles.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
