from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings

import logging, json, psycopg2, csv

#the password here is no secret, read-only user
#in the future, if you need more priviledge, use local peer auth. See /etc/postgresql/12/main/pg_hba.conf
conn_string = "host='localhost' dbname='GD2021' user='gpmdb' password='gpmdb' port=5432"

#
# return the front page
#
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
    for row in cursor:
        data["data"].append(list(row))
    ret = json.dumps(data)

    return HttpResponse(ret, content_type='application/json')


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
