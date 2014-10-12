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

        // background
        // -------------------------------------------------------------------------------------------------------------

        function geneerateBackground() {
            var t = new Trianglify();
            var pattern = t.generate(document.body.clientWidth, document.body.clientHeight);
            document.body.setAttribute('style', 'background-image: ' + pattern.dataUrl);
        }

        // desktop
        // -------------------------------------------------------------------------------------------------------------

    	var desktop = jtop.init('jtop', {
    		scrollView: { initY: 0 }
    	});


        // persistent elements
        // -------------------------------------------------------------------------------------------------------------

		var cMenuProject = jtop.popupmenu()
		.addMenuElement('open project', null, function(sender) {}, 'edit-item')
		.addMenuSeparator()
		.addMenuElement('preview project', null, function(sender) {}, 'preview-project')
		.addMenuElement('remove', null, function(sender) {
			if(sender.parent.type === 'PANEL' && _.keys(sender.parent.items).length == 1) {
				sender.parent.remove();
			}	
			sender.remove();
		}, 'remove');

		var iconTooltip = desktop.tooltip({
			offsetLeft: 30,
			offsetTop: -120
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
			values.field = 'jtop-project';
		});

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
            var newPanel = desktop.panel({
                title: itemBelow.settings.title,
                width: settings.desktop.gridSize * 2,
                height: settings.desktop.gridSize,
                minWidh: settings.desktop.gridSize,
                minHeight: settings.desktop.gridSize,
                gridW: settings.desktop.gridSize,
                gridH: settings.desktop.gridSize
            }).pos(itemBelow.transform.x, itemBelow.transform.y + 25);

            desktop.grid.removeValue(itemBelow.settings.gridX, itemBelow.settings.gridY, itemBelow);
            desktop.grid.removeValue(item.settings.gridX, item.settings.gridY, item);

            newPanel.addItem(item, 1, 0, true);
            newPanel.addItem(itemBelow, 0, 0, true);

            panels.push(newPanel);

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

        // icons and panels
        // -------------------------------------------------------------------------------------------------------------

        var icons = [];
        var panels = [];

        function destroyElements() {

            for(var i = 0, l = panels.length; i < l; i++) {
                desktop.removeItem(panels[i]);
            }

            panels.length = 0;

            for(var i = 0, l = icons.length; i < l; i++) {
                desktop.removeItem(icons[i]);
            }

            icons.length = 0;
        }

        function createElements() {

            var folderIcons = 3;

            for(var i = 0; i < folderIcons; i++) {

                icons[i] = desktop.icon({
                    title: settings.desktop.iconTitle,
                    image: 'test/images/717.png',
                    gridX: 2,
                    gridY: i + 1,
                    offsetTop: settings.desktop.iconOffsetTop,
                    maxWidth: settings.desktop.gridSize,
                    maxHeight: settings.desktop.gridSize,
                    width: settings.desktop.iconSize,
                    height: settings.desktop.iconSize,
                    fontSize: settings.desktop.iconFontSize,
                    textOffsetTop: settings.desktop.iconFontOffsetTop

                }).menu(cMenuProject).tooltip(iconTooltip);

            }

        }

        // demo settings
        // -------------------------------------------------------------------------------------------------------------

        var settings = {

            background: {
                generate: function() {
                    geneerateBackground();
                }
            },

            desktop: {
                iconTitle: 'Icon element',
                iconSize: 48,
                iconOffsetTop: 12,
                iconFontSize: 11,
                iconFontOffsetTop: 2,
                gridSize: 100
            }
        };

        function onItemsChange(value) {

            desktop._settings.gridH = settings.desktop.gridSize;
            desktop._settings.gridW = settings.desktop.gridSize;

            destroyElements();
            createElements();
        }

        var gui = new dat.GUI({ width: 300 });
        gui.background = gui.addFolder('Background');
        gui.background.add(settings.background, 'generate');

        gui.desktop = gui.addFolder('Desktop');
        gui.desktop.add(settings.desktop, 'iconTitle').onFinishChange(onItemsChange);
        gui.desktop.add(settings.desktop, 'iconSize', 38, 96).onFinishChange(onItemsChange);
        gui.desktop.add(settings.desktop, 'iconFontSize', 9, 18).onFinishChange(onItemsChange);
        gui.desktop.add(settings.desktop, 'iconOffsetTop', 12, 50).onFinishChange(onItemsChange);
        gui.desktop.add(settings.desktop, 'iconFontOffsetTop', 0, 20).onFinishChange(onItemsChange);
        gui.desktop.add(settings.desktop, 'gridSize', 100, 300).step(50).onFinishChange(onItemsChange);
        gui.desktop.open();


        // boot
        // -------------------------------------------------------------------------------------------------------------
        geneerateBackground();
        createElements();

        humane.log('<b>hint:</b> Drop the icon on another one to create panel.', {
            timeout: 3000,
            clickToClose: true
        });

  	});

});