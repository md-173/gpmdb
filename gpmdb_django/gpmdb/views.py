from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.conf import settings
from django.http import JsonResponse
from django.contrib.gis.geos import Polygon
from .models import MyModel  # Import your model
from django.db import connection
from django.views.decorators.csrf import csrf_exempt  # Only if you're not using CSRF protection during testing
from pmagpy.ipmag import plot_net, plot_di
from pmagpy.pmag import dia_vgp
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import mplstereonet
import io
import base64
import logging, json, psycopg2, csv
import pandas as pd
import time
import math
from sphstat.utils import readsample, convert, polartocart, sph2cart, prettyprintdict
from sphstat.descriptives import resultants, mediandir
from sphstat.singlesample import isfisher
import numpy as np
from pmagpy.pmag import fisher_mean
from shapely.geometry import LineString
from shapely.geometry import mapping
import os

#the password here is no secret, read-only user
#in the future, if you need more priviledge, use local peer auth. See /etc/postgresql/12/main/pg_hba.conf
DB_NAME = os.environ.get("DB_NAME", "GD2021")
DB_USER = os.environ.get("DB_USER", "gpmdb")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "gpmdb")
DB_ADMIN_USER = os.environ.get("DB_ADMIN_USER", "gpmdbadmin")
DB_ADMIN_PASSWORD = os.environ.get("DB_ADMIN_PASSWORD", "admin")
DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_PORT = os.environ.get("DB_PORT", "5432")

conn_string = f"host='{DB_HOST}' dbname='{DB_NAME}' user='{DB_USER}' password='{DB_PASSWORD}' port={DB_PORT}"
conn_string_admin = f"host='{DB_HOST}' dbname='{DB_NAME}' user='{DB_ADMIN_USER}' password='{DB_ADMIN_PASSWORD}' port={DB_PORT}"
#
# return the front page
#
def select_points(request):
    if request.method == 'POST' and request.is_ajax():
        # Retrieve the GeoJSON data from the request
        geo_data = request.POST.get('geo_data')

        if not geo_data:
            return JsonResponse({"error": "Geo data not provided"}, status=400)

        # Query the database using ST_Within to find points inside the polygon
        query = """
            SELECT * FROM rockunit
            WHERE ST_Within(geom, ST_GeomFromGeoJSON(%s));
        """
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, [geo_data])
                rows = cursor.fetchall()

            # Convert database results to a list of dicts
            results = [{"id": row[0], "name": row[1], "coords": row[2]} for row in rows]
            return JsonResponse(results, safe=False)

        except Exception as e:
            return JsonResponse({"error": f"Database query failed: {str(e)}"}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)
def save_polygon(request):
    if request.method == 'POST':
        try:
            # Get the polygon data from the request (assuming it's in GeoJSON format)
            polygon_data = json.loads(request.body)  # Parse the GeoJSON string to a Python object
            coordinates = polygon_data['polygon']['coordinates'][0]  # Extracting the first ring of coordinates (the exterior of the polygon)

            # Convert the coordinates to a Polygon object
            polygon = Polygon(coordinates)

            # Save the polygon to the database using Django model (assuming you have a field 'polygon' in your model)
            polygon_instance = MyModel(polygon=polygon)  # Assuming 'polygon' is a field in your model
            polygon_instance.save()

            # Optionally, if you want to make some database queries, you can use psycopg2 to connect to PostgreSQL
            # Example query to check if the connection works
            conn = psycopg2.connect(conn_string)
            cursor = conn.cursor()
            cursor.execute("SELECT NOW();")  # Example query to check if database connection works
            result = cursor.fetchone()
            logging.info(f"Database connection successful: {result[0]}")
            cursor.close()
            conn.close()

            return JsonResponse({'status': 'success', 'message': 'Polygon saved successfully'}, status=200)
        except Exception as e:
            logging.error(f"Error saving polygon: {str(e)}")
            return JsonResponse({'status': 'error', 'message': f'Error saving polygon: {str(e)}'}, status=500)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)
    
