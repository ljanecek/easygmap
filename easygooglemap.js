/*
 * 	EasyGoogleMap v1 - jQuery plugin
 *	written by Ladislav Janeček
 *	http://freshfeet.cz
 *
 *	Built for jQuery library & Google Maps Api v3 & MarkerClusterer for Google Maps v3
 *	http://jquery.com
 *	http://maps.google.com/maps/api/js?sensor=false
 *	http://gmaps-utility-library-dev.googlecode.com/svn/tags/markerclusterer
 *
 *	markup example for $("#googleMap").easyGoogleMap();
 *
 * 	<div id="googleMap">
 * 	</div>
 *
 */
(function($) {
	$.fn.easyGoogleMap = function(options) {
		
		var defaults = {
			searchForm: false,
			gpsButton: false,
			searchFormId: 'googleMap-search-form',
			mapContentId : 'googleMap-map',
			gpsButtonId: 'googleMap-gps',
			searchButtonValue: 'Search',
			gpsButtonValue: 'GPS',
			zoom : 8,
			group: false,
			gridSize: 30,
			setCenterGps: {lon: 49.743678, lat: 15.338712},
			mapStyle: {width: 300, height: 300, mapType: 'roadmap'},
			mapControl: {streetView: true, scrollwheel: true, navigationControl: true, mapTypeControl: true, zoomControl: true, draggable: true, disableDoubleClickZoom: true},
			markers: Array(),
			markersWindow: false,
			markerContent: "", 
			error: {
				canNotLoadGps: "Nepodařilo se načíst adresu. Zkontrolujte nastavení Vašeho zařízení i prohlížeče a zkuste to prosím znovu",
				unsupportedDev: "Váš prohlížeč nepodporuje geolokaci."
			}
		};
		var options = $.extend(defaults, options);
		
		this.each(function() {
			
			var obj = $(this);
			var markerArray = [];
			
			//pročistit proměnné
			var map, lat_geo, lon_geo, lat_addr, lon_addr, infowindow, geocoder;
			var watchID;
			var geoLoc;
			
			var opt = new Array();
				opt["gridSize"] = options.gridSize;
			
			//zobrazit vyhledávání
			if (options.searchForm) {
				var html = '<form action="" id="'+options.searchFormId+'">';
				html += '<input type="text" name="address" id="address" value="" />';
				html += '<input type="submit" value="'+options.searchButtonValue+'" />';
				html += '</form>';
				$(obj).append(html);
				
				//	event odeslání formuláře pro vyhledávání
				$(document.getElementById(options.searchFormId)).submit(function(e){
					e.preventDefault();		
					
					var address = $(document.getElementById("address")).val();
		
					gpsByAddress(address, function(location){
						var latlngs = getNearestNum(markerArray, location[0], location[1]);
						mapLocation(location[0], location[1], 13, map, latlngs);
					});
					if(detectMob()){
						hideKeyboard();
					}
				});
			};
			
			//zobrazit gps
			if (options.gpsButton) {
				var html = '<a href=\"javascript:void(0);\" id="'+options.gpsButtonId+'">'+options.gpsButtonValue+'</a>';
				$(obj).append(html);

				//	event kliknutí na GPS			
				$(document.getElementById(options.gpsButtonId)).click(function(e){
					e.preventDefault();					
					if (navigator.geolocation) {
						navigator.geolocation.getCurrentPosition(success, error);
					}else{
						alert(options.unsupportedDev);
					}
					function success(position) {				
						var latlngs = getNearestNum(markerArray, position.coords.latitude, position.coords.longitude);
						mapLocation(position.coords.latitude, position.coords.longitude, 20, map, latlngs);
					}	
					function error(msg) {
						alert(options.canNotLoadGps);
					}	
					if(lat_geo && lon_geo){
						var latlngs = getNearestNum(markerArray, lat_geo, lon_geo);
						mapLocation(lat_geo, lon_geo, 20, map, latlngs);
					}
				});
			};
			
			//inicializace a vytvoření mapy
			var html = '<div id="'+options.mapContentId+'"></div>';
			$(obj).append(html);
			
			$(document.getElementById(options.mapContentId)).css({"width": options.mapStyle.width, "height" : options.mapStyle.height});
			
			var mapStyleType = options.mapStyle.mapType;
			
			var mapTypeTrans = {
				roadmap: google.maps.MapTypeId.ROADMAP,
				hybrid: google.maps.MapTypeId.HYBRID,
			};
						
			var mapOptions = {
				center : new google.maps.LatLng(options.setCenterGps.lon, options.setCenterGps.lat),
				zoom : options.zoom,
				mapTypeId : mapStyleType,
				streetViewControl : options.mapControl.streetView,
				scrollwheel: options.mapControl.scrollwheel,
				navigationControl: options.mapControl.navigationControl,
		    	mapTypeControl: options.mapControl.mapTypeControl,
		    	zoomControl: options.mapControl.zoomControl,
		    	draggable: options.mapControl.draggable,
				disableDoubleClickZoom: options.mapControl.disableDoubleClickZoom
			}
			
			var map = new google.maps.Map(document.getElementById(options.mapContentId), mapOptions);
			
			/*if (navigator.geolocation && detectMob()) {
				navigator.geolocation.getCurrentPosition(success, error);
			}*/
			
			function success(position) {				
				var latlngs = getNearestNum(markerArray, position.coords.latitude, position.coords.longitude);
				mapLocation(position.coords.latitude, position.coords.longitude, 20, map, latlngs);
			}
			function error(msg) {
				alert(options.canNotLoadGps);
			}
			
			
			//cyklus pro vypsání markerů z pole
			if(typeof options.markers === 'string'){
				$.getJSON(options.markers, function(data) {
					$.each(data, function(i, it) {
						var content = options.markerContent;
						var match = /{(.*?)}/g;
						var variables = content.match(match);
						$.each(variables, function(key) {
							var varFull = variables[key];
							varFull = varFull.replace("{", "").replace("}", "");
							eval('var element = it.'+ varFull);			
							content = content.replace('{'+varFull+'}', element);
						});
						addMarker(it.title, content, it.url, it.lat, it.lon);
					});
					if(options.group){
						var m = new MarkerClusterer(map, markerArray, opt);
					}
				});
			}else{
				$.each(options.markers, function(key) {
					if(options.markers[key].lon && options.markers[key].lat){
						addMarker(options.markers[key].address, options.markers[key].content, options.markers[key].link, options.markers[key].lon, options.markers[key].lat);
					}else{
						gpsByAddress(options.markers[key].address, function(location){
							addMarker(options.markers[key].address, options.markers[key].content, options.markers[key].link, location[0], location[1]);
						});
					}		
					//spistit až po naplnění pole i asyn, funkcí = BUG
					if(options.group){
						var m = new MarkerClusterer(map, markerArray, opt);
					}	
				});
			}
			// asyn funkce vracející lat a lon
			function gpsByAddress(address, fn){
				var geocoder = new google.maps.Geocoder();
				var lat, lon;
		        geocoder.geocode( {'address': address },
		            function(data, status) { 
						if (status == google.maps.GeocoderStatus.OK) {
							lat = data[0].geometry.location.lat();
							lon = data[0].geometry.location.lng();
							fn([lat, lon]);
						}
		        });
			}
			
			//přidání markeru
			function addMarker(address, content, url, lon, lat) {
				var latlng = new google.maps.LatLng(lon, lat);
				
				var marker = new google.maps.Marker({map : map, position : latlng, title : address, url: url});
	
				if(options.markersWindow){
					markerInfoWindow(map, marker, content);
				}else if(url != undefined){
					google.maps.event.addListener(marker, 'click', function() {
					 window.open(marker.url,'_newtab');
					});
				}
				markerArray.push(marker);
			}
			
			//přidá bublinu k markeru
			function markerInfoWindow(map, marker, content) {
				google.maps.event.addDomListener(marker, 'click', function() {
					if (infowindow) {
						infowindow.close();
					}
					infowindow = new google.maps.InfoWindow({
						content : content
					})
					infowindow.open(map, marker);
				});
			}
			
			//výpočet nejbližšího markeru od zadané pozice
			function getNearestNum(array, nearest_Ya, nearest_Za) {
				var latlng;
				var closest_Ya, closest_Za, closest_el_Ya, closest_el_Za = null;
			
				$.each(array, function(i, integ) {
			
					if ((closest_Ya == null || Math.abs(integ.position.lat() - nearest_Ya) < Math.abs(closest_Ya - nearest_Ya)) && (closest_Za == null || Math.abs(integ.position.lng() - nearest_Za) < Math.abs(closest_Za - nearest_Za))) {
						closest_Ya = integ.position.lat();
						closest_Za = integ.position.lng();
					}
				});
				latlng = new google.maps.LatLng(closest_Ya, closest_Za);
				return latlng;
			}
			
			//přesun na požadovanou pozici
			function mapLocation(lon, lat, zoom, map_ob, bounds_latlng) {
				var latlngoposite;
				var bound = new google.maps.LatLngBounds();
			
				var latlng = new google.maps.LatLng(lon, lat);

				if (lon >= bounds_latlng.lat() && lat >= bounds_latlng.lng()) {
					latlngoposite = new google.maps.LatLng((bounds_latlng.lat() - lon) + lon, (bounds_latlng.lng() - lat) + lat);
				} else {
					latlngoposite = new google.maps.LatLng((lon - bounds_latlng.lat()) + lon, (lat - bounds_latlng.lng()) + lat);
				}
			
				if(markerArray != ""){
					bound.extend(bounds_latlng);
					bound.extend(latlng);
					bound.extend(latlngoposite);
				
					map_ob.setCenter(latlng);
					map_ob.fitBounds(bound);
				}
				else{
					map.setCenter(latlng);
					map.setZoom(zoom);
				}
			}
		});
		
		function detectMob() {
			if( navigator.userAgent.match(/Android/i) || 
				navigator.userAgent.match(/webOS/i) || 
				navigator.userAgent.match(/iPhone/i) || 
				navigator.userAgent.match(/iPad/i) || 
				navigator.userAgent.match(/iPod/i) || 
				navigator.userAgent.match(/BlackBerry/i) || 
				navigator.userAgent.match(/Windows Phone/i)){
			    return true;
			}
			else {return false;}
		}
		
		if(detectMob()){
			window.addEventListener("load", function() {
				window.scrollTo(0, 1);
			});
		}
		
		function hideKeyboard() {
			document.activeElement.blur();
			$("input").blur();
			getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);
		}

	};
})(jQuery);