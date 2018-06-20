# Jtop

Builld beautiful UI similar to real desktop.

![Demo](docs/hero.png)

## Getting Started

See the **[live version](http://coderitual.github.io/jtop/ "jtop")**.

## Features
- ✊ **Drag & drop** for desktop elements
- 📦 **Basic elements**  included: `Icon`, `Panel`, `Tooltip`, `Menu`
- 📝 **SVG Text** with drop shadow and ellispis
- ✏️ **Inline** text editing (Panels)
- ↕️ **Resizable** elements

### Example

```js
const desktop = jtop.init('jtop', {
  scrollView: {
    initY: 25
  }
});

const tooltop = desktop.tooltip({
  offsetLeft: 30,
  offsetTop: -120
});

const menu = jtop.popupmenu().addMenuElement(
  'open project',
  null,
  sender => {
    console.log(`open project ${sender.title}`);
  },
  'edit-item'
);

const icon = desktop
  .icon({ title: 'Icon', image: 'test/images/db.png', gridX: 1, gridY: 1 })
  .menu(cMenuProject)
  .tooltip(iconTooltip);

```

For more, visit the example page inside `test` directory and look into `main.js`.

## Built With

* [SVG](https://developer.mozilla.org/pl/docs/Web/SVG) - Custom graphics and effects
* [require.js](http://requirejs.org/) - Module Loader
* [js-signals](http://millermedeiros.github.io/js-signals/) - Pub/Sub system
* [underscore.js](https://underscorejs.org/) - Functional programming helpers

## Authors

* **Mike Skowronek** - *Initial work* - [coderitual](https://twitter.com/coderitual)

## License

Jtop is available under the MIT license. See the [LICENSE](LICENSE) file for more info.