# @login_required()
def addition(request):

    print("test")
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    cursor.execute("Select * FROM \"CONTRIBUTIONS\"")
    data = []
    for row in cursor:
        print(row)
        data.append({
            "doi": row[0],
            "r_lat": row[1],
            "r_long": row[2],
            "email": row[3],
            "rockname": row[4],
            "age": row[5],
            "place": row[6],
            "continent": row[7],
            "terrane": row[8],
            "rocktype": row[8],
            "stratage": row[10],
            "lowage": row[11],
            "highage": row[12],
            "method": row[13],
            "lomagage": row[14],
            "himagage": row[15],
            "tilt": row[16],
            "tests": row[17],
            "slat": row[18],
            "slong": row[19],
            "ptype": row[20],
            "demagcode": row[21],
            "treatment": row[22],
            "noreversed": row[23],
            "authors": row[24],
            "years": row[26],
            "journal": row[27],
            "vpages": row[28],
            "title": row[29],
            "remarks": row[30],
        })
        
    print(data)

    return render(request, 'gpmdb2.html', {'rows': data})

def index(request):
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    cursor.execute("Select count(*) FROM \"PMAGRESULT\"")
    poles = cursor.fetchone()[0]

    cursor.execute("Select count(*) FROM \"REFERENCE\"")
    studies = cursor.fetchone()[0]

    cursor.execute("Select count(*) FROM \"ROCKUNIT\"")
    sites = cursor.fetchone()[0]


    return render(
        request,
        'gpmdb.html',
        {
            'poles': poles,
            'sites': sites,
            'studies': studies
        }
    )

#
# Return all ROCKUNIT points
#
def get_data(request):
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    try:
        cursor.execute('''
            select ru.\"ROCKUNITNO\", ru.\"ROCKNAME\",ru.\"RLONG\", ru.\"RLAT\", array_agg(pmr.\"RESULTNO\") 
            from (\"ROCKUNIT\" ru inner join \"PMAGRESULT\" pmr on ru.\"ROCKUNITNO\" = pmr.\"ROCKUNITNO\") 
            group by ru.\"ROCKUNITNO\"'''
            )
    except psycopg2.Error as e:
        print(e.pgerror)
        print(e.diag.message_detail)
        

    data=[]
    for row in cursor:
        data.append({ 
                    "type": "Feature",
                    "properties": {
                        "ROCKUNITNO": row[0],
                        "ROCKNAME" : row[1],
                        "PMAGRESULTCOUNT": row[4]
                    },
                    "geometry":{
                        "type": "Point",
                        "coordinates": [row[2],row[3]]
                    }
        })

    ret = json.dumps(data)

    return HttpResponse(ret, content_type='application/json')

#
# return page http://localhost:5555/tables
#
def tables(request):
    tables = ['ALTRESULT','CONTINENTS','COUNTRY','CROSSREF','FIELDTESTS',
        'INFORMATION','JOURNAL','PMAGRESULT','REFERENCE','ROCKUNIT','TERRANE','TIMESCALE', 'RELIABILITY']
    ret = json.dumps(tables)
    return HttpResponse(ret, content_type='application/json')


#
# return page http://localhost:5555/PMAGRESULT/?ROCKUNITNO=237
#
def PMAGRESULT(request):
    ROCKUNITNO = request.GET.get('ROCKUNITNO', None)
    return render(
        request,
        'PMAGRESULT.html',
        {
            'ROCKUNITNO': ROCKUNITNO
        }
    )


#
# return page http://localhost:5555/table?name=COUNTRY
#
def table(request):
    table_name = request.GET.get('name', 'PMAGRESULT')
    return render(
        request,
        'table.html',
        {
            'table_name': table_name
        }
    )


#
# retrieve PMAGRESULT data given a ROCKUNITNO
#
def get_PMAGRESULT_data(request):
    rock_unit_no = request.GET.get('ROCKUNITNO', None)
    fmt = request.GET.get('fmt', 'csv')

    if rock_unit_no=='None':
        rock_unit_no = None

    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    columns_str = '''\"ROCKUNITNO\",\"RESULTNO\",\"COMPONENT\",\"LOMAGAGE\",\"HIMAGAGE\",\"TESTS\",
    \"TILT\",\"SLAT\",\"SLONG\",\"B\",\"N\",\"DEC\",\"INC\",\"KD\",\"ED95\",\"PLAT\",\"PLONG\",
    \"PTYPE\",\"DP\",\"DM\",\"NOREVERSED\",\"ANTIPODAL\",\"N_NORM\",\"D_NORM\",  \"I_NORM\",
    \"K_NORM\",\"ED_NORM\",\"N_REV\",\"D_REV\",\"I_REV\",\"K_REV\",\"ED_REV\",\"DEMAGCODE\",
    \"TREATMENT\",\"ROCKMAG\",\"LABDETAILS\",\"N_TILT\", \"D_UNCOR\",\"I_UNCOR\",\"K1\",\"ED1\",
    \"D_COR\",\"I_COR\",\"K2\",\"ED2\",\"COMMENTS\", \"STATUS\" '''

    if rock_unit_no:
        cursor.execute("select "+columns_str+" from \"PMAGRESULT\" where \"ROCKUNITNO\" =  \'{0}\';".format(rock_unit_no))
    else:
        cursor.execute("select "+columns_str+" from \"PMAGRESULT\";")
    
    columns = [[desc[0]] for desc in cursor.description]

    if fmt=='csv':
        response = HttpResponse(
            content_type='text/csv'
        )
        response['Content-Disposition'] = 'attachment; filename="PMAGRESULT.csv"'

        writer = csv.writer(response)
        print([c[0] for c in columns])
        writer.writerow([c[0] for c in columns])

        for row in cursor:
            writer.writerow(row)

        return response
    else: #json
        data={}
        data["columns"] = columns
        data["data"] = []
        for row in cursor:
            data["data"].append(list(row))
        ret = json.dumps(data)

        return HttpResponse(ret, content_type='application/json')


