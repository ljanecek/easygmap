EasyGoogleMap
=============

EasyGoogleMap is plugin for jQuery.


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
