define(function(require, exports, module) {
	
	//jQuery offset implementation using getBoundingClientRect
	function offset(element) {

		var docElem, 
			win,
			box = { top: 0, left: 0 },
			elem = element,
			doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return;
		}

		docElem = doc.documentElement;

		// If we don't have gBCR, just use 0,0 rather than error
		// BlackBerry 5, iOS 3 (original iPhone)
		if ( typeof elem.getBoundingClientRect !== "undefined" ) {
			box = elem.getBoundingClientRect();
		}
		
		win = getWindow(doc);
		
		return {
			top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
			left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
		};
	};

	function getWindow( elem ) {
		return elem.nodeType === 9 ?
		   	   elem.defaultView || elem.parentWindow :false;
	}

	module.exports = offset;
});