#
# retrieve data from a given table
#
def get_table_data(request):
    table_name = request.GET.get('table', None)
    fmt = request.GET.get('fmt', 'json')

    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    cursor.execute(f'select * from \"{table_name}\"')
    
    columns = [[desc[0]] for desc in cursor.description]

    if fmt=='csv':
        response = HttpResponse(
            content_type='text/csv'
        )
        response['Content-Disposition']= f'attachment; filename="{table_name}.csv"'

        writer = csv.writer(response)
        print([c[0] for c in columns])
        writer.writerow([c[0] for c in columns])

        for row in cursor:
            writer.writerow(row)

        return response
    else: #json
        data={}
        data["columns"] = columns
        data["data"] = []
        for row in cursor:
            data["data"].append(list(row))
        ret = json.dumps(data)

        return HttpResponse(ret, content_type='application/json')

#
# build the 'where' clause from the request
#
def build_query_string(request):
    where_or_and = 'where'
    rockage_done = False
    magage_done = False
    query_str = ''
    for key, value in request.GET.items():
        if key == 'continent':
            query_str+=f' {where_or_and} ru.\"CONTINENT\" like \'%{value}%\''
            
        if key == 'rocktype':
            query_str+=f' {where_or_and} ru.\"ROCKTYPE\" like \'%{value}%\''
        
        if (key == 'rockage-min' or key == 'rockage-max') and not rockage_done:
            rockage_max = request.GET.get('rockage-max', None)
            rockage_min = request.GET.get('rockage-min', None)
            if rockage_max is not None and rockage_min is not None:
                query_str+=f' {where_or_and} ru.\"LOWAGE\" <= {rockage_max} and ru.\"HIGHAGE\" >= {rockage_min}'
            elif rockage_min is not None:
                query_str+=f' {where_or_and} ru.\"HIGHAGE\" >= {rockage_min}'
            elif rockage_max is not None:
                query_str+=f' {where_or_and} ru.\"LOWAGE\" <= {rockage_max}'
            rockage_done = True

        if (key == 'magage-min' or key == 'magage-max') and not magage_done:
            magage_max = request.GET.get('magage-max', None)
            magage_min = request.GET.get('magage-min', None)
            if magage_max is not None and magage_min is not None:
                query_str+=f' {where_or_and} pmr.\"LOMAGAGE\" <= {magage_max} and pmr.\"HIMAGAGE\" >= {magage_min}'
            elif magage_min is not None:
                query_str+=f' {where_or_and} pmr.\"HIMAGAGE\" >= {magage_min}'
            elif magage_max is not None:
                query_str+=f' {where_or_and} pmr.\"LOMAGAGE\" <= {magage_max}'
            magage_done = True
            
        if key == 'rockname':
           query_str+=f' {where_or_and} ru.\"ROCKNAME\" like \'%{value}%\''
           
        if key == 'refno':
            query_str+=f' {where_or_and} r.\"REFNO\" = {value}'
           
        if key == 'resultno':
            query_str+=f' {where_or_and} pmr.\"RESULTNO\" = {value}'

        if key == 'lat-min':
            query_str+=f' {where_or_and} pmr.\"SLAT\" >= {value}'

        if key == 'lat-max':
            query_str+=f' {where_or_and} pmr.\"SLAT\" <= {value}'
        
        if key == 'lon-min':
            query_str+=f' {where_or_and} pmr.\"SLONG\" >= {value}'
        
        if key == 'lon-max':
            query_str+=f' {where_or_and} pmr.\"SLONG\" <= {value}'

        if key == 'qsum-min':
            query_str+=f' {where_or_and} re.\"QSUM\" >= {value}'

        if key == 'rsum-min':
            query_str+=f' {where_or_and} re.\"RSUM\" >= {value}'

        if key == 'k-min':
            query_str+=f' {where_or_and} pmr.\"KD\" >= {value}'

        if key == 'k-max':
            query_str+=f' {where_or_and} pmr.\"KD\" <= {value}'

        if key == 'a95-min':
            query_str+=f' {where_or_and} pmr.\"ED95\" >= {value}'

        if key == 'a95-max':
            query_str+=f' {where_or_and} pmr.\"ED95\" <= {value}'
            
            
        where_or_and = 'and'
    return query_str

