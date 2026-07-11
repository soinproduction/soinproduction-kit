# InfiniteSlider

Импорт:

```js
import { InfiniteSlider } from '@soinproduction/kit/infinity-slider';
```

`InfiniteSlider` создает бесконечно движущийся slider/marquee. Он оборачивает children в track, дублирует элементы для бесшовного движения и управляет animation loop.

## Markup

```html
<div data-infinite-slider>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Использование

```js
const slider = new InfiniteSlider('[data-infinite-slider]', {
  direction: 'left',
  speed: 0.6,
  pauseOnHover: true,
});
```

## Options

| Option | Default | Описание |
| --- | --- | --- |
| `direction` | `'left'` | `'left'` или `'right'`. |
| `speed` | `0.5` | Скорость движения. |
| `pauseOnHover` | `false` | Останавливать slider при hover. |
| `showInfo` | `false` | Debug-информация. |
| `onStart` | `null` | Callback при старте. |
| `onStop` | `null` | Callback при остановке. |
| `onTick` | `null` | Callback на каждом frame. |

## Методы

```js
slider.start();
slider.stop();
slider.destroy();
```

## Notes

- Контроллер добавляет `.infinite-slider__track`.
- Для корректной работы контейнеру обычно нужен `overflow: hidden`.
- Если элементы содержат изображения, инициализацию лучше запускать после загрузки критичных assets.
