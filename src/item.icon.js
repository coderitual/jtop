define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Signal = require('./lib/signals'),
		core = require('./core'), 
		Item = require('./item'),
		Text = require('./text'),
		Drag = require('./drag'),
		TWEEN = require('./tween'); 

	var XLINK = 'http://www.w3.org/1999/xlink',
		_type = 'ICON';
	
	var settings = {
		fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Helvetica, Arial, Verdana',
		fontSize: 11,
		mouseOverSpeed: 100,
		mouseOutSpeed: 100,
		mouseOverRotation: 10,
		mouseOutRotation: 0,
		titleMargin: 5,
		titleMaxLines: 2
	};

	function measureElements() {
		var node = this.node,
			icon = this.elements.icon,
			title = this.elements.title,
			handle = this.elements.handle,
			titleTop = this.elements._titleTop,
			titleShadow = this.elements._titleShadow,
			o = this.settings;

		icon.setAttribute('x', (o.maxWidth - o.width) / 2);
		icon.setAttribute('y', o.offsetTop);

		var iconBBox = icon.getBBox();
		icon.cx = o.maxWidth / 2;
		icon.cy = o.offsetTop + o.height / 2;

		title.setAttribute('transform', 'translate(' + (o.maxWidth / 2 - 1) + ', ' + (iconBBox.height + iconBBox.y + o.fontSize + o.textOffsetTop) + ')');
		
		Text.addTextFlow(o.title, titleTop, o.maxWidth - o.titleMargin * 2, 0, o.fontSize, false, o.titleMaxLines, true);
		Text.addTextFlow(o.title, titleShadow, o.maxWidth - o.titleMargin * 2, 0, o.fontSize, false, o.titleMaxLines, true);

		var bbox = node.getBBox();
		core.svgSetXYWH(handle, 0, 0, o.maxWidth, bbox.height);
	};

	function onMouseOver() {
		var icon = this.elements.icon;
		this.tweens.hover.stop().to({ r: settings.mouseOverRotation }, settings.mouseOverSpeed).start();
		
		if(!this.drag.dragging) {
			this.manager.node.style.cursor = 'pointer';
		}
			
	};

	function onMouseOut() {
		var icon = this.elements.icon;
		this.tweens.hover.stop().to({ r: settings.mouseOutRotation }, settings.mouseOutSpeed).start();
		
		if(!this.drag.dragging) {
			this.manager.node.style.cursor = 'default';
		}		
	};

	function onClickEvent(e) {
		this.on.click.dispatch(this, e);
	};

	var Icon = Item.extend({

		init: function(options) {
			this._super(options);
			
			var o = this.settings = _.extend({
				image: '',
				title: '',
				width: 38,
				height: 38,
				maxWidth: 100,
				maxHeight: 80,
				offsetTop: 12,
				textOffsetTop: 2,
				fontFamily: settings['fontFamily'],
				fontSize: settings['fontSize'],
				titleMargin: settings['titleMargin'],
				titleMaxLines: settings['titleMaxLines']
			}, options);

			this.type = _type;
			
			_.extend(this.on, {
				click: new Signal()
			});

			var g = core.createSVGElement('g'),
				icon = core.createSVGElement('image'),
				title = core.createSVGElement('g'),
				handle = core.createSVGElement('rect'),
				titleTop = core.createSVGElement('text'),
				titleShadow = core.createSVGElement('text');

			icon.setAttributeNS(XLINK, "xlink:href", o.image);
			icon.setAttribute('width', o.width);
			icon.setAttribute('height', o.height);
			
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

			handle.setAttribute('fill', '#FFF');
			handle.setAttribute('opacity', '0.0');
			handle.setAttribute('rx', '5');
			handle.setAttribute('ry', '5');

			g.appendChild(icon);
			g.appendChild(title);
			g.appendChild(handle);
			
			g.addEventListener('mouseover', _.bind(onMouseOver, this));
			g.addEventListener('mouseout', _.bind(onMouseOut, this));
			g.addEventListener('click', _.bind(onClickEvent, this));

			this.node = g;
			this.elements = {
				icon: icon,
				title: title,
				handle: handle,
				_titleTop: titleTop,
				_titleShadow: titleShadow
			};

			Drag.asDragElement.call(this);
		},

		title: function(val) {
			if(_.isString(val)) {
				this.settings.title = val;
				this.invalidate();
			}

			return this;
		},

		image: function(val) {
			if(_.isString(val)) {
				this.settings.image = val;
				this.elements.icon.setAttributeNS(XLINK, "xlink:href", val);
			}

			return this;
		},

		onAdd: function(desk) {
			this.invalidate();

			// hover effect
			var icon = this.elements.icon;
			this.tweens.hover = new TWEEN.Tween({ r: 0 })
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(function() {
                icon.rotate = this.r;
                icon.setAttribute('transform', 'rotate(' + icon.rotate + ', ' + icon.cx + ',' + icon.cy + ')');
            });

            this._super();
		},

		invalidate: function() {
			measureElements.call(this);
			this._super();
		},

		dragStart: function() {
			this.node.style.opacity = 0.8;
		},
		dragEnd: function() {
			this.node.style.opacity = 1;
		}
	});

	core.Core.inject({
		icon: function(options) {
			return this.addItem(new Icon(options), options.gridX, options.gridY);
		}
	});

	module.exports = Icon;
});