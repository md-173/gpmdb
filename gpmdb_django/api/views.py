"""
API views for GPMDB.
 
Provides JSON endpoints for python package access to the paleomagnetic database.
"""
 
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import connection
 
 
def api_response(data=None, columns=None, count=None, error=None, status=200):
    """
    Create a standardized API response.
    
    All API endpoints use this to ensure consistent response format.
    
    Success response:
        {"success": true, "data": [...], "columns": [...], "count": 123}
    
    Error response:
        {"success": false, "error": "Error message"}
    """
    response = {
        "success": error is None,
    }
    
    if data is not None:
        response["data"] = data
    if columns is not None:
        response["columns"] = columns
    if count is not None:
        response["count"] = count
    if error is not None:
        response["error"] = error
        
    return JsonResponse(response, status=status)
 
 
@require_http_methods(["GET"])
def metadata(request):
    """
    GET /api/v1/metadata/
    
    Returns database name and api version
    """
    return api_response(data={
        "name": "Global Paleomagnetic Database",
        "api_version": "1.0",
    })
 
 
@require_http_methods(["GET"])
def query(request):
    """
    GET /api/v1/query/
    
    Main query endpoint for retrieving paleomagnetic data.
    
    Query Parameters
    ----------------
    Location Filters:
        CONTINENT   : str   - Filter by continent (partial match, case-insensitive)
        LAT_MIN     : float - Minimum site latitude
        LAT_MAX     : float - Maximum site latitude
        LON_MIN     : float - Minimum site longitude
        LON_MAX     : float - Maximum site longitude
    
    Rock Property Filters:
        ROCKTYPE    : str   - Filter by rock type (partial match, case-insensitive)
        ROCKNAME    : str   - Filter by rock name (partial match, case-insensitive)
    
    Age Filters:
        AGE_MIN     : float - Minimum rock age in Ma
        AGE_MAX     : float - Maximum rock age in Ma
        MAGAGE_MIN  : float - Minimum magnetic age in Ma
        MAGAGE_MAX  : float - Maximum magnetic age in Ma
    
    Paleomagnetic Data Filters:
        DEC_MIN     : float - Minimum declination (degrees)
        DEC_MAX     : float - Maximum declination (degrees)
        INC_MIN     : float - Minimum inclination (degrees)
        INC_MAX     : float - Maximum inclination (degrees)
        PLAT_MIN    : float - Minimum pole latitude
        PLAT_MAX    : float - Maximum pole latitude
        PLON_MIN    : float - Minimum pole longitude
        PLON_MAX    : float - Maximum pole longitude
        K_MIN       : float - Minimum Fisher K parameter
        K_MAX       : float - Maximum Fisher K parameter
        A95_MIN     : float - Minimum alpha-95
        A95_MAX     : float - Maximum alpha-95
        DP_MIN      : float - Minimum DP (semi-axis of confidence ellipse)
        DP_MAX      : float - Maximum DP
        DM_MIN      : float - Minimum DM (semi-axis of confidence ellipse)
        DM_MAX      : float - Maximum DM
    
    Quality Filters:
        QSUM_MIN    : float - Minimum Q quality score
        RSUM_MIN    : float - Minimum R reliability score
    
    Reference Filters:
        REFNO       : int   - Filter by reference number (exact match)
        RESULTNO    : int   - Filter by result number (exact match)
        YEAR_MIN    : int   - Minimum publication year
        YEAR_MAX    : int   - Maximum publication year
        AUTHORS     : str   - Filter by author name (partial match)
        JOURNAL     : str   - Filter by journal name (partial match)
    
    Pagination:
        limit       : int   - Maximum results (default 10000, max 50000)
        offset      : int   - Pagination offset (default 0)
    
    Returns
    -------
    JSON response with:
        - success: bool
        - data: list of rows
        - columns: list of column names
        - count: number of results
    """
    params = request.GET
    
    # Base query - joins the main tables
    base_query = '''
        SELECT 
            r."REFNO", 
            pmr."RESULTNO", 
            ru."ROCKNAME", 
            r."YEAR", 
            r."AUTHORS",
            r."JOURNAL", 
            r."VOLUME", 
            r."VPAGES", 
            ru."CONTINENT", 
            ru."ROCKTYPE", 
            ru."LOWAGE", 
            ru."HIGHAGE", 
            pmr."LOMAGAGE", 
            pmr."HIMAGAGE", 
            pmr."SLAT", 
            pmr."SLONG", 
            pmr."PLAT", 
            pmr."PLONG", 
            pmr."DP", 
            pmr."DM",
            pmr."DEC",
            pmr."INC",
            pmr."KD",
            pmr."ED95",
            re."QSUM", 
            re."RSUM"
        FROM "ROCKUNIT" AS ru 
        LEFT JOIN "REFERENCE" AS r ON r."REFNO" = ru."REFNO"
        LEFT JOIN "PMAGRESULT" AS pmr ON ru."ROCKUNITNO" = pmr."ROCKUNITNO"
        LEFT JOIN "RELIABILITY" AS re ON pmr."RESULTNO" = re."RESULTNO"
    '''
    
    # Build WHERE clauses with parameterized queries
    where_clauses = []
    query_params = []
    
    # =========================================================================
    # LOCATION FILTERS
    # =========================================================================
    
    # CONTINENT filter (partial match, case-insensitive)
    if params.get('CONTINENT'):
        where_clauses.append('ru."CONTINENT" ILIKE %s')
        query_params.append(f'%{params["CONTINENT"]}%')
    
    # LAT_MIN filter (site latitude)
    if params.get('LAT_MIN'):
        try:
            lat_min = float(params['LAT_MIN'])
            where_clauses.append('pmr."SLAT" >= %s')
            query_params.append(lat_min)
        except ValueError:
            return api_response(error="LAT_MIN must be numeric", status=400)
    
    # LAT_MAX filter (site latitude)
    if params.get('LAT_MAX'):
        try:
            lat_max = float(params['LAT_MAX'])
            where_clauses.append('pmr."SLAT" <= %s')
            query_params.append(lat_max)
        except ValueError:
            return api_response(error="LAT_MAX must be numeric", status=400)
    
    # LON_MIN filter (site longitude)
    if params.get('LON_MIN'):
        try:
            lon_min = float(params['LON_MIN'])
            where_clauses.append('pmr."SLONG" >= %s')
            query_params.append(lon_min)
        except ValueError:
            return api_response(error="LON_MIN must be numeric", status=400)
    
    # LON_MAX filter (site longitude)
    if params.get('LON_MAX'):
        try:
            lon_max = float(params['LON_MAX'])
            where_clauses.append('pmr."SLONG" <= %s')
            query_params.append(lon_max)
        except ValueError:
            return api_response(error="LON_MAX must be numeric", status=400)
    
    # =========================================================================
    # ROCK PROPERTY FILTERS
    # =========================================================================
    
    # ROCKTYPE filter (partial match, case-insensitive)
    if params.get('ROCKTYPE'):
        where_clauses.append('ru."ROCKTYPE" ILIKE %s')
        query_params.append(f'%{params["ROCKTYPE"]}%')
    
    # ROCKNAME filter (partial match, case-insensitive)
    if params.get('ROCKNAME'):
        where_clauses.append('ru."ROCKNAME" ILIKE %s')
        query_params.append(f'%{params["ROCKNAME"]}%')
    
    # =========================================================================
    # AGE FILTERS
    # =========================================================================
    
    # AGE_MIN filter (rock age - minimum)
    if params.get('AGE_MIN'):
        try:
            age_min = float(params['AGE_MIN'])
            where_clauses.append('ru."HIGHAGE" >= %s')
            query_params.append(age_min)
        except ValueError:
            return api_response(error="AGE_MIN must be numeric", status=400)
    
    # AGE_MAX filter (rock age - maximum)
    if params.get('AGE_MAX'):
        try:
            age_max = float(params['AGE_MAX'])
            where_clauses.append('ru."LOWAGE" <= %s')
            query_params.append(age_max)
        except ValueError:
            return api_response(error="AGE_MAX must be numeric", status=400)
    
    # MAGAGE_MIN filter (magnetic age - minimum)
    if params.get('MAGAGE_MIN'):
        try:
            magage_min = float(params['MAGAGE_MIN'])
            where_clauses.append('pmr."HIMAGAGE" >= %s')
            query_params.append(magage_min)
        except ValueError:
            return api_response(error="MAGAGE_MIN must be numeric", status=400)
    
    # MAGAGE_MAX filter (magnetic age - maximum)
    if params.get('MAGAGE_MAX'):
        try:
            magage_max = float(params['MAGAGE_MAX'])
            where_clauses.append('pmr."LOMAGAGE" <= %s')
            query_params.append(magage_max)
        except ValueError:
            return api_response(error="MAGAGE_MAX must be numeric", status=400)
    
    # =========================================================================
    # PALEOMAGNETIC DATA FILTERS
    # =========================================================================
    
    # DEC_MIN filter (declination)
    if params.get('DEC_MIN'):
        try:
            dec_min = float(params['DEC_MIN'])
            where_clauses.append('pmr."DEC" >= %s')
            query_params.append(dec_min)
        except ValueError:
            return api_response(error="DEC_MIN must be numeric", status=400)
    
    # DEC_MAX filter (declination)
    if params.get('DEC_MAX'):
        try:
            dec_max = float(params['DEC_MAX'])
            where_clauses.append('pmr."DEC" <= %s')
            query_params.append(dec_max)
        except ValueError:
            return api_response(error="DEC_MAX must be numeric", status=400)
    
    # INC_MIN filter (inclination)
    if params.get('INC_MIN'):
        try:
            inc_min = float(params['INC_MIN'])
            where_clauses.append('pmr."INC" >= %s')
            query_params.append(inc_min)
        except ValueError:
            return api_response(error="INC_MIN must be numeric", status=400)
    
    # INC_MAX filter (inclination)
    if params.get('INC_MAX'):
        try:
            inc_max = float(params['INC_MAX'])
            where_clauses.append('pmr."INC" <= %s')
            query_params.append(inc_max)
        except ValueError:
            return api_response(error="INC_MAX must be numeric", status=400)
    
    # PLAT_MIN filter (pole latitude)
    if params.get('PLAT_MIN'):
        try:
            plat_min = float(params['PLAT_MIN'])
            where_clauses.append('pmr."PLAT" >= %s')
            query_params.append(plat_min)
        except ValueError:
            return api_response(error="PLAT_MIN must be numeric", status=400)
    
    # PLAT_MAX filter (pole latitude)
    if params.get('PLAT_MAX'):
        try:
            plat_max = float(params['PLAT_MAX'])
            where_clauses.append('pmr."PLAT" <= %s')
            query_params.append(plat_max)
        except ValueError:
            return api_response(error="PLAT_MAX must be numeric", status=400)
    
    # PLON_MIN filter (pole longitude)
    if params.get('PLON_MIN'):
        try:
            plon_min = float(params['PLON_MIN'])
            where_clauses.append('pmr."PLONG" >= %s')
            query_params.append(plon_min)
        except ValueError:
            return api_response(error="PLON_MIN must be numeric", status=400)
    
    # PLON_MAX filter (pole longitude)
    if params.get('PLON_MAX'):
        try:
            plon_max = float(params['PLON_MAX'])
            where_clauses.append('pmr."PLONG" <= %s')
            query_params.append(plon_max)
        except ValueError:
            return api_response(error="PLON_MAX must be numeric", status=400)
    
    # K_MIN filter (Fisher K parameter)
    if params.get('K_MIN'):
        try:
            k_min = float(params['K_MIN'])
            where_clauses.append('pmr."KD" >= %s')
            query_params.append(k_min)
        except ValueError:
            return api_response(error="K_MIN must be numeric", status=400)
    
    # K_MAX filter (Fisher K parameter)
    if params.get('K_MAX'):
        try:
            k_max = float(params['K_MAX'])
            where_clauses.append('pmr."KD" <= %s')
            query_params.append(k_max)
        except ValueError:
            return api_response(error="K_MAX must be numeric", status=400)
    
    # A95_MIN filter (alpha-95)
    if params.get('A95_MIN'):
        try:
            a95_min = float(params['A95_MIN'])
            where_clauses.append('pmr."ED95" >= %s')
            query_params.append(a95_min)
        except ValueError:
            return api_response(error="A95_MIN must be numeric", status=400)
    
    # A95_MAX filter (alpha-95)
    if params.get('A95_MAX'):
        try:
            a95_max = float(params['A95_MAX'])
            where_clauses.append('pmr."ED95" <= %s')
            query_params.append(a95_max)
        except ValueError:
            return api_response(error="A95_MAX must be numeric", status=400)
    
    # DP_MIN filter
    if params.get('DP_MIN'):
        try:
            dp_min = float(params['DP_MIN'])
            where_clauses.append('pmr."DP" >= %s')
            query_params.append(dp_min)
        except ValueError:
            return api_response(error="DP_MIN must be numeric", status=400)
    
    # DP_MAX filter
    if params.get('DP_MAX'):
        try:
            dp_max = float(params['DP_MAX'])
            where_clauses.append('pmr."DP" <= %s')
            query_params.append(dp_max)
        except ValueError:
            return api_response(error="DP_MAX must be numeric", status=400)
    
    # DM_MIN filter
    if params.get('DM_MIN'):
        try:
            dm_min = float(params['DM_MIN'])
            where_clauses.append('pmr."DM" >= %s')
            query_params.append(dm_min)
        except ValueError:
            return api_response(error="DM_MIN must be numeric", status=400)
    
    # DM_MAX filter
    if params.get('DM_MAX'):
        try:
            dm_max = float(params['DM_MAX'])
            where_clauses.append('pmr."DM" <= %s')
            query_params.append(dm_max)
        except ValueError:
            return api_response(error="DM_MAX must be numeric", status=400)
    
    # =========================================================================
    # QUALITY FILTERS
    # =========================================================================
    
    # QSUM_MIN filter (Q quality score)
    if params.get('QSUM_MIN'):
        try:
            qsum_min = float(params['QSUM_MIN'])
            where_clauses.append('re."QSUM" >= %s')
            query_params.append(qsum_min)
        except ValueError:
            return api_response(error="QSUM_MIN must be numeric", status=400)
    
    # RSUM_MIN filter (R reliability score)
    if params.get('RSUM_MIN'):
        try:
            rsum_min = float(params['RSUM_MIN'])
            where_clauses.append('re."RSUM" >= %s')
            query_params.append(rsum_min)
        except ValueError:
            return api_response(error="RSUM_MIN must be numeric", status=400)
    
    # =========================================================================
    # REFERENCE FILTERS
    # =========================================================================
    
    # REFNO filter (exact match)
    if params.get('REFNO'):
        try:
            refno = int(params['REFNO'])
            where_clauses.append('r."REFNO" = %s')
            query_params.append(refno)
        except ValueError:
            return api_response(error="REFNO must be an integer", status=400)
    
    # RESULTNO filter (exact match)
    if params.get('RESULTNO'):
        try:
            resultno = int(params['RESULTNO'])
            where_clauses.append('pmr."RESULTNO" = %s')
            query_params.append(resultno)
        except ValueError:
            return api_response(error="RESULTNO must be an integer", status=400)
    
    # YEAR_MIN filter (publication year)
    if params.get('YEAR_MIN'):
        try:
            year_min = int(params['YEAR_MIN'])
            where_clauses.append('r."YEAR" >= %s')
            query_params.append(year_min)
        except ValueError:
            return api_response(error="YEAR_MIN must be an integer", status=400)
    
    # YEAR_MAX filter (publication year)
    if params.get('YEAR_MAX'):
        try:
            year_max = int(params['YEAR_MAX'])
            where_clauses.append('r."YEAR" <= %s')
            query_params.append(year_max)
        except ValueError:
            return api_response(error="YEAR_MAX must be an integer", status=400)
    
    # AUTHORS filter (partial match, case-insensitive)
    if params.get('AUTHORS'):
        where_clauses.append('r."AUTHORS" ILIKE %s')
        query_params.append(f'%{params["AUTHORS"]}%')
    
    # JOURNAL filter (partial match, case-insensitive)
    if params.get('JOURNAL'):
        where_clauses.append('r."JOURNAL" ILIKE %s')
        query_params.append(f'%{params["JOURNAL"]}%')
    
    # =========================================================================
    # BUILD FINAL QUERY
    # =========================================================================
    
    # Combine WHERE clauses
    if where_clauses:
        base_query += ' WHERE ' + ' AND '.join(where_clauses)
    
    # Add ordering (most recent publications first)
    base_query += ' ORDER BY r."YEAR" DESC'
    
    # Pagination parameters
    try:
        limit = int(params.get('limit', 10000))
        offset = int(params.get('offset', 0))
        limit = min(limit, 50000)  # Cap at 50k to prevent server overload
    except ValueError:
        return api_response(error="limit and offset must be integers", status=400)
    
    # Add pagination to query
    base_query += ' LIMIT %s OFFSET %s'
    query_params.extend([limit, offset])
    
    # =========================================================================
    # EXECUTE QUERY USING DJANGO'S CONNECTION
    # =========================================================================
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(base_query, query_params)
            
            # Get column names from cursor description
            columns = [desc[0] for desc in cursor.description]
            
            # Fetch all rows and convert to lists (JSON serializable)
            rows = [list(row) for row in cursor.fetchall()]
        
        return api_response(
            data=rows,
            columns=columns,
            count=len(rows),
        )
        
    except Exception as e:
        return api_response(error=f"Database error: {str(e)}", status=500)