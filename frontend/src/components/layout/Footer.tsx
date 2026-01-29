import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-[var(--dark)] text-white">
            <div className="page-container py-4">
                <div className="flex items-center justify-between text-sm">
                    <a
                        href="/api/metadata"
                        className="text-white underline hover:text-[var(--accent-coral)] transition-colors"
                    >
                        View Metadata
                    </a>

                    <div className="text-[var(--text-secondary)]">
                        © {new Date().getFullYear()} Global Paleomagnetic Database
                    </div>
                </div>
            </div>
        </footer>
    );
}
