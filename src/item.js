define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Signal = require('./lib/signals'),
		Class = require('./class'),
		TWEEN = require('./tween');

	var settings = {
		transformAnimDuration: 500,
		transformAnimTween: TWEEN.Easing.Elastic.Out
	};

	function buildTransform(t) {
		return ['translate(', t.x, ',', t.y, ') rotate(', t.r, ') scale(', t.s, ')'].join('');
	};

	function tweenTransformUpdate() {
        this.node.setAttribute('transform', buildTransform(this.transform));
	};

	var Item = Class.extend({

		id: null,
		type: null,
		node: null,
		parent: null,
		manager: null,

		init: function(options) {

			// transform matrix
			this.transform = {
				x: 0,
				y: 0,
				r: 0,
				s: 1
			};

			//events container
			this.on = {
				add: new Signal(),
				remove: new Signal()
			};

			if(options) {
				this.id = options.id || null;
			}
			
			this.elements = {};
			this.tweens = {};
			this.settings = {};
			this._bbox = { width: 0, height: 0 };
			
			// tween transforms
			this.tweens.transform = new TWEEN.Tween(this.transform)
            .easing(TWEEN.Easing.Elastic.Out)
            .onUpdate(_.bind(tweenTransformUpdate, this));
		},

		remove: function() {
			if(!(_.isNull(this.id) || _.isNull(this.node) || _.isNull(this.parent))) {
				this.onRemove(this);

				this.parent && this.parent.node.removeChild(this.node);
				delete this;
			}
		},

		pos: function(x, y) {
			this.tweens.transform.stop();
			this.transform.x = x;
			this.transform.y = y;
			this.node.setAttribute('transform', buildTransform(this.transform));
			return this;
		},

		posAnim: function(x, y, duration, easing) {
			this.tweens.transform.stop().to({
				x: x,
				y: y
			}, duration || settings.transformAnimDuration)
			.easing(easing || settings.transformAnimTween)
			.start();
			return this;
		},

		invalidate: function() {
			// defer calculations to next tick because of some borwsers (Opera)
			_.defer(function(sender) {
				var bbox = sender.node.getBoundingClientRect(); 
				sender._bbox.width = bbox.width;
				sender._bbox.height = bbox.height;
			}, this);
		},

		getBoundingBox: function() {
			return { 
				x: this.transform.x, 
				y: this.transform.y, 
				w: this._bbox.width, 
				h: this._bbox.height
			};
		},

		onAdd: function() {
			this.on.add.dispatch(this);
		},

		onRemove: function() {
			this.on.remove.dispatch(this);
		}
	});

	module.exports = Item;
});