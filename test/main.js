require.config({
	baseUrl: './src',
    paths: {
        'lib': '../lib',
        'domReady': '../lib/domReady'
    },

    shim: {
    	'lib/underscore': { exports: "_"}
    }
			
});

require(['domReady', 'jtop'], function(domReady, jtop) {

	domReady(function() {
    	var desktop = jtop.init('jtop', {
    		scrollView: {
    			initY: 25
    		}
    	});

		var cMenuProject = jtop.popupmenu()
		.addMenuElement('open project', null, function(sender) {
			alert('open project ' + sender.title);
		}, 'edit-item')
		.addMenuSeparator()
		.addMenuElement('preview project', null, function(sender) {
			alert('open project ' + sender.title);
		}, 'preview-project') 
		.addMenuElement('remove', null, function(sender) {
			if(sender.parent.type === 'PANEL' && _.keys(sender.parent.items).length == 1) {
				sender.parent.remove();
			}	
			sender.remove();
		}, 'remove');

		var iconTooltip = desktop.tooltip({
			offsetLeft: 30,
			offsetTop: -120,
		})
		.addTemplate('<%if(image) {%><img class="image" src="<%=image%>"/><%}%>' +
					 '<div class="title"><%=title%></div>' +
					 '<div class="description"><%=description%></div>' + 
					 '<div class="field"><%=field%></div>')
		.addTemplate(' ');

		iconTooltip.on.show.add(function(sender, values) {
			values.title = sender.settings.title;
			values.image = 'http://ns3002439.ovh.net/thumbs/rozne/thumb-2274542.jpg';
			values.description = sender.settings.title; 
			values.field = 'Jtop project';
		});

		var icons = [];

		icons[0] = desktop.icon({title: 'Some very long text applied to this icon can be seen here it is good i hope', image: 'test/images/db.png', gridX: 1, gridY: 1})
		.menu(cMenuProject).
		tooltip(iconTooltip);;

		icons[1] = desktop.icon({title: 'Secon element. Shorten text applied.', image: 'test/images/box.png', gridX: 2, gridY: 1})
		.menu(cMenuProject)
		.tooltip(iconTooltip);

		icons[2] = desktop.icon({title: 'Short named element', image: 'test/images/bird.png', gridX: 3, gridY: 1})
		.menu(cMenuProject)
		.tooltip(iconTooltip);

		icons[3] = desktop.icon({title: 'Different element', image: 'test/images/box.png', gridX: 2, gridY: 2})
		.menu(cMenuProject)
		.tooltip(iconTooltip);

		icons[4] = desktop.icon({title: 'Test project, some very long text.', image: 'test/images/db.png', gridX: 1, gridY: 2})
		.menu(cMenuProject)
		.tooltip(iconTooltip);

		icons[5] = desktop.icon({title: 'Secon element. Shorten text applied.', image: 'test/images/box.png', gridX: 3, gridY: 3})
		.menu(cMenuProject)
		.tooltip(iconTooltip);

		icons[6] = desktop.icon({title: 'Short named element', image: 'test/images/bird.png', gridX: 3, gridY: 2})
		.menu(cMenuProject)
		.tooltip(iconTooltip);

		icons[7] = desktop.icon({title: 'Different element', image: 'test/images/box.png', gridX: 2, gridY: 3})
		.menu(cMenuProject)
		.tooltip(iconTooltip);

		

		var p = desktop.panel({title: 'Some very long text with this custom panel item'}).pos(500, 100);
		var r = desktop.panel({title: 'Different panel', width: 200, height: 160}).pos(800, 100);

		p.addItem(icons[7], 0,0, true);

		// automated create panels functionality
		var panelTooltip = desktop.tooltip({
			className: 'jt-tooltip-info',
			offsetLeft: 0,
			offsetTop: 0,
			toOpacity: 1
		})
		.addTemplate('<div class="image"></div><div class="title"><span class="name"><%=name%></span> <%=title%></div>');

		panelTooltip.on.show.add(function(sender, values) {
			values.name = '<span class="name">+ Create panel</span>';
			values.title = sender.settings.title;
		});

		desktop.on.dragOverItem.add(function(item, itemBelow, x, y) {
			panelTooltip.show(itemBelow, x, y);	
		});

		desktop.on.dragOutItem.add(function(item) {
			panelTooltip.hide();	
		});

		desktop.on.dropInItem.add(function(item, itemBelow) {
			panelTooltip.hide();
			var newPanel = desktop.panel({title: itemBelow.settings.title, width: 200, height: 80}).pos(itemBelow.transform.x, itemBelow.transform.y + 25);
			
			desktop.grid.removeValue(itemBelow.settings.gridX, itemBelow.settings.gridY, itemBelow);
			desktop.grid.removeValue(item.settings.gridX, item.settings.gridY, item);
			
			newPanel.addItem(item, 1, 0, true);
			newPanel.addItem(itemBelow, 0, 0, true);

			return true;	
		});

		// automated remove panels functionality
		var panelToRemove = null;
		desktop.on.dragStart.add(function(item, x, y) {
			if(item.parent.type === 'PANEL' && _.keys(item.parent.items).length == 0) {
				panelToRemove = item.parent;	
			} else {
				panelToRemove = null;
			}
		});

		desktop.on.dragEnd.add(function(item, x, y) {
			if(item.parent !== panelToRemove) {
				panelToRemove && panelToRemove.remove();	
			}
		});

  	});

});