#
# handle the main query 
#
def get_query_data(request):
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    query_str = '''
        Select r.\"REFNO\", pmr.\"RESULTNO\", ru.\"ROCKNAME\", r.\"YEAR\", r.\"AUTHORS\",
            r.\"JOURNAL\", r.\"VOLUME\", r.\"VPAGES\", 
            ru.\"CONTINENT\", ru.\"ROCKTYPE\", ru.\"LOWAGE\", ru.\"HIGHAGE\", 
            pmr.\"LOMAGAGE\", pmr.\"HIMAGAGE\", pmr.\"SLAT\", pmr.\"SLONG\", pmr.\"PLAT\", pmr.\"PLONG\", 
            pmr.\"DP\", pmr.\"DM\", re.\"QSUM\", re.\"RSUM\"
        FROM (((\"ROCKUNIT\" AS ru 
            INNER JOIN \"REFERENCE\" AS r ON r.\"REFNO\" = ru.\"REFNO\")
            INNER JOIN \"PMAGRESULT\" AS pmr ON ru.\"ROCKUNITNO\" = pmr.\"ROCKUNITNO\")
            INNER JOIN \"RELIABILITY\" AS re ON pmr.\"RESULTNO\" = re.\"RESULTNO\") '''

    query_str+=build_query_string(request)

    query_str+=' order by r.\"YEAR\";'

    if settings.DEBUG:
        print(query_str)
    cursor.execute(query_str)

    data={}
    data["columns"] = [[desc[0]] for desc in cursor.description]
    data["data"] = []
    stats_data=[]
    #histogram_data=[]
    print(data["columns"])    
    for row in cursor:

        data["data"].append(list(row))

        print(row)


        stats_data.append({
            "PLAT": row[16],  # Paleolatitude
            "PLONG": row[17],  # Paleolongitude
            "LOMAGAGE": row[12],
            "HIMAGAGE": row[13],
            "DP": row[18],     # Confidence radius in latitude
            "DM": row[19],
            "SLAT": row[14],
            "SLONG": row[15],
            "ROCKNAME": row[2],
            "REFNO": row[0],
            "RESULTNO": row[1],
            "YEAR": row[3],
            "AURTHORS": row[4],
            "JOURNAL": row[5],
            "VOLUME": row[6],
            "VPAGES": row[7],
            "CONTINENT": row[8],
            "ROCKTYPE": row[9],
            "LOWAGE": row[10],
            "HIGHAGE": row[11],
            "QSUM": row[20],
            "RSUM": row[21]
            })
                    
        '''histogram_data.append({
            "LOMAGAGE": row[12],
            "HIMAGAGE": row[13],
            "DP": row[18],
            "DM": row[19]
            })'''
                
    # Prepare both the table data and geojson data
    result = {
        'data': data,
        'stats_data': stats_data,
         
    }

    # Return the result as a JSON string
    #print("Backend Response:", result)
    return JsonResponse(result)
              
    
    
#submit_data to database

def submit_data(request):
    conn = psycopg2.connect(conn_string_admin)
    cursor = conn.cursor()
    #if request.method != "POST":
      #return JsonResponse({"success": False, "error": "Invalid request method. Use POST."})
    print('this is a test2')
    data = request.GET.dict()
    print(data)
    try:
