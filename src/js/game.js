var map;
var ge;
var model;
google.load("earth", "1");
var mplat = 61.2;
var previous_data = {};
var inactive_timer = 0;
var timer_active = 0;
var inactive_timeout;
var bRightKeyDown = false;
var bLeftKeyDown = false;
var bUpKeyDown = false;
var bDownKeyDown = false;
var bSpaceKeyDown = false;
var animRunning = false;
var timeout = 60;
var ANIM_ALTITUDE = 5;
var TURN_DEGREES = 2;
var WALK_SPEED = 1;
var TURBO_SPEED = 2;
var GAS_COUNT = 0;
var lastDirBack = false;

var World = new Array();
var sessions = new Array();

function Point(lat, lng) { 
    this.lat = lat; 
    this.lon = lng; 
} 


function failureCallback(object) {}

function timer() {
    if (timer_active) {
        inactive_timer = inactive_timer + 1;
        setTimeout(timer, 1000);
    }
}
            
function updateSpeed()
{
	if (bUpKeyDown || bDownKeyDown)
	{
		GAS_COUNT = GAS_COUNT + 1;
	}
	else
		{
    		GAS_COUNT = GAS_COUNT - 5;
		}
	
	if (GAS_COUNT >= 100)
	{
		GAS_COUNT = 100;
	}
	else if (GAS_COUNT < 0)
	{
		GAS_COUNT = 0;
	}
	
     	           	
    WALK_SPEED = 1/100 * GAS_COUNT;
     
    // $('#dvSpeed').html('Speed: ' +Math.round( GAS_COUNT ) + '
	// MPH');
    parent.document.getElementById("dvSpeed").innerHTML = 'Speed: ' +Math.round( GAS_COUNT ) + ' MPH';
    parent.document.getElementById("dvHeading").innerHTML = 'Heading: ' +player.heading + ' MPH';
}

var player;

function server_update() {
    if (player.changed) {
        timer_active = 0;
        inactive_timer = 0;
        $.getJSON("/update",
        		{
                    lat: player.lat,
                    lon: player.lon,
                    heading: player.heading,
                    session: player.session
                },
        		  function(data) {
                	$.each(data.users, function(i,item){
                        // alert(item.lat);

                        if(sessions.indexOf(item.session) != -1){
                        	
                        	World[item.session].pointQueue.push(new Point(item.lat, item.lon))
                        	if(World[item.session].pointQueue.length>=3){
                        		World[item.session].fillFrames()
                        	}
                        }
                        else                        	
                        	{ 
                        		World[item.session]  =  new Model(ge,item.session,item.lat,item.lon,item.heading,1);
                        		
                        	    sessions.push(item.session);  
                        	}
                        });
                	setTimeout(server_update, 250);
        		  });
    }else{                	
    	setTimeout(server_update, 250);
    }
    
}

function initCallback(object) {
    ge = object;
    ge.getWindow().setVisibility(true);

    ge.getLayerRoot().enableLayerById(ge.LAYER_BUILDINGS, true);
    ge.getOptions().setMouseNavigationEnabled(true);



    var initCam = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
    dest = destination(start_lat, start_lon, -20, start_heading);
    initCam.setAltitude(ANIM_ALTITUDE);
    initCam.setLatitude(dest[0]);
    initCam.setLongitude(dest[1]);
    initCam.setHeading(start_heading);

    initCam.setTilt(80);
    initCam.setRoll(0);

    ge.getView().setAbstractView(initCam);
    player = new Model(ge,start_session,start_lat,start_lon,start_heading,1);
     
    
    setTimeout(server_update,250);
    setTimeout(runEngine,25);
    //createPlayer('1', 40.759, -73.9849, 'http://www.ricardocunha.com/car.dae');
}

function startAnimation() {
    if (!animRunning) {
    	
        ge.getOptions().setFlyToSpeed(ge.SPEED_TELEPORT);
        animRunning = true;
        google.earth.addEventListener(ge, 'frameend', tickAnimation);

        // start it off
        tickAnimation();
    }
}

