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

        var t = new Trianglify();

        function geneerateBackground() {
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
		.addMenuElement('panel resize info...', null, function(sender) {

            humane.log('<b>hint:</b> Drag bottom-right of panel until the desired size is achieved.', {
                timeout: 3000,
                clickToClose: true
            });

        }, 'open-link')

        .addMenuElement('inline edit info...', null, function(sender) {

            humane.log('<b>hint:</b> Click the panel title to change it.', {
                timeout: 3000,
                clickToClose: true
            });

        }, 'edit-project')
		.addMenuElement('remove', null, function(sender) {
			if(sender.parent.type === 'PANEL' && _.keys(sender.parent.items).length == 1) {
				sender.parent.remove();
			}	
			sender.remove();
		}, 'remove');

		var iconTooltip = desktop.tooltip({
			offsetLeft: 30,
			offsetTop: -120,
            fadeInSpeed: 0,
            fadeOutSpeed: 200
		})
		.addTemplate('<%if(image) {%><img class="image" src="<%=image%>"/><%}%>' +
					 '<div class="title"><%=title%></div>' +
					 '<div class="description"><%=description%></div>' + 
					 '<div class="field"><%=field%></div>');

		iconTooltip.on.show.add(function(sender, values) {

            if(!settings.desktop.tooltip) return;

			values.title = sender.settings.title;
			values.image = 'https://avatars3.githubusercontent.com/u/8572321?v=2&s=460',
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
                gridH: settings.desktop.gridSize,
                inlineEdit: settings.desktop.panelTitleEdit

            }).pos(itemBelow.transform.x, itemBelow.transform.y + 25);

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
                if(panelToRemove) {
                    desktop.removeItem(panelToRemove);
                }
            }
        });

        // icons and panels
        // -------------------------------------------------------------------------------------------------------------

        function destroyElements() {

            for(key in desktop.items) {
                desktop.items[key].remove();
            }
        }

        function createElements() {

            var folderIcons = 3;

            for(var i = 0; i < folderIcons; i++) {

                desktop.icon({
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

            desktop.icon({
                title: settings.desktop.iconTitle,
                image: 'test/images/700.png',
                gridX: 2,
                gridY: folderIcons + 1,
                offsetTop: settings.desktop.iconOffsetTop,
                maxWidth: settings.desktop.gridSize,
                maxHeight: settings.desktop.gridSize,
                width: settings.desktop.iconSize,
                height: settings.desktop.iconSize,
                fontSize: settings.desktop.iconFontSize,
                textOffsetTop: settings.desktop.iconFontOffsetTop

            }).menu(cMenuProject).tooltip(iconTooltip);
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
                iconSize: 42,
                iconOffsetTop: 19,
                iconFontSize: 13,
                iconFontOffsetTop: 2,
                gridSize: 100,
                tooltip: false,
                panelTitleEdit: true
            }
        };

        desktop._settings.gridH = settings.desktop.gridSize;
        desktop._settings.gridW = settings.desktop.gridSize;

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
        gui.desktop.add(settings.desktop, 'gridSize', 100, 300).step(25).onFinishChange(onItemsChange);
        gui.desktop.add(settings.desktop, 'panelTitleEdit').onFinishChange(onItemsChange);
        gui.desktop.add(settings.desktop, 'tooltip');
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