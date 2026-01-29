"""
GPMDB REST API Views

This module provides REST API endpoints for the Global Paleomagnetic Database.
These endpoints are consumed by the Next.js frontend.

Note: This is compatible with Django 2.2+ (the version in the Docker container)
"""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import psycopg2
import json
import math
import numpy as np
from pmagpy.pmag import fisher_mean
from shapely.geometry import LineString
from shapely.geometry import mapping

# Database connection strings (same as views.py)
conn_string = "host='localhost' dbname='GD2021' user='gpmdb' password='gpmdb' port=5432"
conn_string_admin = "host='localhost' dbname='GD2021' user='gpmdbadmin' password='admin' port=5432"


def get_db_connection():
    """Get a database connection."""
    return psycopg2.connect(conn_string)


def get_admin_connection():
    """Get a database connection with write access."""
    return psycopg2.connect(conn_string_admin)


def _shoot(lon, lat, azimuth, maxdist=None):
    """Great-circle shooter used for stereonet circles."""
    glat1 = lat * np.pi / 180.0
    glon1 = lon * np.pi / 180.0
    s = maxdist / 1.852
    faz = azimuth * np.pi / 180.0

    eps = 0.00000000005
    if (np.abs(np.cos(glat1)) < eps) and not (np.abs(np.sin(faz)) < eps):
        return (lon, lat, azimuth)

    a = 6378.13 / 1.852
    f = 1 / 298.257223563
    r = 1 - f
    tu = r * np.tan(glat1)
    sf = np.sin(faz)
    cf = np.cos(faz)
    if cf == 0:
        b = 0.0
    else:
        b = 2.0 * np.arctan2(tu, cf)

    cu = 1.0 / np.sqrt(1 + tu * tu)
    su = tu * cu
    sa = cu * sf
    c2a = 1 - sa * sa
    x = 1.0 + np.sqrt(1.0 + c2a * (1.0 / (r * r) - 1.0))
    x = (x - 2.0) / x
    c = 1.0 - x
    c = (x * x / 4.0 + 1.0) / c
    d = (0.375 * x * x - 1.0) * x
    tu = s / (r * a * c)
    y = tu
    c = y + 1.0
    while np.abs(y - c) > eps:
        sy = np.sin(y)
        cy = np.cos(y)
        cz = np.cos(b + y)
        e = 2.0 * cz * cz - 1.0
        c = y
        x = e * cy
        y = e + e - 1.0
        y = (((sy * sy * 4.0 - 3.0) * y * cz * d / 6.0 + x) * d / 4.0 - cz) * sy * d + tu

    b = cu * cy * cf - su * sy
    c = r * np.sqrt(sa * sa + b * b)
    d = su * cy + cu * sy * cf
    glat2 = (np.arctan2(d, c) + np.pi) % (2 * np.pi) - np.pi
    c = cu * cy - su * sy * cf
    x = np.arctan2(sy * sf, c)
    c = ((-3.0 * c2a + 4.0) * f + 4.0) * c2a * f / 16.0
    d = ((e * cy * c + cz) * sy * c + y) * sa
    glon2 = ((glon1 + x - (1.0 - c) * d * f + np.pi) % (2 * np.pi)) - np.pi

    baz = (np.arctan2(sa, b) + np.pi) % (2 * np.pi)

    glon2 *= 180.0 / np.pi
    glat2 *= 180.0 / np.pi
    baz *= 180.0 / np.pi
    return (glon2, glat2, baz)


def _circle(centerlon, centerlat, radius):
    coords = []
    for azimuth in range(0, 360):
        glon2, glat2, _ = _shoot(centerlon, centerlat, azimuth, radius)
        coords.append((glon2, glat2))
    coords.append(coords[0])
    return LineString(coords)


