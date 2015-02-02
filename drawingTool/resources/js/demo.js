var spectrumLD = {};
document.onreadystatechange = function () {

	var state = document.readyState
	if (state == 'interactive') {
	} else if (state == 'complete') {

		//first
		spectrumLD = SpectrumLayoutDesigner({});
		// getting Image by coords
		/* google LatLng object ({lat: -34, lng: 151})*/	
		coord = {
			lat:-33.86714174144573,
			lng: 151.2022563815117
		};

		spectrumLD.createCanvas('canvas2','canvas2Wrap');
		spectrumLD.addEventListeners();
		spectrumLD.getImageByCoords(coord, 21, function(){
			spectrumLD.createObject([
				{x:50,y:50},{x:250,y:50},{x:100,y:100},
				{x:250,y:220},{x:50,y:220},{x:50,y:50}
				],{
					layer: "default",
					group: "default",
					style: {
						lineColor: "0xFF0000",
						lineWidth: 1,
						fill: "0x008000",
						opacity: 0.5,
						lineStyle: {}
					}
				});

			spectrumLD.createObject([
				{x:300,y:300},{x:500,y:300},{x:500,y:500},{x:300,y:500}
				],{
					layer: "default",
					group: "default",
					style: {
						lineColor: "0xFF0000",
						lineWidth: 1,
						fill: "0x008000",
						opacity: 1,
						lineStyle: {}
					}
				});
			spectrumLD.expandPictureToScreen();
			spectrumLD.setViewBoundriesToBackgroundImage();
			spectrumLD.addZoomController();
			
		});
	}
}

function test(){
	eval(document.getElementById('scriptInput').value);
}