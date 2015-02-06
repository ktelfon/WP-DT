var GeometryUtils = function() {
	var geometryUtils = {};

	geometryUtils.pointsDistance = function(point1, point2){
		var xs = 0;
		var ys = 0;
		xs = point2.x - point1.x;
		xs = xs * xs;
		ys = point2.y - point1.y;
		ys = ys * ys;
		return Math.sqrt(xs + ys);
	};

	geometryUtils.checkIfPolygonisClockwise = function(points) {
		var area = 0;
		for (var i = 0; i < points.length; i++) {
			j = (i + 1) % points.length;
			area += points[i].x * points[j].y;
			area -= points[j].x * points[i].y;
		}
		return area / 2;
	};

	geometryUtils.calculatePolygonArea = function(points) {
		var X = [];
		var Y = [];
		for (var j = 0; j < points.length; j++) {
			X.push(points[j].x);
			Y.push(points[j].y);
		}
		return Math.abs(calculatePolygonArea(X, Y, points.length));
	};

	function calculatePolygonArea(X, Y, numPoints) {
		var area = 0;
		var j = numPoints - 1;
		for (var i = 0; i < numPoints; i++) {
			area = area + (X[j] + X[i]) * (Y[j] - Y[i]);
			j = i;
		}
		return area / 2;
	}

	return geometryUtils;
};