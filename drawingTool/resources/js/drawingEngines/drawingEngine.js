var DrawingEngine = function() {

    var drawingEngine = {},
    prevX, prevY, isDragging,
    canvas, util= Util(),
    dx = 0, dy = 0, scale =1, // Global canvas transforms
    canvasTransformationTool = {};
    //clean up
    canvasTransformationTool.clearContext = function(canvas, ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        canvas.clearContext(ctx);
        ctx.restore();
    };
    canvasTransformationTool.getLocalPosition = function(x, y, scaleLevel, canvasOffset) {
        return {
            x: (x - canvasOffset.x) / scaleLevel,
            y: (y - canvasOffset.y) / scaleLevel
        };
    };
    canvasTransformationTool.setTransform = function(tx, ty, newScale, oldScale, canvasOffset, canvas) {
        oldScale = newScale;
        canvasOffset.x = tx;
        canvasOffset.y = ty;
        // canvas is fabric.Canvas || fabric.StaticCanvas
        canvas.contextContainer.setTransform(oldScale, 0, 0, oldScale, canvasOffset.x, canvasOffset.y);
        //clean up
        this.clearContext(canvas, canvas.contextContainer);
        return {
            scale: oldScale,
            canvasOffset: canvasOffset
        };
    };
    // zoom to cx, cy coordinates of canvas
    canvasTransformationTool.zoom = function(cx, cy, newScale, canvasOffset, oldScale, canvas) {
        var ds = (oldScale - newScale);
        var result = this.setTransform(canvasOffset.x + cx * ds, (canvasOffset.y + cy * ds), newScale, oldScale, canvasOffset, canvas);
        oldScale = result.scale;
        return {
            scale: oldScale,
            canvasOffset: result.canvasOffset
        };
    };
    canvasTransformationTool.canvasCenteredTransforamtion = function(canvas, scale, offset) {
        if (canvas.getObjects().length > 0) {
            // remember the position of objects
            var offsetBefore = {x: canvas.getObjects()[0].left, y: canvas.getObjects()[0].top};
            // group objects
            var group = new fabric.Group(canvas.getObjects(), {
                originX: 'center',
                originY: 'center'
            });
            // remeber the group position
            var groupBefore = {left: group.left, top: group.top};
            // move group to the center of the canvas
            group.set({
                left: (canvas.width / scale) / 2,
                top: (canvas.height / scale) / 2
            });
            // ungroup objects
            group.destroy();
            // save the new position of the objects
            var offsetAfter = {x: canvas.getObjects()[0].left, y: canvas.getObjects()[0].top};
            // group objects and move them back to initial position
            var group = new fabric.Group(canvas.getObjects(), {
                originX: 'center',
                originY: 'center'
            });
            group.set({
                left: groupBefore.left,
                top: groupBefore.top
            });
            // ungroup
            group.destroy();
            // calculate the distance objects were moved
            offset.x = offsetAfter.x - offsetBefore.x;
            offset.y = offsetAfter.y - offsetBefore.y;
        }
        return offset;
    };
    drawingEngine.canvasTransformationTool = canvasTransformationTool;

    var LabeledRect = fabric.util.createClass(fabric.Rect, {
        type: 'labeledRect',
        initialize: function(options) {
            options || (options = {});
            this.callSuper('initialize', options);
            this.set('label', options.label || '');
        },
        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                label: this.get('label')
            });
        },
        _render: function(ctx) {
            this.callSuper('_render', ctx);
            ctx.font = 'lighter ' + this.widthCoef / 1.5 + 'px Arial';
            ctx.fillStyle = 'white';
            if (this.width > this.height) {
                ctx.fillText(this.label, (-this.width / 2) + (this.widthCoef / 1.7), -this.height / 2 + (this.widthCoef / 1.3));
            } else {
                ctx.fillText(this.label, (-this.width / 2) + (this.widthCoef / 3), -this.height / 2 + (this.widthCoef));
            }
        }
    });

    var moduleNumber = 0;
    function setModuleNumber() {
        moduleNumber++;
        return moduleNumber;
    }

    function getArrayOfPointsFromCoords(oCoords) {
        return [
        {x: oCoords.tl.x, y: oCoords.tl.y},
        {x: oCoords.tr.x, y: oCoords.tr.y},
        {x: oCoords.br.x, y: oCoords.br.y},
        {x: oCoords.bl.x, y: oCoords.bl.y}
        ];
    }

    function makeObjectUnselectable(object) {
        var unselectableObjectParams = {
            border: false,
            hasBorders: false,
            selectable: false,
            lockMovementX: true,
            lockMovementY: true,
            hasControls: false,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
            hasRotatingPoint: false
        };
        for (var value in unselectableObjectParams) {
            object[value] = unselectableObjectParams[value];
        }
        return object;
    }

    // drawingEngine.createObject = function(objectOptions) {
    //     objectOptions.isCircle

    // };
    drawingEngine.canvasCenteredTransforamtion = function(canvas, scale, offset) {
        return canvasTransformationTool.canvasCenteredTransforamtion(canvas, scale, offset);
    };

    drawingEngine.addEventListeners = function(elementId){
     var element = document.getElementById(elementId)
     .getElementsByClassName("canvas-container")[0]
     .getElementsByClassName("upper-canvas ")[0]; 

     util.addEvent(element,'mousedown', function(e) {
        console.log("mousedown");

        // pan
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
    });
     util.addEvent(element,'mouseup', function(e) {
        // pan
        isDragging = false;
    });
     util.addEvent(element,'mousemove', function(e) {
        // pan
        if(isDragging){
            var offsetX = (e.clientX - prevX);
            var offsetY = (e.clientY - prevY);
            setTransform(dx + offsetX, dy + offsetY, scale);
            prevX = e.clientX;
            prevY = e.clientY;
            canvas.renderAll();
        }
    });

     if (element.addEventListener) {
    // IE9, Chrome, Safari, Opera
    element.addEventListener("mousewheel", MouseWheelHandler, false);
    // Firefox
    element.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
}else{ 
    // IE 6/7/8
    element.attachEvent("onmousewheel", MouseWheelHandler)
}


function MouseWheelHandler(e) {
    console.log("wheel");
    var isZoomIn = e.deltaY < 0;
    var direction = isZoomIn ? 1 : -1;
    var factor = (1 + direction * 0.1);
    var mousePos = {
        x: e.clientX,
        y: e.clientY
    };

 var before = getLocalPosition(mousePos.x, mousePos.y, scale);
 zoom(before.x, before.y, scale * factor);
 canvas.renderAll();
}

function setTransform(tx, ty, newScale) {
  scale = newScale; dx = tx; dy = ty;
  canvas.contextContainer.setTransform(scale, 0, 0, scale, dx, dy);
}

function zoom(cx, cy, newScale) {
  var ds = (scale - newScale);
  setTransform(dx + cx * ds, dy + cy * ds, newScale);
}

function getLocalPosition(x, y, scaleLevel) {
    if (scaleLevel === undefined) {
          scaleLevel = scale; // use current scale then;
      }
      return {
          x: (x - dx) / scaleLevel,
          y: (y - dy) / scaleLevel
      };
  }

};    

