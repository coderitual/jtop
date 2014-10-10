define([
		'require',
		'exports',
		'module',
		'./item.icon',
		'./item.panel',
		'./popupmenu',
		'./tooltip',
		'./scrollview'
	],

	function(
		require,
		exports,
		module
	) {

	var core = require('./core'),
		PopupMenu = require('./popupmenu');
	
	module.exports = {
		init: function(element, options) { return new core.Core(element, options); },
		popupmenu: function(options) { return new PopupMenu(options); }
	}
});