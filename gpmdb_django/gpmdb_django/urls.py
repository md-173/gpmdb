"""gpmdb_django URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url
from django.contrib import admin
from gpmdb import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^get_data/?$', views.get_data, name='get_data'),
    url(r'^get_query_data/?$', views.get_query_data, name='get_query_data'),
    url(r'^get_PMAGRESULT_data/?$', views.get_PMAGRESULT_data, name='get_PMAGRESULT_data'),
    url(r'^PMAGRESULT/?$', views.PMAGRESULT, name='PMAGRESULT'),
    url(r'^tables/?$', views.tables, name='tables'),
    url(r'^get_table_data/?$', views.get_table_data, name='get_table_data'),
    url(r'^table/?$', views.table, name='table'),
    url(r'^get_query_data_for_map/?$', views.get_query_data_for_map, name='get_query_data_for_map'),
#    url(r'^admin/', admin.site.urls),
]
