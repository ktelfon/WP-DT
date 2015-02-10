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
			lat: 40.715540,
			lng: -74.051580
		};

		spectrumLD.createCanvas('canvas2','canvas2Wrap');
		spectrumLD.addEventListeners();
		spectrumLD.addZoomController();
		document.body.style.cursor = "wait";
		spectrumLD.getImageByCoords(coord, 21, function(){

			spectrumLD.addGroup("roof");
			spectrumLD.addLayer("test1");

			spectrumLD.createObject([
				{x:5,y:5},{x:25,y:5},{x:10,y:10},
				{x:25,y:22},{x:5,y:22},{x:5,y:5}
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
			
			// spectrumLD.createObject([
			// 	{x:5,y:5},{x:25,y:5},{x:10,y:10},
			// 	{x:25,y:22},{x:5,y:22},{x:5,y:5}
			// 	],{
			// 		layer: "default",
			// 		group: "roof",
			// 		style: {
			// 			lineColor: "0xFF0000",
			// 			lineWidth: 1,
			// 			fill: "0x008000",
			// 			opacity: 0.5,
			// 			lineStyle: {}
			// 		}
			// 	});

			// spectrumLD.createObject([
			// 	{x:30,y:30},{x:50,y:30},{x:50,y:50},{x:30,y:50}
			// 	],{
			// 		layer: "default",
			// 		group: "test1",
			// 		style: {
			// 			lineColor: "0xFF0000",
			// 			lineWidth: 1,
			// 			fill: "0x008000",
			// 			opacity: 1,
			// 			lineStyle: {}
			// 		}
			// 	});

			spectrumLD.createObject([
				{x:2,y:2},{x:2+2.76,y:2},{x:2+2.76,y:2+ 6.1},{x:2,y:2+ 6.1}
				],{
					layer: "test1",
					group: "roof",
					style: {
						arrowDegrees: 270,
						lineColor: "0xFF0000",
						lineWidth: 1,
						fill: "0x008000",
						opacity: 1,
						lineStyle: {}
					}
				});		

			spectrumLD.expandPictureToScreen();
			spectrumLD.setViewBoundriesToBackgroundImage();
			
			document.body.style.cursor = "default";
		});
}
}

function deleteo(){
	spectrumLD.deleteSelectedObject("roof");
}
function drawR(){
	spectrumLD.drawRect(	{
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
}
function drawC(){
	spectrumLD.drawCircle(	{
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
}
function draw(){
	spectrumLD.drawPolygon(	{
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
}

function test(){
	eval(document.getElementById('scriptInput').value);
}