var GoogleImageProvider = function() {
    var MERCATOR_RANGE = 256;
    var googleImageProvider = {};
    var util = Util();

    function bound(value, opt_min, opt_max) {
        if (opt_min != null)
            value = Math.max(value, opt_min);
        if (opt_max != null)
            value = Math.min(value, opt_max);
        return value;
    }

    function degreesToRadians(deg) {
        return deg * (Math.PI / 180);
    }

    function radiansToDegrees(rad) {
        return rad / (Math.PI / 180);
    }

    function MercatorProjection() {
        this.pixelOrigin_ = new google.maps.Point(MERCATOR_RANGE / 2, MERCATOR_RANGE / 2);
        this.pixelsPerLonDegree_ = MERCATOR_RANGE / 360;
        this.pixelsPerLonRadian_ = MERCATOR_RANGE / (2 * Math.PI);
    }
    

    MercatorProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
        var me = this;

        var point = opt_point || new google.maps.Point(0, 0);

        var origin = me.pixelOrigin_;
        point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;
        // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
        // 89.189.  This is about a third of a tile past the edge of the world tile.
        var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999, 0.9999);
        point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
        return point;
    };

    MercatorProjection.prototype.fromPointToLatLng = function(point) {
        var me = this;

        var origin = me.pixelOrigin_;
        var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
        var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
        var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
        return new google.maps.LatLng(lat, lng);
    };

    getGoogleTileCorners = function(center, zoom, mapSize) {
        var proj = new MercatorProjection();
        var scale = Math.pow(2, zoom);
        var centerPx = proj.fromLatLngToPoint(center);
        var SWPoint = {x: (centerPx.x - (mapSize.width / 2) / scale), y: (centerPx.y + (mapSize.height / 2) / scale)};
        var SWLatLon = proj.fromPointToLatLng(SWPoint);
        var NEPoint = {x: (centerPx.x + (mapSize.width / 2) / scale), y: (centerPx.y - (mapSize.height / 2) / scale)};
        var NELatLon = proj.fromPointToLatLng(NEPoint);
        return new google.maps.LatLngBounds(SWLatLon, NELatLon);
    }


    var G = google.maps;
    var roofs = [];
    /* returns bounding box around all roofs */
    getSiteBounds = function() {
        var bounds =  new google.maps.LatLngBounds();
        for (var i = 0; i < this.roofs.length; i++) {
            var polygonBounds = this.roofs[i].getPath();
            for (var j = 0; j < polygonBounds.getLength(); j++) {
                bounds.extend(polygonBounds.getAt(j));
            }
        }
        return bounds;
    };
    /* returns the metric coords of the point relative to the basePoint */
    getMetricCoords = function(basePoint, point) {
        var bounds =  new google.maps.LatLngBounds();
        bounds.extend(basePoint);
        bounds.extend(point);
        return {
            y:  google.maps.geometry.spherical.computeDistanceBetween(bounds.getNorthEast(), this.getSEPointFromBounds(bounds)),
            x:  google.maps.geometry.spherical.computeDistanceBetween(bounds.getSouthWest(), this.getSEPointFromBounds(bounds))
        };
    };
    /* returns the North-West point of the rectangle */
    getNWPointFromBounds = function(bounds) {
        return  new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng());
    };
    /* returns the South-East point of the rectangle */
    getSEPointFromBounds = function(bounds) {
        return  new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getNorthEast().lng());
    };
    /* returns the zoom level necessary to fit the specified bounds */
    getBoundsZoomLevel = function(bounds, mapDim) {
        var WORLD_DIM = {height: 256, width: 256};
        var ZOOM_MAX = 21;

        function latRad(lat) {
            var sin = Math.sin(lat * Math.PI / 180);
            var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
            return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
        }

        function zoom(mapPx, worldPx, fraction) {
            return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
        }

        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();

        var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

        var lngDiff = ne.lng() - sw.lng();
        var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

        var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
        var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

        return Math.min(latZoom, lngZoom, ZOOM_MAX);
    };
    /* converts bounds object to array of LatLng points */
    getAllBoundingPoints = function(bounds) {
        var points = [];
        //NE 
        points.push(bounds.getNorthEast());
        //SW
        points.push(bounds.getSouthWest());
        //NW 
        points.push( new google.maps.LatLng(points[0].lat(), points[1].lng()));
        //SE 
        points.push( new google.maps.LatLng(points[1].lat(), points[0].lng()));
        return points;
    };
    /* returns bounding box with only 1 point*/
    getSiteBoundsByPoint = function(latlng, sizeOfImage, overlay) {
        latlng = new google.maps.LatLng( latlng.lat,latlng.lng);
        var centerPoint = overlay.getProjection().fromLatLngToContainerPixel(latlng);
        var rightCenterPoint = util.copy(centerPoint);
        rightCenterPoint.x = rightCenterPoint.x + (sizeOfImage.width / 2);
        var topCenterPoint = util.copy(centerPoint);
        topCenterPoint.y = topCenterPoint.y + (sizeOfImage.height / 2);
        var leftCenterPoint = util.copy(centerPoint);
        leftCenterPoint.x = leftCenterPoint.x - (sizeOfImage.width / 2);
        var bottomCenterPoint = util.copy(centerPoint);
        bottomCenterPoint.y = bottomCenterPoint.y - (sizeOfImage.height / 2);
        var bounds =  new google.maps.LatLngBounds();
        bounds.extend(overlay.getProjection().fromContainerPixelToLatLng(centerPoint));
        bounds.extend(overlay.getProjection().fromContainerPixelToLatLng(bottomCenterPoint));
        bounds.extend(overlay.getProjection().fromContainerPixelToLatLng(leftCenterPoint));
        bounds.extend(overlay.getProjection().fromContainerPixelToLatLng(topCenterPoint));
        bounds.extend(overlay.getProjection().fromContainerPixelToLatLng(rightCenterPoint));
        return bounds;
    }

    googleImageProvider.getImageByCoords = function(coord, zoom, callbackFunction){
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
            siteBounds = getSiteBoundsByPoint(coord, size, overlay);
            var calculatedZoomLevel = getBoundsZoomLevel(siteBounds, size);
            allowedZoomLevel = (calculatedZoomLevel <= allowedZoomLevel) && (allowedZoomLevel != "ERROR") ? calculatedZoomLevel : allowedZoomLevel;

            basePoint = getNWPointFromBounds(siteBounds);
            imageBounds = getGoogleTileCorners(siteBounds.getCenter(), allowedZoomLevel, size);
            metricSEpoint = getMetricCoords(
                getNWPointFromBounds(imageBounds),
                getSEPointFromBounds(imageBounds));
            satelliteImg.metricLocation = getMetricCoords(
                basePoint, getNWPointFromBounds(imageBounds));
            satelliteImg.metricLocation = {x: -satelliteImg.metricLocation.x, y: -satelliteImg.metricLocation.y};
            satelliteImg.metricWidth = metricSEpoint.x;
            satelliteImg.metricHeight = metricSEpoint.y;
            var imgLink = "http://maps.googleapis.com/maps/api/staticmap?center="
            + new google.maps.LatLng(coord.lat, coord.lng).toString()
            + "&zoom=" + allowedZoomLevel
            + "&size=" + size.width + "x" + size.height
            + "&maptype=satellite&scale=2";
            satelliteImg.link = imgLink;            
            return callbackFunction(satelliteImg);
        });
};

return googleImageProvider;

}