#        doi = request.GET.get("doi", "").strip()
#        lat = request.GET.get("lat", "").strip()
#        lon = request.GET.get("lon", "").strip()
#        email = request.GET.get("email", "").strip()
#        alternate_email = request.GET.get("alternate_email", "").strip()
#        age = request.GET.get("age", "").strip()
#        comments = request.GET.get("comments", "").strip()
#
#        # Insert into database using parameterized query
        query_str = '''INSERT INTO "CONTRIBUTIONS" (doi, rlat, rlong, email, rockname, age, comments, place, continent, terrane, rocktype, stratage, lowage, highage, method, lomagage, himagage, tilt, tests, 
        slat, slong, ptype, demagcode, treatment, noreversed, authors, years, journal, vpages, title, remarks) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);'''
        cursor.execute(query_str, (data['doi'], data['rlat'], data['rlong'], data['email2'], data['rockname'], data['age'], data['comments'], data['place'], data['continent'], data['terrane'], 
                       data['rocktype'], data['stratage'], data['lowage'], data['highage'], data['method'], data['lomagage'], data['himagage'],data['tilt'], data['tests'],  data['slat'], data['slong'], 
                       data['ptype'], data['demagcode'], data['treatment'], data['noreversed'], data['authors'], data['year'], data['journal'], data['vpages'], data['title'], data['remarks'],) )
#
        # Commit the transaction
        conn.commit()

        return JsonResponse({"success": True, "message": "Data inserted successfully."})

    except psycopg2.DatabaseError as e:
        return JsonResponse({"success": False, "error": f"Database error: {str(e)}"})

#
# update the map after query the data
#
def get_query_data_for_map(request):
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    
    query_str = '''
            SELECT ru.\"ROCKUNITNO\", ru.\"ROCKNAME\",ru.\"RLONG\", ru.\"RLAT\", array_agg(pmr.\"RESULTNO\") 
            FROM (((\"ROCKUNIT\" AS ru 
            INNER JOIN \"REFERENCE\" AS r ON r.\"REFNO\" = ru.\"REFNO\")
            INNER JOIN \"PMAGRESULT\" AS pmr ON ru.\"ROCKUNITNO\" = pmr.\"ROCKUNITNO\")
            INNER JOIN \"RELIABILITY\" AS re ON pmr.\"RESULTNO\" = re.\"RESULTNO\") '''

    query_str+=build_query_string(request)

    query_str+='group by ru.\"ROCKUNITNO\"'

    try:
        cursor.execute(query_str)
    except psycopg2.Error as e:
        print(e.pgerror)
        print(e.diag.message_detail)
        

    data=[]
    for row in cursor:
        data.append({ 
                    "type": "Feature",
                    "properties": {
                        "ROCKUNITNO": row[0],
                        "ROCKNAME" : row[1],
                        "PMAGRESULTCOUNT": row[4]
                    },
                    "geometry":{
                        "type": "Point",
                        "coordinates": [row[2],row[3]]
                    }
        })

    ret = json.dumps(data)

    return HttpResponse(ret, content_type='application/json')


