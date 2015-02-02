var LayoutService = function(constructorOptions) {

    var canvas = null,
    roofs = [],
    // groups = new Map(),
    // layers = new Map(),
    layoutService = {},
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

    var createObject = function(objectOptions) {
        var object = {};
        object.type = objectOptions.type;
        object.graphicalObject = drawingEngine.createObject(objectOptions.graphicalObjectOptions);
        return object;
    };
    // var group = {
    //     type: 'default',
    //     objects: []
    // };
    // var layer = {
    //     type: 'default',
    //     objects: []
    // };

    // groups[group.type] = group.objects;
    // layers[layer.type] = layer.objects;

    function calculatePolygonArea(X, Y, numPoints) {
        var area = 0;
        var j = numPoints - 1;
        for (var i = 0; i < numPoints; i++) {
            area = area + (X[j] + X[i]) * (Y[j] - Y[i]);
            j = i;
        }
        return area / 2;
    }

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

// layoutService.addLayer = function(type){
//     var layerIsCreated = false;
//     for(var type in layers) {
//         if(myObject.hasOwnProperty(key)) {
//             layerIsCreated = true;
//         }
//     }
//     if(!layerIsCreated){
//         layers[type] = [];
//     }
// };

// layoutService.addGroup = function(type){
//     var groupIsCreated = false;
//     for(var type in groups) {
//         if(myObject.hasOwnProperty(key)) {
//             groupIsCreated = true;
//         }
//     }
//     if(!groupIsCreated){
//         groups[type] = [];
//     }
// };

// layoutService.removeLayer = function(type){
//     for(var i= 0;  i < layers[type].length; i++){
//         layoutService.removeObjectsFromCanvas(layers[type][i]);
//     }
// };

// layoutService.removeGroup = function(type){
//     for(var i= 0;  i < groups[type].length; i++){
//         layoutService.removeObjectsFromCanvas(groups[type][i]);
//     }
// };

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
            // gets all objects that have the same value in paramter "type" as input values type
            return drawingEngine.getAllObjectsByType(canvas, type);
        };

        layoutService.checkIfPolygonisClockwise = function(points) {
            var area = 0;
            for (var i = 0; i < points.length; i++) {
                j = (i + 1) % points.length;
                area += points[i].x * points[j].y;
                area -= points[j].x * points[i].y;
            }
            return area / 2;
        };
        layoutService.pointsDistance = function(point1, point2) {
            var xs = 0;
            var ys = 0;
            xs = point2.x - point1.x;
            xs = xs * xs;
            ys = point2.y - point1.y;
            ys = ys * ys;
            return Math.sqrt(xs + ys);
        };
        layoutService.calculatePolygonArea = function(points) {
            var X = [];
            var Y = [];
            for (var j = 0; j < points.length; j++) {
                X.push(points[j].x);
                Y.push(points[j].y);
            }
            return Math.abs(calculatePolygonArea(X, Y, points.length));
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
        layoutService.checkIfObjectIntersectsAnyObject = function(whatToCheck /* array of point arrays */, whatToPlace/* array of points */) {
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
        layoutService.getImageFromCanvas = function(canvas) {
            drawingEngine.getImageFromCanvas(canvas);
        };
        layoutService.removeObjectsFromCanvas = function(whatToRemove) {
            return drawingEngine.removeObjectsFromCanvas(whatToRemove, canvas);
        };
        layoutService.setValuesForObject = function(object, top, left, width, height, strokeColor, strokeWidth, fill, opacity, strokeDash, visibility) {
            return drawingEngine.setValuesForObject(object, top, left, width, height, strokeColor, strokeWidth, fill, opacity, strokeDash, visibility);
        };
        /**
    Creates graprics from points and options
    */
    layoutService.createObject = function(points, options){
    /* options = {
        layer: "default",
        group: "default",
        style: {
            lineColor: "red",
            lineWidth: "1.0",
            fill: "red",
            opacity: "1.0",
            lineStyle: {}
        }
    }*/
    options.layer = options.layer != undefined ? options.layer : "default"; 
    options.group = options.group != undefined ? options.group : "default"; 
    var object = drawingEngine.createObject(canvas, points, options.style);
    // layers[options.layer].push(object);
    // groups[options.group].push(object);
    this.addObjectToCanvas(object);
};
layoutService.setZoomLevel = function(zoomLevel){
    drawingEngine.setZoomLevel(zoomLevel);
};
layoutService.expandPictureToScreen = function(){
    drawingEngine.expandPictureToScreen();  
};
/**
  Gets image by coords with provided zoom
  is delayed by responce from google 
  */
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
        if(zoomController.showZoomControls){
            // hide control
            zoomController.showZoomControls = false;
        }else{
            // show controll
            zoomController.showZoomControls = true;
            zoomController.isCreated = true;
            zoomController.elements = {};
            // creating html elements
            var zoomSliderControllerElement = "<div id='zoomSliderController'></div>",
            slider = "<input id='zoomSlider' type=range \n\
            min="+ drawingEngine.getMinScale()+" \n\
            max="+ drawingEngine.getMaxScale()+" \n\
            value="+drawingEngine.getDefaultContainerScale()+" \n\
            step=0.1 orient='vertical'>",
            zoomInButton = "<button id='zoomInButton' class='zoomSliderButton'>+</button>",
            zoomOutButton = "<button id='zoomOutButton' class='zoomSliderButton'>-</button>";

            // add zoomController to canvas wrap
            util.appendHtml(canvasWrapElement, zoomSliderControllerElement);
            // add buttons to control
            zoomController.elements.controllerWrap = document.getElementById("zoomSliderController");
            util.appendHtml(zoomController.elements.controllerWrap, zoomInButton);
            util.appendHtml(zoomController.elements.controllerWrap, slider);
            util.appendHtml(zoomController.elements.controllerWrap, zoomOutButton);

            zoomController.elements = {
                slider : document.getElementById("zoomSlider"),
                zoomInButton: document.getElementById("zoomInButton"),
                zoomOutButton: document.getElementById("zoomOutButton")
            };
           
            zoomController.elements.slider.minValue = drawingEngine.getMinScale();
            zoomController.elements.slider.maxValue = drawingEngine.getMaxScale();
            zoomController.elements.slider.currentZoomValue = drawingEngine.getDefaultContainerScale();

            setStylesToZoomControllerElements(zoomController.elements);
            addEventListenersToZoomControllerElements(zoomController.elements);
        } 
    }
};

