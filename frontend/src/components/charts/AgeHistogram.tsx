'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface AgeHistogramProps {
    data: Array<{
        loMagAge?: number | null;
        hiMagAge?: number | null;
        lowAge?: number | null;
        highAge?: number | null;
    }>;
    height?: number;
}

// Define geological time periods (in Ma)
const TIME_PERIODS = [
    { name: 'Quaternary', min: 0, max: 2.58, color: '#ffffc8' },
    { name: 'Neogene', min: 2.58, max: 23.03, color: '#fff25e' },
    { name: 'Paleogene', min: 23.03, max: 66, color: '#ffa86e' },
    { name: 'Cretaceous', min: 66, max: 145, color: '#7fc55e' },
    { name: 'Jurassic', min: 145, max: 201.3, color: '#34b2c9' },
    { name: 'Triassic', min: 201.3, max: 251.9, color: '#812b92' },
    { name: 'Permian', min: 251.9, max: 298.9, color: '#f04028' },
    { name: 'Carboniferous', min: 298.9, max: 358.9, color: '#67a599' },
    { name: 'Devonian', min: 358.9, max: 419.2, color: '#cb8c37' },
    { name: 'Silurian', min: 419.2, max: 443.8, color: '#b3e1b6' },
    { name: 'Ordovician', min: 443.8, max: 485.4, color: '#009270' },
    { name: 'Cambrian', min: 485.4, max: 538.8, color: '#7fa056' },
    { name: 'Ediacaran', min: 538.8, max: 635, color: '#fed96a' },
    { name: 'Cryogenian', min: 635, max: 720, color: '#fdb462' },
    { name: 'Tonian', min: 720, max: 1000, color: '#fcab4f' },
    { name: 'Mesoproterozoic', min: 1000, max: 1600, color: '#fdcc8a' },
    { name: 'Paleoproterozoic', min: 1600, max: 2500, color: '#f76e51' },
    { name: 'Archean', min: 2500, max: 4000, color: '#f0a9a4' },
];

// Simplified bins for histogram
const AGE_BINS = [
    { label: '0-100', min: 0, max: 100 },
    { label: '100-250', min: 100, max: 250 },
    { label: '250-500', min: 250, max: 500 },
    { label: '500-1000', min: 500, max: 1000 },
    { label: '1000-1500', min: 1000, max: 1500 },
    { label: '1500-2000', min: 1500, max: 2000 },
    { label: '2000-2500', min: 2000, max: 2500 },
    { label: '2500-3000', min: 2500, max: 3000 },
    { label: '3000+', min: 3000, max: 5000 },
];

function getAgeColor(midAge: number): string {
    const period = TIME_PERIODS.find(p => midAge >= p.min && midAge < p.max);
    return period?.color || '#cc7a60';
}

export default function AgeHistogram({ data, height = 250 }: AgeHistogramProps) {
    // Count data points in each age bin
    const binCounts = AGE_BINS.map(bin => {
        const count = data.filter(d => {
            const age = d.loMagAge ?? d.lowAge ?? null;
            if (age === null) return false;
            return age >= bin.min && age < bin.max;
        }).length;

        const midAge = (bin.min + bin.max) / 2;

        return {
            name: bin.label,
            count,
            midAge,
            color: getAgeColor(midAge),
        };
    });

    // Filter out empty bins at the end
    const lastNonZeroIndex = binCounts.reduce(
        (lastIdx, item, idx) => (item.count > 0 ? idx : lastIdx),
        -1
    );
    const filteredBins = binCounts.slice(0, Math.max(lastNonZeroIndex + 1, 1));

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                No data to display
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <BarChart
                    data={filteredBins}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '12px',
                        }}
                        formatter={(value) => [`${value} results`, 'Count']}
                        labelFormatter={(label) => `Age: ${label} Ma`}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {filteredBins.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
