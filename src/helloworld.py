import cgi
import os
import import_wrapper
import geo.geomodel
import geo.geotypes
import random

from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from django.utils import simplejson as json
import datetime
import time

SIMPLE_TYPES = (int, long, float, bool, dict, basestring, list)

class User(geo.geomodel.GeoModel):
    username = db.UserProperty()
    session = db.StringProperty('single-line')
    @staticmethod
    def public_attributes():
        """Returns a set of simple attributes on public school entities."""
        return [
            'username', 'session'
        ]

    def _get_latitude(self):
        return self.location.lat if self.location else None

    def _set_latitude(self, lat):
        if not self.location:
          self.location = db.GeoPt()

        self.location.lat = lat

    latitude = property(_get_latitude, _set_latitude)

    def _get_longitude(self):
        return self.location.lon if self.location else None

    def _set_longitude(self, lon):
        if not self.location:
            self.location = db.GeoPt()

        self.location.lon = lon

    longitude = property(_get_longitude, _set_longitude)\

def _merge_dicts(*args):
  """Merges dictionaries right to left. Has side effects for each argument."""
  return reduce(lambda d, s: d.update(s) or d, args)

class MainPage(webapp.RequestHandler):
    def get(self):

        current_user = User(location=db.GeoPt(40.745193,-73.903926))
        if users.get_current_user():
            current_user.username = users.get_current_user()
        current_user.update_location()
        session = str(random.random())
        current_user.session = session
        current_user.put()
        
        self.redirect('/play?s='+session)        
        
        
class play(webapp.RequestHandler):
    def get(self):
        current_user = User.all().filter("session =",self.request.get('s'))
        
        for the_user in current_user:
            template_values = {
            'session': self.request.get('s'),
            'start_lat':the_user.location.lat,
            'start_lon':the_user.location.lon,
            }

        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(template.render(path, template_values))

class Guestbook(webapp.RequestHandler):
    def post(self):
        current_user = User(location=db.GeoPt(40.745193,73.903926))
        if users.get_current_user():
            current_user.username = users.get_current_user()
        current_user.update_location()
        current_user.put()

class update(webapp.RequestHandler):
    def post(self):       
        
        center = geo.geotypes.Point(float(self.request.get('lat')), float(self.request.get('lon')))
        results = User.proximity_fetch(User.all(), center, max_results=10, max_distance=160934)
        
        public_attrs = User.public_attributes()  
        results_obj = [
          _merge_dicts({
            'lat': result.location.lat,
            'lon': result.location.lon,
            },
            dict([(attr, getattr(result, attr))
                  for attr in public_attrs]))
          for result in results]
        
        self.response.out.write(json.dumps({
        'users': results_obj
      }))

application = webapp.WSGIApplication(
                                    [('/',MainPage),
                                     ('/sign',Guestbook),
                                     ('/update',update),
                                     ('/play',play)],
                                    debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
