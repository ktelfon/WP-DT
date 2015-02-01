var Util = function() {

	var isArray = Array.isArray;
	var NODE_TYPE_ELEMENT = 1;

	function setHashKey(obj, h) {
		if (h) {
			obj.$$hashKey = h;
		}
		else {
			delete obj.$$hashKey;
		}
	}

	function isFunction(value) {return typeof value === 'function';}

	function isString(value) {return typeof value === 'string';}

	function isObject(value) {
  		// http://jsperf.com/isobject4
  		return value !== null && typeof value === 'object';
  	}

  	function isRegExp(value) {
  		return value.toString() === '[object RegExp]';
  	}

  	function isDate(value) {
  		return value.toString() === '[object Date]';
  	}

  	function isWindow(obj) {
  		return obj && obj.window === obj;
  	}

  	function isArrayLike(obj) {
  		if (obj == null || isWindow(obj)) {
  			return false;
  		}

  		var length = obj.length;

  		if (obj.nodeType === NODE_TYPE_ELEMENT && length) {
  			return true;
  		}

  		return isString(obj) || isArray(obj) || length === 0 ||
  		typeof length === 'number' && length > 0 && (length - 1) in obj;
  	}

  	function forEach(obj, iterator, context) {
  		var key, length;
  		if (obj) {
  			if (isFunction(obj)) {
  				for (key in obj) {
	        // Need to check if hasOwnProperty exists,
	        // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
	        if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
	        	iterator.call(context, obj[key], key, obj);
	        }
	    }
	} else if (isArray(obj) || isArrayLike(obj)) {
		var isPrimitive = typeof obj !== 'object';
		for (key = 0, length = obj.length; key < length; key++) {
			if (isPrimitive || key in obj) {
				iterator.call(context, obj[key], key, obj);
			}
		}
	} else if (obj.forEach && obj.forEach !== forEach) {
		obj.forEach(iterator, context, obj);
	} else {
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				iterator.call(context, obj[key], key, obj);
			}
		}
	}
}
return obj;
}

return {
	addEvent: function(element, evnt, funct){
		if (element.attachEvent)
			return element.attachEvent('on'+evnt, funct);
		else
			return element.addEventListener(evnt, funct, false);
	},
	appendHtml: function(el, str) {
		var div = document.createElement('div');
		div.innerHTML = str;
		while (div.children.length > 0) {
			el.appendChild(div.children[0]);
		}
	},
	copy: function(source, destination, stackSource, stackDest) {
		if (isWindow(source)) {
			throw ngMinErr('cpws',
				"Can't copy! Making copies of Window is not supported.");
		}

		if (!destination) {
			destination = source;
			if (source) {
				if (isArray(source)) {
					destination = this.copy(source, [], stackSource, stackDest);
				} else if (isDate(source)) {
					destination = new Date(source.getTime());
				} else if (isRegExp(source)) {
					destination = new RegExp(source.source, source.toString().match(/[^\/]*$/)[0]);
					destination.lastIndex = source.lastIndex;
				} else if (isObject(source)) {
					var emptyObject = Object.create(Object.getPrototypeOf(source));
					destination = this.copy(source, emptyObject, stackSource, stackDest);
				}
			}
		} else {
			if (source === destination)
				throw ngMinErr('cpi',
					"Can't copy! Source and destination are identical.");

			stackSource = stackSource || [];
			stackDest = stackDest || [];

			if (isObject(source)) {
				var index = stackSource.indexOf(source);
				if (index !== -1)
					return stackDest[index];

				stackSource.push(source);
				stackDest.push(destination);
			}

			var result;
			if (isArray(source)) {
				destination.length = 0;
				for (var i = 0; i < source.length; i++) {
					result = this.copy(source[i], null, stackSource, stackDest);
					if (isObject(source[i])) {
						stackSource.push(source[i]);
						stackDest.push(result);
					}
					destination.push(result);
				}
			} else {
				var h = destination.$$hashKey;
				if (isArray(destination)) {
					destination.length = 0;
				} else {
					forEach(destination, function(value, key) {
						delete destination[key];
					});
				}
				for (var key in source) {
					if (source.hasOwnProperty(key)) {
						result = this.copy(source[key], null, stackSource, stackDest);
						if (isObject(source[key])) {
							stackSource.push(source[key]);
							stackDest.push(result);
						}
						destination[key] = result;
					}
				}
				setHashKey(destination, h);
			}

		}
		return destination;
	}
};
};