function setStylesToZoomControllerElements(elements){
    // setting style to slider element
    elements.slider.style.top = (canvasWrapElement.offsetTop + (elements.zoomInButton.offsetHeight * 2.5)).toString()+"px"; 
    elements.slider.style.height = (canvasWrapElement.offsetHeight * 0.65).toString()+"px";
    // setting style to zoom in button element
    elements.zoomInButton.style.top = (canvasWrapElement.offsetTop + (elements.zoomInButton.offsetHeight )).toString()+"px";
    // setting style to zoom out button element
    elements.zoomOutButton.style.top = ((elements.slider.offsetTop * 0.65) 
        + (elements.slider.offsetHeight) 
        + (elements.zoomInButton.offsetHeight * 2.5)).toString()+"px";
}

function addEventListenersToZoomControllerElements(elements){
    util.addEvent(elements.slider, "change", function(e){
        drawingEngine.setZoomLevel(parseFloat(this.value));
    });
    util.addEvent(elements.zoomInButton, "click", function(e){
        drawingEngine.increaseZoomLevel();
        elements.slider.value = drawingEngine.getDefaultContainerScale();
    });
    util.addEvent(elements.zoomOutButton, "click", function(e){
        drawingEngine.reduceZoomLevel();
        elements.slider.value = drawingEngine.getDefaultContainerScale();
    });
};

function MouseWheelHandler(e){
    var e = window.event || e; // old IE support
    zoomController.elements.slider.value = drawingEngine.zoom(
        e.clientX,
        e.clientY,
        Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))));
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