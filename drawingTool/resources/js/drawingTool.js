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

    var createObject = function(objectOptions) {
        var object = {};
        object.type = objectOptions.type;
        object.graphicalObject = drawingEngine.createObject(objectOptions.graphicalObjectOptions);
        object.id = getObjectIdNumber();
        return object;
    };
    var group = {
        type: 'default',
        objects: []
    };
    var layer = {
        type: 'default',
        objects: []
    };

    groups[group.type] = group.objects;
    layers[layer.type] = layer.objects;

    function isPointInPoly(poly, pt) {
        for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
        return c;
    }

    function checkForRectObjectIntersections(whatToCheck /* array of Rect objects */, whatToPlace/* Rect object */) {
        for (var i = 0; i < whatToCheck.length; i++) {
            if (inter.constructor.intersectPolygonPolygon(
                drawingEngine.getRectObjectCoords(whatToCheck[i]),
                drawingEngine.getRectObjectCoords(whatToPlace)
                ).status === "Intersection"
                && !angular.equals(whatToCheck[i], whatToPlace)) {
                return false;
        }
    }
    return true;
}

function checkIfObjectCanBePlacedInside(whereToPlace, whatToPlace) {
    if (inter.constructor.intersectPolygonPolygon(
        whereToPlace,
        whatToPlace
        ).status === "Intersection") {
        return false;
}
for (var j = 0; j < whatToPlace.length; j++) {
    if (!isPointInPoly(whereToPlace, whatToPlace[j])) {
        return false;
    }
}
return true;
}

function checkIfObstructionCanBePlaced(obstructionPoints) {
    for (var i = 0; i < roofs; i++) {
        if (!checkIfObjectCanBePlacedInside(roofs[i].polygonPoints, obstructionPoints)) {
            return false;
        }
    }
}

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

layoutService.createObstruction = function(isPolygon, shapePoints, tmpRoof, obstructionStyle) {
    var canBePlaced = false;
    if (isPolygon) {
        if (shapePoints.length > 2) {
            var copyOfShapePoints = {};
            copyOfShapePoints = util.copy(shapePoints);
            var left = this.getLeft(shapePoints),
            top = this.getTop(shapePoints);
            var obstruction = this.createPolygonObject(
                shapePoints, left, top,
                obstructionStyle.strokeWidth,
                obstructionStyle.strokeColor,
                obstructionStyle.fill,
                obstructionStyle.opacity);
            obstruction.polygonPoints = copyOfShapePoints;
            this.addObjectToCanvas(obstruction);
            canBePlaced = this.checkIfObjectCanBePlacedInside(tmpRoof.polygonPoints, obstruction.polygonPoints);
        } else {
            return undefined;
        }
    } else {
        obstruction.polygonPoints = this.getRectObjectCoords(obstruction);
        canBePlaced = this.checkIfObjectCanBePlacedInside(tmpRoof.polygonPoints, obstruction.polygonPoints);
    }
    if (tmpRoof !== false && canBePlaced) {
        this.bringToFront(obstruction);
        obstruction.roof = tmpRoof;
        tmpRoof.obstructions.push(obstruction);
        tmpRoof.isGridCreated = false;
        return obstruction;
    } else {
        this.removeObjectsFromCanvas([obstruction]);
        return undefined;
    }
};

