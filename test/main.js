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
            fadeInSpeed: 100,
            fadeOutSpeed: 0
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
                inlineEdit: settings.desktop.panelTitleEdit,
                fontSize: settings.desktop.panelFontSize,
                topPanelHeight: settings.desktop.panelTopPanelHeight,
                bottomPanelHeight: settings.desktop.panelBottomPanelHeight,
                textOffsetTop: settings.desktop.panelTextOffsetTop,
                textMargin: settings.desktop.panelTextMargin

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

            // panel items

            var folderIcons = 12;
            var panelNo = 0;
            var newPanel;

            for(var i = 0; i < folderIcons; i++) {

                if(i % 2 === 0) {

                    panelNo = (i / 2) | 0;

                    newPanel = desktop.panel({
                        title: 'Panel title ' + (panelNo + 1),
                        width: settings.desktop.gridSize * (2 + ((panelNo % 2) * 2)),
                        height: settings.desktop.gridSize,
                        minWidh: settings.desktop.gridSize,
                        minHeight: settings.desktop.gridSize,
                        gridW: settings.desktop.gridSize,
                        gridH: settings.desktop.gridSize,
                        inlineEdit: settings.desktop.panelTitleEdit,
                        fontSize: settings.desktop.panelFontSize,
                        topPanelHeight: settings.desktop.panelTopPanelHeight,
                        bottomPanelHeight: settings.desktop.panelBottomPanelHeight,
                        textOffsetTop: settings.desktop.panelTextOffsetTop,
                        textMargin: settings.desktop.panelTextMargin

                    }).pos(400 + (panelNo % 2) * (settings.desktop.gridSize * 2 + 20), (panelNo % 3) * (settings.desktop.gridSize + 50) + 100);

                }

                var icon = desktop.icon({
                    title: settings.desktop.iconTitle,
                    image: 'test/images/717.png',
                    gridX: 2 + (i / 3) | 0,
                    gridY: i % 3 + 1,
                    offsetTop: settings.desktop.iconOffsetTop,
                    maxWidth: settings.desktop.gridSize,
                    maxHeight: settings.desktop.gridSize,
                    width: settings.desktop.iconSize,
                    height: settings.desktop.iconSize,
                    fontSize: settings.desktop.iconFontSize,
                    textOffsetTop: settings.desktop.iconFontOffsetTop

                }).menu(cMenuProject).tooltip(iconTooltip);

                newPanel.addItem(icon, i % 2, 0, true);

            }

            var customIcons = [
                'test/images/927.png',
                'test/images/1474.png',
                'test/images/1465.png',
                'test/images/1491.png'
            ];

            for(var i = 0, len = customIcons.length; i < len; i++) {
                desktop.icon({
                    title: settings.desktop.iconTitle,
                    image: customIcons[i],
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

        // background
        // -------------------------------------------------------------------------------------------------------------

        function geneerateBackground() {
            var t = new Trianglify();
            var pattern = t.generate(document.body.clientWidth, document.body.clientHeight);
            document.body.setAttribute('style', 'background-image: ' + pattern.dataUrl);
        }

        function setWallpaper() {
            document.body.setAttribute('style', 'background-image: url(' + settings.background.wallpaper + ')');
        }

        function toggleGrid() {
            document.getElementById('jtop').style.backgroundImage = settings.background.grid ? 'url("test/images/siatka10.png")' : 'none';
        }

        var wallpapers = {
            'rocket': 'test/images/w1.png',
            'hair': 'test/images/w1.jpg',
            'abstract': 'test/images/w2.jpg',
            'abstract2': 'test/images/wallpaper-3.jpg',
            'city': 'test/images/w3.jpg',
            'boat': 'test/images/w9.jpg',
            'box': 'test/images/wallpaper-2.jpg',
            'tree': 'test/images/wallpaper.jpg'
        };

        var settings = {

            background: {
                generate: function() {
                    geneerateBackground();
                },

                wallpaper: 'test/images/w1.jpg',
                grid: true
            },

            desktop: {
                iconTitle: 'Desktop item',
                iconSize: 42,
                iconOffsetTop: 19,
                iconFontSize: 13,
                iconFontOffsetTop: 2,
                panelFontSize: 15,
                panelTopPanelHeight: 25,
                panelBottomPanelHeight: 6,
                panelTextOffsetTop: 18,
                panelTextMargin: 25,
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

        gui.icon = gui.addFolder('ICON');
        gui.icon.add(settings.desktop, 'iconTitle').name('TITLE').onFinishChange(onItemsChange);
        gui.icon.add(settings.desktop, 'iconSize', 38, 96).name('SIZE').onFinishChange(onItemsChange);
        gui.icon.add(settings.desktop, 'iconFontSize', 9, 18).name('FONT SIZE').onFinishChange(onItemsChange);
        gui.icon.add(settings.desktop, 'iconOffsetTop', 12, 50).name('OFFSET TOP ').onFinishChange(onItemsChange);
        gui.icon.add(settings.desktop, 'iconFontOffsetTop', 0, 20).name('FONT OFFSET TOP').onFinishChange(onItemsChange);

        gui.panel = gui.addFolder('PANEL');
        gui.panel.add(settings.desktop, 'panelFontSize', 9, 24).name('FONT SIZE').onFinishChange(onItemsChange);
        gui.panel.add(settings.desktop, 'panelTopPanelHeight', 15, 40).name('TOP HEIGHT').onFinishChange(onItemsChange);
        gui.panel.add(settings.desktop, 'panelBottomPanelHeight', 0, 12).name('BOTTOM HEIGHT').onFinishChange(onItemsChange);
        gui.panel.add(settings.desktop, 'panelTextOffsetTop', 12, 24).name('FONT OFFSET TOP').onFinishChange(onItemsChange);
        gui.panel.add(settings.desktop, 'panelTextMargin', 0, 50).name('TEXT MARGIN').onFinishChange(onItemsChange);
        gui.panel.add(settings.desktop, 'panelTitleEdit').name('INLINE EDIT').onFinishChange(onItemsChange);

        gui.desktop = gui.addFolder('DESKTOP');
        gui.desktop.add(settings.desktop, 'gridSize', 100, 300).name('GRID SIZE').step(25).onFinishChange(onItemsChange);
        gui.desktop.add(settings.desktop, 'tooltip').name('TOOLTIP');
        gui.desktop.add(settings.background, 'grid').name('GRID').onFinishChange(toggleGrid);
        gui.desktop.add(settings.background, 'wallpaper').options(wallpapers).name('WALLPAPER').onFinishChange(setWallpaper);
        gui.desktop.add(settings.background, 'generate').name('GENERATE');



        // boot
        // -------------------------------------------------------------------------------------------------------------
        setWallpaper();
        createElements();

        humane.log('<b>hint:</b> Drop the icon on another one to create panel.', {
            timeout: 3000,
            clickToClose: true
        });

  	});

});