function runEngine(){
	var dist;
    
    if (bSpaceKeyDown)
    {
    	dist = TURBO_SPEED;
    }
    else
    { 
    	dist = WALK_SPEED;
    } 

    if (bRightKeyDown) {
        if (bDownKeyDown) {
        	player.heading = fix360(player.heading - TURN_DEGREES);
        }
        else {
        	player.heading = fix360(player.heading + TURN_DEGREES);
        }


        if (!bDownKeyDown && !bUpKeyDown) {
            dist = 0;
        }
    }

    if (bLeftKeyDown) {
        if (bDownKeyDown) {
        	player.heading = fix360(player.heading + TURN_DEGREES);
        }
        else {
        	player.heading = fix360(player.heading - TURN_DEGREES);
        }

        if (!bDownKeyDown && !bUpKeyDown) {
            dist = 0;
        }
    }

    GAS_COUNT = GAS_COUNT+1;
    if (bDownKeyDown || lastDirBack) {
        dist = 0 - dist;
        GAS_COUNT = GAS_COUNT+3;
    }
    
    
	player.move(dist);
	setTimeout(runEngine,25);
}

function stopAnimation() {
    if (animRunning) {
        google.earth.removeEventListener(ge, 'frameend', tickAnimation);
        animRunning = false;
    }
}

function tickAnimation() {
	
    // an example of some camera manipulation that's possible w/ the
	// Earth API
    var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
    
	
    var myLatlng = new google.maps.LatLng(player.lat, player.lon);    
    map.setCenter(myLatlng);

    dest = destination(player.lat, player.lon, player.queue-20, player.heading);
    $.each(sessions,function(index,sess){
    		World[sess].animate2();
    })
    
    if(player.changed==true){
    	player.animate();  
        camera.setAltitude(ANIM_ALTITUDE);
        camera.setLatitude(dest[0]);
        camera.setLongitude(dest[1]);
        camera.setHeading(player.heading);

        camera.setTilt(80);
        camera.setRoll(0);
    }
    
    ge.getView().setAbstractView(camera);
}

/*
 * Helper functions, courtesy of
 * http://www.movable-type.co.uk/scripts/latlong.html
 */

function distance(lat1, lng1, lat2, lng2) {
    var a = Math.sin(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180);
    var b = Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lng2 - lng1) * Math.PI / 180);
    return 6371000 * Math.acos(a + b);
}

function fix360(angle) {
	if (angle > 360){ 
		return angle-360;
		}
	if (angle < 0 ) {
		return angle+360;
		}
    return angle;
    }


function destination(lat, lng, dist, heading) {
    lat *= Math.PI / 180;
    lng *= Math.PI / 180;
    heading *= Math.PI / 180;
    dist /= 6371000; // angular dist
    var lat2 = Math.asin(Math.sin(lat) * Math.cos(dist) + Math.cos(lat) * Math.sin(dist) * Math.cos(heading));

    return [
    180 / Math.PI * lat2, 180 / Math.PI * (lng + Math.atan2(Math.sin(heading) * Math.sin(dist) * Math.cos(lat2), Math.cos(dist) - Math.sin(lat) * Math.sin(lat2)))];
}

function foo(event, state) {
	if (event.keyCode == '87' || event.keyCode == '38') { // UP &
															// W
        bUpKeyDown = state;
        if (state) {
            startAnimation();
            lastDirBack = false;
        }
        else {
            if (!bRightKeyDown && !bLeftKeyDown) {
               // stopAnimation();
                // GAS_COUNT = 0;
                updateSpeed();
            }
        };
    } else if (event.keyCode == '68' || event.keyCode == '39') { // RIGHT
																	// & D
        bRightKeyDown = state;
        if (state) {
            startAnimation();
        }
        else {
            if (!bDownKeyDown && !bUpKeyDown) {
                //stopAnimation();
            }
        };

    } else if (event.keyCode == '83' || event.keyCode == '40') { // DOWN
																	// & S
        bDownKeyDown = state;
        if (state) {
            startAnimation();
            lastDirBack = true;
        }
        else {
            if (!bRightKeyDown && !bLeftKeyDown) {
                // stopAnimation();
                // GAS_COUNT = 0;
                updateSpeed();
            }
        };
    } else if (event.keyCode == '65' || event.keyCode == '37') { // Left
																	// & A
        bLeftKeyDown = state;
        if (state) {
            startAnimation();
        }
        else {
            if (!bDownKeyDown && !bUpKeyDown) {
                // stopAnimation();
            }
        };
    }
    else if (event.keyCode == '32') { // Space
    	event.preventDefault();
    	bSpaceKeyDown = state;
    }
}
         
$(document).ready(function() {
	
	var myLatlng = new google.maps.LatLng(start_lat, start_lon);
	var myOptions = {
	  zoom: 15,
	  center: myLatlng,
	  disableDefaultUI: true,
	  mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(parent.document.getElementById("map_canvas"), myOptions);
    google.earth.createInstance("map3d", initCallback, failureCallback);
    
    
    
    $(document).keydown(function(event) {
        foo(event, true);
    });
    $(document).keyup(function(event) {
        foo(event, false);
    });
});