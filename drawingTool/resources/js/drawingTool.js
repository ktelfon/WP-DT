var LayoutService = function(constructorOptions) {

    var canvas = null,
    roofs = [],
    objectsIds = 0,
    groups = new Object(),
    layers = new Object(),
    layoutService = {},
    geometryUtils = new GeometryUtils(),
    inter = new Intersection(),
    drawingEngine = DrawingEngine(),
    googleImageProvider = GoogleImageProvider(),
    zoomController = {
        showZoomControls : false,
        isCreated : false
    },
    canvasElement = {},
    canvasWrapElement = {},
    util = Util();

    function getObjectIdNumber() {
        objectsIds++;
        return objectsIds;
    }

    function initGroupsAndLayers(){
        var group = {
            type: 'default',
            objects: []
        };
        var roofGroup = {
            type: 'roof',
            objects: []
        };
        var layer = {
            type: 'default',
            objects: []
        };
        groups[group.type] = group.objects;
        groups[roofGroup.type] = roofGroup.objects;
        layers[layer.type] = layer.objects;
    }

    initGroupsAndLayers();

    

    layoutService.addLayer = function(layerName){
        var layerIsCreated = false;
        for(var type in layers) {
            if(layers.hasOwnProperty(layerName)) {
                layerIsCreated = true;
            }
        }
        if(!layerIsCreated){
            layers[layerName] = [];
        }
    };

    layoutService.addGroup = function(groupName){
        var groupIsCreated = false;
        for(var type in groups) {
            if(groups.hasOwnProperty(groupName)) {
                groupIsCreated = true;
            }
        }
        if(!groupIsCreated){
            groups[groupName] = [];
        }
    };

    layoutService.removeLayer = function(type){
        layoutService.removeObjectsFromCanvas(layers[type][i]);
        layers[type] = [];
    };

    layoutService.removeGroup = function(type){
        layoutService.removeObjectsFromCanvas(groups[type]);
        groups[type] = [];
    };

    layoutService.centerView = function(canvasOffset, scale) {
        drawingEngine.centerView(canvasOffset, scale);
    };
    layoutService.setViewBoundriesToBackgroundImage = function(){
        drawingEngine.setViewBoundriesToBackgroundImage();
    };
    layoutService.zoom = function(canvasOffset, scale, zoomFactor) {
        return drawingEngine.zoom(canvas, this.getCanvasSize(), canvasOffset, scale, zoomFactor);
    };
    layoutService.createCanvas = function(elementId, elementWrap) {
        canvasElement = document.getElementById(elementId);
        canvasWrapElement = document.getElementById(elementWrap);
        canvas = drawingEngine.createCanvas(elementId, elementWrap);
        canvasElement.addEventListener("objectCreated", function(e) {
            organiseObject(e.detail.data, e.detail.object);
        });
        return canvas;
    };
    layoutService.increaseZoomLevel = function(){
        drawingEngine.increaseZoomLevel();
    };
    layoutService.reduceZoomLevel = function(){
        drawingEngine.reduceZoomLevel();
    }; 

    layoutService.checkIfPolygonisClockwise = function(points) {
        return geometryUtils.checkIfPolygonisClockwise(points);
    };

    layoutService.pointsDistance = function(point1, point2) {
        return geometryUtils.pointsDistance(point1, point2);
    };

    layoutService.calculatePolygonArea = function(points) {
        return geometryUtils.calculatePolygonArea(points);
    };

    layoutService.addObjectToCanvas = function(whatToAdd) {
        drawingEngine.addObjectToCanvas(canvas, whatToAdd);
    };

    layoutService.createBackgroundImage = function(satelliteImage) {
        // satelliteImg.metricLocation, satelliteImg.metricLocation, satelliteImg.metricWidth, satelliteImg.metricHeight, satelliteImg.imageBase64
        var image = drawingEngine.createBackgroundImage(satelliteImage, canvas);
        this.addObjectToCanvas(image);
        return image;
    };

        // remove a group of objects
        layoutService.removeObjectsFromCanvas = function(whatToRemove) {
            return drawingEngine.removeObjectsFromCanvas(whatToRemove, canvas);
        };
        // remove a specific object
        layoutService.deleteSelectedObject = function(groupName, layerName){
            if(groupName == undefined && layerName == undefined){
                drawingEngine.deleteSelectedObject();
            }else{
                // find object to delete
                var selectedObject = drawingEngine.getSelectedObject();
                if(groupName != undefined && layerName != undefined){
                    var group = groups[groupName];
                    for(var i = 0; i < group.length; i++){
                        if(selectedObject.id == group[i].id){
                            var layer = layers[layerName];
                            for(var j = 0; j < layer.length; j++){
                                if(selectedObject.id == layer[j].id){
                                    drawingEngine.deleteSelectedObject(layer[j]);
                                    layer.splice(j, 1);
                                    group.splice(i, 1);
                                } 
                            }                            
                        }                    
                    }
                    return;
                }
                if(groupName != undefined){
                    var group = groups[groupName];
                    for(var i = 0; i < group.length; i++){
                        if(selectedObject.id == group[i].id){
                            drawingEngine.deleteSelectedObject(group[i]);
                            group.splice(i, 1);
                        }                    
                    }
                    return;
                }
                if(layerName != undefined){
                    var layer = layers[layerName];
                    for(var j = 0; j < layer.length; j++){
                        if(selectedObject.id == layer[j].id){
                            drawingEngine.deleteSelectedObject(layer[j]);
                            layer.splice(j, 1);
                        } 
                    }
                    return;
                }
            }            
        };
        layoutService.createObject = function(points, options){
            var object = drawingEngine.createObject(canvas, points, options.style, false);
            organiseObject(options, object);
        };
        layoutService.setZoomLevel = function(zoomLevel){
            drawingEngine.setZoomLevel(zoomLevel);
        };
        layoutService.drawPolygon = function(data){
            drawingEngine.drawPolygon(data);
        };
        layoutService.drawRect = function(data){
            drawingEngine.drawRect(data);  
        };
        layoutService.drawCircle = function(data){
            drawingEngine.drawCircle(data);    
        };
        layoutService.expandPictureToScreen = function(){
            drawingEngine.expandPictureToScreen();
            if(zoomController.isCreated){
                layoutService.removeZoomController();
                layoutService.addZoomController();
            }  
        };

        layoutService.getSelectedObject = function(){
            return drawingEngine.getSelectedObject().id;
        };

        layoutService.getImageByCoords = function(coord, zoom, callbackFunction) {
            layoutService.createBackgroundImage(googleImageProvider.getImageByCoords(coord, zoom, callbackFunction));
        };

layoutService.addEventListeners = function(elementId) {

    if(canvasElement!=undefined){
        // adds mouse wheel listener for all browsers
        if (canvasElement.addEventListener) {
            // IE9, Chrome, Safari, Opera
            canvasElement.addEventListener("mousewheel", MouseWheelHandler, false);
            // Firefox
            canvasElement.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
        }else{ 
            // IE 6/7/8
            canvasElement.attachEvent("onmousewheel", MouseWheelHandler);
        }

        drawingEngine.addEventListeners(elementId);
    }
};

layoutService.addZoomController=function(){
    if(canvasWrapElement != undefined){
        if(!zoomController.showZoomControls && !zoomController.isCreated){
            // show controll
            zoomController.showZoomControls = true;
            zoomController.isCreated = true;
            zoomController.elements = {};
            // creating html elements
            var zoomSliderControllerElement = "<div id='zoomSliderController'></div>",
            slider = "<input id='zoomSlider' type=range data-slider-id='zoomSlider' \n\
            data-slider-min="+ drawingEngine.getMinScale()+" \n\
            data-slider-max="+ drawingEngine.getMaxScale()+" \n\
            data-slider-value="+drawingEngine.getDefaultContainerScale()+" \n\
            data-slider-step="+ drawingEngine.getScaleStep()+ " \n\
            data-slider-tooltip='hide' data-slider-orientation='vertical' data-slider-handle='square'>",
            zoomInButton = "<button id='zoomInButton' class='zoomSliderButton'>+</button>",
            zoomOutButton = "<button id='zoomOutButton' class='zoomSliderButton'>-</button>";

            // add zoomController to canvas wrap
            util.appendHtml(canvasWrapElement, zoomSliderControllerElement);
            // add buttons to control
            zoomController.elements.controllerWrap = document.getElementById("zoomSliderController");
            util.appendHtml(zoomController.elements.controllerWrap, zoomInButton);
            util.appendHtml(zoomController.elements.controllerWrap, slider);
            util.appendHtml(zoomController.elements.controllerWrap, zoomOutButton);
            
            zoomController.elements.slider = document.getElementById("zoomSlider");
            zoomController.elements.zoomInButton = document.getElementById("zoomInButton");
            zoomController.elements.zoomOutButton = document.getElementById("zoomOutButton");

            zoomController.elements.slider.minValue = drawingEngine.getMinScale();
            zoomController.elements.slider.maxValue = drawingEngine.getMaxScale();
            zoomController.elements.slider.currentZoomValue = drawingEngine.getDefaultContainerScale();

            zoomController.elements.sliderObject = new Slider("#zoomSlider", {
                reversed : true
            });

            setStylesToZoomControllerElements(zoomController.elements);
            addEventListenersToZoomControllerElements(zoomController.elements);

        } 
    }
};

layoutService.hideZoomController = function(){
    if(canvasWrapElement != undefined){
        if(zoomController.showZoomControls){
            zoomController.showZoomControls = false;
            zoomController.elements.controllerWrap.style.display = "none";
        }
    }
};

layoutService.showZoomController = function(){
    if(canvasWrapElement != undefined){
        if(!zoomController.showZoomControls){
            zoomController.showZoomControls = true;
            zoomController.elements.controllerWrap.style.display = "block";
        }
    }
};

layoutService.removeZoomController = function(){
    if(canvasWrapElement != undefined){
        if(zoomController.isCreated){
            zoomController.isCreated = false;
            zoomController.showZoomControls = false;
            canvasWrapElement.removeChild(zoomController.elements.controllerWrap);
        }
    }
};

layoutService.moveArrowOnSelectedShape = function(degrees){
    drawingEngine.moveArrowOnSelectedShape(degrees);
};

function organiseObject(data, object){

    data.layer = data.layer != undefined ? data.layer : "default"; 
    data.group = data.group != undefined ? data.group : "default";

    layers[data.layer].push(object);
    groups[data.group].push(object);

    object.layer = data.layer; 
    object.group = data.group; 
    if(object.id != undefined){
        object.id = util.generateUUID();
    }

    if(data.group === "roof"){
        object.arrowDegrees = data.style.arrowDegrees;
        object.arrowObject = drawingEngine.createAzimuthArrow(object);
    }
}

function setStylesToZoomControllerElements(elements){
    // setting style to slider element
    elements.controllerWrap.style.top = (canvasWrapElement.offsetTop + (elements.zoomInButton.offsetHeight * 2.5)).toString()+"px"; 
    elements.zoomInButton.style.top = (-elements.zoomInButton.offsetHeight * 1.5).toString()+"px";
    elements.zoomOutButton.style.top = (elements.controllerWrap.offsetHeight + elements.zoomInButton.offsetHeight*0.5).toString()+"px";
}

function addEventListenersToZoomControllerElements(elements){
    util.addEvent(elements.slider, "change", function(e){
        drawingEngine.setZoomLevel(parseFloat(this.value));
    });
    util.addEvent(elements.zoomInButton, "click", function(e){
        drawingEngine.increaseZoomLevel();
        zoomController.elements.sliderObject.setValue(
            drawingEngine.getDefaultContainerScale());
    });
    util.addEvent(elements.zoomOutButton, "click", function(e){
        drawingEngine.reduceZoomLevel();
        zoomController.elements.sliderObject.setValue(
            drawingEngine.getDefaultContainerScale());
    });
    elements.sliderObject.on("slide",function(e){
        if(e !== null && typeof e === 'object'){
            drawingEngine.setZoomLevel(e.value);
        }else{
            drawingEngine.setZoomLevel(e);
        }
    });
    elements.sliderObject.on("slideStop",function(e){
        if(e !== null && typeof e === 'object'){
            drawingEngine.setZoomLevel(e.value);
        }else{
            drawingEngine.setZoomLevel(e);
        }
    });
};

function MouseWheelHandler(e){
    var e = window.event || e; // old IE support
    zoomController.elements.sliderObject.setValue(drawingEngine.zoom(
        e.clientX,
        e.clientY,
        Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))));
};

