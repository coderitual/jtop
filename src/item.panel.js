define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Signal = require('./lib/signals'),
		core = require('./core'), 
		Item = require('./item'),
		Text = require('./text'),
		Drag = require('./drag'),
		TWEEN = require('./tween'),
		Grid = require('./grid'),
		Offset = require('./offset');

	var XLINK = 'http://www.w3.org/1999/xlink',
		_type = 'PANEL';

	var settings = {
		fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Helvetica, Arial, Verdana',
		fontSize: 15,
		mouseOverSpeed: 200,
		mouseOutSpeed: 200,
		mouseOverOpacity: 0.75,
		mouseOutOpacity: 0.6,
		textMargin: 25,
		alignDistance: 10,
		alignIndicatorDelay: 70,
		alignIndicator: false
	};

	function buildTransform(t) {
		return ['translate(', t.x, ',', t.y, ') rotate(', t.r, ') scale(', t.s, ')'].join('');
	};

	function buildTransformEx(x, y, r, s) {
		return ['translate(', x, ',', y, ') rotate(', r, ') scale(', s, ')'].join('');
	};

	function windowToElement(el, x, y) {
    	var bbox = el.getBoundingClientRect();
    	return { x: x - bbox.left, y: y - bbox.top};
	};

	function hasClass(ele,cls) {
		return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
	};
 
	function addClass(ele,cls) {
		if (!hasClass(ele,cls)) ele.className += " "+cls;
	};
 
	function removeClass(ele,cls) {
		if (hasClass(ele,cls)) {
	    	var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
			ele.className = ele.className.replace(reg,' ');
		}
	};

	function createIndicator(el, x1, y1, x2, y2) {
		var line = core.createSVGElement('line');
		line.setAttribute('x1', x1);
		line.setAttribute('y1', y1);
		line.setAttribute('x2', x2);
		line.setAttribute('y2', y2);
		line.setAttribute('stroke', 'rgba(255,255,255,1)');
		line.setAttribute('stroke-width', 2);
		line.setAttribute('stroke-dasharray', 3);
		line.style.opacity = 0.7;
		el.appendChild(line);
		rampOpacityDownEx(line);
    };

    function rampOpacityDownEx(g) {
	  	var rampFunc = function () {
	      var o = parseFloat(g.style.opacity) - 0.03;
	      g.style.opacity = o;
	      if (o > 0)
	          setTimeout(rampFunc, 10);
	      else
	        g.parentNode.removeChild(g);

	  }
	  rampFunc();
	};

	// Resizer
	var Resizer = Item.extend({
		
		init: function(options) {

			this._super();

			var o = this.settings = _.defaults(options || {}, {
				radius: 10
			});

			_.extend(this.on, {
				resizeStart: new Signal,
				resize: new Signal,
				resizeEnd: new Signal
			});

			var g = core.createSVGElement('g');
				handle = core.createSVGElement('circle');

			handle.setAttribute('r', o.radius);
			handle.setAttribute('fill', '#000');
			handle.setAttribute('stroke', '#000');
			handle.setAttribute('stroke-width', 1);
			handle.setAttribute('opacity', 0);
			handle.setAttribute('transform', 'translate(' + (-o.radius) + ',' + (0) + ')');

			g.appendChild(handle);
			g.style.cursor = 'nw-resize';

			this.node = g;

			Drag.asDragElement.call(this, {
				handle: g,
				checkDragOver: false,
				checkDropOver: false
			});
		},

		dragStart: function(x, y) {
			this.on.resizeStart.dispatch(x, y, x - this.parent.transform.x, y - this.parent.transform.y);
			this.dragManager.node.style.cursor = 'nw-resize';
		},

		dragEnd: function(x, y) {
			this.on.resizeEnd.dispatch(x, y, x - this.parent.transform.x, y - this.parent.transform.y);
		},

		dragMove: function(x, y) {
			this.on.resize.dispatch(x, y, x - this.parent.transform.x, y - this.parent.transform.y);
			this.dragManager.node.style.cursor = 'nw-resize';
		}	

	});

	// Panel
	function measureElements() {
		var node = this.node,
			container = this.elements.container,
			topPanel = this.elements.topPanel,
			title = this.elements.title,
			titleTop = this.elements.titleTop,
			titleShadow = this.elements.titleShadow,
			bottomPanel = this.elements.bottomPanel,
			containerBackground = this.elements.containerBackground,
			topBackground = this.elements.topBackground,
			bottomBackground = this.elements.bottomBackground,
			resizer = this.resizer,
			o = this.settings;

		core.svgSetXYWH(containerBackground, 0, 0, o.width, o.height);
		topBackground.setAttribute('d', core.path.roundedRectangle(0, 0, o.width, o.topPanelHeight, 6, 6, 0, 0));
		bottomBackground.setAttribute('d', core.path.roundedRectangle(0, 0, o.width, o.bottomPanelHeight, 0, 0, 6, 6));

		Text.addEllipseText(titleTop,  o.title, o.width - 2 * o.textMargin);
		titleShadow.textContent = titleTop.textContent;
		title.setAttribute('transform', 'translate(' + o.width / 2 + ', ' + o.textOffsetTop + ')');
		topPanel.setAttribute('transform', 'translate(0, ' + (-o.topPanelHeight) + ')');
		bottomPanel.setAttribute('transform', 'translate(0, ' + (o.height) + ')');
		resizer.pos(o.width, o.height);
	};

	function onMouseOver() {
		var topBackground = this.elements.topBackground;
		this.tweens.hover.stop().to({ o: settings.mouseOverOpacity }, settings.mouseOverSpeed).start();	
	};

	function onMouseOut() {
		var topBackground = this.elements.topBackground;
		this.tweens.hover.stop().to({ o: settings.mouseOutOpacity }, settings.mouseOutSpeed).start();	
	};

	function onInlineEditInit(e) {

		var title = this.elements.title,
			topPanel = this.elements.topPanel,
			o = this.settings,
			textValue = o.title,
			self = this,
			input,
			bbox,
			bboxText,
			loc,
			locText;

		if(o.inlineEdit !== true) return;

		// prevent edit after drag (Fiirefox)
		if(this.drag._afterDrag === true) {
			this.drag._afterDrag = false;
			return;
		}
			
		bbox = topPanel.getBoundingClientRect();
		loc = windowToElement(this.manager.parent, bbox.left, bbox.top);
		bboxText = title.getBoundingClientRect();
		locText = windowToElement(this.manager.parent, bboxText.left, bboxText.top);

		input = this._inlineInput = document.createElement("input");
		input.type = "text";
		input.className = 'jt-panel-edit-inline';
		input.maxLength = 50;
		input.value = o.title;
		
		this.on.changed.active = false;
		this.title('');
		this.settings.title = input.value; 
		this.on.changed.active = true;

		input.addEventListener('keydown', function(e) {
  			if (e.keyCode == 13) {
        		onInlineEditEnd.call(self, e);	
   			} else if (e.keyCode == 27) {
   				this.value = textValue;
        		onInlineEditEnd.call(self, e);	
   			}
		});

		_.extend(input.style, {
			display: 'block',
			backgroundColor: 'transparent',
			outline: 'none',
			position: 'absolute',
			left: loc.x + o.textMargin + 'px',
			top: locText.y + 'px',
			border: 'none',
			width: o.width - 2 * o.textMargin + 'px',
			color: '#FFF',
			fontFamily: o.fontFamily,
			fontSize: o.fontSize + 'px',
			textAlign: 'center',
			margin: 0,
			padding: 0
		});

		this.manager.parent.appendChild(input); 
		input.focus();
		input.select();
	};

	function onInlineEditEnd(e) {

		if(this.settings.inlineEdit !== true) return; 

		if(this._inlineInput) {
			var input = this._inlineInput;

			if(this.settings.title !== input.value && input.value !== '') {
				this.title(input.value);
			} else {
				this.on.changed.active = false;
				this.title(this.settings.title);
				this.on.changed.active = true;
			}

			this.manager.parent.removeChild(input); 
			this._inlineInput = null;
		}
	}

	var Panel = Item.extend({

		panels: [],	// static panels reference

		init: function(options) {
			this._super(options);
			
			var o = _.extend(this.settings, {
				title: '',
				width: 200,
				height: 160,
				minWidh: 100,
				minHeight: 80,
				gridW: 100,
				gridH: 80,
				fontFamily: settings['fontFamily'],
				fontSize: settings['fontSize'],
				topPanelHeight: 25,
				bottomPanelHeight: 6,
				textOffsetTop: 18,
				textMargin: settings['textMargin'],
				inlineEdit: true
			}, options);

			this.type = _type;
			this.items = {};
			this.grid = new Grid();

			_.extend(this.on, {
				changed: new Signal()
			});

			// panel basic svg elements
			var g = core.createSVGElement('g'),
				container = core.createSVGElement('g'),
				containerBackground = core.createSVGElement('rect'),
				topPanel = core.createSVGElement('g'),
				topBackground = core.createSVGElement('path'),
				bottomPanel = core.createSVGElement('g'),
				bottomBackground = core.createSVGElement('path'),
				title = core.createSVGElement('g'),
				titleTop = core.createSVGElement('text'),
				titleShadow = core.createSVGElement('text');

			core.svgSetXYWH(containerBackground, 0, 0, o.width, o.height);
			containerBackground.setAttribute('fill', '#000');
			containerBackground.setAttribute('opacity', '0.4');
			container.appendChild(containerBackground);

			titleTop.setAttribute('font-family', o.fontFamily);
			titleTop.setAttribute('font-size', o.fontSize);
			titleTop.setAttribute('fill', '#FFF');
			titleTop.setAttribute('text-anchor', 'middle');	

			titleShadow.setAttribute('font-family', o.fontFamily);
			titleShadow.setAttribute('font-size', o.fontSize);
			titleShadow.setAttribute('fill', '#000');
			titleShadow.setAttribute('stroke', '#000');
			titleShadow.setAttribute('stroke-width', 2.6);
			titleShadow.setAttribute('stroke-opacity', 0.5);
			titleShadow.setAttribute('text-anchor', 'middle');
			titleShadow.setAttribute('transform', 'translate(1, 1)');

			title.setAttribute('class', 'text');
			title.style['-webkit-user-select'] = 'none';
			title.style['-moz-user-select'] = 'none';
			title.appendChild(titleShadow);
			title.appendChild(titleTop);

			topBackground.setAttribute('d', core.path.roundedRectangle(0, 0, o.width, o.topPanelHeight, 6, 6, 0, 0));
			topBackground.setAttribute('fill', '#000');
			topBackground.setAttribute('opacity', settings.mouseOutOpacity);
			topBackground.opacity = settings.mouseOutOpacity; // tween value
			topPanel.appendChild(topBackground);
			topPanel.appendChild(title);

			bottomBackground.setAttribute('d', core.path.roundedRectangle(0, 0, o.width, o.bottomPanelHeight, 0, 0, 6, 6));
			bottomBackground.setAttribute('fill', '#000');
			bottomBackground.setAttribute('opacity', '0.4');
			bottomPanel.appendChild(bottomBackground);

			// drag indicators
			var indicators = core.createSVGElement('g'),
				indicator = core.createSVGElement('path');

			indicator.setAttribute('stroke', '#000');
			indicator.setAttribute('stroke-width', 1.0);
			indicator.setAttribute('stroke-opacity', 0);
			indicator.setAttribute('fill', '#000');
			indicator.setAttribute('fill-opacity', 0.3);
			//indicator.setAttribute('d', core.path.roundedRectangle(0, 0, o.gridW, o.gridH, 0, 0, 0, 0));
			//indicator.setAttribute('d', core.path.cross(0, 0, o.gridW / 3, o.gridH / 3, 10));
			//indicator.setAttribute('transform', 'translate(' + (o.gridW - o.gridW / 3) / 2 + ', ' + (o.gridH - o.gridH / 3) / 2 + ')');
			indicator.setAttribute('opacity', '0');
			indicators.setAttribute('transform-origin', '50 50');
			indicators.appendChild(indicator);

			g.appendChild(container);
			g.appendChild(bottomPanel);
			g.appendChild(topPanel);
			g.appendChild(indicators);

			//events handling
			g.addEventListener('mouseover', _.bind(onMouseOver, this));
			g.addEventListener('mouseout', _.bind(onMouseOut, this));

			document.addEventListener('mousedown', _.bind(onInlineEditEnd, this));
			topPanel.addEventListener('click', _.bind(onInlineEditInit, this));

			this.node = g;
			this.elements = {
				container: container,
				containerBackground: containerBackground,
				topPanel: topPanel,
				topBackground: topBackground,
				bottomPanel: bottomPanel,
				bottomBackground: bottomBackground,
				title: title,
				titleTop: titleTop,
				titleShadow: titleShadow,
				indicators: indicators,
				indicator: indicator
			};

			//resizer
			var resizer = this.resizer = new Resizer();
			
			resizer.parent = this;
			g.appendChild(resizer.node);
			resizer.on.resizeStart.add(_.bind(this._resizeStart, this));
			resizer.on.resizeEnd.add(_.bind(this._resizeEnd, this));
			resizer.on.resize.add(_.bind(this._resize, this));

			Drag.asDragElement.call(this, { 
				handle: topPanel,
				checkDragOver: false,
				checkDropOver: false
			});
			Drag.asDropElement.call(this, {
				gridX: -1,
				gridY: -1
			});

			this.panels.push(this);
		},

		title: function(val) {
			if(_.isString(val)) {
				this.settings.title = val;
				this.invalidate();
				this.on.changed.dispatch({ key: 'title', value: val });
			}

			return this;
		},

		resize: function(enabled) {

			if(_.isUndefined(enabled)) return this.resizer.drag.enabled;

			if(enabled === true) {
				this.resizer.drag.enabled = true;
				this.resizer.node.style.cursor = 'nw-resize';
			} else {
				this.resizer.drag.enabled = false;
				this.resizer.node.style.cursor = 'default';
			}
		},

		getBoundingBox: function() {
			return { 
				x: this.transform.x, 
				y: this.transform.y - this.settings.topPanelHeight, 
				w: this._bbox.width, 
				h: this._bbox.height
			};
		},

		onAdd: function(manager) {
			manager.registerDragItem(this.resizer);
			this.invalidate();

			// hover effect
			var topBackground = this.elements.topBackground;
			this.tweens.hover = new TWEEN.Tween({ o: topBackground.opacity })
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function() {
            	topBackground.opacity = this.o;
                topBackground.setAttribute('opacity', topBackground.opacity);
            });

            // drag indicator animation
            var indicator = this.elements.indicator;
        	indicator.t = {
        		o: 0.2,
        		s: 1,
        		r: 0
        	};
			this.tweens.indicator = new TWEEN.Tween(indicator.t)
			.to({ s: 1.5, o: 1, r: 360 }, 300)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function() {
                indicator.setAttribute('opacity', this.o);
            });
           	this.tweens.indicatorBack = new TWEEN.Tween(indicator.t)
			.to({ s: 1, o: 0.2, r: 0}, 300)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function() {
                indicator.setAttribute('opacity', this.o);
            });
            
            this.tweens.indicatorBack.chain(this.tweens.indicator);
            this.tweens.indicator.chain(this.tweens.indicatorBack);
		},

		dragOver: function(item, x, y) {
			if(item.type === 'ICON') {

				var o = this.settings,
					newposx = Math.floor((x - this.transform.x) / o.gridW),
	          		newposy = Math.floor((y - this.transform.y) / o.gridH),
	          		indicator = this.elements.indicator,
	          		indicators =  this.elements.indicators;

	          		newposx = newposx < 0 ? 0 : (newposx * o.gridW >= o.width ? o.width / o.gridW - 1 : newposx);
	          		newposy = newposy < 0 ? 0 : (newposy * o.gridH >= o.height ? o.height / o.gridH - 1 : newposy);

	          	if(newposx !== this.drop.gridX || newposy !== this.drop.gridY) {
	          		
	          		// indicators.setAttribute('opacity', '1');
	          		// indicators.setAttribute('transform', 'translate(' + newposx * o.gridW + ', ' + newposy * o.gridH + ')');
	          		// indicator.t.o = 0.2;
	          		// this.tweens.indicator.start();
	          		this.drop.gridX = newposx;
	          		this.drop.gridY = newposy;
	          	}

	          	var belowItem = this.grid.getValue(newposx, newposy);
	          	if(belowItem) {
	          		this.manager.node.style.cursor = 'not-allowed';	// item not accepted cursor
	          	} else {
	          		this.manager.node.style.cursor = 'move';
	          	}

				this.tweens.hover.stop().to({ o: settings.mouseOverOpacity }, settings.mouseOverSpeed).start();
	        }
		},

		dragOut: function(item, x, y) {
			if(item.type === 'ICON') {

				var indicators = this.elements.indicators;
				this.drop.gridX = -1;
				this.drop.gridY = -1;
				// indicators.setAttribute('opacity', '0');
				// this.tweens.indicator.stop();
				// this.tweens.indicatorBack.stop();

				this.manager.node.style.cursor = 'move'; // cursor not allowed clear
				this.tweens.hover.stop().to({ o: settings.mouseOutOpacity }, settings.mouseOutSpeed).start();	
	        }
		},

		dropIn: function(item, x, y) {
			if(item.type === 'ICON') {
				var o = this.settings 
					indicators = this.elements.indicators,
					relx = x - this.transform.x,
					rely = y - this.transform.y,
					newposx = Math.floor((x - this.transform.x) / o.gridW),
	          		newposy = Math.floor((y - this.transform.y) / o.gridH);

	          	newposx = newposx < 0 ? 0 : (newposx * o.gridW >= o.width ? o.width / o.gridW - 1 : newposx);
	          	newposy = newposy < 0 ? 0 : (newposy * o.gridH >= o.height ? o.height / o.gridH - 1 : newposy);
				
	          	//measure item position
	          	var belowItem = this.grid.getValue(newposx, newposy);
	          	if(belowItem) return false;	// item not accepted

				this.drop.gridX = newposx;
	          	this.drop.gridY = newposy;

				item.pos(item.transform.x - this.transform.x, item.transform.y - this.transform.y);
				item.posAnim(this.drop.gridX * o.gridW, this.drop.gridY * o.gridH, 150, TWEEN.Easing.Linear.None);
				this.addItem(item, this.drop.gridX, this.drop.gridY, false);

				// reset
				this.drop.gridX = -1;
				this.drop.gridY = -1;
				indicators.setAttribute('opacity', '0');
				this.tweens.indicator.stop();
				this.tweens.indicatorBack.stop();

				return true;
			}
		},

		dropOut: function(item, x, y) {
			var o = this.settings;
			if(item.type === 'ICON') {
				this.removeItem(item);
			}
		},

		dragStart: function(x, y) {
			this.drag.alignX = false;
			this.drag.alignY = false;
		},

		dragEnd: function(x, y) {
			this.pos(this.drag.alignX ? this.drag.alignPosX : this.transform.x, 
					 this.drag.alignY ? this.drag.alignPosY : this.transform.y);
			
			// set this flag to prevent inline edit after drag in some browsers (Firefox)
			var self = this;
			this.drag._afterDrag = true;
			_.defer(function() {
				self.drag._afterDrag = false;	// set after drag to false on next thick (Prevent force to double click to edit in other than FF browsers)
			});
		},
		
		dragMove: function(x, y) {
			// panel alignment
			var self = this;

			var	relatePanelY = _.find(this.panels, function(panel) {
				return panel !== self && Math.abs(self.transform.y - panel.transform.y) < settings.alignDistance
			});

			if(!_.isUndefined(relatePanelY)) {

				if(!this.drag.alignY) {
					this.drag.alignY = true;
					settings.alignIndicator && setTimeout(function() {
						self.drag.alignY && createIndicator(self.manager.node, 
								0, relatePanelY.transform.y - relatePanelY.settings.topPanelHeight, 
								self.manager.parent.offsetWidth, relatePanelY.transform.y - relatePanelY.settings.topPanelHeight);
					}, settings.alignIndicatorDelay);
				}

				this.drag.alignPosY = relatePanelY.transform.y;
			} else {
				this.drag.alignY = false;
			}

			var	relatePanelX = _.find(this.panels, function(panel) {
				return panel !== self && Math.abs(self.transform.x - panel.transform.x) < settings.alignDistance
			});

			if(!_.isUndefined(relatePanelX)) {

				if(!this.drag.alignX) {
					this.drag.alignX = true;
					settings.alignIndicator && setTimeout(function() {
						self.drag.alignX && createIndicator(self.manager.node, 
										relatePanelX.transform.x, 0, 
										relatePanelX.transform.x, self.manager.parent.offsetHeight);
					}, settings.alignIndicatorDelay);
				}

				this.drag.alignX = true;
				this.drag.alignPosX = relatePanelX.transform.x;
			} else {
				this.drag.alignX = false;
			}

			var posx = this.drag.alignX ? this.drag.alignPosX : this.transform.x,  
				posy = this.drag.alignY ? this.drag.alignPosY : this.transform.y;

			this.node.setAttribute('transform', buildTransform({
				x: posx,
				y: posy,
				s: self.transform.s,
				r: self.transform.r
			}));
		},

		addItem: function(item, gridX, gridY, changePos) {
			if(!_.has(this.items, item.id)) {
				this.items[item.id] = item;
				item.on.remove.add(this.removeItem, this);

				if(item.parent.grid instanceof Grid) {
					item.parent.grid.removeValue(item.settings.gridX, item.settings.gridY, item);
				}

				item.parent.node.removeChild(item.node);
				item.parent = this;
				item.parent.node.appendChild(item.node);

				this.grid.setValue(gridX, gridY, item);
				item.settings.gridX = _.defaults(gridX, item.settings.gridX);
				item.settings.gridY = _.defaults(gridY, item.settings.gridY);

				var o = this.settings,
					maxX = this.grid.getColumnCount(),
					maxY = this.grid.getRowCount(),
					changePos = _.defaults(changePos, true);

				o.minWidh = o.gridW * maxX;
				o.minHeight = o.gridH * maxY;

				if(changePos) {
					item.pos(item.settings.gridX * o.gridW, item.settings.gridY * o.gridH);
				}
			}
		},

		removeItem: function(item) {
			if(_.has(this.items, item.id)) {
				item.on.remove.remove(this.removeItem);
				this.grid.removeValue(item.settings.gridX, item.settings.gridY, item);

				var o = this.settings,
					maxX = this.grid.getColumnCount(),
					maxY = this.grid.getRowCount(); 
				
				o.minWidh = maxX > 0 ? o.gridW * maxX : o.gridW;
				o.minHeight = maxY > 0 ? o.gridH * maxY : o.gridH;

				this.items[item.id] = null;
				delete this.items[item.id];
			}
		},

		_resizeStart: function(x, y, ix, iy) {},

		_resizeEnd: function(x, y, ix, iy) {
			var self = this,
				o = this.settings,
				resizer = this.resizer;

			ix = _.max([o.minWidh, ix]);
			iy = _.max([o.minHeight, iy]);

			ix = Math.floor((ix + o.gridW / 2) / o.gridW) * o.gridW;
			iy = Math.floor((iy + o.gridH / 2) / o.gridH) * o.gridH;

			o.width = ix;
			o.height = iy;

			this.invalidate();
			this.on.changed.dispatch({ key: 'size', value: {width: self.settings.width, height: self.settings.height }});
		},

		_resize: function(x, y, ix, iy) {

			var o = this.settings;

			ix = _.max([o.minWidh, ix]);
			iy = _.max([o.minHeight, iy]);
			
			o.width = ix;
			o.height = iy;

			this.invalidate();
		},

		invalidate: function() {
			measureElements.call(this);
			this._super();
		}

	});

	core.Core.inject({
		panel: function(options) {
			return this.addItem(new Panel(options));
		}
	});

	module.exports = Panel;

});