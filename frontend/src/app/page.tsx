'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getStats, searchData, searchPolygon, DatabaseStats, PaleomagneticResult } from '@/lib/api';
import { MapPoint } from '@/components/map/GpmdbMap';

// Dynamically import the map component to avoid SSR issues
const GpmdbMap = dynamic(
  () => import('@/components/map/GpmdbMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)]">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p>Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<DatabaseStats>({
    poles: 0,
    rockUnits: 0,
    references: 0,
  });
  const [loading, setLoading] = useState(true);

  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [allMapPoints, setAllMapPoints] = useState<MapPoint[]>([]);
  const [selectedPolygon, setSelectedPolygon] = useState<[number, number][] | null>(null);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allMapPointsRef = useRef<MapPoint[]>([]);
  const hasFetchedRef = useRef(false);

  const isPointInPolygon = (lon: number, lat: number, polygon: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect =
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const countPointsInPolygon = (points: MapPoint[], polygon: [number, number][]) => {
    let count = 0;
    points.forEach((point) => {
      if (isPointInPolygon(point.lon, point.lat, polygon)) count += 1;
    });
    return count;
  };

  const getIdsInPolygon = (points: MapPoint[], polygon: [number, number][]) => {
    const ids: string[] = [];
    points.forEach((point) => {
      if (isPointInPolygon(point.lon, point.lat, polygon)) {
        ids.push(String(point.id));
      }
    });
    return ids;
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    async function fetchData() {
      try {
        console.log('Fetching stats...');
        const statsData = await getStats();
        setStats(statsData);

        console.log('Fetching map data...');
        const searchResults = await searchData({});
        console.log('Search results:', searchResults);

        const points = searchResults.data
          .filter(r => r.sLat !== null && r.sLon !== null)
          .map(r => ({
            id: r.resultNo,
            lat: r.sLat!,
            lon: r.sLon!,
            label: r.rockName,
            rockName: r.rockName,
            age: r.lowAge ? `${r.lowAge}-${r.highAge}` : undefined,
            continent: r.continent,
          }));

        console.log('Processed points:', points.length);
        setMapPoints(points);
        setAllMapPoints(points);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    allMapPointsRef.current = allMapPoints;
  }, [allMapPoints]);

  useEffect(() => {
    const handlePolygonSearch = async (event: Event) => {
      try {
        setLoading(true);
        const customEvent = event as CustomEvent<[number, number][]>;
        const polygon = customEvent.detail;
        if (!polygon) return;
        setSelectedPolygon(polygon);
        const ids = getIdsInPolygon(allMapPointsRef.current, polygon);
        setSelectedIds(ids);
        setSelectedCount(ids.length);
        setMapPoints(allMapPointsRef.current);
        const results = await searchPolygon(polygon);
        setSelectedCount(results.count ?? results.data?.length ?? ids.length);
        // Keep full dataset on the landing map; selection is highlighted on the map itself.
        setMapPoints(allMapPointsRef.current);
      } catch (error) {
        console.error('Polygon search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('gpmdb:polygon-search', handlePolygonSearch);
    return () => {
      window.removeEventListener('gpmdb:polygon-search', handlePolygonSearch);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4">
              {/* Stats Section */}
              <div className="text-[var(--dark)] px-3 py-2 border-l-4 border-[var(--accent-coral)] mb-4 text-sm font-medium">
                GPMDB Stats
              </div>
              <table className="w-full mb-4 text-sm">
                <tbody>
                  <tr className="border-b border-dashed border-[var(--border-gray)]">
                    <td className="py-2">
                      Palaeomagnetic Poles: {' '}
                      <span className="font-semibold">
                        {loading ? '...' : stats.poles.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-dashed border-[var(--border-gray)]">
                    <td className="py-2">
                      Rock Units: {' '}
                      <span className="font-semibold">
                        {loading ? '...' : stats.rockUnits.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-dashed border-[var(--border-gray)]">
                    <td className="py-2">
                      References: {' '}
                      <span className="font-semibold">
                        {loading ? '...' : stats.references.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Menu Items */}
              <div className="space-y-1">
                <Link
                  href="/search"
                  className="block bg-[var(--accent-coral)] text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors"
                >
                  Search GPMDB
                </Link>
                <button
                  onClick={() => alert('Under Construction!')}
                  className="w-full bg-[var(--accent-coral)] text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors"
                >
                  File Format Conversion
                </button>
                <button
                  onClick={() => alert('Under Construction!')}
                  className="w-full bg-[var(--accent-coral)] text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors"
                >
                  Download Python Scripts
                </button>
                <button
                  onClick={() => alert('Under Construction!')}
                  className="w-full bg-[var(--accent-coral)] text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors"
                >
                  Software Tools
                </button>
                <Link
                  href="/contribute"
                  className="block mt-4 bg-[var(--accent-coral)] text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-[var(--accent-coral-hover)] transition-colors"
                >
                  Contribute data
                </Link>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg overflow-hidden" style={{ height: '350px' }}>
              <GpmdbMap
                height="350px"
                center={[0, 0]}
                zoom={2}
                points={mapPoints}
                onPointClick={(point) => console.log('Clicked point:', point)}
                enableDraw={true}
              />
            </div>
            {selectedPolygon && selectedCount !== null && (
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="text-[var(--text-secondary)]">
                  Selected {selectedCount.toLocaleString()} poles.
                </span>
                <button
                  onClick={() => {
                    sessionStorage.setItem('gpmdb_polygon', JSON.stringify(selectedPolygon));
                    if (selectedIds.length > 0) {
                      sessionStorage.setItem('gpmdb_selected_ids', JSON.stringify(selectedIds));
                    }
                    router.push('/search');
                  }}
                  className="px-3 py-1.5 rounded-md bg-[var(--accent-blue)] text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Show selected
                </button>
                <button
                  onClick={() => {
                    setSelectedPolygon(null);
                    setSelectedCount(null);
                    setSelectedIds([]);
                    setMapPoints(allMapPoints);
                    window.dispatchEvent(new Event('gpmdb:polygon-clear'));
                  }}
                  className="px-3 py-1.5 rounded-md border border-[var(--border-gray)] text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Welcome and News Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Welcome */}
          <div className="lg:col-span-7 bg-white rounded-lg p-5">
            <h3 className="text-lg font-semibold text-[var(--dark)] mb-4">
              Welcome to the Global Paleomagnetic Database
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              The Global Paleomagnetic Database (GPMDB) contains published paleomagnetic poles
              and directions. The database was originally created by Mike McElhinny and Jo Lock,
              later maintained by Sergei Pisarevsky. This is the second online implementation of
              the database as part of the IGCP 648: Supercontinent Cycles &amp; Global Geodynamics project,
              and funded by Professor Zheng-Xiang Li&apos;s research grants.
            </p>
            <p className="text-[var(--text-secondary)]">
              This web site provides online access to the contents of the database. Several methods of
              querying the database are provided. Selected data can be exported to csv format.
            </p>
          </div>

          {/* News */}
          <div className="lg:col-span-5 bg-white rounded-lg p-5 border-l-2 border-[var(--bg-secondary)]">
            <h3 className="text-[var(--dark)] px-3 py-2 border-l-4 border-[var(--accent-coral)] text-sm font-medium mb-4 -mx-5 -mt-5">
              Latest News
            </h3>

            <p className="mb-4">
              <strong>New data available</strong> -
              This database is still under construction and new data will be added frequently.
              If you have data that you would like added to this database please contact us via
              the &quot;Feedback&quot; option below.
            </p>

            <p className="mb-4">
              <strong>GPMDB in the news!</strong> -
              Under construction!
            </p>

            <h3 className="text-[var(--dark)] px-3 py-2 border-l-4 border-[var(--accent-coral)] text-sm font-medium mb-4 -mx-5">
              Useful Information
            </h3>

            <p className="mb-4">
              <strong>Feedback</strong> -
              If you notice any issues or would like to make suggestions please{' '}
              <a href="mailto:Earth.Dynamics@curtin.edu.au" className="text-[var(--accent-blue)] hover:text-[var(--accent-coral)]">
                contact us
              </a>.
              <br />A feedback form will be added in subsequent updates.
            </p>

            <p>
              <strong>To cite this database</strong> -
              If you use the GPMDB, please cite our article: Pisarevsky, S.A., Li, Z.X., Tetley, M.G.,
              Liu, Y., and Beardmore, J., 2022. An updated internet-based Global Paleomagnetic Database.
              <em> Earth Science Reviews</em>, <strong>235</strong>, 104258.
              DOI:<a
                href="https://doi.org/10.1016/j.earscirev.2022.104258"
                className="text-[var(--accent-blue)] hover:text-[var(--accent-coral)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                10.1016/j.earscirev.2022.104258
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