if (constructorOptions != undefined) {
            //  (canvasID)
            if (constructorOptions.canvasId != undefined &&
               constructorOptions.canvasIdWrap != undefined &&
               constructorOptions.zoom == undefined &&
               constructorOptions.mapImage == undefined &&
               constructorOptions.coord == undefined) {
                layoutService.createCanvas(constructorOptions.canvasId, constructorOptions.canvasIdWrap);
            layoutService.addEventListeners();
        }
            // (canvasID, zoom)
            if (constructorOptions.canvasId != undefined &&
                constructorOptions.canvasIdWrap != undefined &&
                constructorOptions.zoom != undefined &&
                constructorOptions.mapImage == undefined &&
                constructorOptions.coord == undefined) {
                layoutService.createCanvas(constructorOptions.canvasId, constructorOptions.canvasIdWrap);
            layoutService.addEventListeners();
            layoutService.setZoomLevel(constructorOptions.zoom);
        }
            // (canvasID, zoom, mapImage)
            if (constructorOptions.canvasId != undefined &&
                constructorOptions.canvasIdWrap != undefined &&
                constructorOptions.zoom != undefined &&
                constructorOptions.mapImage != undefined &&
                constructorOptions.coord == undefined) {
                layoutService.createCanvas(constructorOptions.canvasId, constructorOptions.canvasIdWrap);
            layoutService.addEventListeners();
            layoutService.createBackgroundImage(constructorOptions.mapImage);
            layoutService.setZoomLevel(constructorOptions.zoom);
        }
            // (canvasID, zoom, coord)
            if (constructorOptions.canvasId != undefined &&
                constructorOptions.canvasIdWrap != undefined &&
                constructorOptions.zoom != undefined &&
                constructorOptions.mapImage == undefined &&
                constructorOptions.coord != undefined) {
                layoutService.createCanvas(constructorOptions.canvasId, constructorOptions.canvasIdWrap);
            layoutService.addEventListeners();
            layoutService.getImageByCoords(constructorOptions.coord, constructorOptions.zoom, function(){

            });
        }
    }

    return layoutService;
};