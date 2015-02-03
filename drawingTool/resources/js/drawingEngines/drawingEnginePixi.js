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
	 util = Util(), imageMeterSize = {},
	 canvasElement = {}, canvasWrapElement = {},
	 backgroundPicSet = false, viewParameters = {}; 

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
	drawingEngine.MouseWheelHandler= function(e){
		var e = window.event || e; // old IE support
		zoom(e.clientX, e.clientY, Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))));
	};

	drawingEngine.addEventListeners = function(elementId){

		stage.mousedown = function(interactionData){
	        //Reset clientX and clientY to be used for relative location base panning
	        clientX = -1;
	        clientY = -1;
	        mousedown = true;
	    };

	    stage.mouseup = function(interactionData){
	    	mousedown = false;
	    };

	    stage.mousemove = function(interactionData){
	    	var e = interactionData.originalEvent;	    	
	        // Check if the mouse button is down to activate panning
	        if(mousedown && !isObjectDragging) {
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
	    };

	    window.addEventListener("resize", function () {
	    	drawingEngine.centerView();
	    	drawingEngine.setViewBoundriesToBackgroundImage();
	    });

	    var resize = function () {
	    	window.addEventListener('resize', rendererResize);
	    	window.addEventListener('deviceOrientation', rendererResize);
	    };

	    resize();
	};

	drawingEngine.createBackgroundImage = function(satelliteImage){
		if(backgroundPicSet === true){
			for(var i = 0; i < defaultContainer.children.length; i++){
				if(defaultContainer.children[i].isBgImage === true){
					defaultContainer.removeChild(defaultContainer.children[i]);
				}
			}
		};

		imageMeterSize = {
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
		bgImage.isBgImage = backgroundPicSet = true;
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
	drawingEngine.createObject = function(canvas, points, style){
		// set a fill and line style
		var shape = new PIXI.Graphics();
		shape.beginFill(style.fill, style.opacity);
		shape.lineStyle(style.lineWidth, style.lineColor, 1);
		
		// draw a shape
		shape.moveTo(points[0].x, points[0].y);
		for(var i = 0; i < points.length; i++){
			shape.lineTo(points[i].x, points[i].y);
		}
		shape.endFill();
		shape.scale.set(1, 1);
	
		shape.buttonMode = true;
		shape.interactive = true;
		shape.renderable = true;

		// add listeners to object

		shape.mousedown = shape.touchstart = function(data)
		{
            // store a refference to the data
            // The reason for this is because of multitouch
            // we want to track the movement of this particular touch
            this.data = data;
            this.alpha = 0.9;
            this.dragging = isObjectDragging = true;
            this.sx = this.data.getLocalPosition(shape).x * shape.scale.x;
            this.sy = this.data.getLocalPosition(shape).y * shape.scale.y;   
        };
        
        // set the events for when the mouse is released or a touch is released
        shape.mouseup = shape.mouseupoutside = shape.touchend = shape.touchendoutside = function(data)
        {
        	this.alpha = 1
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
		if(backgroundPicSet === true){
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
		if(backgroundPicSet === true){
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

	//
	// Private Functions
	//

	/**
		Transforms from meters to pixels
	*/

	function fromMetersToPixels(meterPoints){
		var pixelPoints = [],
		coefWidth = imageMeterSize.width,
		coefHeight = imageMeterSize.height;
		for(var i = 0; i < meterPoints.length; i++){
			pixelPoints.push({x: meterPoints[i].x  * coef,y: meterPoints[i].y * coef});
		}
		return pixelPoints;
	}

	/**
		Transforms from pixels to meters
	*/

	function fromPixelsTometers(pixelPoints){
		var meterPoints = [],
		coefWidth = imageMeterSize.width,
		coefHeight = imageMeterSize.height;
		for(var i = 0; i < pixelPoints.length; i++){
			meterPoints.push({x: pixelPoints[i].x  * coef,y: pixelPoints[i].y * coef});
		}
		return meterPoints;
	}

	/*
	Check if view is in boundries and changes the value of allowedPanDirections
	*/
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

		/**
		 * Calculate the current window size and set the canvas renderer size accordingly
		 */
	var rendererResize = function () {
		var width = window.innerWidth,
		height = window.innerHeight,
		targetScale;

			 /**
			 * Calculate the current window size and set the canvas renderer size accordingly
			 */
		canvasElement.width = width * window.devicePixelRatio;
		canvasElement.height = height * window.devicePixelRatio;
		canvasElement.style.width = width + 'px';
		canvasElement.style.height = height + 'px';

			    // defaultContainer._width = canvasElement.width; 
			    // defaultContainer._height = canvasElement.height; 
			    /**
			     * Resize the PIXI renderer
			     * Let PIXI know that we changed the size of the viewport
			     */

		renderer.resize(canvasElement.width, canvasElement.height);

		drawingEngine.setViewBoundriesToBackgroundImage();
	};

	function animate() {
	 	requestAnimFrame( animate );
	 	renderer.render(stage);
	}

	return drawingEngine;
};