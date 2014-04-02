EasyGoogleMap
=============

EasyGoogleMap is plugin for jQuery.

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js" type="text/javascript"></script>
<script src="//maps.google.com/maps/api/js?sensor=false"></script>
<script src="marker.js" type="text/javascript"></script>
<script src="easygooglemap.js" type="text/javascript"></script>
<script>
	$(function() {
		
		var any = {
			1:{
				title: "test",
				address: "new york",
				url: "http://google.com",
			},
			2:{
				title: "test 2",
				address: "prague",
				url: "http://google.cz",
			}
		}
		
		$('#googleMap').easyGoogleMap({
			mapStyle: {width: 500, height: 500, mapType: 'hybrid'}, 
			markers: any,
		});

	});
</script>

...

<div id="googleMap"></div>
