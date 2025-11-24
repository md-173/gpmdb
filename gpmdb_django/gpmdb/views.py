from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
from django.http import JsonResponse
from django.contrib.gis.geos import Polygon
from .models import MyModel  # Import your model
from django.db import connection
from django.views.decorators.csrf import csrf_exempt  # Only if you're not using CSRF protection during testing
from pmagpy.ipmag import plot_net, plot_di
import matplotlib.pyplot as plt
import mplstereonet
import io
import base64
import logging, json, psycopg2, csv
import pandas as pd


#the password here is no secret, read-only user
#in the future, if you need more priviledge, use local peer auth. See /etc/postgresql/12/main/pg_hba.conf
conn_string = "host='localhost' dbname='GD2021' user='gpmdb' password='gpmdb' port=5432"

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
        });

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
            pmr.\"DP\", pmr.\"DM\", re.\"QSUM\", re.\"RSUM\", r.\"DOI\"
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
    
    for row in cursor:
        data["data"].append(list(row))
        stats_data.append({
            "PLAT": row[16],  # Paleolatitude
            "PLONG": row[17],  # Paleolongitude
            "LOMAGAGE": row[12],
            "HIMAGAGE": row[13],
            "DP": row[18],     # Confidence radius in latitude
            "DM": row[19]      # Confidence radius in longitude
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
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    #if request.method != "POST":
      #return JsonResponse({"success": False, "error": "Invalid request method. Use POST."})

    try:
        doi = request.GET.get("doi", "").strip()
        lat = request.GET.get("lat", "").strip()
        lon = request.GET.get("lon", "").strip()
        email = request.GET.get("email", "").strip()
        alternate_email = request.GET.get("alternate_email", "").strip()
        age = request.GET.get("age", "").strip()
        comments = request.GET.get("comments", "").strip()

        # Insert into database using parameterized query
        query_str = '''INSERT INTO "CONTRIBUTIONS" (doi, r_lat, r_long, email, alt_email, age, comments) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s);'''
        cursor.execute(query_str, [doi, lat, lon, email, alternate_email, age, comments])

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
                           pmr."DP", pmr."DM", re."QSUM", re."RSUM", r."DOI",
                           ST_AsGeoJSON(ru."geom") AS geojson_geom
                    FROM "ROCKUNIT" AS ru
                    INNER JOIN "REFERENCE" AS r ON r."REFNO" = ru."REFNO"
                    INNER JOIN "PMAGRESULT" AS pmr ON ru."ROCKUNITNO" = pmr."ROCKUNITNO"
                    INNER JOIN "RELIABILITY" AS re ON pmr."RESULTNO" = re."RESULTNO"
                    WHERE ST_Within(ru."geom", ST_SetSRID(ST_GeomFromText(%s), 4326));
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
                        "DM": row[19]      # Confidence radius in longitude
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

            # Process data (e.g., generating plot and histogram)
            plot_image = plot_equal_area_plot(stats_data) 
            histogram_image = renderhistogram(stats_data)  

            result = {
                'plot_image': plot_image,
                'histogram_image': histogram_image
            }

            return JsonResponse(result)
        except Exception as e:
            print("Error:", str(e))  # Log the error for debugging
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def generate_equal_area_plot(data):
    fig = plt.figure(figsize=(8, 8))
    ax = fig.add_subplot(111, projection='stereonet')

    for entry in data:
        plat = entry["PLAT"]
        plong = entry["PLONG"]
        dp = entry["DP"]

        try:
            trend, plunge = mplstereonet.pole(plong, plat)
            ax.pole(trend, plunge, 'o', markersize=8)
            ax.cone(trend, plunge, dp, facecolor='none', edgecolor='blue')
        except Exception as e:
            print(f"Plotting error for point {entry}: {e}")

    #plt.title("Equal-Area Plot with Fisher Confidence Circles")
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode('utf-8')
    return encoded
    

def renderhistogram(data):# src: Dr. UWE
    # Convert list of dictionaries to DataFrame
    df = pd.DataFrame(data)
    print(df.head(5))
    
    '''df['LOMAGAGE'] = df['LOMAGAGE'].fillna(0)  # Fill missing LOMAGAGE with 0 or any default value
    df['HIMAGAGE'] = df['HIMAGAGE'].fillna(0)  # Fill missing HIMAGAGE with 0 or any default value
    df['DP'] = df['DP'].fillna(0)  # Fill missing DP with 0 or any default value
    df['DM'] = df['DM'].fillna(0)  '''
    
    # Calculate average site ages
    df['AGE'] = (df['LOMAGAGE'] + df['HIMAGAGE']) / 2

    # Calculate A95 (precision parameter)
    #df['A95'] = (df['DP'] * df['DM'])**0.5

    # Plot the histogram of ages with automatic binning and log-scaled y-axis
    plt.figure(figsize=(8, 5))
    plt.hist(df['AGE'], bins='auto', color='skyblue', edgecolor='black')
    plt.yscale('log')  # Log scale on y-axis

    plt.title('Histogram of Site Ages')
    plt.xlabel('Age')
    plt.ylabel('Frequency (log scale)')
    plt.grid(True, which="both", linestyle="--", linewidth=0.5)
    plt.tight_layout()

    # Save plot to a base64-encoded string to send to frontend
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=300)
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()

    return image_base64
    
def plot_equal_area_plot(data):
    # Convert input data to DataFrame if not already
    df = pd.DataFrame(data)

    # Create the plot
    fig = plt.figure()
    plot_net(1)

    # Plot each directional mean
    for _, row in df.iterrows():
        plot_di(row['PLONG'], row['PLAT'], color='blue')

    # Save to buffer for base64 encoding
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=300)
    plt.close(fig)

    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode('utf-8')
    return encoded
    
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