layoutService.pan = function(options, allowedPan, canvasOffset, scale, prevX, prevY) {
    var stopX, offsetX, stopY, offsetY;
    if (options.e.clientX < prevX) {
        if (allowedPan.xCurrentLeft > allowedPan.xLeft /* * (scale / allowedPan.scale)*/) {
            stopX = true;
        } else {
            allowedPan.xCurrentLeft += prevX - options.e.clientX;
            allowedPan.xCurrentRight = -allowedPan.xCurrentLeft;
        }
    }
    if (options.e.clientX > prevX) {
        if (allowedPan.xCurrentRight > allowedPan.xRight/* * (scale / allowedPan.scale)*/) {
            stopX = true;
        } else {
            allowedPan.xCurrentRight += options.e.clientX - prevX;
            allowedPan.xCurrentLeft = -allowedPan.xCurrentRight;
        }
    }
    if (options.e.clientY < prevY) {
        if (allowedPan.yCurrentTop > allowedPan.yTop/* * (scale / allowedPan.scale)*/) {
            stopY = true;
        } else {
            allowedPan.yCurrentTop += prevY - options.e.clientY;
            allowedPan.yCurrentBottom = -allowedPan.yCurrentTop;
        }
    }
    if (options.e.clientY > prevY) {
        if (allowedPan.yCurrentBottom > allowedPan.yBottom /* * (scale / allowedPan.scale)*/) {
            stopY = true;
        } else {
            allowedPan.yCurrentBottom += options.e.clientY - prevY;
            allowedPan.yCurrentTop = -allowedPan.yCurrentBottom;
        }
    }
    if (stopX !== true || stopY !== true) {
        offsetX = stopX === true ? 0 : (options.e.clientX - prevX);
        offsetY = stopY === true ? 0 : (options.e.clientY - prevY);
        var result = drawingEngine.setTransform(
            canvasOffset,
            canvasOffset.x + offsetX,
            canvasOffset.y + offsetY,
            scale, canvas);
        scale = result.scale;
        prevX = options.e.clientX;
        prevY = options.e.clientY;
        return {
            scale: scale,
            allowedPan: allowedPan,
            prevX: prevX,
            prevY: prevY
        };
    }
};
layoutService.centerView = function(canvasOffset, scale) {
    drawingEngine.centerView(canvasOffset, scale);
};
layoutService.setViewBoundriesToBackgroundImage = function(){
    drawingEngine.setViewBoundriesToBackgroundImage();
};
layoutService.setTransform = function(canvasOffset, offsetX, offsetY, scale) {
    return drawingEngine.setTransform(canvasOffset, offsetX, offsetY, scale, canvas);
};
layoutService.zoom = function(canvasOffset, scale, zoomFactor) {
    return drawingEngine.zoom(canvas, this.getCanvasSize(), canvasOffset, scale, zoomFactor);
};
layoutService.createCanvas = function(elementId, elementWrap) {
    canvasElement = document.getElementById(elementId);
    canvasWrapElement = document.getElementById(elementWrap);
    canvas = drawingEngine.createCanvas(elementId, elementWrap);
    canvasElement.addEventListener("objectCreated", function(e) {

        e.detail.data.layer = e.detail.data.layer != undefined ? e.detail.data.layer : "default"; 
        e.detail.data.group = e.detail.data.group != undefined ? e.detail.data.group : "default";

        layers[e.detail.data.layer].push(e.detail.data.object);
        groups[e.detail.data.group].push(e.detail.data.object);

        e.detail.data.object.layer = e.detail.data.layer; 
        e.detail.data.object.group = e.detail.data.group; 
        
        object.id = getObjectIdNumber();
    });
    return canvas;
};
layoutService.increaseZoomLevel = function(){
    drawingEngine.increaseZoomLevel();
};
layoutService.reduceZoomLevel = function(){
    drawingEngine.reduceZoomLevel();
};  
layoutService.setCanvasProperty = function(propName, value) {
    canvas[propName] = value;
};
layoutService.setCanvasSize = function(width, height) {
    drawingEngine.setCanvasSize(canvas, width, height);
};
layoutService.getCanvasSize = function() {
    return drawingEngine.getCanvasSize(canvas);
};
layoutService.getAllObjectsByType = function(type) {
    return drawingEngine.getAllObjectsByType(canvas, type);
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

layoutService.bringToFront = function(object) {
    drawingEngine.bringToFront(object);
};

layoutService.getRectObjectCoords = function(module) {
    return drawingEngine.getRectObjectCoords(module);
};

layoutService.setWidthHeight = function(isPortrait, type, tilt) {
    var width, height;
    if (isPortrait) {
        width = type.width;
        height = type.height * Math.cos(tilt * (Math.PI / 180));
    } else {
        width = type.height;
        height = type.width * Math.cos(tilt * (Math.PI / 180));
    }
    return {
        width: width,
        height: height
    };
};

layoutService.checkIfObjectCanBePlacedInside = function(whereToPlace/*array of points*/, whatToPlace/*array of points*/) {
    return checkIfObjectCanBePlacedInside(whereToPlace, whatToPlace);
};

layoutService.checkIfObjectIntersectsAnyObject = function(whatToCheck , whatToPlace) {
    for (var j = 0; j < whatToCheck.length; j++) {
        for (var z = 0; z < whatToCheck[j].setbackPoints.length; z++) {
            if (isPointInPoly(whatToPlace, whatToCheck[j].setbackPoints[z])) {
                return true;
            }
            for (var i = 0; i < whatToPlace.length; i++) {
                if (isPointInPoly(whatToCheck[j].setbackPoints, whatToPlace[i])) {
                    return true;
                }
            }
        }
        if (inter.constructor.intersectPolygonPolygon(
            whatToCheck[j].setbackPoints,
            whatToPlace
            ).status === "Intersection") {
            return true;
    }
}
return false;
};
layoutService.checkForRectObjectIntersections = function(whatToCheck /* array of Rect objects */, whatToPlace/* RectObject */) {
    return checkForRectObjectIntersections(whatToCheck, whatToPlace);
};
layoutService.isPointInPoly = function(poly, pt) {
    return isPointInPoly(poly, pt);
};
layoutService.getMouseCoords = function(canvas, canvasOffset, scale, e) {
    return drawingEngine.getMouseCoords(canvas, canvasOffset, scale, e);
};
layoutService.mouseOverCell = function(e, canvasOffset, scale, canvas, selectedRoof) {
            //check if grid i active
            if (selectedRoof.gridLayout !== undefined) {
                //convert points to canvas transformed point
                var conversedPoint = drawingEngine.getMouseCoords(canvas, canvasOffset, scale, e);
                //find cell that mouse is over
                for (var i = 0; i < selectedRoof.gridLayout.length; i++) {
                    if (isPointInPoly(drawingEngine.getRectObjectCoords(selectedRoof.gridLayout[i]),
                        conversedPoint)) {
                        return  {
                            mouseOnCell: true,
                            cellNumber: i,
                            obj: selectedRoof.gridLayout[i]
                        };
                    }
                }
                return {mouseOnCell: false};
            }
        };

        layoutService.addObjectToCanvas = function(whatToAdd) {
            drawingEngine.addObjectToCanvas(canvas, whatToAdd);
        };
        layoutService.createLine = function(points, x, y, strokeColor, strokeWidth, strokeDashArray) {
            return drawingEngine.createLine(points, x, y, strokeColor, strokeWidth, strokeDashArray);
        };
        layoutService.createGridCell = function(scale, id, isPortrait, azimuth, tilt, moduleType, left, top, fill, objectType, label) {
            return drawingEngine.createGridCell(scale, id, isPortrait, azimuth, tilt, moduleType, left, top, fill, objectType, label);
        };
        layoutService.createModule = function(scale, id, isPortrait, azimuth, tilt, type, mleft, mtop) {
            var module = drawingEngine.createModule(scale, id, isPortrait, azimuth, tilt, type, mleft, mtop)
            this.addObjectToCanvas(module);
            return module;
        };
        layoutService.createPolygonObject = function(points, left, top, strokeWidth, strokeColor, fill, opacity, type, strokeDash, id) {
            return drawingEngine.createPolygonObject(points, left, top, strokeWidth, strokeColor, fill, opacity, type, strokeDash, id);
        };
        layoutService.createReactangleObject = function(left, top, strokeWidth, strokeColor, fill, opacity, width, height) {
            return drawingEngine.createReactangleObject(left, top, strokeWidth, strokeColor, fill, opacity, width, height);
        };
        layoutService.createCircleObject = function(left, top, strokeWidth, strokeColor, fill, opacity, radius) {
            return drawingEngine.createCircleObject(left, top, strokeWidth, strokeColor, fill, opacity, radius);
        };
        layoutService.createBackgroundImage = function(satelliteImage) {
            /*
             satelliteImg.metricLocation 
             satelliteImg.metricLocation 
             satelliteImg.metricWidth 
             satelliteImg.metricHeight
             satelliteImg.imageBase64
             */
             var image = drawingEngine.createBackgroundImage(satelliteImage, canvas);
             this.addObjectToCanvas(image);
             return image;
         };
         layoutService.createAdjustGrid = function(cells, roof, height, width) {
            return drawingEngine.createAdjustGrid(cells, roof, height, width);
        };
        layoutService.createAzimuthArrow = function(x, y, sizeCoef, opacity) {
            return drawingEngine.createAzimuthArrow(x, y, sizeCoef, opacity);
        };
        layoutService.mouseOverRoof = function(e, scale, canvasOffset, canvas, roofData) {
            var conversedPoint = drawingEngine.getMouseCoords(canvas, canvasOffset, scale, e);
            for (var i = 0; i < roofData.length; i++) {
                if (isPointInPoly(roofData[i].polygonPoints, conversedPoint)) {
                    return {
                        found: true,
                        roof: roofData[i].roofPolygon
                    };
                }
            }
            return {found: false};
        };
        layoutService.setObjectActive = function(mouseX, mouseY, roofs) {
            for (var i = 0; i < roofs.length; i++) {
                if (isPointInPoly(roofs[i].polygonPoints, {x: mouseX, y: mouseY})) {
                    for (var j = 0; j < roofs[i].obstructions.length; j++) {
                        if (isPointInPoly(roofs[i].obstructions[j].polygonPoints, {x: mouseX, y: mouseY})) {
                            return roofs[i].obstructions[j];
                        }
                    }
                    return roofs[i];
                }
            }
            return false;
        };
        layoutService.mouseOverModule = function(e, canvasOffset, scale, canvas, roofData) {
            var conversedPoint = drawingEngine.getMouseCoords(canvas, canvasOffset, scale, e);
            for (var i = 0; i < roofData.length; i++) {
                for (var j = 0; j < roofData[i].layout.layoutUnits.length; j++) {
                    if (isPointInPoly(
                        drawingEngine.getRectObjectCoords(roofData[i].layout.layoutUnits[j].moduleDisplayObject),
                        conversedPoint)) {
                        return {
                            found: true,
                            obj: roofData[i].layout.layoutUnits[j].moduleDisplayObject
                        };
                    }
                }
            }
            return {found: false};
        };
        layoutService.getLeft = function(points) {
            var left = Number.MAX_VALUE;
            points.forEach(function(point) {
                if (point.x < left) {
                    left = point.x;
                }
            });
            return left;
        };
        layoutService.getTop = function(points) {
            var top = Number.MAX_VALUE;
            points.forEach(function(point) {
                if (point.y < top) {
                    top = point.y;
                }
            });
            return top;
        };
        layoutService.scaleAll = function() {
            drawingEngine.scaleAll(canvas);
        };
        layoutService.checkIfObjectInsideObject = function(firstObjPoints, secondObjPoints) {
            for (var i = 0; i < firstObjPoints.legth; i++) {
                if (!isPointInPoly(secondObjPoints, firstObjPoints[i])) {
                    return false;
                }
            }
            if (inter.constructor.intersectPolygonPolygon(firstObjPoints, secondObjPoints).status === "Intersection") {
                return false;
            }
        };
        layoutService.getTransformedPoints = function(points, widthCoef, heightCoef, canvasOffset) {
            var transformPoints = [];
            for (var p = 0; p < points.length; p++) {
                transformPoints.push({
                    x: (points[p].x * widthCoef) + (canvasOffset != undefined && canvasOffset.w != undefined ? canvasOffset.w / 2 : 0),
                    y: (points[p].y * heightCoef) + (canvasOffset != undefined && canvasOffset.h != undefined ? canvasOffset.h / 2 : 0)
                });
            }
            return transformPoints;
        };
        layoutService.setValuesForObject = function(object, top, left, width, height, strokeColor, strokeWidth, fill, opacity, strokeDash, visibility) {
            return drawingEngine.setValuesForObject(object, top, left, width, height, strokeColor, strokeWidth, fill, opacity, strokeDash, visibility);
        };
        layoutService.getImageFromCanvas = function(canvas) {
            drawingEngine.getImageFromCanvas(canvas);
        };
        // remove a group of objects
        layoutService.removeObjectsFromCanvas = function(whatToRemove) {
            return drawingEngine.removeObjectsFromCanvas(whatToRemove, canvas);
        };
        // remove a specific object
        layoutService.deleteSelectedObject = function(objectType){
            if(objectType == undefined){
                drawingEngine.deleteSelectedObject();
            }else{
                // find object to delete
                var selectedObject = drawingEngine.getSelectedObject();

                for(var i = 0; i < groups[selectedObject.group].length; i++){
                    if(selectedObject.id == groups[selectedObject.group][i].id){
                        drawingEngine.deleteSelectedObject(groups[selectedObject.group][i]);
                        groups.splice(i, 1);
                    }                    
                }
                for(var j = 0; j < layers[selectedObject.layer].length; j++){
                   if(selectedObject.id == layers[selectedObject.layer][j].id){
                    drawingEngine.deleteSelectedObject(layers[selectedObject.layer][j]);
                    layers.splice(j, 1);
                } 
            }
        }            
    };
    layoutService.createObject = function(points, options){
        options.layer = options.layer != undefined ? options.layer : "default"; 
        options.group = options.group != undefined ? options.group : "default"; 
        var object = drawingEngine.createObject(canvas, points, options.style, false);
        object.layer = options.layer; 
        object.group = options.group; 
        layers[options.layer].push(object);
        groups[options.group].push(object);
        this.addObjectToCanvas(object);
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
    };

    layoutService.getImageByCoords = function(coord, zoom, callbackFunction) {
        var overlay = new google.maps.OverlayView(),
        size = {width: 640, height: 640},
        maxZoomService = new google.maps.MaxZoomService(),
        map = new google.maps.Map(document.getElementById('map-canvas'), {
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.LARGE,
                position: google.maps.ControlPosition.RIGHT_CENTER
            },
            tilt: 0,
            zoom: 20,
            center: coord,
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            maxZoom: 40
        });
        overlay.draw = function() {};
        overlay.setMap(map);
        maxZoomService.getMaxZoomAtLatLng(coord,
            function(response) {
                var allowedZoomLevel, satelliteImg ={}, siteBounds, basePoint, zoomLevel, imageBounds, metricSEpoint;
                if (response.status == google.maps.MaxZoomStatus.OK && zoom == undefined ) {
                    allowedZoomLevel = response.zoom;
                }else{
                    allowedZoomLevel = zoom;
                }
                siteBounds = googleImageProvider.getSiteBoundsByPoint(coord, size, overlay);
                var calculatedZoomLevel = googleImageProvider.getBoundsZoomLevel(siteBounds, size);
                allowedZoomLevel = (calculatedZoomLevel <= allowedZoomLevel) && (allowedZoomLevel != "ERROR") ? calculatedZoomLevel : allowedZoomLevel;

                basePoint = googleImageProvider.getNWPointFromBounds(siteBounds);
                imageBounds = googleImageProvider.getGoogleTileCorners(siteBounds.getCenter(), allowedZoomLevel, size);
                metricSEpoint = googleImageProvider.getMetricCoords(
                    googleImageProvider.getNWPointFromBounds(imageBounds),
                    googleImageProvider.getSEPointFromBounds(imageBounds));
                satelliteImg.metricLocation = googleImageProvider.getMetricCoords(
                    basePoint, googleImageProvider.getNWPointFromBounds(imageBounds));
                satelliteImg.metricLocation = {x: -satelliteImg.metricLocation.x, y: -satelliteImg.metricLocation.y};
                satelliteImg.metricWidth = metricSEpoint.x;
                satelliteImg.metricHeight = metricSEpoint.y;
                var imgLink = "http://maps.googleapis.com/maps/api/staticmap?center="
                + new google.maps.LatLng(coord.lat, coord.lng).toString()
                + "&zoom=" + allowedZoomLevel
                + "&size=" + size.width + "x" + size.height
                + "&maptype=satellite&scale=2";
                satelliteImg.link = imgLink;
                layoutService.createBackgroundImage(satelliteImg);
                return callbackFunction(satelliteImg);
            });
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

function setStylesToZoomControllerElements(elements){
    // setting style to slider element
    elements.controllerWrap.style.top = (canvasWrapElement.offsetTop + (elements.zoomInButton.offsetHeight * 2.5)).toString()+"px"; 
    // elements.slider.style.height = (canvasWrapElement.offsetHeight * 0.65).toString()+"px";
    // setting style to zoom in button element
    elements.zoomInButton.style.top = (-elements.zoomInButton.offsetHeight*1.5).toString()+"px";
    // setting style to zoom out button element
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