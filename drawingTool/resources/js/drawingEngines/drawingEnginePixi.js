var DrawingEngine = function() {

	var drawingEngine = {},	defaultContainer = {},
	defaultContainerScale = 1, minScale = 0.005,
	maxScreenWidth = 1980, maxScreenHeight = 1080,
	maxScale = 100, isObjectDragging = false,
	windowWidth = window.innerWidth,
	windowHeight = window.innerHeight,
	canvas = {}, stage = {}, scaleStep = 0.3,
	 //Used to check if mouse is down
	 mousedown = false, renderer = {},
	 defaultContainerZoomOffsetX = 0,
	 defaultContainerZoomOffsetY = 0,
	 util = Util(), canvasElement = {},
	 canvasWrapElement = {},
	 defaultSnapPointRadius = 0.2,
	 drawingModesProperties = setDefaultDrawingModesProperties(),
	 geometryUtils = new GeometryUtils(),
	 selectedObject = undefined,
	 backgroundImageProperties = {
	 	backgroundPicSet : false	
	 },
	 viewParameters = {}; 

	//
	// getters setters
	//
	drawingEngine.getScaleStep = function(){
		return scaleStep;
	};
	drawingEngine.getDefaultContainerScale = function(){
		return defaultContainerScale;
	};

	drawingEngine.setDefaultContainerScale = function(newDefaultContainerScale){
		defaultContainerScale = newDefaultContainerScale;
	};
	
	drawingEngine.getMinScale = function(){
		return minScale;
	};
	drawingEngine.getMaxScale = function(){
		return maxScale;
	};	

	drawingEngine.setMaxPictureExpansionWidth = function(newMaxScreenWidth){
		maxScreenWidth = newMaxScreenWidth;
	};
	drawingEngine.setMaxPictureExpansionHeight = function(newMaxScreenHeight){
		maxScreenHeight = newMaxScreenHeight;
	};
	drawingEngine.getSelectedObject = function(){
		return selectedObject;
	};

	drawingEngine.setZoomLevel = function(zoomLevel){
		var defaultContainerOldScale = defaultContainerScale;
		defaultContainerScale = zoomLevel;
    	//Check to see that the scale is not outside of the specified bounds
    	if (defaultContainerScale > maxScale) defaultContainerScale = maxScale
    		else if (defaultContainerScale < minScale) defaultContainerScale = minScale

	    // This is the magic. I didn't write this, but it is what allows the zoom to work.
		// defaultContainerZoomOffsetX = defaultContainer.position.x;
		// defaultContainerZoomOffsetY = defaultContainer.position.y;

		defaultContainerZoomOffsetX = (defaultContainerZoomOffsetX - canvasElement.width/2) *
		(defaultContainerScale / defaultContainerOldScale) + canvasElement.width/2;
		defaultContainerZoomOffsetY = (defaultContainerZoomOffsetY - canvasElement.height/2) *
		(defaultContainerScale / defaultContainerOldScale) + canvasElement.height/2;

	    //Set the position and scale of the DisplayObjectContainer
	    defaultContainer.scale.set(defaultContainerScale, defaultContainerScale);
	    defaultContainer.position.set(defaultContainerZoomOffsetX, defaultContainerZoomOffsetY);
	    renderer.render(stage);
	    if(viewParameters.viewBoundriesSet === true){
	    	checkIfViewIsInBoundries();
	    	renderer.render(stage);
	    }
	    return defaultContainerScale; 
	};

	//
	// Public Functions
	//

	 /*
	 Creates stage with stage and main container for drawings and image
	 creating renderer and starts animation
	 @return PIXI.Satge
	 */
	 drawingEngine.createCanvas = function(elementId, elementWrap){
	 	
	 	canvasElement = document.getElementById(elementId);
	 	canvasWrapElement = document.getElementById(elementWrap);

	 	stage = new PIXI.Stage(0xFFFFFF);
	 	defaultContainer = new PIXI.DisplayObjectContainer();

	 	stage.addChild(defaultContainer);
	 	defaultContainer.renderable = true;

	 	renderer = new PIXI.autoDetectRenderer( windowWidth, windowHeight,{
	 		view: canvasElement
		});//autoDetectRenderer(400, 300);

	 	renderer.view.style.display = "block";
		// add the renderer view element to the DOM

		canvasWrapElement.appendChild(renderer.view);
		requestAnimFrame( animate );

		return stage;
	};

	/*
	Adds mouse envent listeners to stage 
	*/
	
	drawingEngine.addEventListeners = function(elementId){

		stage.mousedown = function(interactionData){
			clientX = -1;
			clientY = -1;
			mousedown = true;

			if(isDrawingModeOn()){
				drawingModesProperties.mouseDownPoint = {
					x: (interactionData.originalEvent.clientX - defaultContainerZoomOffsetX) / defaultContainerScale,
					y: (interactionData.originalEvent.clientY - defaultContainerZoomOffsetY) / defaultContainerScale
				};
			}

			if(drawingModesProperties.drawingModeTypes.polygon === true){				
				drawingModesProperties.points.push(util.copy(drawingModesProperties.mouseDownPoint));

				if(drawingModesProperties.points.length > 1){
					var line = createPolygon(
						[drawingModesProperties.lines, drawingModesProperties.mouseFollowPoint],
						drawingModesProperties.data.style); 
					drawingModesProperties.lines.push(line);

					if(geometryUtils.pointsDistance(
						fromPixelsTometers([drawingModesProperties.points[0]])[0],
						fromPixelsTometers([drawingModesProperties.points[drawingModesProperties.points.length - 1]])[0]) < drawingModesProperties.snapPointRadius){
						stopDrawingPolygon();
				}
			}
		}
		if(drawingModesProperties.drawingModeTypes.circle === true){

		}
		if(drawingModesProperties.drawingModeTypes.rect === true){

		}	
	};

	stage.mouseup = function(interactionData){
		mousedown = false;

		if(drawingModesProperties.drawingModeTypes.circle === true){
			stopDrawingCircle();

		}
		if(drawingModesProperties.drawingModeTypes.rect === true){
			stopDrawingRect();
		}
	};

	stage.mousemove = function(interactionData){
		var e = interactionData.originalEvent;

		if(isDrawingModeOn()){
			drawingModesProperties.mouseFollowPoint = {
				x: (interactionData.originalEvent.clientX - defaultContainerZoomOffsetX) / defaultContainerScale ,
				y: (interactionData.originalEvent.clientY - defaultContainerZoomOffsetY) / defaultContainerScale
			};   	
		}

		if(mousedown && !isObjectDragging && !isDrawingModeOn()) {
			panCanvas(e);
		}
		if(drawingModesProperties.drawingModeTypes.polygon === true){
			lineFollowMouse();
			if(drawingModesProperties.points.length > 1){
				if(geometryUtils.pointsDistance(
					fromPixelsTometers([drawingModesProperties.points[0]])[0],
					fromPixelsTometers([drawingModesProperties.mouseFollowPoint])[0]) < drawingModesProperties.snapPointRadius){
					canvasElement.style.cursor = 'pointer';
			}else{
				canvasElement.style.cursor = 'crosshair';
			}
		}
	}
	if(drawingModesProperties.drawingModeTypes.circle === true){
		circleFollowMouse(e, drawingModesProperties.data.style);
	}
	if(drawingModesProperties.drawingModeTypes.rect === true){
		rectFollowMouse(e, drawingModesProperties.data.style);
	}

};

canvasElement.oncontextmenu = function() {
	if(drawingModesProperties.drawingModeTypes.polygon){
		stopDrawingPolygon();
	}  
	return false;
}

util.addEvent(window, "resize", function () {
	drawingEngine.centerView();
	drawingEngine.setViewBoundriesToBackgroundImage();
});

util.addEvent(canvasElement,"mouseout",function(){
	mousedown = false;
}); 

var resize = function () {
	window.addEventListener('resize', rendererResize);
	window.addEventListener('deviceOrientation', rendererResize);
};

resize();
};

drawingEngine.createBackgroundImage = function(satelliteImage){
	if(backgroundImageProperties.backgroundPicSet === true){
		for(var i = 0; i < defaultContainer.children.length; i++){
			if(defaultContainer.children[i].isBgImage === true){
				defaultContainer.removeChild(defaultContainer.children[i]);
			}
		}
	};

	backgroundImageProperties.imageMeterSize = {
		width: satelliteImage.metricWidth,
		height: satelliteImage.metricHeight
	};

	var texture = PIXI.Texture.fromImage(satelliteImage.link, true);
		// create a new Sprite using the texture
		var bgImage = new PIXI.Sprite(texture);
		// Sets pic in the top left corner
		bgImage.position.x = 0;
		bgImage.position.y = 0;
		bgImage.width = 1280;
		bgImage.height = 1280;
		bgImage.isBgImage = backgroundImageProperties.backgroundPicSet = true;
		backgroundImageProperties.backgroundImageObject = bgImage;
		return bgImage;
		
	};

	/*
	Adds any object to stage for display 
	*/
	drawingEngine.addObjectToCanvas = function(canvas, whatToAdd){
		// sets background image to background
		if(defaultContainer.children.length > 0 && whatToAdd.isBgImage === true){
			defaultContainer.addChildAt(whatToAdd , 0);
		}else{
			defaultContainer.addChild(whatToAdd);
		}
		renderer.render(stage);
	};

	/*
		Create objects and adds listeners to them
		*/
		drawingEngine.createObject = function(canvas, points, style, isTransformed){
		// set a fill and line style

		if(isTransformed === false){
			points = fromMetersToPixels(points);
		}

		var shape = createPolygon(points, style);

		shape = addListenersToShape(shape);
		drawingEngine.addObjectToCanvas(canvas, shape);

		shape.points = points;
		shape = getPositionProperties(shape, points);
		return shape;
	};

	drawingEngine.centerView = function(){
		var centerOffsetX = (defaultContainer.width - canvasElement.width) / 2,
		centerOffsetY = (defaultContainer.height - canvasElement.height) / 2;

		defaultContainer.position.set(-centerOffsetX, -centerOffsetY);
		defaultContainerZoomOffsetX = defaultContainer.position.x;
		defaultContainerZoomOffsetY = defaultContainer.position.y;
		renderer.render(stage);
	};

	drawingEngine.increaseZoomLevel = function(){
		this.setZoomLevel(defaultContainerScale + scaleStep);
	};
	drawingEngine.reduceZoomLevel = function(){
		this.setZoomLevel(defaultContainerScale - scaleStep);
	}; 

	drawingEngine.expandPictureToScreen = function(){
		if(backgroundImageProperties.backgroundPicSet === true){
			this.centerView();
			while(defaultContainer.width < maxScreenWidth || defaultContainer.height < maxScreenHeight){
				defaultContainerScale *= 1.1;
				this.setZoomLevel(defaultContainerScale);
			}
			defaultContainerZoomOffsetX = defaultContainer.position.x ;
			defaultContainerZoomOffsetY = defaultContainer.position.y ;

	        // Move the main layer based on above calucalations
	        minScale = defaultContainerScale;
	        maxScale = minScale*10; 
	        this.centerView();
	        rendererResize();
	    }
	}; 

	// 
	drawingEngine.setViewBoundriesToBackgroundImage = function(){
		if(backgroundImageProperties.backgroundPicSet === true){
			viewParameters.viewBoundriesSet = true;

			// return to starting position
			this.centerView();
			viewParameters.boundriesScale = util.copy(defaultContainerScale);
			viewParameters.tlPointViewBoundries = {x:0,y:0};
			viewParameters.viewStartingPosition =  util.copy(defaultContainer.position);
			viewParameters.viewStartingWidth = util.copy(defaultContainer.width);
			viewParameters.viewStartingHeight = util.copy(defaultContainer.height);
			viewParameters.brPointViewBoundries =  {
				x: defaultContainer.width + Math.abs(defaultContainer.position.x) * 2 ,
				y: defaultContainer.height + Math.abs(defaultContainer.position.y) * 2
			}; 
			renderer.render(stage);
		}
	};

	drawingEngine.zoom = function(x, y, direction) {

		var defaultContainerOldScale = defaultContainerScale;
		var factor = (1 + direction * 0.1);
		defaultContainerScale *= factor;

		//Check to see that the scale is not outside of the specified bounds
		if (defaultContainerScale > maxScale){ 
			defaultContainerScale = maxScale;
		}else if (defaultContainerScale < minScale){
			defaultContainerScale = minScale;	
		}

		defaultContainerZoomOffsetX = (defaultContainerZoomOffsetX - x) *
		(defaultContainerScale / defaultContainerOldScale) + x;
		defaultContainerZoomOffsetY = (defaultContainerZoomOffsetY - y) *
		(defaultContainerScale / defaultContainerOldScale) + y;

	    //Set the position and scale of the DisplayObjectContainer
	    defaultContainer.scale.set(defaultContainerScale, defaultContainerScale);
	    defaultContainer.position.set(defaultContainerZoomOffsetX, defaultContainerZoomOffsetY);
	    renderer.render(stage);
	    if(viewParameters.viewBoundriesSet === true){
	    	checkIfViewIsInBoundries();
	    	renderer.render(stage);
	    }
	    return defaultContainerScale; 
	}

	drawingEngine.drawPolygon = function(data){
		if(drawingModesProperties.drawingModeTypes.polygon){
			stopDrawingPolygon();
		}else{
			startDrawing("polygon", data);
		}		
	};

	drawingEngine.drawRect = function(data){
		if(drawingModesProperties.drawingModeTypes.rect){
			stopDrawingRect();
		}else{
			startDrawing("rect", data);
		}	
	};
	drawingEngine.drawCircle = function(data){
		if(drawingModesProperties.drawingModeTypes.circle){
			stopDrawingCircle();
		}else{
			startDrawing("circle", data);
		}	   
	};

	drawingEngine.deleteSelectedObject = function(object){
		if(object == undefined){
			selectedObject.clear();
			stage.removeChild(selectedObject);
		}else{
			object.clear();
			stage.removeChild(object);
		}
		selectedObject = undefined;
	};

	drawingEngine.removeObjectsFromCanvas = function(whatToRemove, canvas){
		if(whatToRemove != undefined && whatToRemove.length != undefined && whatToRemove.length > 0){
			whatToRemove.map(function(shape){
				drawingEngine.deleteSelectedObject(shape);
			});
		}
	};

	drawingEngine.createAzimuthArrow = function(object){
		var arrowShape, arrowPoints, arrowStyle;
		arrowPoints = [{x:0,y:0.3},{x:0.3,y:0},{x:0.3,y:1.7},{x:0.3,y:0},{x:0.6,y:0.3}];
		arrowPoints = fromMetersToPixels(arrowPoints);
		arrowStyle = {
			lineColor: "0xFFFFFF",
			lineWidth: 1.5,
			fill: "0xFFFFFF",
			opacity: 1.0,
			lineStyle: {}
		};
		arrowShape = createPolygon(arrowPoints, arrowStyle);
		drawingEngine.addObjectToCanvas(canvas, arrowShape);

		arrowShape.points = arrowPoints;
		arrowShape = getPositionProperties(arrowShape, arrowPoints);
		arrowShape.offsetX = object.left + (object.realWidth / 2) - (arrowShape.realWidth / 2);
		arrowShape.offsetY = object.top + (object.realHeight / 2) - (arrowShape.realHeight / 2);
		arrowShape.position.set(arrowShape.offsetX, arrowShape.offsetY);
		renderer.render(stage);
		arrowShape.pivot = new PIXI.Point((arrowShape.realWidth / 2),(arrowShape.realHeight / 2));	
			renderer.render(stage);	
		if(object.arrowDegrees != undefined){
			arrowShape.rotation = object.arrowDegrees * (Math.PI / 180);					
		}else{
			var angleDeg = Math.atan2(
				object.points[1].y - object.points[0].y,
				object.points[1].x - object.points[0].x) * 180 / Math.PI;
            if (angleDeg < 0) {
                angleDeg = 360 + angleDeg;
            }
            if (geometryUtils.checkIfPolygonisClockwise(object.points) < 0) {
                angleDeg += 180;
            }
            if (angleDeg > 360) {
                angleDeg -= 360;
            }
            arrowShape.rotation = angleDeg * (Math.PI / 180);
		}	
		renderer.render(stage);
		return arrowShape;
	};

	drawingEngine.moveArrowOnSelectedShape = function(degrees){
		if(selectedObject != undefined && selectedObject.group === "roof" && selectedObject.arrowObject != undefined){
			selectedObject.arrowObject.rotation = degrees * (Math.PI / 180);
		}
	};

	//
	// Private Functions
	//
	
	function applyOffsetToPoints(shape){
		for (var i = 0; i < shape.points.length; i++) {
			shape.points[i].x += shape.offsetX;
			shape.points[i].y += shape.offsetY;
		}
		return shape;
	}

	function getPositionProperties(shape, points){
		shape.top = geometryUtils.getTop(points);
		shape.left = geometryUtils.getLeft(points);
		shape.realWidth = geometryUtils.getRight(points) - shape.left; 
		shape.realHeight = geometryUtils.getBottom(points) - shape.top;
		return shape;
	}

	function startDrawing(drawingMode, data){
		drawingModesProperties.drawingModeTypes[drawingMode] = true;
		canvasElement.style.cursor = 'crosshair';
		drawingModesProperties.data = data;
	} 

	//
	//	Transforms from meters to pixels
	//	

	function fromMetersToPixels(meterPoints){
		var pixelPoints = [],
		coefWidth = backgroundImageProperties.backgroundImageObject.width / backgroundImageProperties.imageMeterSize.width,
		coefHeight = backgroundImageProperties.backgroundImageObject.height / backgroundImageProperties.imageMeterSize.height;
		for(var i = 0; i < meterPoints.length; i++){
			pixelPoints.push({x: meterPoints[i].x  * coefWidth,y: meterPoints[i].y * coefHeight});
		}
		return pixelPoints;
	}

	//
	//	Transforms from pixels to meters
	//	

	function fromPixelsTometers(pixelPoints){
		var meterPoints = [],
		coefWidth = backgroundImageProperties.imageMeterSize.width / backgroundImageProperties.backgroundImageObject.width,
		coefHeight = backgroundImageProperties.imageMeterSize.height / backgroundImageProperties.backgroundImageObject.height;
		for(var i = 0; i < pixelPoints.length; i++){
			meterPoints.push({x: pixelPoints[i].x  * coefWidth,y: pixelPoints[i].y * coefHeight});
		}
		return meterPoints;
	}

	//
	//Check if view is in boundries and changes the value of allowedPanDirections
	//
	function checkIfViewIsInBoundries(zoom){

		// return position 
		if(viewParameters.viewBoundriesSet === true){
			// find positon of picture

			var defaultContainerTlPoint = defaultContainer.position,
			defaultContainerBrPoint = {
				// get position, get original width
				x:  Math.abs(defaultContainer.position.x) + (defaultContainer.width * 1/defaultContainerScale) * viewParameters.boundriesScale,
				y:  Math.abs(defaultContainer.position.y) + (defaultContainer.height * 1/defaultContainerScale) * viewParameters.boundriesScale
			},
			viewBoundriesOffsetY = (defaultContainer.height - viewParameters.viewStartingHeight),
			viewBoundriesOffsetX = (defaultContainer.width - viewParameters.viewStartingWidth),
			isMovedVertically = false, isMovedHorizontaly = false;
			//top
			if((defaultContainerTlPoint.y  > viewParameters.tlPointViewBoundries.y) && !isMovedVertically){
				defaultContainer.position.set(defaultContainerTlPoint.x, viewParameters.tlPointViewBoundries.y);
				isMovedVertically = true;
			};			
			//left
			if((defaultContainerTlPoint.x  > viewParameters.tlPointViewBoundries.x) && !isMovedHorizontaly){
				defaultContainer.position.set(viewParameters.tlPointViewBoundries.x, defaultContainerTlPoint.y);
				isMovedHorizontaly = true;
			};
			//bottom			
			if((defaultContainerBrPoint.y > (viewParameters.brPointViewBoundries.y + viewBoundriesOffsetY)) && !isMovedVertically){
				defaultContainer.position.set(
					defaultContainerTlPoint.x,
					defaultContainer.position.y + (defaultContainerBrPoint.y - viewParameters.brPointViewBoundries.y) - viewBoundriesOffsetY);
				isMovedVertically = true;
			};
			//right
			if((defaultContainerBrPoint.x > (viewParameters.brPointViewBoundries.x + viewBoundriesOffsetX)) && !isMovedHorizontaly){
				defaultContainer.position.set(					
					defaultContainer.position.x + (defaultContainerBrPoint.x - viewParameters.brPointViewBoundries.x) - viewBoundriesOffsetX,
					defaultContainerTlPoint.y);
				isMovedHorizontaly = true;
			};
		}
	}

		//
		// Calculate the current window size and set the canvas renderer size accordingly
		//
		var rendererResize = function () {
			var width = window.innerWidth,
			height = window.innerHeight,
			targetScale;

			 //
			 // Calculate the current window size and set the canvas renderer size accordingly
			 //
			 canvasElement.width = width * window.devicePixelRatio;
			 canvasElement.height = height * window.devicePixelRatio;
			 canvasElement.style.width = width + 'px';
			 canvasElement.style.height = height + 'px';

			    // defaultContainer._width = canvasElement.width; 
			    // defaultContainer._height = canvasElement.height; 
			    //
			     // Resize the PIXI renderer
			     //Let PIXI know that we changed the size of the viewport
			     //

			     renderer.resize(canvasElement.width, canvasElement.height);

			     drawingEngine.setViewBoundriesToBackgroundImage();
			     renderer.render(stage);
			 };

			 function isDrawingModeOn(){
			 	for(var val in drawingModesProperties.drawingModeTypes){
			 		if(drawingModesProperties.drawingModeTypes[val] === true)
			 			return true;
			 	}
			 	return false;
			 }

			 function addListenersToShape(shape){
			 	shape.buttonMode = true;
			 	shape.interactive = true;
			 	shape.renderable = true;

				// add listeners to object

				shape.mousedown = shape.touchstart = function(data)
				{
		            // store a refference to the data
		            // The reason for this is because of multitouch
		            // we want to track the movement of this particular touch
		            if(selectedObject != undefined){
		            	selectedObject.alpha = 1;
		            }
		            this.data = data;
		            this.alpha = 0.8;
		            // this.dragging = isObjectDragging = true;
		            this.sx = this.data.getLocalPosition(shape).x * shape.scale.x;
		            this.sy = this.data.getLocalPosition(shape).y * shape.scale.y;
		            this.isSelected = true;   
		            selectedObject = this;
		        };
		        
		        // set the events for when the mouse is released or a touch is released
		        shape.mouseup = shape.mouseupoutside = shape.touchend = shape.touchendoutside = function(data)
		        {
		        	if(!this.isSelected === true){
		        		this.alpha = 1
		        	}
		        	this.dragging = isObjectDragging = false;
		            // set the interaction data to null
		            this.data = null;
		        };
		        
		        // set the callbacks for when the mouse or a touch moves
		        shape.mousemove = shape.touchmove = function(data)
		        {
		        	if(this.dragging)
		        	{
		                // need to get parent coords..
		                var newPosition = this.data.getLocalPosition(this.parent);
		                this.position.x = newPosition.x - this.sx;
		                this.position.y = newPosition.y - this.sy;
		            }
		        }
		        return shape;
		    }

		    function createPolygon(points, style){
		    	var shape = new PIXI.Graphics();
		    	shape.beginFill(style.fill, style.opacity);
		    	shape.lineStyle(style.lineWidth, style.lineColor, 1);

				// draw a shape
				shape.moveTo(points[0].x, points[0].y);
				for(var i = 1; i < points.length; i++){
					shape.lineTo(points[i].x, points[i].y);
				}
				shape.endFill();
				shape.scale.set(1, 1);
				return shape;
			}

			function panCanvas(e){
			 	// Check if the mouse button is down to activate panning
	            // If this is the first iteration through then set clientX and clientY to match the inital mouse position
	            if(clientX == -1 && clientY == -1) {
	            	clientX = e.clientX;
	            	clientY = e.clientY;
	            }

	            // Run a relative check of the last two mouse positions to detect which direction to pan on x
	            if(e.clientX == clientX) {
	            	xPos = 0;
	            } else if(e.clientX < clientX == true) {
	            	// left(mouse direction)
	            	xPos = -Math.abs(e.clientX - clientX);
	            } else if(e.clientX > clientX == true) {
	            	// right(mouse direction)
	            	xPos = Math.abs(e.clientX - clientX);
	            }

	            // Run a relative check of the last two mouse positions to detect which direction to pan on y
	            if(e.clientY == clientY) {
	            	yPos = 0;
	            } else if(e.clientY < clientY == true) {
	            	// top(mouse direction)
	            	yPos = -Math.abs(e.clientY - clientY);
	            } else if(e.clientY > clientY == true) {
	            	// bottom(mouse direction)
	            	yPos = Math.abs(clientY - e.clientY);
	            }

	            // Set the relative positions for comparison in the next frame
	            clientX = e.clientX;
	            clientY = e.clientY;

	            // Change the main layer zoom offset x and y for use when mouse wheel listeners are fired.
	            var defaultContainerZoomOffsetXBeforeMoving = util.copy(defaultContainerZoomOffsetX),
	            defaultContainerZoomOffsetYBeforeMoving = util.copy(defaultContainerZoomOffsetY);

	            defaultContainerZoomOffsetX = defaultContainer.position.x + xPos;
	            defaultContainerZoomOffsetY = defaultContainer.position.y + yPos;
	            var positionBeforeMoving = util.copy(defaultContainer.position);
	            // Move the main layer based on above calucalations
	            defaultContainer.position.set(defaultContainerZoomOffsetX, defaultContainerZoomOffsetY);

	            //check if background pictures is in boundries 
	            if(viewParameters.viewBoundriesSet === true){
	            	checkIfViewIsInBoundries();
	            }
	        }

	        function lineFollowMouse(e){
	        	if(drawingModesProperties.mouseDownPoint != undefined){
	        		if(drawingModesProperties.lines.length > 0){
	        			drawingModesProperties.lines[drawingModesProperties.lines.length - 1].clear();
	        			stage.removeChild(drawingModesProperties.lines[drawingModesProperties.lines.length - 1]);
	        			drawingModesProperties.lines.pop();
	        		}
	        		if(drawingModesProperties.points.length === 1){
	        			var points = [drawingModesProperties.points[0], drawingModesProperties.mouseFollowPoint];
	        		}else{
	        			var points = [drawingModesProperties.lines[drawingModesProperties.lines.length-1].points[1], drawingModesProperties.mouseFollowPoint];
	        		}

	        		var line = createPolygon(
	        			points,
	        			drawingModesProperties.data.style); 
	        		drawingModesProperties.lines.push(line);	
	        		line.points = points;
	        		drawingEngine.addObjectToCanvas(canvas, line);
	        		renderer.render(stage);
	        	}
	        };

	        function stopDrawingPolygon(){
	        	var newShape = drawingEngine.createObject(
	        		canvas,
	        		drawingModesProperties.points,
	        		drawingModesProperties.data.style,
	        		true
	        		);
	        	drawingEngine.addObjectToCanvas(canvas, newShape);
	        	// clean drawingModesProperties
	        	drawingModesProperties.lines.map(function(line){
	        		line.clear();
	        	});
	        	var event = new CustomEvent("objectCreated", { "detail": { 
	        		object: newShape,
	        		data: drawingModesProperties.data 
	        	}});

	        	canvasElement.dispatchEvent(event);
	        	drawingModesProperties = setDefaultDrawingModesProperties();
	        };

	        function circleFollowMouse(e, style){
	        	if(drawingModesProperties.mouseDownPoint != undefined){
	        		if(drawingModesProperties.circle != undefined){
	        			drawingModesProperties.circle.clear();
	        			stage.removeChild(drawingModesProperties.circle);
	        		}
	        		var radius = geometryUtils.pointsDistance(drawingModesProperties.mouseDownPoint, drawingModesProperties.mouseFollowPoint),
	        		shape = new PIXI.Graphics();
	        		shape.beginFill(style.fill, style.opacity);
	        		shape.lineStyle(style.lineWidth, style.lineColor, 1);
	        		shape.drawCircle(
	        			drawingModesProperties.mouseDownPoint.x,
	        			drawingModesProperties.mouseDownPoint.y,
	        			radius);
	        		shape.endFill();
	        		shape.scale.set(1, 1);
	        		drawingModesProperties.circle = shape;
	        		drawingEngine.addObjectToCanvas(canvas, shape);
	        	}
	        };

	        function stopDrawingCircle(){
	        	if(drawingModesProperties.circle != undefined){
	        		addListenersToShape(drawingModesProperties.circle);
	        		var event = new CustomEvent("objectCreated", { "detail": { 
	        			object: drawingModesProperties.circle,
	        			data: drawingModesProperties.data 
	        		}});
	        		canvasElement.dispatchEvent(event);
	        	}
	        	drawingModesProperties = setDefaultDrawingModesProperties();
	        };

	        function rectFollowMouse(e, style){
	        	if(drawingModesProperties.mouseDownPoint != undefined){
	        		if(drawingModesProperties.rect != undefined){
	        			drawingModesProperties.rect.clear();
	        			stage.removeChild(drawingModesProperties.rect);
	        		}
	        		var shape = new PIXI.Graphics();
	        		shape.beginFill(style.fill, style.opacity);
	        		shape.lineStyle(style.lineWidth, style.lineColor, 1);
	        		shape.drawRect(
	        			drawingModesProperties.mouseDownPoint.x,
	        			drawingModesProperties.mouseDownPoint.y,
	        			-(drawingModesProperties.mouseDownPoint.x - drawingModesProperties.mouseFollowPoint.x),
	        			-(drawingModesProperties.mouseDownPoint.y - drawingModesProperties.mouseFollowPoint.y));
	        		shape.endFill();
	        		shape.scale.set(1, 1);
	        		drawingModesProperties.rect = shape;
	        		drawingEngine.addObjectToCanvas(canvas, shape);
	        	}
	        };

	        function stopDrawingRect(){
	        	if(drawingModesProperties.rect != undefined){
	        		addListenersToShape(drawingModesProperties.rect);
	        		// Create the event
	        		var event = new CustomEvent("objectCreated", { "detail": { 
	        			object: drawingModesProperties.rect,
	        			data: drawingModesProperties.data
	        		}});
	        		canvasElement.dispatchEvent(event);
	        	}	        	
	        	drawingModesProperties = setDefaultDrawingModesProperties();
	        };

	        function setDefaultDrawingModesProperties(){ 
	        	drawingModesProperties = { 
	        		snapPointRadius: defaultSnapPointRadius,
	        		mouseDownPoint: undefined,
	        		mouseFollowPoint: undefined,
	        		lines: [],
	        		points: [],
	        		drawingModeTypes : {
	        			polygon: false,
	        			circle: false,
	        			rect: false
	        		},
	        	};
	        	if(canvasElement.style != undefined){
	        		canvasElement.style.cursor = 'default';
	        	}	        	
	        	return drawingModesProperties;
	        };

	        function animate() {
	        	requestAnimFrame( animate );
	        	renderer.render(stage);
	        }

	        return drawingEngine;
	    };