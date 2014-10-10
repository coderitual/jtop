define(function(require, exports, module) {

	var _ = require('./lib/underscore'),
		Class = require('./class');

	var Grid = Class.extend({

		init: function() {
			this._grid = [];
		},

		setValue: function(x, y, val) {
			if (!this._grid[y]) this._grid[y] = [];
			if (!this._grid[y][x]) this._grid[y][x] = [];
			this._grid[y][x].push(val);
		},

		removeValue: function(x, y, val) {
			if (!this._grid[y] || !this._grid[y][x]) return null;
			this._grid[y][x].splice(this._grid[y][x].indexOf(val), 1);
		},

		getValue: function(x, y) {
			if (!this._grid[y] || !this._grid[y][x]) return null;
			// get top most value
			return this._grid[y][x][this._grid[y][x].length - 1] || null;
		},

		getValues: function(x, y) {
			if (!this._grid[y] || !this._grid[y][x]) return null;
			// get all values
			return this._grid[y][x] || null;
		},

		getRowCount: function() {

			var resultSet = [];

			_.each(this._grid, function(arr, idx) {
				if(_.any(arr, function(a) { return _.size(a) > 0})) {
					resultSet.push(idx + 1);
				} else {
					resultSet.push(0);
				}
			});

			return _.max(resultSet) || 0;
		},

		getColumnCount: function() {
			
			var resultSet = [];

			_.each(this._grid, function(arr) {
				_.each(arr, function(a, idx) {
					if(_.size(a) > 0) {
						resultSet.push(idx + 1);
					}
				});
			});

			return _.max(resultSet) || 0;
		}

	});

	module.exports = Grid;
});