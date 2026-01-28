import axios from 'axios';

// Base API URL - Django backend via Docker (Apache on port 8080)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// API Types
export interface DatabaseStats {
    poles: number;
    rockUnits: number;
    references: number;
}

export interface SearchParams {
    continent?: string;
    rocktype?: string;
    'rockage-min'?: string;
    'rockage-max'?: string;
    'magage-min'?: string;
    'magage-max'?: string;
    rockname?: string;
    refno?: string;
    resultno?: string;
    'lat-min'?: string;
    'lat-max'?: string;
    'lon-min'?: string;
    'lon-max'?: string;
    'qsum-min'?: string;
    'rsum-min'?: string;
    'k-min'?: string;
    'k-max'?: string;
    'a95-max'?: string;
    'b-min'?: string;
    'n-min'?: string;
}

export interface PaleomagneticResult {
    refNo: number;
    resultNo: number;
    rockName: string;
    year: number;
    authors: string;
    journal: string;
    volume: string;
    pages: string;
    continent: string;
    rockType: string;
    lowAge: number;
    highAge: number;
    loMagAge: number;
    hiMagAge: number;
    sLat: number | null;
    sLon: number | null;
    pLat: number | null;
    pLon: number | null;
    dp: number | null;
    dm: number | null;
    qsum: number;
    rsum: number;
    k: number | null;
    a95: number | null;
    b: number | null;
    n: number | null;
}

export interface SearchResponse {
    columns: string[];
    data: PaleomagneticResult[];
    count: number;
}

export interface Reference {
    refNo: number;
    authors: string;
    year: number;
    title: string;
    journal: string;
    volume: string;
    pages: string;
}

// API Functions

/**
 * Get database statistics
 */
export async function getStats(): Promise<DatabaseStats> {
    try {
        const response = await api.get<DatabaseStats>('/stats/');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Return placeholder data if API fails
        return {
            poles: 0,
            rockUnits: 0,
            references: 0,
        };
    }
}

/**
 * Search paleomagnetic data
 */
export async function searchData(params: SearchParams): Promise<SearchResponse> {
    try {
        // Convert params to query string, filtering out empty values
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                queryParams.append(key, value);
            }
        });

        const response = await api.get<SearchResponse>(`/search/?${queryParams.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Failed to search:', error);
        throw error;
    }
}

/**
 * Get references with optional filtering
 */
export async function getReferences(params?: {
    limit?: number;
    offset?: number;
    year?: number;
    author?: string;
}): Promise<{ data: Reference[]; count: number }> {
    try {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, String(value));
                }
            });
        }

        const response = await api.get(`/references/?${queryParams.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch references:', error);
        throw error;
    }
}

/**
 * Get list of continents
 */
export async function getContinents(): Promise<string[]> {
    try {
        const response = await api.get<{ continents: string[] }>('/continents/');
        return response.data.continents;
    } catch (error) {
        console.error('Failed to fetch continents:', error);
        // Return default list if API fails
        return [
            'Africa',
            'Antarctica',
            'Asia',
            'Atlantic Ocean',
            'Australia',
            'Europe',
            'Greenland',
            'Indian Ocean',
            'Middle East',
            'North America',
            'Pacific Ocean',
            'South America',
        ];
    }
}

/**
 * Get list of rock types
 */
export async function getRockTypes(): Promise<string[]> {
    try {
        const response = await api.get<{ rockTypes: string[] }>('/rocktypes/');
        return response.data.rockTypes;
    } catch (error) {
        console.error('Failed to fetch rock types:', error);
        // Return default list if API fails
        return [
            'extrusives',
            'intrusives',
            'sediments',
            'limestones',
            'metamorphics',
        ];
    }
}

/**
 * Submit data contribution
 */
export async function submitContribution(data: {
    doi: string;
    email: string;
    comments?: string;
    age?: number;
    lat?: number;
    lon?: number;
}): Promise<{ success: boolean; message: string }> {
    try {
        const response = await api.post('/contribution/', data);
        return response.data;
    } catch (error) {
        console.error('Failed to submit contribution:', error);
        throw error;
    }
}

/**
 * Export search results to CSV
 */
export function exportToCSV(data: PaleomagneticResult[], filename: string = 'gpmdb_export.csv') {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Define column order and headers
    const headers = [
        'RefNo', 'ResultNo', 'RockName', 'Year', 'Authors', 'Journal', 'Volume', 'Pages',
        'Continent', 'RockType', 'LowAge', 'HighAge', 'LoMagAge', 'HiMagAge',
        'SLat', 'SLon', 'PLat', 'PLon', 'DP', 'DM', 'QSUM', 'RSUM', 'K', 'A95', 'B', 'N'
    ];

    const keys: (keyof PaleomagneticResult)[] = [
        'refNo', 'resultNo', 'rockName', 'year', 'authors', 'journal', 'volume', 'pages',
        'continent', 'rockType', 'lowAge', 'highAge', 'loMagAge', 'hiMagAge',
        'sLat', 'sLon', 'pLat', 'pLon', 'dp', 'dm', 'qsum', 'rsum', 'k', 'a95', 'b', 'n'
    ];

    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            keys.map(key => {
                const value = row[key];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
