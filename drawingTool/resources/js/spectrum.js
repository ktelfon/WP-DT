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
	spectrumLayoutDesigner.drawPolygon = function(data){
		layoutService.drawPolygon(data);	
	};
	spectrumLayoutDesigner.drawRect = function(data){
		layoutService.drawRect(data);	
	};
	spectrumLayoutDesigner.drawCircle = function(data){
		layoutService.drawCircle(data);	
	};
	// objectType - what type of object to delete, if not set delete selected
	spectrumLayoutDesigner.deleteSelectedObject = function(groupName, layerName){
		layoutService.deleteSelectedObject(groupName, layerName);
	};
	spectrumLayoutDesigner.addLayer = function(layerName){
		layoutService.addLayer(layerName);
	};
	spectrumLayoutDesigner.removeLayer = function(layerName){
		layoutService.removeLayer(layerName);
	};
	spectrumLayoutDesigner.addGroup = function(groupName){
		layoutService.addGroup(groupName);
	};
	spectrumLayoutDesigner.removeGroup = function(groupName){
		layoutService.removeGroup(groupName);
	};
	spectrumLayoutDesigner.moveArrowOnSelectedShape = function(degrees){
		layoutService.moveArrowOnSelectedShape(degrees);
	};

	return spectrumLayoutDesigner;
};