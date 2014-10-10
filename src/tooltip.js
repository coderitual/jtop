define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Class = require('./class'),
		Signal = require('./lib/signals'),
		core = require('./core'),
		Icon = require('./item.icon'),
		Template = require('./template'),
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
    	return { x: x + bbox.left, y: y + bbox.top};
	};

	var Tooltip = Class.extend({

		_tooltips: [],

		init: function(options, desktop) {

			if(!(desktop instanceof core.Core)) return;

			var o = this.settings = _.extend({
				marginTop: 20,
				marginBottom: 20,
				offsetLeft: 0,
				offsetTop: 0,
				showDelay: 0,
				hideDelay: 0,
				fadeInSpeed: 200,
				fadeOutSpeed: 0,
				toOpacity: 1,
				className: 'jt-tooltip'
			}, options),

			self = this,
			body = document.getElementsByTagName('body')[0],
			tooltip = document.createElement('div');

			addClass(tooltip, o.className);
			body.appendChild(tooltip);

			this.active = false;
			this._style = { opacity: 0 };
			this._template = null;
			this.on = {
				show: new Signal()
			};

			document.addEventListener('mousemove', _.bind(function(e) {
				e.preventDefault();
				if(this.active) {
					var loc = windowToElement(desktop.parent, e.clientX, e.clientY);
					this.pos(e.clientX, e.clientY);
				}
			}, this));

			document.addEventListener('mousedown', _.bind(function(e) {
				if(this.active) {
					this.hide();
				}
			}, this));

			this._tweenOpacity = new TWEEN.Tween(this._style)
			.onUpdate(function() {
     			tooltip.style.opacity = this.opacity;
     		})
     		.onComplete(function() {
     			if(!self.active) tooltip.style.display = 'none';
     			self._style.opacity = parseFloat(tooltip.style.opacity);
     		});

			this._tooltips.push(this);
			this._getTooltipHtml = function() {
				return tooltip;
			}
		},
		
		addTemplate: function(templ) {	
			if(_.isString(templ)) {
				this._template = Template(templ); 
			}

			return this;
		},

		show: function(sender, x, y) {
			var tooltip = this._getTooltipHtml(),
				self = this,
				o = this.settings,
				values = {};

			this.active = true;
			this.on.show.dispatch(sender, values);
			tooltip.innerHTML = this._template(values);

			if(tooltip.style.display == 'none') tooltip.style.display = 'block';
			this.pos(x, y);
			
			this._tweenOpacity
			.stop()
     		.to({'opacity': o.toOpacity}, o.fadeInSpeed)
     		.delay(o.showDelay)
     		.start();

			return this;
		},

		pos: function(x, y) {
			var tooltip = this._getTooltipHtml(),
				o = this.settings,
				self = this,
				posX = x + o.offsetLeft, 
				posY = y + o.offsetTop;

			_.extend(tooltip.style, {
				top: posY + 'px',
				left: posX + 'px'
			});

			var bbox = tooltip.getBoundingClientRect(),
				dy = 0,
				dx = 0;

			if(bbox.top - o.marginTop < 0) {
				dy = -(bbox.top - o.marginTop);
			} else if (bbox.bottom + o.marginBottom > window.innerHeight) {
				dy = -Math.abs(bbox.bottom + o.marginBottom - window.innerHeight);
			}

			if(bbox.left < 0) {
				dx = -bbox.left; 
			} else if (bbox.right > window.innerWidth) {
				dx = -bbox.width - 2 * o.offsetLeft;
			}

			_.extend(tooltip.style, {
				top: posY + dy + 'px',
				left: posX + dx + 'px'
			});
		},

		/**
		 * Hides tooltip
		 * @return {tooltip}
		 */
		hide: function() {
			var tooltip = this._getTooltipHtml(),
				o = this.settings,
				that = this;

			this.active = false;

			this._tweenOpacity
			.stop()
     		.to({'opacity': 0}, o.fadeOutSpeed)
     		.delay(o.hideDelay)
     		.start();
		
     		return this;
		}
	});

	// Icon inject
	Icon.inject({
		tooltip: function(tooltip) {
			if(!(tooltip instanceof Tooltip)) return;

			this._tooltip = tooltip;

			this.node.addEventListener('mouseover', _.bind(function(e) {
				e.preventDefault();
				if(!this.manager._drag.dragging) {
					var loc = windowToElement(this.manager.parent, e.clientX, e.clientY);
					this._tooltip.show(this, e.clientX, e.clientY);
				}

			}, this));

			this.node.addEventListener('mouseout', _.bind(function(e) {
				e.preventDefault();
				this._tooltip.hide();
			}, this));

			return this;
		}
	});

	// Core inject
	core.Core.inject({
		tooltip: function(options) {
			return new Tooltip(options, this);
		}
	});

	module.exports = Tooltip;
});