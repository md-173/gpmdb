import axios from 'axios';

// Base API URL - will point to Django backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    rockType?: string;
    rockAgeMin?: number;
    rockAgeMax?: number;
    magAgeMin?: number;
    magAgeMax?: number;
    rockName?: string;
    refNo?: number;
    resultNo?: number;
    minLat?: number;
    maxLat?: number;
    minLon?: number;
    maxLon?: number;
    minQsum?: number;
    minRsum?: number;
    minK?: number;
    maxK?: number;
    maxA95?: number;
    minB?: number;
    minN?: number;
}

export interface PaleomagneticResult {
    resultNo: number;
    refNo: number;
    rockUnit: string;
    continent: string;
    terrane?: string;
    lat: number;
    lon: number;
    age: number;
    ageError?: number;
    rockType: string;
    poleLat: number;
    poleLon: number;
    a95: number;
    k?: number;
    n?: number;
    qsum?: number;
    rsum?: number;
}

export interface Reference {
    refNo: number;
    authors: string;
    year: number;
    title: string;
    journal: string;
    volume?: string;
    pages?: string;
    doi?: string;
}

// API Functions

/**
 * Get database statistics
 */
export async function getStats(): Promise<DatabaseStats> {
    // TODO: Replace with actual API call when Django REST API is ready
    // const response = await api.get('/stats/');
    // return response.data;

    // Placeholder data for now
    return {
        poles: 12847,
        rockUnits: 8234,
        references: 3156,
    };
}

/**
 * Search paleomagnetic data
 */
export async function searchData(params: SearchParams): Promise<PaleomagneticResult[]> {
    // TODO: Replace with actual API call when Django REST API is ready
    // const response = await api.post('/search/', params);
    // return response.data;

    console.log('Search params:', params);
    return [];
}

/**
 * Get reference by number
 */
export async function getReference(refNo: number): Promise<Reference | null> {
    // TODO: Replace with actual API call
    // const response = await api.get(`/references/${refNo}/`);
    // return response.data;

    console.log('Get reference:', refNo);
    return null;
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
    // TODO: Replace with actual API call
    // const response = await api.post('/contributions/', data);
    // return response.data;

    console.log('Submit contribution:', data);
    return { success: true, message: 'Contribution submitted (placeholder)' };
}

/**
 * Export search results to CSV
 */
export function exportToCSV(data: PaleomagneticResult[], filename: string = 'gpmdb_export.csv') {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Create CSV headers
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header as keyof PaleomagneticResult];
                // Escape values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
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
