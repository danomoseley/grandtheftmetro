import cgi
import os
import import_wrapper
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

class User(db.Model):
    username = db.UserProperty()
    session = db.StringProperty('single-line')
    lat = db.FloatProperty()
    lon = db.FloatProperty()
    heading = db.IntegerProperty()
    @staticmethod
    def public_attributes():
        """Returns a set of simple attributes on public school entities."""
        return [
            'username', 'session'
        ]
        
           
    def _get_heading(self):
        return self.location.lat if self.location else None

    def _set_heading(self, heading):
        if not self.location:
          self.location = db.GeoPt()

          self.location.heading = heading

    heading1 = property(_get_heading, _set_heading)  

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
        template_values = {}    
        path = os.path.join(os.path.dirname(__file__), 'frame.html')
        self.response.out.write(template.render(path, template_values))


class Play(webapp.RequestHandler):
    def get(self): 
        user = users.get_current_user()

        if user:
            query = User.all()
            query.filter("username =", users.get_current_user())
            
            if query.count() == 0:
                current_user = User(lat=40.745193,lon=-73.903926, heading=0)
                current_user.username = users.get_current_user()
                current_user.put()
                template_values = {
                                       'session': current_user.key(),
                                       'start_lat':current_user.lat,
                                       'start_lon':current_user.lon,
                                       'start_heading':current_user.heading,
                                       }    
                path = os.path.join(os.path.dirname(__file__), 'index.html')
                self.response.out.write(template.render(path, template_values))
            else:
                for current_user in query:   
                    template_values = {
                                       'session': current_user.key(),
                                       'start_lat':current_user.lat,
                                       'start_lon':current_user.lon,
                                       'start_heading':current_user.heading,
                                       }
    
                    path = os.path.join(os.path.dirname(__file__), 'index.html')
                    self.response.out.write(template.render(path, template_values))
        else:
            self.redirect(users.create_login_url(self.request.uri))


class Play(webapp.RequestHandler):
    def get(self): 
        user = users.get_current_user()

        if user:
            query = User.all()
            query.filter("username =", users.get_current_user())
            
            if query.count() == 0:
                current_user = User(lat=40.745193,lon=-73.903926, heading=0)
                current_user.username = users.get_current_user()
                current_user.put()
                template_values = {
                                       'session': current_user.key(),
                                       'start_lat':current_user.lat,
                                       'start_lon':current_user.lon,
                                       'start_heading':current_user.heading,
                                       }    
                path = os.path.join(os.path.dirname(__file__), 'index.html')
                self.response.out.write(template.render(path, template_values))
            else:
                for current_user in query:   
                    template_values = {
                                       'session': current_user.key(),
                                       'start_lat':current_user.lat,
                                       'start_lon':current_user.lon,
                                       'start_heading':current_user.heading,
                                       }
    
                    path = os.path.join(os.path.dirname(__file__), 'index.html')
                    self.response.out.write(template.render(path, template_values))
        else:
            self.redirect(users.create_login_url(self.request.uri))
            
              
        
        
class play(webapp.RequestHandler):
    def get(self):
        current_user = db.get(self.request.get('s'))
        
        template_values = {
        'session': self.request.get('s'),
        'start_lat':current_user.lat,
        'start_lon':current_user.lon,
        'start_heading':current_user.heading,
        }

        path = os.path.join(os.path.dirname(__file__), 'game.html')
        self.response.out.write(template.render(path, template_values))

class update(webapp.RequestHandler):
    def post(self):  
          
        if self.request.get('lat'):
            current_user = db.get(self.request.get('session'))   
            current_user.lat = float(self.request.get('lat'))
            current_user.lon = float(self.request.get('lon'))
            current_user.heading = int(self.request.get('heading'))
            current_user.put()
         
        results = User.all()
        
        public_attrs = User.public_attributes()  
        results_obj = [
          _merge_dicts({
            'lat': result.lat,
            'lon': result.lon,
            'heading': result.heading,
            },
            dict([(attr, getattr(result, attr))
                  for attr in public_attrs]))
          for result in results]
        self.response.out.write(json.dumps({
        'users': results_obj
      }))

application = webapp.WSGIApplication(
                                    [('/',MainPage),
                                     ('/update',update),
                                     ('/play',Play)],
                                    debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
