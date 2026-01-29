import axios from 'axios';

// Base API URL - Django backend via Docker (Apache on port 8080)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Create axios instance with default config
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const legacyApi = axios.create({
    baseURL: API_ROOT_URL,
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
    limit?: number | string;
    offset?: number | string;
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

export interface ContributionPayload {
    doi: string;
    email: string;
    comments?: string;
    age?: number;
    lat?: number;
    lon?: number;
    [key: string]: string | number | undefined;
}

export interface LegacyStereoPoint {
    PLAT: number;
    PLONG: number;
    RESULTNO: number;
    ROCKNAME?: string;
    LOMAGAGE?: number | null;
    HIMAGAGE?: number | null;
    DP?: number | null;
    DM?: number | null;
}

export interface StereonetMean {
    dec: number;
    inc: number;
    n: number;
    r: number;
    alpha95: number;
    csd: number;
}

export interface StereonetStatsResponse {
    calculations: StereonetMean;
    circle?: { coordinates: number[][][] };
    pointcircle?: Record<string, { coordinates: number[][][] }>;
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
            if (value === undefined || value === null) return;
            const stringValue = typeof value === 'string' ? value.trim() : String(value);
            if (stringValue === '') return;
            queryParams.append(key, stringValue);
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
export async function submitContribution(
    data: ContributionPayload
): Promise<{ success: boolean; message: string }> {
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

/**
 * Search data within a polygon
 */
export async function searchPolygon(polygon: [number, number][]): Promise<SearchResponse> {
    try {
        const polygonStr = JSON.stringify(polygon);
        const response = await api.get<SearchResponse>(`/search/polygon/?polygon=${encodeURIComponent(polygonStr)}`);
        return response.data;
    } catch (error) {
        console.error('Failed to search polygon:', error);
        throw error;
    }
}

/**
 * Search data by result numbers (POST to avoid long URLs).
 */
export async function searchByResultNos(resultNos: Array<number | string>): Promise<SearchResponse> {
    try {
        const payload = {
            resultNos: resultNos
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value)),
        };
        const response = await api.post<SearchResponse>('/search/resultnos/', payload);
        return response.data;
    } catch (error) {
        console.error('Failed to search by resultNos:', error);
        throw error;
    }
}

// Auth Types
export interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    isStaff: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
}

/**
 * Login
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
    try {
        const response = await api.post<AuthResponse>('/auth/login/', { username, password });
        // Set token in header for future requests
        if (response.data.token) {
            api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
            // Store in localStorage if in browser
            if (typeof window !== 'undefined') {
                localStorage.setItem('gpmdb_token', response.data.token);
            }
        }
        return response.data;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout/');
        delete api.defaults.headers.common['Authorization'];
        if (typeof window !== 'undefined') {
            localStorage.removeItem('gpmdb_token');
        }
    } catch (error) {
        console.error('Logout failed:', error);
        // Clean up anyway
        delete api.defaults.headers.common['Authorization'];
        if (typeof window !== 'undefined') {
            localStorage.removeItem('gpmdb_token');
        }
    }
}

/**
 * Get current user
 */
export async function getUser(): Promise<User> {
    try {
        // Restore token if exists
        if (typeof window !== 'undefined' && !api.defaults.headers.common['Authorization']) {
            const token = localStorage.getItem('gpmdb_token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Token ${token}`;
            }
        }

        const response = await api.get<User>('/auth/user/');
        return response.data;
    } catch (error) {
        // If 401, clear token
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            delete api.defaults.headers.common['Authorization'];
            if (typeof window !== 'undefined') {
                localStorage.removeItem('gpmdb_token');
            }
        }
        throw error;
    }
}

/**
 * Stereonet stats for a list of points (legacy endpoint).
 */
export async function getStereonetStats(
    data: LegacyStereoPoint[]
): Promise<StereonetStatsResponse> {
    const response = await api.post('/stereonet/stats/', { data });
    return response.data;
}

/**
 * Mean of selected points (legacy endpoint expects object map).
 */
export async function getSelectedMeans(
    data: Record<string, LegacyStereoPoint>
): Promise<{ calculations: StereonetMean; circle?: { coordinates: number[][][] } }> {
    const response = await api.post('/stereonet/selected-means/', { data });
    return response.data;
}

/**
 * Circle for a custom plotted point (legacy endpoint).
 */
export async function getPlottedMean(data: {
    PLAT: number;
    PLONG: number;
    a95: number;
}): Promise<{ circle?: { coordinates: number[][][] } }> {
    const response = await api.post('/stereonet/plotted-mean/', { data });
    return response.data;
}
