'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitContribution } from '@/lib/api';

export default function ContributePage() {
    const [formData, setFormData] = useState({
        doi: '',
        email: '',
        lat: '',
        lon: '',
        age: '',
        comments: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await submitContribution({
                doi: formData.doi,
                email: formData.email,
                lat: formData.lat ? parseFloat(formData.lat) : undefined,
                lon: formData.lon ? parseFloat(formData.lon) : undefined,
                age: formData.age ? parseFloat(formData.age) : undefined,
                comments: formData.comments || undefined,
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
                <div className="max-w-xl mx-auto px-4">
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
            <div className="max-w-xl mx-auto px-4">
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

                        <div className="grid grid-cols-2 gap-4 mb-4">
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

                        <div className="mb-4">
                            <label className={labelClass}>Age in Ma (optional)</label>
                            <input
                                type="number"
                                step="any"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                placeholder="e.g., 2500"
                                className={inputClass}
                            />
                        </div>

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
