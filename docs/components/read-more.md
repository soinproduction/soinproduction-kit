# ReadMore

Импорт:

```js
import { ReadMore } from '@soinproduction/kit/read-more';
```

`ReadMore` управляет раскрытием/схлопыванием контента через height-анимацию. Подходит для текстовых блоков, FAQ и admin/frontend preview.

## Markup

```html
<div data-read-more>
  <div data-read-more-content>
    Long content...
  </div>
  <button type="button" data-read-more-button>
    Read more
  </button>
</div>
```

Можно использовать несколько кнопок:

```html
<button data-read-more-button>Open</button>
<button data-read-more-button>Close</button>
```

## Использование

```js
const readMore = new ReadMore('[data-read-more]', {
  animationDuration: 300,
  setAria: true,
});
```

## Options

| Option | Default | Описание |
| --- | --- | --- |
| `buttons` | `'[data-read-more-button]'` | Selector кнопок. |
| `contentClass` | `'[data-read-more-content]'` | Selector content-блока. |
| `animationDuration` | `300` | Длительность анимации. |
| `setAria` | `true` | Ставить aria-expanded/hidden. |
| `autoHeightOptimization` | `true` | Оптимизация высоты после раскрытия. |
| `autoInit` | `true` | Инициализировать сразу в constructor. |

## Методы

```js
readMore.init();
readMore.toggle();
readMore.destroy();
```

## Notes

- После раскрытия может использоваться auto height, чтобы динамический контент не был зажат старой высотой.
- Если `autoInit: false`, вызови `init()` вручную.
