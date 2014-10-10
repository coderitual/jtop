define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Signal = require('./lib/signals'),
		Class = require('./class'),
		TWEEN = require('./tween'),
		Item = require('./item'),
		Drag = require('./drag'),
		Grid = require('./grid');

	var	SVG = "http://www.w3.org/2000/svg",
		desktopIdCounter = 1,
		idPrefix = 'jtop_desktop',
		type = 'DESKTOP';

	function disableSelection(target){
		target.onmousedown=function(){return false}
		target.style.cursor = "default";
	};

	function getIEVersion() {
		var rv = -1; // Return value assumes failure.
		if (navigator.appName == 'Microsoft Internet Explorer')
		{
		var ua = navigator.userAgent;
		var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		if (re.exec(ua) != null)
		  rv = parseFloat( RegExp.$1 );
		}
		return rv;
	};

	var events = {
		create: new Signal()
	};

	function createIndicator(x, y, w, h, persist) {
		var p = document.createElementNS(SVG, "rect");
		svgSetXYWH(p, x, y, w, h);
		p.setAttribute('fill', 'rgba(255,255,255,1)');
		p.style.opacity = 0.6;
		this.layers.indicatorLayer.appendChild(p);
		if (!persist) rampOpacityDownEx(p);
		return p;
    };

    function rampOpacityDownEx(g) {
	  	var rampFunc = function () {
	      var o = parseFloat(g.style.opacity) - 0.04;
	      g.style.opacity = o;
	      if (o > 0)
	          setTimeout(rampFunc, 10);
	      else
	        g.parentNode.removeChild(g);

	  }
	  rampFunc();
	};

	// private Core functions
	function itemRemoved(item) {
		if(item) {
			item.on.remove.remove(itemRemoved);
			this.grid.removeValue(item.settings.gridX, item.settings.gridY, item);
			this.items[item.id] = null;
			delete this.items[item.id];
		}
	};

	var Core = Class.extend({

		init: function(element, options) {

			var id = idPrefix + '_' + desktopIdCounter++,
				parent,
				node,
				indicatorLayer;

			this._settings = _.extend({
				gridW: 100,
				gridH: 100
			}, options);

			if(_.isString(element)) {
				parent = document.getElementById(element);
			} else if(_.isElement(element)) {
				parent = element;
			}

			if(_.isNull(parent)) {
				console.error('Cannot create desktop. Specified DOM element does not exists.');
				return;
			}

			node = document.createElementNS(SVG, 'svg');
			node.setAttribute('xlmns', SVG);
			node.setAttribute('xmlns:xlink', SVG);
			node.setAttribute('id', id);
			node.style.width = '100%';
			node.style.height = '100%';
			parent.appendChild(node);

			indicatorLayer = document.createElementNS(SVG, 'g');
			indicatorLayer.setAttribute('class', 'indicator-layer');
			node.appendChild(indicatorLayer);

			disableSelection(parent);

			this.id = id;
			this.node = node;
			this.parent = parent;
			this.items = {};
			this.type = type;
			this.grid = new Grid();

			this.on = {
				addItem: new Signal(),
				removeItem: new Signal(),
				settings: new Signal(),
				change: new Signal(),
				dragOverItem: new Signal(),
				dragOutItem: new Signal(),
				dropInItem: new Signal(),
				dragStart: new Signal(),
				dragEnd: new Signal()
			};

			this.layers = {
				indicatorLayer: indicatorLayer
			}

			Drag.asDragManager.call(this, node);
			Drag.asDropElement.call(this);
			this._drag.gridX = -1;
			this._drag.gridY = -1;
			events.create.dispatch(this);
		},

		addItem: function(item, gridX, gridY) {
			if(item instanceof Item && _.isString(item.type) && !_.has(this.items, item.id)) {
				
				var o = this._settings;

				item.id = item.id || _.uniqueId('jtop_' + item.type + '_');
				this.items[item.id] = item;
				
				if(_.isElement(item.node)) {
					addClass(item.node, 'ITEM');
					addClass(item.node, item.type);
					item.node.setAttribute('id', item.id);
					item.parent = this;
					item.manager = this;
					item.on.remove.add(itemRemoved, this);
					this.node.appendChild(item.node);
				}

				if(_.isNumber(gridX) && _.isNumber(gridY)) {
					this.grid.setValue(gridX, gridY, item);
					item.settings.gridX = gridX;
					item.settings.gridY = gridY;
					item.pos(item.settings.gridX * o.gridW, item.settings.gridY * o.gridH);
				}

				this.on.addItem.dispatch(item);
				item.onAdd.call(item, this);

				return item;
			}
		},

		removeItem: function(id) {
			var item;
			if(_.has(this.items, id)) 
				item = this.items[id];
			else if(id instanceof Item)
				item = id;

			if(item) {
				item.remove();
			}
		},

		dragStart: function(item, x, y) {

			if(!_.has(this.items, item.id)) return;
			this.on.dragStart.dispatch(item, x, y);

			if(item.type === 'ICON') {
				if(item.parent.id !== this.id)
					item.pos(item.transform.x + item.parent.transform.x, item.transform.y + item.parent.transform.y);
				
				item.parent.node.removeChild(item.node);
				item.parent = this;
				item.parent.node.appendChild(item.node);
			}
		},

		dragEnd: function(item, x, y) {
			if(!_.has(this.items, item.id)) return;
			this.on.dragEnd.dispatch(item, x, y);
		},

		dragOver: function(item, x, y) {
			if(item.type === 'ICON') {
				var self = this,
					o = this._settings,
					newposx = Math.floor(x / o.gridW),
	          		newposy = Math.floor(y / o.gridH);

	          	if(newposx !== this._drag.gridX || newposy !== this._drag.gridY) {

	          		this.on.dragOutItem.dispatch(item);
	          		var belowItem = this.grid.getValue(newposx, newposy);
	          		if(belowItem) {
	          			this.on.dragOverItem.dispatch(item, belowItem, x, y);
	          		}

	          		createIndicator.call(self, newposx *  o.gridW, newposy * o.gridH,  o.gridW,  o.gridH);

	          		this._drag.gridX = newposx;
	          		this._drag.gridY = newposy;
	          	}
	        }
		},

		dragOut: function(item, x, y) {
			this.on.dragOutItem.dispatch(item);
			this._drag.gridX = -1;
	        this._drag.gridY = -1;
		},

		dropIn: function(item, x, y, dropBack) {
			if(item.type === 'ICON') {
				var o = this._settings,
					grid = this.grid,
					gridposx = Math.floor(x / o.gridW),
          			gridposy = Math.floor(y / o.gridH);

          		var belowItem = this.grid.getValue(gridposx, gridposy);
          		grid.setValue(gridposx, gridposy, item);
				item.settings.gridX = gridposx;
				item.settings.gridY = gridposy;

          		if(!dropBack) {
          			item.posAnim(gridposx * o.gridW, gridposy * o.gridH);
	          		if(belowItem) {
	          			this.on.dropInItem.dispatch(item, belowItem);
	          		}
          		} else {
					item.posAnim(gridposx * o.gridW, gridposy * o.gridH, 150, TWEEN.Easing.Linear.None);
				}

				return true;
			}
		},

		dropOut: function(item, x, y) {
			if(item.type === 'ICON') {
				var o = this._settings,
					grid = this.grid;
				grid.removeValue(item.settings.gridX, item.settings.gridY, item);
			}
		},

		getDropableItem: function(id) {
			if(this.id === id) 
				return this;
			else
				return this.getItemById(id);
		},

		getItemById: function(id) {
			if(_.has(this.items, id))
				return this.items[id];
		},

		settings: function(val) {
			_.extend(this._settings, val);
			this.on.settings.dispatch(this._settings);
		},

		destroy: function() {
			this.parent.removeChild(this.node);
		}
	});

	// core helper functions
	function createSVGElement(type) {
			return document.createElementNS(SVG, type);
	};

	function svgSetXYWH(el, x, y, w, h) {
		el.setAttribute("x", x);
		el.setAttribute("y", y);
		el.setAttribute("width", w);
		el.setAttribute("height", h);
    };

    function pathRoundedRectangle(x, y, w, h, r1, r2, r3, r4) {
  		var array = [];
  		array = array.concat(["M",x,r1+y, "Q",x,y, x+r1,y]); //A
		array = array.concat(["L",x+w-r2,y, "Q",x+w,y, x+w,y+r2]); //B
		array = array.concat(["L",x+w,y+h-r3, "Q",x+w,y+h, x+w-r3,y+h]); //C
		array = array.concat(["L",x+r4,y+h, "Q",x,y+h, x,y+h-r4, "Z"]); //D

		return array.join(' ');
	};

	function pathCross(x, y, w, h, width) {
		var array = [];
		array = array.concat(["M",0, (h - width) / 2, "L", (w - width) / 2, (h - width) / 2]); // 1
		array = array.concat(["L", (w - width) / 2, 0, "L", (w + width) / 2, 0]); // 2,3
		array = array.concat(["L", (w + width) / 2, (h - width) / 2, "L", w, (h - width) / 2]); // 4,5
		array = array.concat(["L", w, (h + width) / 2, "L", (w + width) / 2, (h + width) / 2]); // 5,6
		array = array.concat(["L", (w + width) / 2, h, "L", (w - width) / 2, h]); // 7,8
		array = array.concat(["L", (w - width) / 2, (h + width) / 2, "L", 0, (h + width) / 2, 'Z']); // 8,9
		return array.join(' ');
	};

	function hasClass(ele,cls) {
		return ele.className.baseVal.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
	};
 
	function addClass(ele,cls) {
		if (!hasClass(ele,cls)) ele.className.baseVal += " "+cls;
	};
 
	function removeClass(ele,cls) {
		if (hasClass(ele,cls)) {
	    	var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
			ele.className = ele.className.baseVal.replace(reg,' ');
		}
	};

	module.exports = {
		Core: Core,
		on: events,
		getIEVersion: getIEVersion,
		svgSetXYWH: svgSetXYWH,
		createSVGElement: createSVGElement,
		addClass: addClass,
		hasClass: hasClass,
		removeClass: removeClass,
		path: {
			roundedRectangle: pathRoundedRectangle,
			cross: pathCross
		}
	};

});