function Model (ge,session,lat,lon,heading,speed) {
    this.changed = false;
    this.heading = heading;
    this.lat = lat;
    this.lon = lon;
    this.session = session;
    this.max_speed = 100;
    this.dae = 'http://www.ricardocunha.com/car.dae';
    this.queue = 0;
    this.pointQueue = new Array();
    this.buffer = new Array();
    
        
    var placemark = ge.createPlacemark('');
    placemark.setName(this.session);
    this.model = ge.createModel('');
    ge.getFeatures().appendChild(placemark);
    var loc = ge.createLocation('');
    this.model.setLocation(loc);
    var link = ge.createLink('');

    //set scale of model
    var scale = this.model.getScale();
    scale.setX(0.5);
    scale.setY(0.5);
    scale.setZ(0.5);
    this.model.setScale(scale)

    // A textured model created in Sketchup and exported as Collada.
    link.setHref(this.dae);
    this.model.setLink(link);

    //orientation
    var ori = ge.createOrientation('');
    ori.setRoll(0);
    ori.setHeading(fix360(this.heading+270));
    ori.setTilt(0);
    this.model.setOrientation(ori);

    loc.setLatitude(this.lat);
    loc.setLongitude(this.lon);
    this.marker = new google.maps.Marker({
	      position: new google.maps.LatLng(this.lat, this.lon), 
	      map: map
	  });
    placemark.setGeometry(this.model);
    
    this.move = function(dist) {
    	this.queue += dist;
    	this.changed = true;
    };
    
    this.animate = function(){
    	var dest = destination(this.lat, this.lon, this.queue, this.heading);
        var loc = ge.createLocation('');
        loc.setLatLngAlt(dest[0], dest[1], 0)
        
        // orientation
        var ori = ge.createOrientation('');
        ori.setRoll(0);
        ori.setHeading(fix360(this.heading+270));
        ori.setTilt(0);
        this.model.setOrientation(ori);
        
        this.model.setLocation(loc);
        updateSpeed();
        
        this.lat = dest[0];
        this.lon = dest[1];
        this.marker.setPosition(new google.maps.LatLng(this.lat, this.lon));
        this.changed = false;
        this.queue = 0;
    }
    
    this.animate2 = function(){  
    	if(this.buffer.length>0){
	    	var movePoint = this.buffer.shift();
	        var loc = ge.createLocation('');
	        loc.setLatLngAlt(movePoint.lat, movePoint.lon, 0)
	        
	        // orientation
	        var ori = ge.createOrientation('');
	        ori.setRoll(0);
	        ori.setHeading(fix360(this.heading+270));
	        ori.setTilt(0);
	        this.model.setOrientation(ori);
	        
	        this.model.setLocation(loc);
	        
	        this.lat = movePoint.lat;
	        this.lon = movePoint.lon;
	        this.marker.setPosition(new google.maps.LatLng(this.lat, this.lon));
    	}
    }
    
    
    this.setLocation = function(lat,lon,heading){
        // orientation
        if(heading!=this.heading){
        	var ori = ge.createOrientation('');
            ori.setRoll(0);
            ori.setHeading(fix360(heading+270));
            ori.setTilt(0);
            this.model.setOrientation(ori);
        }
        
        if(lat!=this.lat && lon!=this.lon){
        	var loc = ge.createLocation('');
            loc.setLatLngAlt(lat, lon, 0)
            this.model.setLocation(loc);
            updateSpeed();
            
            this.lat = lat;
            this.lon = lon;
            this.changed = true;   
            this.marker.setPosition(new google.maps.LatLng(this.lat, this.lon));
        }         	
    };
    
    this.fillFrames = function(){
    	var stepsize = 1/8;  
    	var N = 3;  
    	for (var u = 0; u <= 1; u += stepsize) {  
            x = y = 0;  
            $.each(this.pointQueue, function(k,item){
                var blend = (factorial(N) / (factorial(k) * factorial(N - k))) * Math.pow(u, k) * Math.pow(1 -  u, N - k);  
                x += item.lat * blend;  
                y += item.lon * blend;  
            })
            this.buffer.push(new Point(x,y));
        }
    	this.pointQueue = new Array();
    }
    
    this.stop = function(lat,lon,alt) {
    	var loc = ge.createLocation('');
        loc.setLatLngAlt(temp1, temp2, alt)
        
        // orientation
        var ori = ge.createOrientation('');
        ori.setRoll(0);
        ori.setHeading(fix360(me.heading+270));
        ori.setTilt(0);
        thisModel.setOrientation(ori);
        
        thisModel.setLocation(loc);
    };    
    
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


function factorial(x) {
	if(x<=1){
		return 1;
	}else{
		return x*factorial(x-1);
	}
}  