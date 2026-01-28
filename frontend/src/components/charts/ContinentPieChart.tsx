'use client';

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';

interface ContinentPieChartProps {
    data: Array<{
        continent?: string;
    }>;
    height?: number;
}

// Continent colors (same as PolePlot for consistency)
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
    'Unknown': '#999999',
};

export default function ContinentPieChart({ data, height = 250 }: ContinentPieChartProps) {
    // Count by continent
    const continentCounts: Record<string, number> = {};
    data.forEach(d => {
        const continent = d.continent || 'Unknown';
        continentCounts[continent] = (continentCounts[continent] || 0) + 1;
    });

    const chartData = Object.entries(continentCounts)
        .map(([name, value]) => ({
            name,
            value,
            color: CONTINENT_COLORS[name] || '#999999',
        }))
        .sort((a, b) => b.value - a.value);

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
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => {
                            const p = typeof percent === 'number' ? percent : 0;
                            const n = name ?? '';
                            return p > 0.05 ? `${n} (${(p * 100).toFixed(0)}%)` : '';
                        }}
                        labelLine={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '12px',
                        }}
                        formatter={(value) => [`${value} results`, 'Count']}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