def api_stats(request):
    """
    GET /api/stats/
    
    Returns database statistics:
    - poles: count of PMAGRESULT records
    - rockUnits: count of ROCKUNIT records  
    - references: count of REFERENCE records
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT count(*) FROM "PMAGRESULT"')
        poles = cursor.fetchone()[0]
        
        cursor.execute('SELECT count(*) FROM "ROCKUNIT"')
        rock_units = cursor.fetchone()[0]
        
        cursor.execute('SELECT count(*) FROM "REFERENCE"')
        references = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return JsonResponse({
            'poles': poles,
            'rockUnits': rock_units,
            'references': references,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def api_search(request):
    """
    GET /api/search/
    
    Search paleomagnetic data with various filters.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Base query joining all relevant tables
        query_str = '''
            SELECT r."REFNO", pmr."RESULTNO", ru."ROCKNAME", r."YEAR", r."AUTHORS",
                r."JOURNAL", r."VOLUME", r."VPAGES", 
                ru."CONTINENT", ru."ROCKTYPE", ru."LOWAGE", ru."HIGHAGE", 
                pmr."LOMAGAGE", pmr."HIMAGAGE", pmr."SLAT", pmr."SLONG", pmr."PLAT", pmr."PLONG", 
                pmr."DP", pmr."DM", re."QSUM", re."RSUM", pmr."KD", pmr."ED95", pmr."B", pmr."N"
            FROM ((("ROCKUNIT" AS ru 
                INNER JOIN "REFERENCE" AS r ON r."REFNO" = ru."REFNO")
                INNER JOIN "PMAGRESULT" AS pmr ON ru."ROCKUNITNO" = pmr."ROCKUNITNO")
                INNER JOIN "RELIABILITY" AS re ON pmr."RESULTNO" = re."RESULTNO")
        '''
        
        # Build WHERE clause from query parameters
        where_clause = build_where_clause(request.GET)
        query_str += where_clause
        query_str += ' ORDER BY r."YEAR" DESC'

        # Optional pagination
        limit_param = request.GET.get('limit')
        offset_param = request.GET.get('offset')
        if limit_param:
            try:
                limit = int(limit_param)
                if limit > 0:
                    query_str += f' LIMIT {limit}'
            except ValueError:
                pass
        if offset_param:
            try:
                offset = int(offset_param)
                if offset >= 0:
                    query_str += f' OFFSET {offset}'
            except ValueError:
                pass
        
        if settings.DEBUG:
            print(f"API Search Query: {query_str}")
        
        cursor.execute(query_str)
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Build result list
        results = []
        for row in cursor:
            result = {
                'refNo': row[0],
                'resultNo': row[1],
                'rockName': row[2],
                'year': row[3],
                'authors': row[4],
                'journal': row[5],
                'volume': row[6],
                'pages': row[7],
                'continent': row[8],
                'rockType': row[9],
                'lowAge': row[10],
                'highAge': row[11],
                'loMagAge': row[12],
                'hiMagAge': row[13],
                'sLat': float(row[14]) if row[14] else None,
                'sLon': float(row[15]) if row[15] else None,
                'pLat': float(row[16]) if row[16] else None,
                'pLon': float(row[17]) if row[17] else None,
                'dp': float(row[18]) if row[18] else None,
                'dm': float(row[19]) if row[19] else None,
                'qsum': row[20],
                'rsum': row[21],
                'k': float(row[22]) if row[22] else None,
                'a95': float(row[23]) if row[23] else None,
                'b': row[24],
                'n': row[25],
            }
            results.append(result)
        
        cursor.close()
        conn.close()
        
        return JsonResponse({
            'columns': columns,
            'data': results,
            'count': len(results),
        })
        
    except Exception as e:
        if settings.DEBUG:
            print(f"API Search Error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_search_resultnos(request):
    """
    POST /api/search/resultnos/
    Body: {"resultNos": [1,2,3,...]}
    """
    try:
        data = json.loads(request.body or '{}')
        result_nos = data.get('resultNos', [])
        if not isinstance(result_nos, list) or len(result_nos) == 0:
            return JsonResponse({'error': 'resultNos is required'}, status=400)

        cleaned = []
        for value in result_nos:
            try:
                cleaned.append(int(value))
            except (TypeError, ValueError):
                continue

        if not cleaned:
            return JsonResponse({'error': 'No valid result numbers provided'}, status=400)

        conn = get_db_connection()
        cursor = conn.cursor()

        query_str = '''
            SELECT r."REFNO", pmr."RESULTNO", ru."ROCKNAME", r."YEAR", r."AUTHORS",
                r."JOURNAL", r."VOLUME", r."VPAGES", 
                ru."CONTINENT", ru."ROCKTYPE", ru."LOWAGE", ru."HIGHAGE", 
                pmr."LOMAGAGE", pmr."HIMAGAGE", pmr."SLAT", pmr."SLONG", pmr."PLAT", pmr."PLONG", 
                pmr."DP", pmr."DM", re."QSUM", re."RSUM", pmr."KD", pmr."ED95", pmr."B", pmr."N"
            FROM ((("ROCKUNIT" AS ru 
                INNER JOIN "REFERENCE" AS r ON r."REFNO" = ru."REFNO")
                INNER JOIN "PMAGRESULT" AS pmr ON ru."ROCKUNITNO" = pmr."ROCKUNITNO")
                INNER JOIN "RELIABILITY" AS re ON pmr."RESULTNO" = re."RESULTNO")
            WHERE pmr."RESULTNO" = ANY(%s)
            ORDER BY r."YEAR" DESC
        '''

        cursor.execute(query_str, (cleaned,))

        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor:
            result = {
                'refNo': row[0],
                'resultNo': row[1],
                'rockName': row[2],
                'year': row[3],
                'authors': row[4],
                'journal': row[5],
                'volume': row[6],
                'pages': row[7],
                'continent': row[8],
                'rockType': row[9],
                'lowAge': row[10],
                'highAge': row[11],
                'loMagAge': row[12],
                'hiMagAge': row[13],
                'sLat': float(row[14]) if row[14] else None,
                'sLon': float(row[15]) if row[15] else None,
                'pLat': float(row[16]) if row[16] else None,
                'pLon': float(row[17]) if row[17] else None,
                'dp': float(row[18]) if row[18] else None,
                'dm': float(row[19]) if row[19] else None,
                'qsum': row[20],
                'rsum': row[21],
                'k': float(row[22]) if row[22] else None,
                'a95': float(row[23]) if row[23] else None,
                'b': row[24],
                'n': row[25],
            }
            results.append(result)

        cursor.close()
        conn.close()

        return JsonResponse({
            'columns': columns,
            'data': results,
            'count': len(results),
        })

    except Exception as e:
        if settings.DEBUG:
            print(f"API Search ResultNos Error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


def build_where_clause(params):
    """Build SQL WHERE clause from query parameters."""
    conditions = []
    
    # Continent filter
    continent = params.get('continent')
    if continent:
        conditions.append(f"ru.\"CONTINENT\" ILIKE '%{continent}%'")
    
    # Rock type filter
    rocktype = params.get('rocktype')
    if rocktype:
        conditions.append(f"ru.\"ROCKTYPE\" ILIKE '%{rocktype}%'")
    
    # Rock age range
    rockage_min = params.get('rockage-min')
    rockage_max = params.get('rockage-max')
    if rockage_min and rockage_max:
        conditions.append(f'ru."LOWAGE" <= {rockage_max} AND ru."HIGHAGE" >= {rockage_min}')
    elif rockage_min:
        conditions.append(f'ru."HIGHAGE" >= {rockage_min}')
    elif rockage_max:
        conditions.append(f'ru."LOWAGE" <= {rockage_max}')
    
    # Magnetisation age range
    magage_min = params.get('magage-min')
    magage_max = params.get('magage-max')
    if magage_min and magage_max:
        conditions.append(f'pmr."LOMAGAGE" <= {magage_max} AND pmr."HIMAGAGE" >= {magage_min}')
    elif magage_min:
        conditions.append(f'pmr."HIMAGAGE" >= {magage_min}')
    elif magage_max:
        conditions.append(f'pmr."LOMAGAGE" <= {magage_max}')
    
    # Rock name filter
    rockname = params.get('rockname')
    if rockname:
        conditions.append(f"ru.\"ROCKNAME\" ILIKE '%{rockname}%'")
    
    # Reference number
    refno = params.get('refno')
    if refno:
        conditions.append(f'r."REFNO" = {refno}')
    
    # Result number
    resultno = params.get('resultno')
    if resultno:
        conditions.append(f'pmr."RESULTNO" = {resultno}')
    
    # Latitude range
    lat_min = params.get('lat-min')
    if lat_min:
        conditions.append(f'pmr."SLAT" >= {lat_min}')
    lat_max = params.get('lat-max')
    if lat_max:
        conditions.append(f'pmr."SLAT" <= {lat_max}')
    
    # Longitude range
    lon_min = params.get('lon-min')
    if lon_min:
        conditions.append(f'pmr."SLONG" >= {lon_min}')
    lon_max = params.get('lon-max')
    if lon_max:
        conditions.append(f'pmr."SLONG" <= {lon_max}')
    
    # Quality filters
    qsum_min = params.get('qsum-min')
    if qsum_min:
        conditions.append(f're."QSUM" >= {qsum_min}')
    
    rsum_min = params.get('rsum-min')
    if rsum_min:
        conditions.append(f're."RSUM" >= {rsum_min}')
    
    # K parameter range
    k_min = params.get('k-min')
    if k_min:
        conditions.append(f'pmr."KD" >= {k_min}')
    k_max = params.get('k-max')
    if k_max:
        conditions.append(f'pmr."KD" <= {k_max}')
    
    # A95 filter
    a95_max = params.get('a95-max')
    if a95_max:
        conditions.append(f'pmr."ED95" <= {a95_max}')
    
    # B filter
    b_min = params.get('b-min')
    if b_min:
        conditions.append(f'pmr."B" >= {b_min}')
    
    # N filter
    n_min = params.get('n-min')
    if n_min:
        conditions.append(f'pmr."N" >= {n_min}')
    
    if conditions:
        return ' WHERE ' + ' AND '.join(conditions)
    return ''


def api_continents(request):
    """GET /api/continents/ - Get list of distinct continents."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT DISTINCT "CONTINENT" FROM "ROCKUNIT" WHERE "CONTINENT" IS NOT NULL ORDER BY "CONTINENT"')
        
        continents = [row[0] for row in cursor if row[0]]
        
        cursor.close()
        conn.close()
        
        return JsonResponse({'continents': continents})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def api_rocktypes(request):
    """GET /api/rocktypes/ - Get list of distinct rock types."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT DISTINCT "ROCKTYPE" FROM "ROCKUNIT" WHERE "ROCKTYPE" IS NOT NULL ORDER BY "ROCKTYPE"')
        
        rocktypes = [row[0] for row in cursor if row[0]]
        
        cursor.close()
        conn.close()
        
        return JsonResponse({'rockTypes': rocktypes})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def api_references(request):
    """GET /api/references/ - Get list of references with optional filtering."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        limit = int(request.GET.get('limit', 100))
        offset = int(request.GET.get('offset', 0))
        
        query = '''
            SELECT "REFNO", "AUTHORS", "YEAR", "TITLE", "JOURNAL", "VOLUME", "VPAGES"
            FROM "REFERENCE"
        '''
        
        conditions = []
        year = request.GET.get('year')
        if year:
            conditions.append(f'"YEAR" = {year}')
        
        author = request.GET.get('author')
        if author:
            conditions.append(f'"AUTHORS" ILIKE \'%{author}%\'')
        
        if conditions:
            query += ' WHERE ' + ' AND '.join(conditions)
        
        query += f' ORDER BY "YEAR" DESC LIMIT {limit} OFFSET {offset}'
        
        cursor.execute(query)
        
        results = []
        for row in cursor:
            results.append({
                'refNo': row[0],
                'authors': row[1],
                'year': row[2],
                'title': row[3],
                'journal': row[4],
                'volume': row[5],
                'pages': row[6],
            })
        
        cursor.close()
        conn.close()
        
        return JsonResponse({
            'data': results,
            'count': len(results),
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def api_contribution(request):
    """POST /api/contribution/ - Submit a data contribution request."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    try:
        data = json.loads(request.body or '{}')
        
        # For now, just log the contribution request
        if settings.DEBUG:
            print(f"Contribution received: {data}")
        
        # Validate required fields
        if not data.get('doi'):
            return JsonResponse({'error': 'DOI is required'}, status=400)
        
        if not data.get('email'):
            return JsonResponse({'error': 'Email is required'}, status=400)

        def parse_optional_float(value):
            if value is None:
                return None
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                trimmed = value.strip()
                if trimmed == '':
                    return None
                try:
                    return float(trimmed)
                except ValueError:
                    return None
            return None

        def parse_optional_int(value):
            if value is None:
                return None
            if isinstance(value, bool):
                return int(value)
            if isinstance(value, int):
                return value
            if isinstance(value, float):
                return int(value) if value.is_integer() else None
            if isinstance(value, str):
                trimmed = value.strip()
                if trimmed == '':
                    return None
                try:
                    return int(trimmed)
                except ValueError:
                    return None
            return None

        # Map payload to database columns
        rlat = parse_optional_float(data.get('rlat'))
        rlong = parse_optional_float(data.get('rlong'))
        if rlat is None:
            rlat = parse_optional_float(data.get('lat'))
        if rlong is None:
            rlong = parse_optional_float(data.get('lon'))

        payload = {
            'doi': data.get('doi'),
            'rlat': rlat,
            'rlong': rlong,
            'email': data.get('email'),
            'rockname': data.get('rockname'),
            'age': parse_optional_float(data.get('age')),
            'comments': data.get('comments'),
            'place': data.get('place'),
            'continent': data.get('continent'),
            'terrane': data.get('terrane'),
            'rocktype': data.get('rocktype'),
            'stratage': data.get('stratage'),
            'lowage': parse_optional_float(data.get('lowage')),
            'highage': parse_optional_float(data.get('highage')),
            'method': data.get('method'),
            'lomagage': parse_optional_float(data.get('lomagage')),
            'himagage': parse_optional_float(data.get('himagage')),
            'tilt': parse_optional_float(data.get('tilt')),
            'tests': data.get('tests'),
            'slat': parse_optional_float(data.get('slat')),
            'slong': parse_optional_float(data.get('slong')),
            'ptype': data.get('ptype'),
            'demagcode': parse_optional_int(data.get('demagcode')),
            'treatment': data.get('treatment'),
            'noreversed': data.get('noreversed'),
            'authors': data.get('authors'),
            'years': parse_optional_int(data.get('year')),
            'journal': data.get('journal'),
            'vpages': data.get('vpages'),
            'title': data.get('title'),
            'remarks': data.get('remarks'),
        }

        conn = get_admin_connection()
        cursor = conn.cursor()
        query_str = (
            'INSERT INTO "CONTRIBUTIONS" '
            '(doi, rlat, rlong, email, rockname, age, comments, place, continent, terrane, '
            'rocktype, stratage, lowage, highage, method, lomagage, himagage, tilt, tests, '
            'slat, slong, ptype, demagcode, treatment, noreversed, authors, years, journal, vpages, title, remarks) '
            'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);'
        )
        cursor.execute(query_str, (
            payload['doi'],
            payload['rlat'],
            payload['rlong'],
            payload['email'],
            payload['rockname'],
            payload['age'],
            payload['comments'],
            payload['place'],
            payload['continent'],
            payload['terrane'],
            payload['rocktype'],
            payload['stratage'],
            payload['lowage'],
            payload['highage'],
            payload['method'],
            payload['lomagage'],
            payload['himagage'],
            payload['tilt'],
            payload['tests'],
            payload['slat'],
            payload['slong'],
            payload['ptype'],
            payload['demagcode'],
            payload['treatment'],
            payload['noreversed'],
            payload['authors'],
            payload['years'],
            payload['journal'],
            payload['vpages'],
            payload['title'],
            payload['remarks'],
        ))
        conn.commit()
        cursor.close()
        conn.close()

        return JsonResponse({
            'success': True,
            'message': 'Contribution submitted successfully. We will review it and contact you.',
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def api_search_polygon(request):
    """
    GET /api/search/polygon/
    Query param: polygon=[[lon,lat],[lon,lat],...] (JSON string)
    """
    try:
        polygon_str = request.GET.get('polygon')
        if not polygon_str:
            return JsonResponse({'error': 'Polygon parameter is missing'}, status=400)
            
        # Parse polygon
        polygon = json.loads(polygon_str)
        
        # Create WKT (Well Known Text) for PostGIS
        # Ensure the polygon is closed (first point = last point)
        if polygon[0] != polygon[-1]:
            polygon.append(polygon[0])
            
        polygon_wkt = "POLYGON((" + ", ".join(f"{point[0]} {point[1]}" for point in polygon) + "))"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query using ST_Within
        query_str = '''
            SELECT r."REFNO", pmr."RESULTNO", ru."ROCKNAME", r."YEAR", r."AUTHORS",
                r."JOURNAL", r."VOLUME", r."VPAGES", 
                ru."CONTINENT", ru."ROCKTYPE", ru."LOWAGE", ru."HIGHAGE", 
                pmr."LOMAGAGE", pmr."HIMAGAGE", pmr."SLAT", pmr."SLONG", pmr."PLAT", pmr."PLONG", 
                pmr."DP", pmr."DM", re."QSUM", re."RSUM", pmr."KD", pmr."ED95", pmr."B", pmr."N"
            FROM ((("ROCKUNIT" AS ru 
                INNER JOIN "REFERENCE" AS r ON r."REFNO" = ru."REFNO")
                INNER JOIN "PMAGRESULT" AS pmr ON ru."ROCKUNITNO" = pmr."ROCKUNITNO")
                INNER JOIN "RELIABILITY" AS re ON pmr."RESULTNO" = re."RESULTNO")
            WHERE ST_Within(ru.geom, ST_SetSRID(ST_GeomFromText(%s), 4326))
            ORDER BY r."YEAR" DESC
        '''
        
        cursor.execute(query_str, (polygon_wkt,))
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Build result list (same format as api_search)
        results = []
        for row in cursor:
            result = {
                'refNo': row[0],
                'resultNo': row[1],
                'rockName': row[2],
                'year': row[3],
                'authors': row[4],
                'journal': row[5],
                'volume': row[6],
                'pages': row[7],
                'continent': row[8],
                'rockType': row[9],
                'lowAge': row[10],
                'highAge': row[11],
                'loMagAge': row[12],
                'hiMagAge': row[13],
                'sLat': float(row[14]) if row[14] else None,
                'sLon': float(row[15]) if row[15] else None,
                'pLat': float(row[16]) if row[16] else None,
                'pLon': float(row[17]) if row[17] else None,
                'dp': float(row[18]) if row[18] else None,
                'dm': float(row[19]) if row[19] else None,
                'qsum': row[20],
                'rsum': row[21],
                'k': float(row[22]) if row[22] else None,
                'a95': float(row[23]) if row[23] else None,
                'b': row[24],
                'n': row[25],
            }
            results.append(result)
        
        cursor.close()
        conn.close()
        
        return JsonResponse({
            'columns': columns,
            'data': results,
            'count': len(results),
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_stereonet_stats(request):
    try:
        data = json.loads(request.body or '{}')
        stats_data = data.get("data", [])
        if not isinstance(stats_data, list):
            return JsonResponse({'error': 'Missing stats_data'}, status=400)

        calc = []
        all_circles = {}
        for row in stats_data:
            plong = row.get('PLONG')
            plat = row.get('PLAT')
            if plong is None or plat is None:
                continue
            calc.append([float(plong), float(plat)])

            dp = row.get('DP')
            dm = row.get('DM')
            resultno = row.get('RESULTNO')
            if dp is not None and dm is not None and resultno is not None:
                try:
                    a95 = math.sqrt(float(dp) * float(dm))
                    pointcoords = _circle(float(plong), float(plat), a95 * 111.32)
                    all_circles[str(resultno)] = mapping(pointcoords)
                except Exception:
                    pass

        if not calc:
            return JsonResponse({'error': 'No valid points provided'}, status=400)

        mean = fisher_mean(calc)
        circlecoords = mapping(_circle(mean['dec'], mean['inc'], mean['alpha95'] * 111.32))

        return JsonResponse({
            'calculations': mean,
            'circle': circlecoords,
            'pointcircle': all_circles,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_stereonet_selected_means(request):
    try:
        data = json.loads(request.body or '{}')
        points = data.get("data", {})

        calc = []
        if isinstance(points, list):
            iterable = points
        else:
            iterable = points.values()

        for row in iterable:
            plong = row.get('PLONG')
            plat = row.get('PLAT')
            if plong is None or plat is None:
                continue
            calc.append([float(plong), float(plat)])

        if not calc:
            return JsonResponse({'error': 'No valid points provided'}, status=400)

        mean = fisher_mean(calc)
        circlecoords = mapping(_circle(mean['dec'], mean['inc'], mean['alpha95'] * 111.32))
        return JsonResponse({'calculations': mean, 'circle': circlecoords})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_stereonet_plotted_mean(request):
    try:
        data = json.loads(request.body or '{}')
        point = data.get("data", {})
        plong = point.get('PLONG')
        plat = point.get('PLAT')
        a95 = point.get('a95')
        if plong is None or plat is None or a95 is None:
            return JsonResponse({'error': 'Missing PLONG/PLAT/a95'}, status=400)

        pointcoords = mapping(_circle(float(plong), float(plat), float(a95) * 111.32))
        return JsonResponse({'circle': pointcoords})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
