var SpectrumLayoutDesigner = function(constructorOptions){
	/* constructorOptions ={canvasId:..., zoom:..., mapImage:...,coord:...};*/
	var layoutService = LayoutService(constructorOptions);
	var spectrumLayoutDesigner = {};

	spectrumLayoutDesigner.createCanvas = function(elementId, elementWrap){
		layoutService.createCanvas(elementId, elementWrap);
	};
	spectrumLayoutDesigner.addEventListeners = function(elementId){
		layoutService.addEventListeners(elementId);
	};

	spectrumLayoutDesigner.createBackgroundImage = function(image){
		layoutService.createBackgroundImage(image);
	};

	spectrumLayoutDesigner.createObject = function(canvas, points, style){
		layoutService.createObject(canvas, points, style);
	};

	spectrumLayoutDesigner.setZoomLevel = function(zoomLevel){
		layoutService.setZoomLevel(zoomLevel);
	};

	spectrumLayoutDesigner.centerView = function(){
		layoutService.centerView();
	};

	spectrumLayoutDesigner.expandPictureToScreen = function(){
		layoutService.expandPictureToScreen();
	};

	spectrumLayoutDesigner.getImageByCoords = function(coords, zoom, callbackFunction){
		layoutService.getImageByCoords(coords, zoom, callbackFunction);
	};

	spectrumLayoutDesigner.setViewBoundriesToBackgroundImage = function(){
    	layoutService.setViewBoundriesToBackgroundImage();            
	};

	spectrumLayoutDesigner.increaseZoomLevel = function(){
		layoutService.increaseZoomLevel();
	};

	spectrumLayoutDesigner.reduceZoomLevel = function(){
		layoutService.reduceZoomLevel();	
	};
	spectrumLayoutDesigner.addZoomController = function(){
		layoutService.addZoomController();	
	};
	spectrumLayoutDesigner.hideZoomController = function(){
		layoutService.hideZoomController();	
	};
	spectrumLayoutDesigner.showZoomController = function(){
		layoutService.showZoomController();	
	};
	spectrumLayoutDesigner.removeZoomController = function(){
		layoutService.removeZoomController();	
	};

	return spectrumLayoutDesigner;
};