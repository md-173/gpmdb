'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ColumnDef } from '@tanstack/react-table';
import { searchData, getContinents, getRockTypes, exportToCSV, SearchParams, PaleomagneticResult } from '@/lib/api';
import { DataTable } from '@/components/tables';
import { MapPoint } from '@/components/map';
import { AgeHistogram, PolePlot, ContinentPieChart } from '@/components/charts';

// Dynamically import the map component to avoid SSR issues
const GpmdbMap = dynamic(
    () => import('@/components/map/GpmdbMap'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)]">
                <div className="text-center">
                    <div className="text-2xl mb-2">🗺️</div>
                    <p>Loading map...</p>
                </div>
            </div>
        ),
    }
);

// Define table columns
const columns: ColumnDef<PaleomagneticResult>[] = [
    { accessorKey: 'refNo', header: 'RefNo', size: 60 },
    { accessorKey: 'resultNo', header: 'ResultNo', size: 70 },
    {
        accessorKey: 'rockName',
        header: 'Rock Name',
        cell: ({ getValue }) => (
            <span className="max-w-[200px] truncate block" title={getValue() as string}>
                {getValue() as string}
            </span>
        ),
    },
    { accessorKey: 'year', header: 'Year', size: 50 },
    { accessorKey: 'continent', header: 'Continent', size: 100 },
    { accessorKey: 'rockType', header: 'Rock Type', size: 90 },
    {
        accessorKey: 'loMagAge',
        header: 'Age (Ma)',
        cell: ({ row }) => {
            const lo = row.original.loMagAge || row.original.lowAge;
            const hi = row.original.hiMagAge || row.original.highAge;
            return `${lo || '?'} - ${hi || '?'}`;
        },
    },
    {
        accessorKey: 'pLat',
        header: 'PLat',
        cell: ({ getValue }) => {
            const val = getValue() as number | null;
            return val !== null ? val.toFixed(1) : '-';
        },
    },
    {
        accessorKey: 'pLon',
        header: 'PLon',
        cell: ({ getValue }) => {
            const val = getValue() as number | null;
            return val !== null ? val.toFixed(1) : '-';
        },
    },
    {
        accessorKey: 'a95',
        header: 'A95',
        cell: ({ getValue }) => {
            const val = getValue() as number | null;
            return val !== null ? val.toFixed(1) : '-';
        },
    },
    { accessorKey: 'qsum', header: 'QSUM', size: 50 },
];

type ViewTab = 'table' | 'map' | 'charts';

