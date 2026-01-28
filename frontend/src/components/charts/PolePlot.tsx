'use client';

import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ZAxis,
} from 'recharts';

interface PolePlotProps {
    data: Array<{
        pLat?: number | null;
        pLon?: number | null;
        a95?: number | null;
        rockName?: string;
        continent?: string;
    }>;
    height?: number;
    showTooltip?: boolean;
}

// Continent colors
const CONTINENT_COLORS: Record<string, string> = {
    'Africa': '#e41a1c',
    'Antarctica': '#377eb8',
    'Asia': '#4daf4a',
    'Australia': '#984ea3',
    'Europe': '#ff7f00',
    'North America': '#ffff33',
    'South America': '#a65628',
    'Greenland': '#f781bf',
    'Indian Ocean': '#66c2a5',
    'Atlantic Ocean': '#8da0cb',
    'Pacific Ocean': '#e78ac3',
    'Middle East': '#a6d854',
};

function getContinentColor(continent?: string): string {
    if (!continent) return '#cc7a60';
    return CONTINENT_COLORS[continent] || '#cc7a60';
}

export default function PolePlot({ data, height = 300, showTooltip = true }: PolePlotProps) {
    // Filter data points with valid pole positions
    const validPoles = data
        .filter(d => d.pLat !== null && d.pLon !== null && d.pLat !== undefined && d.pLon !== undefined)
        .map((d, idx) => ({
            id: idx,
            pLat: d.pLat!,
            pLon: d.pLon!,
            a95: d.a95 ?? 5,
            rockName: d.rockName || 'Unknown',
            continent: d.continent || 'Unknown',
            color: getContinentColor(d.continent),
        }));

    if (validPoles.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                No pole data to display
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        type="number"
                        dataKey="pLon"
                        name="Longitude"
                        domain={[-180, 180]}
                        tick={{ fontSize: 10 }}
                        label={{ value: 'Pole Longitude (°)', position: 'bottom', offset: 0, fontSize: 11 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="pLat"
                        name="Latitude"
                        domain={[-90, 90]}
                        tick={{ fontSize: 10 }}
                        label={{ value: 'Pole Latitude (°)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <ZAxis type="number" dataKey="a95" range={[30, 150]} name="A95" />
                    {showTooltip && (
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px',
                            }}
                            formatter={(value, name) => {
                                const numValue = typeof value === 'number' ? value : 0;
                                if (name === 'Latitude') return [`${numValue.toFixed(1)}°`, name];
                                if (name === 'Longitude') return [`${numValue.toFixed(1)}°`, name];
                                if (name === 'A95') return [`${numValue.toFixed(1)}°`, name];
                                return [value, name];
                            }}
                            labelFormatter={(label, payload) => {
                                if (payload && payload[0]) {
                                    const point = payload[0].payload;
                                    return `${point.rockName} (${point.continent})`;
                                }
                                return '';
                            }}
                        />
                    )}
                    <Scatter data={validPoles} fill="#cc7a60">
                        {validPoles.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.7} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
