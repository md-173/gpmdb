'use client';

import { useState } from 'react';
import Link from 'next/link';

const continents = [
    'All continents',
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

const rockTypes = [
    'All Rock Types',
    'extrusives',
    'intrusives',
    'sediments',
    'limestones',
    'metamorphics',
];

export default function SearchPage() {
    const [searchForm, setSearchForm] = useState({
        continent: '',
        rockType: '',
        rockAgeMin: '',
        rockAgeMax: '',
        magAgeMin: '',
        magAgeMax: '',
        rockName: '',
        refNo: '',
        resultNo: '',
        minLat: '',
        maxLat: '',
        minLon: '',
        maxLon: '',
        minQsum: '',
        minRsum: '',
        minK: '',
        maxK: '',
        maxA95: '',
        minB: '',
        minN: '',
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSearchForm(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        setSearchForm({
            continent: '',
            rockType: '',
            rockAgeMin: '',
            rockAgeMax: '',
            magAgeMin: '',
            magAgeMax: '',
            rockName: '',
            refNo: '',
            resultNo: '',
            minLat: '',
            maxLat: '',
            minLon: '',
            maxLon: '',
            minQsum: '',
            minRsum: '',
            minK: '',
            maxK: '',
            maxA95: '',
            minB: '',
            minN: '',
        });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // TODO: Connect to Django API
        setTimeout(() => {
            setIsLoading(false);
            alert('Search functionality will be connected to Django API in Phase 2');
        }, 1000);
    };

    const inputClass = "w-full px-3 py-2 border border-[var(--border-gray)] rounded-md text-sm focus:border-[var(--accent-coral)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-coral)]/20";
    const labelClass = "block text-sm font-medium mb-1";

    return (
        <div className="bg-[var(--bg-secondary)] min-h-screen py-6">
            <div className="max-w-4xl mx-auto px-4">
                {/* Modal-like container */}
                <div className="bg-white rounded-lg shadow-lg border border-[var(--border-gray)]">
                    {/* Header */}
                    <div className="border-b border-[var(--border-gray)] px-5 py-4">
                        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Search GPMDB</h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Combine any search parameters to find paleomagnetic data
                        </p>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSearch} className="p-5">
                        {/* Row 1: Continent and Rock Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Continent</label>
                                <select
                                    name="continent"
                                    value={searchForm.continent}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    {continents.map(c => (
                                        <option key={c} value={c === 'All continents' ? '' : c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Geological Unit Type</label>
                                <select
                                    name="rockType"
                                    value={searchForm.rockType}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    {rockTypes.map(r => (
                                        <option key={r} value={r === 'All Rock Types' ? '' : r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Age Filters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Min Rock Unit Age</label>
                                <input
                                    type="text"
                                    name="rockAgeMin"
                                    value={searchForm.rockAgeMin}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Max Rock Unit Age</label>
                                <input
                                    type="text"
                                    name="rockAgeMax"
                                    value={searchForm.rockAgeMax}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Min Magnetisation Age</label>
                                <input
                                    type="text"
                                    name="magAgeMin"
                                    value={searchForm.magAgeMin}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Max Magnetisation Age</label>
                                <input
                                    type="text"
                                    name="magAgeMax"
                                    value={searchForm.magAgeMax}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Row 3: Rock Name, Ref No, Result No */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Rock Unit Name</label>
                                <input
                                    type="text"
                                    name="rockName"
                                    value={searchForm.rockName}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Reference No.</label>
                                <input
                                    type="text"
                                    name="refNo"
                                    value={searchForm.refNo}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Result No.</label>
                                <input
                                    type="text"
                                    name="resultNo"
                                    value={searchForm.resultNo}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Row 4: Coordinate Filters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Min Latitude</label>
                                <input
                                    type="text"
                                    name="minLat"
                                    value={searchForm.minLat}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Max Latitude</label>
                                <input
                                    type="text"
                                    name="maxLat"
                                    value={searchForm.maxLat}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Min Longitude</label>
                                <input
                                    type="text"
                                    name="minLon"
                                    value={searchForm.minLon}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Max Longitude</label>
                                <input
                                    type="text"
                                    name="maxLon"
                                    value={searchForm.maxLon}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Row 5: Quality Filters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>MIN QSUM</label>
                                <input
                                    type="text"
                                    name="minQsum"
                                    value={searchForm.minQsum}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>MIN RSUM</label>
                                <input
                                    type="text"
                                    name="minRsum"
                                    value={searchForm.minRsum}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Min B</label>
                                <input
                                    type="text"
                                    name="minB"
                                    value={searchForm.minB}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Min N</label>
                                <input
                                    type="text"
                                    name="minN"
                                    value={searchForm.minN}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Row 6: K and A95 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className={labelClass}>Min K</label>
                                <input
                                    type="text"
                                    name="minK"
                                    value={searchForm.minK}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Max K</label>
                                <input
                                    type="text"
                                    name="maxK"
                                    value={searchForm.maxK}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Max A95</label>
                                <input
                                    type="text"
                                    name="maxA95"
                                    value={searchForm.maxA95}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t border-[var(--border-gray)]">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Reset Form
                            </button>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-[var(--accent-coral)] text-white rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Searching...' : 'Search'}
                                </button>
                                <Link
                                    href="/"
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