export default function SearchPage() {
    const [continents, setContinents] = useState<string[]>([]);
    const [rockTypes, setRockTypes] = useState<string[]>([]);
    const [searchForm, setSearchForm] = useState<SearchParams>({
        continent: '',
        rocktype: '',
        'rockage-min': '',
        'rockage-max': '',
        'magage-min': '',
        'magage-max': '',
        rockname: '',
        refno: '',
        resultno: '',
        'lat-min': '',
        'lat-max': '',
        'lon-min': '',
        'lon-max': '',
        'qsum-min': '',
        'rsum-min': '',
        'k-min': '',
        'k-max': '',
        'a95-max': '',
        'b-min': '',
        'n-min': '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<PaleomagneticResult[]>([]);
    const [resultCount, setResultCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ViewTab>('table');

    // Fetch continents, rock types, and initial data on mount
    useEffect(() => {
        async function init() {
            try {
                const [continentList, rockTypeList] = await Promise.all([
                    getContinents(),
                    getRockTypes(),
                ]);
                setContinents(continentList);
                setRockTypes(rockTypeList);

                // Perform initial search to populate map/table
                setIsLoading(true);
                const response = await searchData({
                    continent: '',
                    rocktype: '',
                    'rockage-min': '',
                    'rockage-max': '',
                    'magage-min': '',
                    'magage-max': '',
                    rockname: '',
                    refno: '',
                    resultno: '',
                    'lat-min': '',
                    'lat-max': '',
                    'lon-min': '',
                    'lon-max': '',
                    'qsum-min': '',
                    'rsum-min': '',
                    'k-min': '',
                    'k-max': '',
                    'a95-max': '',
                    'b-min': '',
                    'n-min': '',
                });
                setResults(response.data);
                setResultCount(response.count);
            } catch (err) {
                console.error('Initialization failed:', err);
                setError('Failed to load initial data. Please check backend connection.');
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, []);

    // Listen for polygon search events from the map
    useEffect(() => {
        const handlePolygonSearch = async (e: Event) => {
            const customEvent = e as CustomEvent<[number, number][]>;
            const polygon = customEvent.detail;

            setIsLoading(true);
            setError(null);

            try {
                // Import dynamically to avoid circular dependency if any
                const { searchPolygon } = await import('@/lib/api');
                const response = await searchPolygon(polygon);
                setResults(response.data);
                setResultCount(response.count);
                // Switch to table view to show results
                setActiveTab('table');
            } catch (err) {
                setError('Polygon search failed.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        window.addEventListener('gpmdb:polygon-search', handlePolygonSearch);
        return () => {
            window.removeEventListener('gpmdb:polygon-search', handlePolygonSearch);
        };
    }, []);

    // Convert results to map points
    const mapPoints: MapPoint[] = useMemo(() => {
        return results
            .filter(r => r.sLat !== null && r.sLon !== null)
            .map(r => ({
                id: r.resultNo,
                lat: r.sLat!,
                lon: r.sLon!,
                label: `Result #${r.resultNo}`,
                rockName: r.rockName,
                age: r.loMagAge ? `${r.loMagAge} - ${r.hiMagAge}` : undefined,
                continent: r.continent,
            }));
    }, [results]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSearchForm(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        setSearchForm({
            continent: '',
            rocktype: '',
            'rockage-min': '',
            'rockage-max': '',
            'magage-min': '',
            'magage-max': '',
            rockname: '',
            refno: '',
            resultno: '',
            'lat-min': '',
            'lat-max': '',
            'lon-min': '',
            'lon-max': '',
            'qsum-min': '',
            'rsum-min': '',
            'k-min': '',
            'k-max': '',
            'a95-max': '',
            'b-min': '',
            'n-min': '',
        });
        setResults([]);
        setResultCount(null);
        setError(null);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await searchData(searchForm);
            setResults(response.data);
            setResultCount(response.count);
        } catch (err) {
            setError('Search failed. Make sure the Django backend is running.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (results.length > 0) {
            exportToCSV(results, 'gpmdb_search_results.csv');
        }
    };

    const inputClass = "w-full px-3 py-2 border border-[var(--border-gray)] rounded-md text-sm focus:border-[var(--accent-coral)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-coral)]/20";
    const labelClass = "block text-sm font-medium mb-1";

    const tabClass = (tab: ViewTab) => `
    px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
    ${activeTab === tab
            ? 'border-[var(--accent-coral)] text-[var(--accent-coral)] bg-white'
            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-gray-300'
        }
  `;

    return (
        <div className="bg-[var(--bg-secondary)] min-h-screen py-6">
            <div className="max-w-6xl mx-auto px-4">
                {/* Search Form */}
                <div className="bg-white rounded-lg shadow-lg border border-[var(--border-gray)]">
                    <div className="border-b border-[var(--border-gray)] px-5 py-4">
                        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Search GPMDB</h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Combine any search parameters to find paleomagnetic data
                        </p>
                    </div>

                    <form onSubmit={handleSearch} className="p-5">
                        {/* Row 1: Continent and Rock Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Continent</label>
                                <select name="continent" value={searchForm.continent} onChange={handleChange} className={inputClass}>
                                    <option value="">All continents</option>
                                    {continents.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Geological Unit Type</label>
                                <select name="rocktype" value={searchForm.rocktype} onChange={handleChange} className={inputClass}>
                                    <option value="">All Rock Types</option>
                                    {rockTypes.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Age Filters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Min Rock Age</label>
                                <input type="text" name="rockage-min" value={searchForm['rockage-min']} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Max Rock Age</label>
                                <input type="text" name="rockage-max" value={searchForm['rockage-max']} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Min Mag Age</label>
                                <input type="text" name="magage-min" value={searchForm['magage-min']} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Max Mag Age</label>
                                <input type="text" name="magage-max" value={searchForm['magage-max']} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        {/* Row 3: Name and IDs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Rock Unit Name</label>
                                <input type="text" name="rockname" value={searchForm.rockname} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Reference No.</label>
                                <input type="text" name="refno" value={searchForm.refno} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Result No.</label>
                                <input type="text" name="resultno" value={searchForm.resultno} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        {/* Row 4: Quality Filters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Min QSUM</label>
                                <input type="text" name="qsum-min" value={searchForm['qsum-min']} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Min RSUM</label>
                                <input type="text" name="rsum-min" value={searchForm['rsum-min']} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Max A95</label>
                                <input type="text" name="a95-max" value={searchForm['a95-max']} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Min N</label>
                                <input type="text" name="n-min" value={searchForm['n-min']} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t border-[var(--border-gray)]">
                            <button type="button" onClick={handleReset} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
                                Reset Form
                            </button>
                            <div className="flex gap-2">
                                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-[var(--accent-coral)] text-white rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors disabled:opacity-50">
                                    {isLoading ? 'Searching...' : 'Search'}
                                </button>
                                <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Results Section */}
                {resultCount !== null && (
                    <div className="mt-6">
                        {/* Results Header with Tabs */}
                        <div className="bg-white rounded-lg shadow-lg border border-[var(--border-gray)]">
                            <div className="px-5 py-4 flex justify-between items-center border-b border-[var(--border-gray)]">
                                <div>
                                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Search Results</h2>
                                    <p className="text-sm text-[var(--text-secondary)]">Found {resultCount} results</p>
                                </div>
                                {results.length > 0 && (
                                    <button onClick={handleExport} className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                                        Export to CSV
                                    </button>
                                )}
                            </div>

                            {/* Tab Navigation */}
                            {results.length > 0 && (
                                <div className="flex border-b border-[var(--border-gray)] px-4">
                                    <button onClick={() => setActiveTab('table')} className={tabClass('table')}>
                                        📊 Data Table
                                    </button>
                                    <button onClick={() => setActiveTab('map')} className={tabClass('map')}>
                                        🗺️ Map View
                                    </button>
                                    <button onClick={() => setActiveTab('charts')} className={tabClass('charts')}>
                                        📈 Charts
                                    </button>
                                </div>
                            )}

                            {/* Tab Content */}
                            <div className="p-4">
                                {results.length > 0 ? (
                                    <>
                                        {/* Table View */}
                                        {activeTab === 'table' && (
                                            <DataTable
                                                data={results}
                                                columns={columns}
                                                pageSize={25}
                                                showPagination={true}
                                                showSearch={true}
                                            />
                                        )}

                                        {/* Map View */}
                                        {activeTab === 'map' && mapPoints.length > 0 && (
                                            <GpmdbMap
                                                points={mapPoints}
                                                height="500px"
                                                center={[0, 0]}
                                                zoom={2}
                                            />
                                        )}

                                        {/* Charts View */}
                                        {activeTab === 'charts' && (
                                            <div className="space-y-6">
                                                {/* Age Distribution */}
                                                <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                                                    <h3 className="text-sm font-semibold mb-3">Age Distribution (Ma)</h3>
                                                    <AgeHistogram data={results} height={250} />
                                                </div>

                                                {/* Two column layout for pie and pole plot */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Continent Distribution */}
                                                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                                                        <h3 className="text-sm font-semibold mb-3">By Continent</h3>
                                                        <ContinentPieChart data={results} height={250} />
                                                    </div>

                                                    {/* Pole Positions */}
                                                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                                                        <h3 className="text-sm font-semibold mb-3">Pole Positions</h3>
                                                        <PolePlot data={results} height={250} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-[var(--text-secondary)]">
                                        No results found. Try adjusting your search criteria.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
