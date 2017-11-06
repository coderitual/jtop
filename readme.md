jtop
==============

> Jtop.js is a javascript library that uses SVG to let you build beautiful desktop-like user interfaces.

![a relative link](docs/demo.gif)

## Demo

[Showcase](http://coderitual.github.io/jtop/ "jtop")


## Usage

Visit the example page from the test directory and check out main.js.

### Basic

```javascript
const desktop = jtop.init("jtop", {
  scrollView: {
    initY: 25
  }
});

const tooltop = desktop.tooltip({
  offsetLeft: 30,
  offsetTop: -120
});

var menu = jtop.popupmenu().addMenuElement(
  "open project",
  null,
  function(sender) {
    console.log("open project " + sender.title);
  },
  "edit-item"
);

const icon = desktop
  .icon({ title: "Icon", image: "test/images/db.png", gridX: 1, gridY: 1 })
  .menu(cMenuProject)
  .tooltip(iconTooltip);

```

### Icon customization
```javascript
const icon = desktop.icon({
  title: "Title",
  image: "image.pong",
  gridX: 4,
  gridY: 5,
  offsetTop: 10,
  maxWidth: 100,
  maxHeight: 100,
  width: 32,
  height: 32,
  fontSize: 12,
  textOffsetTop: 12
});
```

### Panel customization
```javascript
const panel = desktop.panel({
  title: "Panel title",
  width: 100,
  height: 100,
  minWidh: 100,
  minHeight: 100,
  gridW: 100,
  gridH: 100,
  inlineEdit: true,
  fontSize: 15,
  topPanelHeight: 15,
  bottomPanelHeight: 5,
  textOffsetTop: 5,
  textMargin: 5
});
```

### Drag and drop tooltip and panel creation
```javascript
const desktop = jtop.init("jtop");

var panelTooltip = desktop.tooltip({
  className: "jt-tooltip-info",
  offsetLeft: 0,
  offsetTop: 0,
  toOpacity: 1
}).addTemplate(`
	<div class="image"></div>
	<div class="title">
		<span class="name"><%=name%></span> <%=title%>
	</div>
`);

panelTooltip.on.show.add(function(sender, values) {
  values.name = `<span class="name">+ Create panel</span>`;
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
  var newPanel = desktop
    .panel({ title: itemBelow.settings.title, width: 200, height: 80 })
    .pos(itemBelow.transform.x, itemBelow.transform.y + 25);
  desktop.grid.removeValue(
    itemBelow.settings.gridX,
    itemBelow.settings.gridY,
    itemBelow
  );
  desktop.grid.removeValue(item.settings.gridX, item.settings.gridY, item);
  newPanel.addItem(item, 1, 0, true);
  newPanel.addItem(itemBelow, 0, 0, true);
  return true;
});
```

## License

jtop is available under the MIT license. See the [LICENSE](LICENSE) file for more info.
