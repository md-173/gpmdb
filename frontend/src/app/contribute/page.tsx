'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitContribution } from '@/lib/api';

export default function ContributePage() {
    const [formData, setFormData] = useState({
        doi: '',
        email: '',
        alternateEmail: '',
        lat: '',
        lon: '',
        age: '',
        rockName: '',
        rockType: '',
        place: '',
        continent: '',
        terrane: '',
        refNo: '',
        rLat: '',
        rLon: '',
        stratAge: '',
        lowAge: '',
        highAge: '',
        method: '',
        rockUnitNo: '',
        resultNo: '',
        loMagAge: '',
        hiMagAge: '',
        tests: '',
        tilt: '',
        sLat: '',
        sLon: '',
        pType: '',
        noReversed: '',
        demagCode: '',
        treatment: '',
        authors: '',
        year: '',
        journal: '',
        vPages: '',
        title: '',
        remarks: '',
        comments: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const parseOptionalNumber = (value: string) => {
        const trimmed = value.trim();
        if (trimmed === '') return undefined;
        const num = Number(trimmed);
        return Number.isFinite(num) ? num : undefined;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await submitContribution({
                doi: formData.doi,
                email: formData.email,
                alternate_email: formData.alternateEmail || undefined,
                comments: formData.comments || undefined,
                lat: parseOptionalNumber(formData.lat),
                lon: parseOptionalNumber(formData.lon),
                age: parseOptionalNumber(formData.age),
                rockname: formData.rockName || undefined,
                rocktype: formData.rockType || undefined,
                place: formData.place || undefined,
                continent: formData.continent || undefined,
                terrane: formData.terrane || undefined,
                refno: parseOptionalNumber(formData.refNo),
                rlat: parseOptionalNumber(formData.rLat),
                rlong: parseOptionalNumber(formData.rLon),
                stratage: formData.stratAge || undefined,
                lowage: parseOptionalNumber(formData.lowAge),
                highage: parseOptionalNumber(formData.highAge),
                method: formData.method || undefined,
                rockunitno: parseOptionalNumber(formData.rockUnitNo),
                resultno: parseOptionalNumber(formData.resultNo),
                lomagage: parseOptionalNumber(formData.loMagAge),
                himagage: parseOptionalNumber(formData.hiMagAge),
                tests: formData.tests || undefined,
                tilt: parseOptionalNumber(formData.tilt),
                slat: parseOptionalNumber(formData.sLat),
                slong: parseOptionalNumber(formData.sLon),
                ptype: formData.pType || undefined,
                noreversed: formData.noReversed || undefined,
                demagcode: parseOptionalNumber(formData.demagCode),
                treatment: formData.treatment || undefined,
                authors: formData.authors || undefined,
                year: parseOptionalNumber(formData.year),
                journal: formData.journal || undefined,
                vpages: formData.vPages || undefined,
                title: formData.title || undefined,
                remarks: formData.remarks || undefined,
            });
            setSuccess(true);
        } catch (err) {
            setError('Failed to submit contribution. Please try again later.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-[var(--border-gray)] rounded-md text-sm focus:border-[var(--accent-coral)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-coral)]/20";
    const labelClass = "block text-sm font-medium mb-1";

    if (success) {
        return (
            <div className="bg-[var(--bg-secondary)] min-h-screen py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-lg border border-[var(--border-gray)] p-8 text-center">
                        <div className="text-4xl mb-4">✅</div>
                        <h1 className="text-xl font-semibold mb-2">Thank You!</h1>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Your contribution has been submitted successfully. We will review the data and contact you at the email address provided.
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-4 py-2 bg-[var(--accent-coral)] text-white rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-secondary)] min-h-screen py-6">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg border border-[var(--border-gray)]">
                    {/* Header */}
                    <div className="border-b border-[var(--border-gray)] px-5 py-4">
                        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Contribute Data</h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Submit paleomagnetic data for inclusion in GPMDB
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5">
                        <div className="mb-4">
                            <label className={labelClass}>
                                DOI URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                name="doi"
                                value={formData.doi}
                                onChange={handleChange}
                                placeholder="https://doi.org/10.1016/..."
                                className={inputClass}
                                required
                            />
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                Enter the DOI URL of the published paper containing the data
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className={labelClass}>
                                Your Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your.email@example.com"
                                className={inputClass}
                                required
                            />
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                We will contact you if we need additional information
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className={labelClass}>Alternate Email</label>
                            <input
                                type="email"
                                name="alternateEmail"
                                value={formData.alternateEmail}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <h3 className="font-medium mb-2 text-gray-700">Site Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Latitude (optional)</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="lat"
                                    value={formData.lat}
                                    onChange={handleChange}
                                    placeholder="-90 to 90"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Longitude (optional)</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="lon"
                                    value={formData.lon}
                                    onChange={handleChange}
                                    placeholder="-180 to 180"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Site Age (Ma)</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Reference No.</label>
                                <input
                                    type="number"
                                    step="1"
                                    name="refNo"
                                    value={formData.refNo}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <h3 className="font-medium mb-2 text-gray-700">Rock Unit</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Rock Name</label>
                                <input
                                    type="text"
                                    name="rockName"
                                    value={formData.rockName}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Rock Type</label>
                                <input
                                    type="text"
                                    name="rockType"
                                    value={formData.rockType}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Place</label>
                                <input
                                    type="text"
                                    name="place"
                                    value={formData.place}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Continent</label>
                                <input
                                    type="text"
                                    name="continent"
                                    value={formData.continent}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Terrane</label>
                                <input
                                    type="text"
                                    name="terrane"
                                    value={formData.terrane}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Rock Unit No.</label>
                                <input
                                    type="number"
                                    step="1"
                                    name="rockUnitNo"
                                    value={formData.rockUnitNo}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>RLat</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="rLat"
                                    value={formData.rLat}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>RLong</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="rLon"
                                    value={formData.rLon}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Strat Age</label>
                                <input
                                    type="text"
                                    name="stratAge"
                                    value={formData.stratAge}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Method</label>
                                <input
                                    type="text"
                                    name="method"
                                    value={formData.method}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Low Age</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="lowAge"
                                    value={formData.lowAge}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>High Age</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="highAge"
                                    value={formData.highAge}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <h3 className="font-medium mb-2 text-gray-700">PMAG Result</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Result No.</label>
                                <input
                                    type="number"
                                    step="1"
                                    name="resultNo"
                                    value={formData.resultNo}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Tests</label>
                                <input
                                    type="text"
                                    name="tests"
                                    value={formData.tests}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Lo Mag Age</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="loMagAge"
                                    value={formData.loMagAge}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hi Mag Age</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="hiMagAge"
                                    value={formData.hiMagAge}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>Tilt</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="tilt"
                                    value={formData.tilt}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>P Type</label>
                                <input
                                    type="text"
                                    name="pType"
                                    value={formData.pType}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>SLAT</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="sLat"
                                    value={formData.sLat}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>SLONG</label>
                                <input
                                    type="number"
                                    step="any"
                                    name="sLon"
                                    value={formData.sLon}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>No Reversed</label>
                                <input
                                    type="text"
                                    name="noReversed"
                                    value={formData.noReversed}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Demag Code</label>
                                <input
                                    type="number"
                                    step="1"
                                    name="demagCode"
                                    value={formData.demagCode}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className={labelClass}>Treatment</label>
                            <input
                                type="text"
                                name="treatment"
                                value={formData.treatment}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <h3 className="font-medium mb-2 text-gray-700">Reference Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <input
                                type="text"
                                name="authors"
                                placeholder="Authors"
                                value={formData.authors}
                                onChange={handleChange}
                                className={inputClass}
                            />
                            <input
                                type="number"
                                name="year"
                                placeholder="Year"
                                value={formData.year}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <input
                            type="text"
                            name="title"
                            placeholder="Title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`${inputClass} mb-2`}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                name="journal"
                                placeholder="Journal"
                                value={formData.journal}
                                onChange={handleChange}
                                className={inputClass}
                            />
                            <input
                                type="text"
                                name="vPages"
                                placeholder="VPages"
                                value={formData.vPages}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <input
                            type="text"
                            name="remarks"
                            placeholder="Remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            className={inputClass}
                        />

                        <div className="mb-4">
                            <label className={labelClass}>Additional Comments (optional)</label>
                            <textarea
                                name="comments"
                                value={formData.comments}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Any additional information about the data..."
                                className={inputClass}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t border-[var(--border-gray)]">
                            <Link
                                href="/"
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-[var(--accent-coral)] text-white rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Contribution'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Citation Info */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-[var(--border-gray)]">
                    <h3 className="font-semibold mb-2">Data Attribution</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        All data contributions will be attributed according to the published reference.
                        If you use GPMDB data in your research, please cite:
                    </p>
                    <blockquote className="mt-2 pl-3 border-l-2 border-[var(--accent-coral)] text-sm text-[var(--text-secondary)]">
                        Pisarevsky et al. (2022). Earth Science Reviews, 235, 104258.
                    </blockquote>
                </div>
            </div>
        </div>
    );
}