def get_data_within_polygon(request):
       
    polygon_str = request.GET.get('polygon')
    print("Received polygon string:", polygon_str)  # Log the polygon string for debugging

    # Check if the polygon parameter exists
    if not polygon_str:
        return JsonResponse({'status': 'error', 'message': 'Polygon parameter is missing'}, status=400)
    try:
        # Parse the polygon data (JSON string) into a Python list
        polygon = json.loads(polygon_str)
        print("Parsed polygon:", polygon)  # Log the parsed polygon for debugging
        
        polygon_wkt = "POLYGON((" + ", ".join(f"{point[0]} {point[1]}" for point in polygon) + "))"
        print("Polygon WKT:", polygon_wkt)  # Log the WKT for debugging
        print(f"Length of polygon_wkt: {len(polygon_wkt)}")
        # Database connection
        conn = psycopg2.connect(conn_string)
        
        with conn:
            with conn.cursor() as cursor:
            
                query_str = '''
                    SELECT r."REFNO", pmr."RESULTNO", ru."ROCKNAME", r."YEAR", r."AUTHORS",
                           r."JOURNAL", r."VOLUME", r."VPAGES",
                           ru."CONTINENT", ru."ROCKTYPE", ru."LOWAGE", ru."HIGHAGE", 
                           pmr."LOMAGAGE", pmr."HIMAGAGE", pmr."SLAT", pmr."SLONG", pmr."PLAT", pmr."PLONG", 
                           pmr."DP", pmr."DM", re."QSUM", re."RSUM",
                           ST_AsGeoJSON(ru."geom") AS geojson_geom
                    FROM "ROCKUNIT" AS ru
                    INNER JOIN "REFERENCE" AS r ON r."REFNO" = ru."REFNO"
                    INNER JOIN "PMAGRESULT" AS pmr ON ru."ROCKUNITNO" = pmr."ROCKUNITNO"
                    INNER JOIN "RELIABILITY" AS re ON pmr."RESULTNO" = re."RESULTNO"
                    WHERE ST_Within(ru.geom, ST_SetSRID(ST_GeomFromText(%s), 4326));
                 '''
               
                # Execute the query with the polygon WKT as a parameter
                cursor.execute(query_str, (polygon_wkt,))

                # Fetch and format the data as GeoJSON
                data={}
                data["columns"] = [[desc[0]] for desc in cursor.description]
                data["data"] = []
                geojson = {"type": "FeatureCollection", "features": []}
                stats_data=[]
                
                for row in cursor:
                    data["data"].append(list(row))

                    # Extract the GeoJSON geometry from the query result
                    geojson_geom = json.loads(row[-1])  # The last column contains the GeoJSON geometry
                    
                    columns = [desc[0] for desc in cursor.description[:-1]]  # All except last column
                    properties = {columns[i]: row[i] for i in range(len(columns))}
                    
                    # Create a GeoJSON feature for each result
                    feature = {
                        "type": "Feature",
                        "geometry": geojson_geom,  # Use the GeoJSON geometry here
                        "properties": properties
                    }
                    
                    geojson["features"].append(feature)






                    
                    stats_data.append({
                        "PLAT": row[16],  # Paleolatitude
                        "PLONG": row[17],  # Paleolongitude
                        "LOMAGAGE": row[12],
                        "HIMAGAGE": row[13],
                        "DP": row[18],     # Confidence radius in latitude
                        "DM": row[19],
                        "SLAT": row[14],
                        "SLONG": row[15],
                        "ROCKNAME": row[2],
                        "REFNO": row[0],
                        "RESULTNO": row[1],
                        "YEAR": row[3],
                        "AURTHORS": row[4],
                        "JOURNAL": row[5],
                        "VOLUME": row[6],
                        "VPAGES": row[7],
                        "CONTINENT": row[8],
                        "ROCKTYPE": row[9],
                        "LOWAGE": row[10],
                        "HIGHAGE": row[11],
                        "QSUM": row[20],
                        "RSUM": row[21]
                        })
                    
                                        
                
                # Prepare both the table data and geojson data
                result = {
                    'table_data': data,
                    'geojson_data': geojson,
                    'stats_data': stats_data,
                    
                }

                # Return the result as a JSON string
                #print("Backend Response:", result)
                return JsonResponse(result)


    except json.JSONDecodeError:
        return HttpResponse(json.dumps({'status': 'error', 'message': 'Invalid polygon data'}), content_type="application/json", status=400)
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return HttpResponse(json.dumps({'status': 'error', 'message': 'Database error'}), content_type="application/json", status=500)
    except Exception as e:
        return HttpResponse(json.dumps({'status': 'error', 'message': 'An unexpected error occurred'}), content_type="application/json", status=500)
        
def get_stats(request):
    if request.method == "POST":
        try:
            # Parse the JSON data sent in the POST request
            data = json.loads(request.body)
            print("Received data:", data)  # Log the received data

            stats_data = data.get("data",[])
            if not isinstance(stats_data, list):
                return JsonResponse({'error': 'Missing stats_data'}, status=400)

            print("new fishcer now")

            calc = []
            pointcircle = []
            allcircles = {}
            for row in stats_data:
                calc.append([row['PLONG'], row['PLAT']])
                if row['DP'] is not None and row['DM'] is not None:
                    a95 = math.sqrt((row['DP'] * row['DM']))
                    pointcoords = Circle(row['PLONG'], row['PLAT'], a95*111.32)
                    pointcoords = mapping(pointcoords)
                    allcircles[row['RESULTNO']] = pointcoords
             

            mean = fisher_mean(calc)
            
            coords = Circle(mean['dec'], mean['inc'], mean['alpha95']*111.32)
            circlecoords = mapping(coords)


            result = {
                'calculations': mean,
                'circle': circlecoords,
                'pointcircle': allcircles
            }

            return JsonResponse(result)
        except Exception as e:
            print("Error:", str(e))  # Log the error for debugging
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)
    
