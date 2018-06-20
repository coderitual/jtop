define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Signal = require('./lib/signals');

	var settings = {
		checkDragOverDelay: 16
	};

	function hasClass(element, cls) {
		var r = new RegExp('\\b' + cls + '\\b');
		return element.getAttribute ? r.test(element.getAttribute('class')) : false;
	}

	function windowToElement(el, x, y) {
		var bbox = el.getBoundingClientRect();
		return { x: x - bbox.left, y: y - bbox.top};
	};

	function getParentWithClass(el, name) {
		while (el && (!hasClass(el, name) || !el.id))
			el = el.parentNode;
		if (el) return el;
	};

	function itemAdded(item) {
		if(_.isUndefined(item.drag)) return;
		item.dragManager = this;
		item.drag.handle.addEventListener('mousedown', _.bind(mousedown, {manager: this, item: item}));
	};

	function dragOverElement() {
		var item = this._drag.item;
		if(_.isNull(item)) return;

		item.node.style.display = 'none';
		var below = document.elementFromPoint(this._drag.cx, this._drag.cy),
			dropElement = getParentWithClass(below, 'droppable'),
			dropItem = this.getDropableItem(dropElement ? dropElement.id : '');
		
		if(!_.isUndefined(dropItem)) {
			if(this._drag.dropItem != dropItem) {
				this._drag.dropItem && this._drag.dropItem.dragOut(item, this._drag.x, this._drag.y);	
			}
			this._drag.dropItem = dropItem;
			dropItem.dragOver(item, this._drag.x, this._drag.y);
		}
		
		item.node.style.display = '';
		this._drag.dragCheckTimer = null;
	};

	function dropOverElement(ex, ey) {
		var item = this._drag.item;
		if(_.isNull(item)) return;

		item.node.style.display = 'none';
		var below = document.elementFromPoint(this._drag.cx, this._drag.cy),
			dropElement = getParentWithClass(below, 'droppable'),
			dropItem = this.getDropableItem(dropElement.id);

		if(!_.isUndefined(dropItem)) {
			var available = dropItem.dropIn(item, ex, ey);
			if(!available) {
				this._drag.itemStartDrag.parent.dropIn(item, this._drag.itemStartDrag.x, this._drag.itemStartDrag.y, true);
			}
		}
		
		item.node.style.display = '';
	};

	function mousedown(e) {
		e.preventDefault();
		if(!this.item.drag.enabled || !_.isNull(this.manager._drag.item)) return;

		var loc = windowToElement(this.manager.parent, e.clientX, e.clientY);
		
		this.manager._drag.item = this.item;
		this.manager._drag.x = loc.x;
		this.manager._drag.y = loc.y;
	};

	function mousemove(e) {
		e.preventDefault();
		if(_.isNull(this._drag.item)) return;

		var item = this._drag.item,
			loc = windowToElement(this.parent, e.clientX, e.clientY);
		cx = e.clientX,
		cy = e.clientY;

		if(!this._drag.dragging && (Math.pow(this._drag.x - loc.x, 2) + Math.pow(this._drag.y - loc.y, 2) < Math.pow(item.drag.distance, 2))) return;
		if(!this._drag.dragging) {
			this._drag.dragging = true;

			// move item to top
			item.parent.node.removeChild(item.node);
			item.parent.node.appendChild(item.node);

			if(item.parent.drop) {
				this._drag.itemStartDrag.parent = item.parent;  // set start drag info: parent
				this._drag.itemStartDrag.x = loc.x,		// start x location
				this._drag.itemStartDrag.y = loc.y;		// start y location

				item.parent.dropOut(item, loc.x, loc.y);  // inform droppable parent about dragging action of its child
			}

			this._drag.cursor = this.node.style.cursor; 
			this.node.style.cursor = 'move';
			this.dragStart(item, loc.x, loc.y);
			item.dragStart(loc.x, loc.y);
			item.drag.dragging = true;
		};

		var xd = loc.x - this._drag.x,
		yd = loc.y - this._drag.y,
		newposx = item.transform.x + xd,
		newposy = item.transform.y + yd;

		// drag boundaries
		if(item.drag.boundingBox) {
			var crect = item.getBoundingBox();

			if (crect.x + xd < 0) newposx = 0; 
			else if (crect.x + xd + crect.w > this.parent.offsetWidth) newposx = this.parent.offsetWidth - crect.w;

			if (crect.y + yd < 0) newposy -= (crect.y + yd); 
			else if (crect.y + yd + crect.h > this.parent.offsetHeight) newposy += this.parent.offsetHeight - (crect.y + yd + crect.h);
		}

		item.pos(newposx, newposy);

		this._drag.x = loc.x;
		this._drag.y = loc.y;
		this._drag.cx = cx;
		this._drag.cy = cy;   

		if(item.drag.checkDragOver && _.isNull(this._drag.dragCheckTimer)) {
			this._drag.dragCheckTimer = setTimeout(_.bind(dragOverElement, this), settings.checkDragOverDelay);	
		}

		this.drag(item, loc.x, loc.y);
		item.dragMove(loc.x, loc.y);
	};

	function mouseup(e) {
		e.preventDefault();
		if(_.isNull(this._drag.item)) return;

		if(this._drag.dragging) {

			var item = this._drag.item,
				loc = windowToElement(this.parent, e.clientX, e.clientY);
				xd = loc.x - this._drag.x,
			yd = loc.y - this._drag.y,
			newposx = item.transform.x + xd,
			newposy = item.transform.y + yd;

			item.pos(newposx, newposy);
			item.drag.dragging = false;
			
			// restore previous cursor
			this.node.style.cursor = this._drag.cursor;

			if(item.drag.checkDropOver)
				dropOverElement.call(this, loc.x, loc.y);

			this.dragEnd(item, loc.x, loc.y);
			item.dragEnd(loc.x, loc.y);
		}

		this._drag = {
			item: null,
			x: null,
			y: null,
			dragging: false,
			dragCheckTimer: null,
			itemStartDrag: {
				parent: null,
				x: 0,
				y: 0
			}
		};
	};

	module.exports = {
		asDragElement: function(options) {

			this.drag = _.extend({
				handle: this.node,
				distance: 5,
				enabled: true,
				dragging: false,
				checkDragOver: true,
				checkDropOver: true,
				boundingBox: true
			}, options || {});

			_.defaults(this, {
				dragStart: function(x, y) {},
				dragEnd: function(x, y) {},
				dragMove: function(x, y) {}
			});
		},

		asDropElement: function(options) {

			this.drop = _.extend({
				handle: this.node,
				enabled: true
			}, options || {});

			this.drop.handle.className.baseVal += ' droppable';

			_.defaults(this, {
				dragOver: function(item, x, y) {},
				dragOut: function(item, x, y) {},
				dropIn: function(item, x, y) {},
				dropOut: function(item, x, y) {}
			});
		},

		asDragManager: function(handler) {

			this.on.addItem.add(_.bind(itemAdded, this));

			_.defaults(this, {
				_drag: { 
					item: null,
					x: null,
					y: null,
					dragging: false,
					dragCheckTimer: null,
					dropItem: null,
					cursor: 'default',
					itemStartDrag: {
						parent: null,
						x: 0,
						y: 0
					}
				},

				dragStart: function(item, x, y) {},
				dragEnd: function(item, x, y) {},
				drag: function(item, x, y) {},
				getDropableItem: function() {},
				registerDragItem: function(item) { itemAdded.call(this, item); }
			});

			handler.addEventListener('mousemove', _.bind(mousemove, this));
			handler.addEventListener('mouseup', _.bind(mouseup, this));
		}
	}
});
