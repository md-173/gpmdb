import os
import sys

path = '/work/'
if path not in sys.path:
    sys.path.insert(0, path)

    os.environ['DJANGO_SETTINGS_MODULE'] = 'gpmdb_django.settings'

    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