def selected_means(request):

    
    if request.method == "POST":
        try:
            # Parse the JSON data sent in the POST request
            data = json.loads(request.body)
            print("Received data:", data)  # Log the received data

            points = data.get("data",[])

            print(points)

            calc = []

            for row in points.values():
                calc.append([float(row['PLONG']), float(row['PLAT'])])
        
            mean = fisher_mean(calc)
        
            result = {
                'calculations': mean,
            }

            return JsonResponse(result)
        except Exception as e:
            print("Error:", str(e))  # Log the error for debugging
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def plotted_mean(request):

    
    if request.method == "POST":
        try:
            # Parse the JSON data sent in the POST request
            data = json.loads(request.body)
            print("Received data:", data)  # Log the received data

            point = data.get("data",[])

            print(point)


            pointcoords = Circle(float(point['PLONG']), float(point['PLAT']), float(point['a95'])*111.32)
            pointcoords = mapping(pointcoords)
        
            result = {
                'circle': pointcoords
            }

            return JsonResponse(result)
        except Exception as e:
            print("Error:", str(e))  # Log the error for debugging
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def shoot(lon, lat, azimuth, maxdist=None):
    """Shooter Function
    Original javascript on http://williams.best.vwh.net/gccalc.htm
    Translated to python by Thomas Lecocq
    """
    glat1 = lat * np.pi / 180.
    glon1 = lon * np.pi / 180.
    s = maxdist / 1.852
    faz = azimuth * np.pi / 180.
 
    EPS= 0.00000000005
    if ((np.abs(np.cos(glat1))<EPS) and not (np.abs(np.sin(faz))<EPS)):
        alert("Only N-S courses are meaningful, starting at a pole!")
 
    a=6378.13/1.852
    f=1/298.257223563
    r = 1 - f
    tu = r * np.tan(glat1)
    sf = np.sin(faz)
    cf = np.cos(faz)
    if (cf==0):
        b=0.
    else:
        b=2. * np.arctan2 (tu, cf)
 
    cu = 1. / np.sqrt(1 + tu * tu)
    su = tu * cu
    sa = cu * sf
    c2a = 1 - sa * sa
    x = 1. + np.sqrt(1. + c2a * (1. / (r * r) - 1.))
    x = (x - 2.) / x
    c = 1. - x
    c = (x * x / 4. + 1.) / c
    d = (0.375 * x * x - 1.) * x
    tu = s / (r * a * c)
    y = tu
    c = y + 1
    while (np.abs (y - c) > EPS):
 
        sy = np.sin(y)
        cy = np.cos(y)
        cz = np.cos(b + y)
        e = 2. * cz * cz - 1.
        c = y
        x = e * cy
        y = e + e - 1.
        y = (((sy * sy * 4. - 3.) * y * cz * d / 6. + x) *
              d / 4. - cz) * sy * d + tu
 
    b = cu * cy * cf - su * sy
    c = r * np.sqrt(sa * sa + b * b)
    d = su * cy + cu * sy * cf
    glat2 = (np.arctan2(d, c) + np.pi) % (2*np.pi) - np.pi
    c = cu * cy - su * sy * cf
    x = np.arctan2(sy * sf, c)
    c = ((-3. * c2a + 4.) * f + 4.) * c2a * f / 16.
    d = ((e * cy * c + cz) * sy * c + y) * sa
    glon2 = ((glon1 + x - (1. - c) * d * f + np.pi) % (2*np.pi)) - np.pi    
 
    baz = (np.arctan2(sa, b) + np.pi) % (2 * np.pi)
 
    glon2 *= 180./np.pi
    glat2 *= 180./np.pi
    baz *= 180./np.pi
    return (glon2, glat2, baz)


def Circle(centerlon, centerlat, radius):
    glon1 = centerlon
    glat1 = centerlat
    X = []
    Y = []
    for azimuth in range(0, 360):
        glon2, glat2, baz = shoot(glon1, glat1, azimuth, radius)
        X.append(glon2)
        Y.append(glat2)
    X.append(X[0])
    Y.append(Y[0])
    coords = [(x,y) for x,y in zip(X,Y)]
    shp = LineString(coords)
    return(shp)



