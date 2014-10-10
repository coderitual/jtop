define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Signal = require('./lib/signals'),
		Class = require('./class'),
		core = require('./core'),
		TWEEN = require('./tween');

	var settings = {
		activationArea: 40,    
		transformAnimDuration: 500,
		transformAnimTween: TWEEN.Easing.Back.Out
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

	function windowToElement(el, x, y) {
    	var bbox = el.getBoundingClientRect();
    	return { x: x - bbox.left, y: y - bbox.top};
	};

	function onWindowResize(e) {

		var self = this,
			bbox = this.layer.getBoundingClientRect();
			this.viewportWidth = window.innerWidth;
      		this.viewportHeight = window.innerHeight;
      		this.maxOffsetX = _.max([bbox.right - this.viewportWidth, 0]);
			this.maxOffsetY = _.max([bbox.bottom - this.viewportHeight, 0]);


		if(this.maxOffsetX > 0) {
			this.elements.htmlArrowLeft.style.display = 'none';
			this.elements.htmlArrowRight.style.display = 'block';
		} else {
			this.elements.htmlArrowLeft.style.display = 'none';
			this.elements.htmlArrowRight.style.display = 'none';
		}

		if(this.maxOffsetY > 0) {
			this.elements.htmlArrowUp.style.display = 'none';
			this.elements.htmlArrowDown.style.display = 'block';
		} else {
			this.elements.htmlArrowUp.style.display = 'none';
			this.elements.htmlArrowDown.style.display = 'none';
		}

		_.extend(this.elements.htmlArrowUp.style, {
			top:  settings.activationArea / 2 + this.initY + 'px',
			left: (self.viewportWidth / 2 - 15) + 'px',
		});

		_.extend(this.elements.htmlArrowDown.style, {
			bottom: settings.activationArea / 2 + 'px',
			left: (self.viewportWidth / 2 - 15) + 'px',
		});

		_.extend(this.elements.htmlArrowLeft.style, {
			left: settings.activationArea + 'px',
			top: (this.viewportHeight / 2 - 15) + 'px',
		});

		_.extend(this.elements.htmlArrowRight.style, {
			left: this.viewportWidth - settings.activationArea + 'px',
			top: (this.viewportHeight / 2 - 15) + 'px',
		});

		this.on.resize.dispatch(this);
	};

	function onMouseMove(e) {

		if(!this.enabled) return;
		var self = this;

		this.arrowsOpacityAnim(0.5);

		clearTimeout(this.hideTimeout);
		this.hideTimeout = setTimeout(function() {
			self.arrowsOpacityAnim(0);
		}, 1000);

		if(this.maxOffsetX > 0) {
			if(e.clientX >= 0 && e.clientX <= settings.activationArea + this.initY) {
				this.on.scroll.dispatch(this, this.SCROLL_DIRECTION.LEFT);
				this.posAnim(this.initX, this.transform.y, this.SCROLL_DIRECTION.LEFT);					// left
				this.elements.htmlArrowLeft.style.display = 'none';
				this.elements.htmlArrowRight.style.display = 'block';
			} else if(e.clientX > (this.viewportWidth - settings.activationArea) && e.clientX <= this.viewportWidth) {
				this.on.scroll.dispatch(this, this.SCROLL_DIRECTION.RIGHT);
				this.posAnim(this.initX - this.maxOffsetX, this.transform.y, this.SCROLL_DIRECTION.RIGHT);	// right
				this.elements.htmlArrowLeft.style.display = 'block';
				this.elements.htmlArrowRight.style.display = 'none';
			}
		}

		if(this.maxOffsetY > 0) {
			if(e.clientY >= 0 && e.clientY <= settings.activationArea + this.initY) {
				this.on.scroll.dispatch(this, this.SCROLL_DIRECTION.TOP);
				this.posAnim(this.transform.x, this.initY, this.SCROLL_DIRECTION.TOP); 					// top
				this.elements.htmlArrowUp.style.display = 'none';
				this.elements.htmlArrowDown.style.display = 'block';
			} else if(e.clientY > (this.viewportHeight - settings.activationArea) && e.clientY <= this.viewportHeight) {
				this.on.scroll.dispatch(this, this.SCROLL_DIRECTION.BOTTOM);
				this.posAnim(this.transform.x, this.initY - this.maxOffsetY, this.SCROLL_DIRECTION.BOTTOM);	// bottom
				this.elements.htmlArrowUp.style.display = 'block';
				this.elements.htmlArrowDown.style.display = 'none';
			}
		}
	};

	var ScrollView = Class.extend({

		SCROLL_DIRECTION: {
			TOP: 1,
			LEFT: 2,
			BOTTOM: 3,
			RIGHT: 4,
		},
		
		init: function(desktop) {

			var self = this;

			this.settings = _.defaults(desktop._settings.scrollView || {}, {
				initX: 0,
				initY: 0
			});

			this.desktop = desktop;
			this.layer = desktop.parent;
			this.layers = [];
			this.enabled = true;

			window.addEventListener('resize', _.bind(onWindowResize, this));
			window.addEventListener('mousemove', _.bind(onMouseMove, this));
			
			var bbox = this.layer.getBoundingClientRect();
			this.viewportWidth = window.innerWidth;
      		this.viewportHeight = window.innerHeight;
      		this.maxOffsetX = bbox.right - this.viewportWidth;
			this.maxOffsetY = bbox.bottom - this.viewportHeight;
			this.initX = this.settings.initX;
			this.initY = this.settings.initY; 

			this.transform = {
				x: this.maxOffsetX > 0 ? bbox.left : self.initX,
				y: this.maxOffsetY > 0 ? bbox.top : self.initY
			};

			this.on = {
				scroll: new Signal,
				resize: new Signal
			};

			this.tweens = {};
			this.posAnimState = false;

			this.tweens.pos = new TWEEN.Tween(this.transform)
            .easing(TWEEN.Easing.Elastic.Out)
            .onComplete(function() {
            	self.posAnimState = false;
            })
            .onUpdate(function() {
            	if(self.maxOffsetX > 0) self.layer.style.left = this.x + 'px';
				if(self.maxOffsetY > 0) self.layer.style.top = this.y + 'px';

				for (var i = self.layers.length - 1; i >= 0; i--) {
					if(self.maxOffsetX > 0) self.layers[i].style.left = this.x + 'px';
					if(self.maxOffsetY > 0) self.layers[i].style.top = this.y + 'px';
				};
            });

            // arrows indicators
            this.elements = {
				htmlArrowUp: document.createElement('div'),
				htmlArrowDown: document.createElement('div'),
				htmlArrowLeft: document.createElement('div'),
				htmlArrowRight: document.createElement('div')
			}

			_.extend(this.elements.htmlArrowUp.style, {
				position: 'fixed',
				top:  settings.activationArea / 2 + this.initY + 'px',
				left: (this.viewportWidth / 2 - 15) + 'px',
				'border-color': 'transparent transparent #FFF transparent',
				'opacity': 0
			});

			_.extend(this.elements.htmlArrowDown.style, {
				position: 'fixed',
				bottom: settings.activationArea / 2 + 'px',
				left: (this.viewportWidth / 2 - 15) + 'px',
				'border-color': '#FFF transparent transparent transparent',
				'opacity': 0
			});

			_.extend(this.elements.htmlArrowLeft.style, {
				position: 'fixed',
				left: settings.activationArea + 'px',
				top: (this.viewportHeight / 2 - 15) + 'px',
				'border-color': 'transparent #FFF transparent transparent',
				'opacity': 0
			});

			_.extend(this.elements.htmlArrowRight.style, {
				position: 'fixed',
				left: this.viewportWidth - settings.activationArea + 'px',
				top: (this.viewportHeight / 2 - 15) + 'px',
				'border-color': 'transparent transparent transparent #FFF',
				'opacity': 0
			});

			addClass(this.elements.htmlArrowUp, 'jtop-popupmenu-arrow');
			addClass(this.elements.htmlArrowDown, 'jtop-popupmenu-arrow');
			addClass(this.elements.htmlArrowLeft, 'jtop-popupmenu-arrow');
			addClass(this.elements.htmlArrowRight, 'jtop-popupmenu-arrow');

			document.body.appendChild(this.elements.htmlArrowUp);
			document.body.appendChild(this.elements.htmlArrowDown);
			document.body.appendChild(this.elements.htmlArrowLeft);
			document.body.appendChild(this.elements.htmlArrowRight);

			this.arrows = {
				opacity: 0
			};

			this.arrowsShowing = false;
			this.arrowsHiding = false;
			this.hideTimeout = null;

			this.tweens.arrowOpacity = new TWEEN.Tween(this.arrows)
            .easing(TWEEN.Easing.Elastic.Out)
            .onComplete(function() {
            	self.arrowsShowing = false;
				self.arrowsHiding = false;
            })
            .onUpdate(function() {
            	self.elements.htmlArrowUp.style.opacity = this.opacity;
            	self.elements.htmlArrowDown.style.opacity = this.opacity;
            	self.elements.htmlArrowLeft.style.opacity = this.opacity;
            	self.elements.htmlArrowRight.style.opacity = this.opacity;
            });

            onWindowResize.call(this);
		},

		arrowsOpacityAnim: function(value, duration, easing) {

			if(this.arrowsHiding && value === 0) return;
			if(this.arrowsShowing && value > 0) return;

			if(value > 0) {
				this.arrowsHiding = false;
				this.arrowsShowing = true;
			} else {
				this.arrowsHiding = true;
				this.arrowsShowing = false;
			}

			this.tweens.arrowOpacity.stop().to({
				opacity: value,
			}, duration || settings.transformAnimDuration)
			.easing(easing || settings.transformAnimTween)
			.start();

			return this;
		},

		posAnim: function(x, y, state, duration, easing) {

			if(this.posAnimState === state) return;
			this.posAnimState = state;

			this.tweens.pos.stop().to({
				x: x,
				y: y
			}, duration || settings.transformAnimDuration)
			.easing(easing || settings.transformAnimTween)
			.start();
			return this;
		},

		addLayer: function(id, initX, initY) {

			var layer = document.getElementById(id);
			if(!layer) return;

			var bbox = layer.getBoundingClientRect();
			layer.initX = initX || 0;
			layer.initY = initY || 0;

			this.layers.push(layer);
			onWindowResize.call(this);

			return layer;
		}

	});

	core.Core.inject({
		init: function(element, options) {
			this._super(element, options);
			this.scrollView = new ScrollView(this);
		}
	});

});