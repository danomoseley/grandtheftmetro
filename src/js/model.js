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
	        ori.setHeading(fix360(movePoint.heading+270));
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
            
            this.lat = lat;
            this.lon = lon;
            this.changed = true;   
            this.marker.setPosition(new google.maps.LatLng(this.lat, this.lon));
        }         	
    };
    
    this.fillFrames = function(){
    	var stepsize = 1/(FRAME_RATE*((LATENCY+UPDATE_FREQUENCY)*4)/1000);
    	for (var u = 0; u <= 1; u += stepsize) {  
            this.buffer.push(getBezier(u,this.pointQueue[3],this.pointQueue[2],this.pointQueue[1],this.pointQueue[0]));
        }
    	//for(var i=1;i<this.pointQueue.length;i++){
    	//	this.pointQueue.shift();
    	//}
    	
		//THIS WORKS
    	//this.pointQueue = new Array();
		this.pointQueue = new Array(this.pointQueue[this.pointQueue.length-1]);
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

function B1(t) { return t*t*t }
function B2(t) { return 3*t*t*(1-t) }
function B3(t) { return 3*t*(1-t)*(1-t) }
function B4(t) { return (1-t)*(1-t)*(1-t) }

function getBezier(percent,C1,C2,C3,C4) {
	  var pos = new Point();
	  pos.lat = C1.lat*B1(percent) + C2.lat*B2(percent) + C3.lat*B3(percent) + C4.lat*B4(percent);
	  pos.lon = C1.lon*B1(percent) + C2.lon*B2(percent) + C3.lon*B3(percent) + C4.lon*B4(percent);
	  pos.heading = C1.heading*B1(percent) + C2.heading*B2(percent) + C3.heading*B3(percent) + C4.heading*B4(percent);
	  return pos;
	}