def add_item(request):


    print('this is a test')
    #data = request.GET.dict()
    #print(data)
    data = request.GET.dict()
    print(data['id'])

    conn = psycopg2.connect(conn_string_admin)
    cursor = conn.cursor()

    query_string = """SELECT * FROM "CONTRIBUTIONS" WHERE "doi" = %s;"""

    cursor.execute(query_string, (data['id'],))

    row = cursor.fetchone()

    print(row)

    query_string = """SELECT MAX("REFNO") FROM "REFERENCE";"""

    cursor.execute(query_string)

    result = cursor.fetchone()

    id_ref = result[0]

    id_ref = id_ref+1

    print(id_ref)

    query_string = """INSERT INTO "REFERENCE" ("REFNO", "AUTHORS", "YEAR", "JOURNAL", "VPAGES", "TITLE", "REMARKS")
                                            VALUES (%s,%s,%s,%s,%s,%s,%s)"""
    
    cursor.execute(query_string, (id_ref, row[25], row[26], row[27], row[28], row[29], row[30],))

    query_string = """SELECT MAX("ROCKUNITNO") FROM "ROCKUNIT";"""

    cursor.execute(query_string)

    result = cursor.fetchone()

    id = result[0]

    id = id+1
    print(data)
    query_string = """INSERT INTO "ROCKUNIT" ("ROCKUNITNO", "REFNO", "PLACE", "CONTINENT", "METHOD", "STRATAGE", "LOWAGE", "HIGHAGE", "ROCKTYPE", "RLAT", "RLONG", "ROCKNAME")
                                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
    
    cursor.execute(query_string, (id, id_ref, row[7], row[8], row[14], row[11], row[12], row[13], row[10], row[1], row[2],row[4],))

    query_string = """SELECT MAX("RESULTNO") FROM "PMAGRESULT";"""

    cursor.execute(query_string)

    result = cursor.fetchone()

    id_pma = result[0]

    id_pma = id_pma+1

    query_string = """INSERT INTO "PMAGRESULT" ("ROCKUNITNO", "RESULTNO", "LOMAGAGE", "HIMAGAGE", "TESTS", "TILT", "SLAT", "SLONG", "PTYPE", "NOREVERSED", "DEMAGCODE", "TREATMENT")
                                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
    
    cursor.execute(query_string, (id, id_pma, row[15], row[16], row[18], row[17], row[19], row[20], row[21], row[24], row[21], row[22],))

    query_string = """DELETE FROM \"CONTRIBUTIONS\" WHERE doi =%s;"""


    cursor.execute(query_string, (data['id'],))
    conn.commit()
    '''

    print(id)    
    #id = request.GET.get("id", "").strip()
    #print(id)
    #print(id == "https://doi.org/10.1234/abcd.567555")
    
    '''
    return render(request, 'gpmdb2.html')
    
def get_map_within_polygon(request):
    polygon_str = request.GET.get('polygon')
    # Check if the polygon parameter exists
    if not polygon_str:
        return JsonResponse({'status': 'error', 'message': 'Polygon parameter is missing'}, status=400)
    try:
        # Parse the polygon data (JSON string) into a Python list
        polygon = json.loads(polygon_str)
                
        polygon_wkt = "POLYGON((" + ", ".join(f"{point[0]} {point[1]}" for point in polygon) + "))"
        
        # Database connection
        conn = psycopg2.connect(conn_string)
    
        with conn:
            with conn.cursor() as cursor:
                query_str = '''
                    SELECT ru."ROCKUNITNO", ru."ROCKNAME", ru."RLONG", ru."RLAT", array_agg(pmr."RESULTNO")
                    FROM "ROCKUNIT" AS ru
                    INNER JOIN "REFERENCE" AS r ON r."REFNO" = ru."REFNO"
                    INNER JOIN "PMAGRESULT" AS pmr ON ru."ROCKUNITNO" = pmr."ROCKUNITNO"
                    INNER JOIN "RELIABILITY" AS re ON pmr."RESULTNO" = re."RESULTNO"
                    WHERE ST_Within(ru."geom", ST_SetSRID(ST_GeomFromText(%s), 4326))
                    GROUP BY ru."ROCKUNITNO", ru."ROCKNAME", ru."RLONG", ru."RLAT"
                '''
                cursor.execute(query_str, (polygon_wkt,))
                rows=cursor.fetchall()
    except psycopg2.Error as e:
        print(e.pgerror)
        print(e.diag.message_detail)
            

    data=[]
    for row in rows:
        data.append({ 
                    "type": "Feature",
                    "properties": {
                        "ROCKUNITNO": row[0],
                        "ROCKNAME" : row[1],
                        "PMAGRESULTCOUNT": row[4]
                    },
                    "geometry":{
                        "type": "Point",
                        "coordinates": [row[2],row[3]]
                    }
        })

    ret = json.dumps(data)

    return HttpResponse(ret, content_type='application/json')