drawingEngine.createCanvas = function(elementId) {
    canvas = new fabric.Canvas(elementId, {
        selection: false,
        allowTouchScrolling: true,
        skipTargetFind: false,
        renderOnAddRemove: false
    }); 
    return canvas;
};
drawingEngine.setTransform = function(canvasOffset, offsetX, offsetY, scale, canvas) {
    return canvasTransformationTool
    .setTransform(
        offsetX,
        offsetY,
        scale,
        scale,
        canvasOffset,
        canvas);
};
drawingEngine.zoom = function(canvas, canvasSize, canvasOffset, scale, zoomFactor) {
    var mousePos = {
        x: canvasSize.width / 2,
        y: canvasSize.height / 2
    };
    var before = canvasTransformationTool.getLocalPosition(mousePos.x, mousePos.y, scale, canvasOffset);
    var result = canvasTransformationTool.zoom(before.x, before.y, zoomFactor, canvasOffset, scale, canvas);
    return result.scale;
};
drawingEngine.getScaleSize = function(maxW, maxH, currW, currH) {
    var newWidth, newHeight;
    var aspect = currW / currH;
    var parentsAspect = maxW / maxH;
    if (aspect > parentsAspect) {
        newWidth = maxW;
        newHeight = newWidth / aspect;
    } else {
        newHeight = maxH;
        newWidth = newHeight * aspect;
    }
    var newSize = {
        width: newWidth,
        height: newHeight
    };
    return newSize;
};
drawingEngine.scaleAll = function(canvas, startingScale) {
    var objs = canvas.getObjects().map(function(o) {
        if (o.type === 'roofSetBack') {
            o.set('fill', '#CCCCCC');
        }
        return o.set('active', false);
    });
    var group = new fabric.Group(objs, {
        originX: 'center',
        originY: 'center'
    });
    var scaledSize = this.getScaleSize(canvas.width, canvas.height, group.width, group.height);
    canvas._activeObject = null;
    startingScale.x = scaledSize.width / group.width;
    startingScale.y = scaledSize.height / group.height;
    group.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        scaleY: startingScale.y,
        scaleX: startingScale.x
    });
    canvas.setActiveGroup(group.setCoords());
    canvas.deactivateAll().renderAll();
};
drawingEngine.getImageFromCanvas = function(canvas) {
    return canvas.toDataURL({format: 'jpg'});
};
drawingEngine.setCanvasSize = function(canvas, width, height) {
    canvas.setHeight(height);
    canvas.setWidth(width);
};
drawingEngine.getCanvasSize = function(canvas) {
    return {
        width: canvas.getWidth(),
        height: canvas.getHeight()
    };
};
drawingEngine.getAllObjectsByType = function(canvas, type) {
    var objects = [];
    canvas.getObjects().map(function(o) {
        if (o.type === type) {
            objects.push(o);
        }
    });
    return objects;
};
drawingEngine.centerView = function(canvasOffset, scale){
    var offset = {x: 0, y: 0};
    offset = this.canvasCenteredTransforamtion(canvas, scale, offset);
    this.setTransform(canvasOffset, offset.x * scale, offset.y * scale, scale);
};
drawingEngine.createBackgroundImage = function(satelliteImage, canvas) {
    var bgImage = new fabric.Rect({
        border: false,
        backgroundColor: '#D9D9D9',
        left: satelliteImage.metricLocation.x,
        top: satelliteImage.metricLocation.y,
        width: 1280,
        height: 1280,
        hasControls: false,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        selectable: false,
        hasBorders: false,
        opacity: 0
    });
    var img = new Image();
    img.onload = function() {
        bgImage.animate('opacity', 1, {
            duration: 1000,
            onChange: canvas.renderAll.bind(canvas)
        });
    };
    if(satelliteImage.link != undefined){
        img.src = satelliteImage.link; 
    }else{
        if (!(/^data:/).test(satelliteImage.imageBase64)) {
            img.src = "data:image/jpg;base64,";
        }
        img.src += satelliteImage.imageBase64;
    }
    bgImage.setPatternFill({
        source: img,
        repeat: 'no-repeat'
    });
    return bgImage;
};
drawingEngine.getRectObjectCoords = function(module) {
    return getArrayOfPointsFromCoords(module.oCoords);
};
drawingEngine.createModule = function(scale, id, isPortrait, azimuth, tilt, type, mleft, mtop) {
    var moduleTiltCoef = Math.cos(tilt * (Math.PI / 180));
    return makeObjectUnselectable(new fabric.Rect({
        isPortrait: isPortrait,
        typeId: type.id,
        id: id,
        number: setModuleNumber(),
        scaleX: scale.x,
        scaleY: scale.y,
        type: "module",
        angle: azimuth,
        left: mleft != undefined ? mleft : -100,
        top: mtop != undefined ? mtop : -100,
        width: isPortrait == true ? type.width : type.height,
        height: isPortrait == true ? type.height * moduleTiltCoef : type.width * moduleTiltCoef,
        fill: 'black',
        strokeWidth: 0.0254,
        stroke: "white",
        name: type.displayName
    }));
};
drawingEngine.createGridCell = function(scale, id, isPortrait, azimuth, tilt, moduleType, left, top, fill, objectType, label) {
    var moduleTiltCoef = Math.cos(tilt * (Math.PI / 180));
    return makeObjectUnselectable(new LabeledRect({
        moduleIsPaced: false,
        isPortrait: isPortrait,
        typeId: moduleType.id,
        id: id,
        number: setModuleNumber(),
        scaleX: scale.x,
        scaleY: scale.y,
        type: objectType,
        angle: azimuth,
        left: left != undefined ? left : -100,
        top: top != undefined ? top : -100,
        width: isPortrait == true ? moduleType.width : moduleType.height,
        label: label != undefined ? "+" : "",
        height: isPortrait == true ? moduleType.height * moduleTiltCoef : moduleType.width * moduleTiltCoef,
        fill: fill,
        stroke: "white",
        strokeWidth: 0.05,
        name: moduleType.displayName
    }));
};
drawingEngine.createReactangleObject = function(left, top, strokeWidth, strokeColor, fill, opacity, width, height) {
    return makeObjectUnselectable(new fabric.Rect({
        left: left,
        top: top,
        isCircle: false,
        strokeWidth: strokeWidth,
        stroke: strokeColor,
        fill: fill,
        opacity: opacity,
        width: width,
        height: height
    }));
};
drawingEngine.createCircleObject = function(left, top, strokeWidth, strokeColor, fill, opacity, radius) {
    return makeObjectUnselectable(new fabric.Circle({
        left: left,
        top: top,
        strokeWidth: strokeWidth,
        stroke: strokeColor,
        fill: fill,
        opacity: opacity,
        radius: radius,
        isCircle: true,
        originX: "center",
        originY: "center"
    }));
};
drawingEngine.getMouseCoords = function(canvas, canvasOffset, scale, e) {
    var pointer = canvas.getPointer(e);
    return {
        x: (pointer.x - canvasOffset.x) / scale,
        y: (pointer.y - canvasOffset.y) / scale
    };
};
drawingEngine.createLine = function(points, x, y, strokeColor, strokeWidth, strokeDashArray) {
    return makeObjectUnselectable(new fabric.Line(points, {
        originY: x,
        originX: y,
        strokeWidth: strokeWidth,
        stroke: strokeColor,
        strokeDashArray: strokeDashArray,
    }));
};
drawingEngine.createPolygonObject = function(points, left, top, strokeWidth, strokeColor, fill, opacity, type, strokeDash, id) {
    return makeObjectUnselectable(new fabric.Polygon(points, {
        id: id,
        type: type,
        fill: fill,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        top: top,
        left: left,
        opacity: opacity != undefined ? opacity : 1,
        strokeDashArray: strokeDash
    }));
};
drawingEngine.addObjectToCanvas = function(whereToAdd, whatToAdd) {
    whereToAdd.add(whatToAdd);
};
drawingEngine.bringToFront = function(object) {
    object.bringToFront();
};
drawingEngine.createAzimuthArrow = function(x, y, sizeCoef, opacity) {
    var arrowCoords = [-3, 10, -3, 25, 3, 25, 3, 10, 7, 10, 0, 0, -7, 10, -3, 10];
    for (var i = 0; i < arrowCoords.length; i++) {
        arrowCoords[i] = arrowCoords[i] * sizeCoef;
    }
    return new fabric.Path(
        'M ' + arrowCoords[0] + ' ' + arrowCoords[1] + ' L ' + arrowCoords[2] + ' ' + arrowCoords[3] + ' L ' + arrowCoords[4] + ' '
        + arrowCoords[5] + ' L ' + arrowCoords[6] + ' ' + arrowCoords[7] + ' L ' + arrowCoords[8] + ' ' + arrowCoords[9] + ' L ' + arrowCoords[10] +
        ' ' + arrowCoords[11] + ' L ' + arrowCoords[12] + ' ' + arrowCoords[13] + ' L ' + arrowCoords[14] + ' ' + arrowCoords[15] + ' z',
        {
            left: x,
            top: y,
            stroke: 'black',
            fill: 'white',
            strokeWidth: 0.5,
            originX: 'center',
            originY: 'center',
            selectable: false,
            hasControls: false,
            hasBorders: false,
            opacity: opacity,
            angle: 0
        });
};
drawingEngine.createAdjustGrid = function(cells, roof, height, width) {
    return makeObjectUnselectable(new fabric.Group(cells, {
        originX: "center",
        originY: "center",
        visible: false,
        roof: roof,
        borderColor: "white",
        shapeType: "adjustGrid",
        moduleCountHeight: height,
        moduleCountWidth: width
    }));
};
drawingEngine.removeObjectsFromCanvas = function(objects, canvas) {
    for (var i = 0; i < objects.length; i++) {
        canvas.remove(objects[i]);
    }
    return [];
};
drawingEngine.setValuesForObject = function(object, top, left, width, height, strokeColor, strokeWidth, fill, opacity, strokeDash, visibility) {
    object.setLeft(left != undefined ? left : object.left);
    object.setTop(top != undefined ? top : object.top);
    object.setWidth(width != undefined ? width : object.width);
    object.setHeight(height != undefined ? height : object.height);
    object.setStroke(strokeColor != undefined ? strokeColor : object.stroke);
    object.setStrokeWidth(strokeWidth != undefined ? strokeWidth : object.strokeWidth);
    object.setFill(fill != undefined ? fill : object.fill);
    object.setOpacity(opacity != undefined ? opacity : object.opacity);
    object.setVisible(visibility != undefined ? visibility : object.visible);
    object.strokeDash = strokeDash != undefined ? strokeDash : object.strokeDash;
    object.setCoords();
    return object;
};
return drawingEngine;
};