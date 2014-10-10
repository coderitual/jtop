define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Class = require('./class'),
		Signal = require('./lib/signals'),
		core = require('./core'), 
		Item = require('./item'),
		Icon = require('./item.icon'),
		TWEEN = require('./tween');

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

	function windowToElement(el, x, y) {
    	var bbox = el.getBoundingClientRect();
    	return { x: x - bbox.left, y: y - bbox.top};
	};

	// Popup menu definition
	var PopupMenu = Class.extend({

		_sender: null,
		_menus: [],

		init: function(options) {

			var o = this.settings = _.extend({
				width: 130,
				defaultSide: 'down',
				showArrow: true,
				offsetTop: 70,
				offsetBottom: 20, 
				iconWidth: 16,
				iconHeight: 16,
				elements: {},
				delay: 0
			}, options),

			body = document.getElementsByTagName('body')[0],
			htmlMenuList = document.createElement('ul'),
			htmlMenuElement = document.createElement('li'),
			htmlMenuDiv = document.createElement('div'),
			htmlMenuImg = document.createElement('div'),
			htmlMenuTitle = document.createElement('a'),
			
			htmlArrow = document.createElement('div'),
			htmlArrowBorder = document.createElement('div');

			htmlMenuDiv.appendChild(htmlMenuImg);
			htmlMenuDiv.appendChild(htmlMenuTitle);
			htmlMenuElement.appendChild(htmlMenuDiv);
			
			htmlMenuList.appendChild(htmlArrowBorder);
			htmlMenuList.appendChild(htmlArrow);
			
			body.appendChild(htmlMenuList);

			addClass(htmlMenuList, 'jtop-popupmenu');
			addClass(htmlArrow, 'jtop-popupmenu-arrow');
			addClass(htmlArrowBorder, 'jtop-popupmenu-arrow-border');
			addClass(htmlMenuImg, 'img');

			this._style = { opacity: 0 },
			this._tweenOpacity = new TWEEN.Tween(this._style)
			.onUpdate(function() {
     			htmlMenuList.style.opacity = this.opacity;
     		})
     		.onComplete(function() {
     			if(this.opacity <= 0) htmlMenuList.style.display = 'none';
     		});

			this._menus.push(this);

			this._getElementTemplate = function() {
				return htmlMenuElement.cloneNode(true);
			}

			this._getMenuHtml = function() {
				return htmlMenuList;
			}

			this._getArrow = function() {
				return htmlArrow;
			}

			this._getArrowBorder = function() {
				return htmlArrowBorder;
			}

			this._createSeparator = function() {
				return document.createElement('hr');
			}

			// Hide popupmenus except mouse actions
			document.addEventListener('mousedown', _.bind(function(e) {
				this.hide();
			}, this));

			htmlMenuList.addEventListener('mousedown', _.bind(function(e) {
				e.stopPropagation();
				e.preventDefault();
			}, this));

			htmlMenuList.addEventListener('click', _.bind(function(e) {
				e.stopPropagation();
				e.preventDefault();
				this.hide();
			}, this));
		},

		/**
		 * Adds element position to menu
		 * @param {string} title Title of element (it will be shown in the menu position).
		 * @param {string} icon Path to the element icon (optional).
		 * @param {function} handler Handler function for element click event..
		 */
		addMenuElement: function(title, icon, handler, className) {
			var menu = this._getMenuHtml(),
				el = this._getElementTemplate(),
				div = el.getElementsByTagName('div')[0],
				text = div.getElementsByTagName('a')[0],
				img = div.getElementsByClassName('img')[0];

			var self = this;
			
			text.href = '#';
			text.innerHTML = title;

			if(_.isFunction(handler)) {
				el.addEventListener('click', function(e) {
					e.preventDefault();
					handler.call(self, self._sender);
					return false;
				});
			}

			if(_.isString(icon)) {
				img.style.backgroundImage = 'url(' + icon + ')';
			}

			if(className && className.length > 0) {
				addClass(el, className);
			}

			menu.appendChild(el);
			return this;
		},

		/**
		 * Adds separator element to menu
		 */
		addMenuSeparator: function() {
			var menu = this._getMenuHtml(),
				sep = this._createSeparator();

			menu.appendChild(sep);
			return this;
		},

		show: function(sender, x, y) {
			var menu = this._getMenuHtml(),
				that = this,
				arrow = this._getArrow(),
				arrowBorder = this._getArrowBorder(),
				o = this.settings,
				posX, 
				posY, 
				arrowX, 
				arrowY,
				canUpPos;

			this._sender = sender;
			
			// Display first to calculate bbox
			_.extend(menu.style, {
				display: 'block',
				opacity: '0',
				top: y + 'px',
				left: x + 'px'
			});

			// Calculate menu position
			var width = menu.offsetWidth,
				height = menu.offsetHeight;
			
			posX = x - width / 2;
		
			if(posX - window.pageXOffset < 0) {
				posX += (window.pageXOffset - posX) + 10;
			} else if ((window.pageXOffset + window.innerWidth) - (posX + width) < 0) {
				posX -= (posX + width) - (window.pageXOffset + window.innerWidth) + 25;
			}

			arrowX = x - posX - 7;

			canUpPos = (((o.defaultSide === 'up') && (y - height - o.offsetBottom - window.pageYOffset) > 0) 
					|| ((o.defaultSide === 'down') && (window.pageYOffset + window.innerHeight) - (y + height + o.offsetTop) < 0) )

			menu.style.left = posX + 'px';
			menu.style.top = canUpPos
							 ? y - height - o.offsetBottom + 'px' 
							 : y + o.offsetTop + 'px';

			// calculate arrow position
			if(canUpPos) {	// above
				
				removeClass(arrow, 'jtop-arrowdown');
				addClass(arrow, 'jtop-arrowup');
				
				_.extend(arrow.style, {
					'left': arrowX + 'px',
				});

				removeClass(arrowBorder, 'jtop-arrowdown-border');
				addClass(arrowBorder, 'jtop-arrowup-border');

				_.extend(arrowBorder.style, {
					'left': arrowX + 'px',
				});
			} else {															// below
				
				removeClass(arrow, 'jtop-arrowup');
				addClass(arrow, 'jtop-arrowdown');

				_.extend(arrow.style, {
					'left': arrowX + 'px',
				});

				removeClass(arrowBorder, 'jtop-arrowup-border');
				addClass(arrowBorder, 'jtop-arrowdown-border');

				_.extend(arrowBorder.style, {
					'left': arrowX + 'px',
				});
			}

			// hide all other menus
			for(var i = 0, len = this._menus.length; i < len; i++) if(this._menus[i] !== this) {
				this._menus[i].hide();
			}

			// Tween menu show
    		this._tweenOpacity.stop().to({'opacity': '1'}, 100).delay(o.delay).start();
			
			return this;
		},

		hide: function() {
			var menu = this._getMenuHtml(),
				that = this;	
				
			if(menu.style.opacity <= 0)
				return this;		

     		this._tweenOpacity.stop().to({'opacity': '0'}, 100).start();

     		return this;
		}
	});

	// Icon inject
	Icon.inject({
		menu: function(popupmenu) {
			if(!(popupmenu instanceof PopupMenu)) return;

			this.menu = {
				menu: popupmenu,
				click: false
			};

			this.node.addEventListener('mousedown', _.bind(function(e) {
				this.menu.click = true;	
			}, this));

			this.node.addEventListener('mouseup', _.bind(function(e) {
				e.preventDefault();
				if(!this.drag.dragging && this.menu.click) {
				
					this.menu.click = false;
					var bbox = this.elements.icon.getBoundingClientRect(),
						loc = windowToElement(this.manager.parent, bbox.left, bbox.bottom);
					popupmenu.show(this, bbox.left + bbox.width / 2, bbox.top);
				}

			}, this));

			return this;
		}
	});

	// Module export
	module.exports = PopupMenu;
});