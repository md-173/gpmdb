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

# Database connection strings (same as views.py)
conn_string = "host='localhost' dbname='GD2021' user='gpmdb' password='gpmdb' port=5432"


def get_db_connection():
    """Get a database connection."""
    return psycopg2.connect(conn_string)


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
        query_str += ' ORDER BY r."YEAR" DESC LIMIT 1000'
        
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
        data = json.loads(request.body)
        
        # For now, just log the contribution request
        if settings.DEBUG:
            print(f"Contribution received: {data}")
        
        # Validate required fields
        if not data.get('doi'):
            return JsonResponse({'error': 'DOI is required'}, status=400)
        
        if not data.get('email'):
            return JsonResponse({'error': 'Email is required'}, status=400)
        
        # TODO: Save to database or send notification email
        
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
            ORDER BY r."YEAR" DESC LIMIT 1000
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
