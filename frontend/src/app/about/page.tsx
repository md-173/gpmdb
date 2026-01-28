'use client';

export default function AboutPage() {
    return (
        <div className="bg-[var(--bg-secondary)] min-h-screen py-6">
            <div className="max-w-4xl mx-auto px-4">
                {/* About Section */}
                <div className="bg-white rounded-lg p-6 mb-6">
                    <h1 className="text-2xl font-semibold text-[var(--dark)] mb-4">
                        About GPMDB
                    </h1>

                    <p className="text-[var(--text-secondary)] mb-4">
                        The Global Paleomagnetic Database (GPMDB) contains published paleomagnetic
                        poles and directions from rocks around the world. Paleomagnetism is the study
                        of the record of Earth&apos;s magnetic field in rocks, sediments, and archaeological
                        materials.
                    </p>

                    <p className="text-[var(--text-secondary)] mb-4">
                        This database serves as a crucial resource for researchers studying:
                    </p>

                    <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 ml-4 space-y-1">
                        <li>Continental drift and plate tectonics</li>
                        <li>Supercontinent cycles (e.g., Pangea, Rodinia)</li>
                        <li>Earth&apos;s magnetic field reversals</li>
                        <li>Apparent Polar Wander Paths (APWPs)</li>
                        <li>Paleogeographic reconstructions</li>
                    </ul>
                </div>

                {/* History */}
                <div className="bg-white rounded-lg p-6 mb-6">
                    <h2 className="bg-[var(--dark)] text-white px-3 py-2 border-l-4 border-[var(--accent-coral)] text-sm font-medium mb-4 -mx-6 -mt-6">
                        History
                    </h2>

                    <ul className="space-y-3 text-[var(--text-secondary)]">
                        <li><strong>1991</strong> - Original GPMDB created by Mike McElhinny and Jo Lock</li>
                        <li><strong>2000s</strong> - Database maintenance continued under Sergei Pisarevsky</li>
                        <li><strong>2015</strong> - GPMDB becomes part of IGCP 648: Supercontinent Cycles &amp; Global Geodynamics</li>
                        <li><strong>2022</strong> - First web-based version launched</li>
                        <li><strong>2026</strong> - Complete redesign with modern web technologies</li>
                    </ul>
                </div>

                {/* Team */}
                <div className="bg-white rounded-lg p-6 mb-6">
                    <h2 className="bg-[var(--dark)] text-white px-3 py-2 border-l-4 border-[var(--accent-coral)] text-sm font-medium mb-4 -mx-6 -mt-6">
                        Team
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-[var(--border-gray)] rounded-md p-3">
                            <div className="font-semibold">Sergei Pisarevsky</div>
                            <div className="text-sm text-[var(--text-secondary)]">Database Maintainer, Curtin University</div>
                        </div>
                        <div className="border border-[var(--border-gray)] rounded-md p-3">
                            <div className="font-semibold">Zheng-Xiang Li</div>
                            <div className="text-sm text-[var(--text-secondary)]">Project Lead, Curtin University</div>
                        </div>
                        <div className="border border-[var(--border-gray)] rounded-md p-3">
                            <div className="font-semibold">Michael Tetley</div>
                            <div className="text-sm text-[var(--text-secondary)]">Developer, Curtin University</div>
                        </div>
                        <div className="border border-[var(--border-gray)] rounded-md p-3">
                            <div className="font-semibold">Yebo Liu</div>
                            <div className="text-sm text-[var(--text-secondary)]">Contributor, Curtin University</div>
                        </div>
                        <div className="border border-[var(--border-gray)] rounded-md p-3">
                            <div className="font-semibold">Jack Beardmore</div>
                            <div className="text-sm text-[var(--text-secondary)]">Developer, Curtin University</div>
                        </div>
                    </div>
                </div>

                {/* Citation */}
                <div className="bg-white rounded-lg p-6">
                    <h2 className="bg-[var(--dark)] text-white px-3 py-2 border-l-4 border-[var(--accent-coral)] text-sm font-medium mb-4 -mx-6 -mt-6">
                        How to Cite
                    </h2>

                    <p className="text-[var(--text-secondary)] mb-4">
                        If you use data from GPMDB in your research, please cite:
                    </p>

                    <blockquote className="border-l-4 border-[var(--accent-coral)] pl-4 py-2 bg-[var(--bg-secondary)] rounded-r">
                        <p className="text-[var(--text-secondary)]">
                            Pisarevsky, S.A., Li, Z.X., Tetley, M.G., Liu, Y., and Beardmore, J., 2022.
                            An updated internet-based Global Paleomagnetic Database.
                            <em> Earth Science Reviews</em>, <strong>235</strong>, 104258.
                        </p>
                    </blockquote>

                    <p className="mt-4">
                        <a
                            href="https://doi.org/10.1016/j.earscirev.2022.104258"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent-blue)] hover:text-[var(--accent-coral)]"
                        >
                            DOI: 10.1016/j.earscirev.2022.104258
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
