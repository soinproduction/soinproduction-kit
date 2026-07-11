# InfiniteSlider

`InfiniteSlider` creates a continuously moving loop by cloning the original children until the track can scroll seamlessly.

```js
import { InfiniteSlider } from '@soinproduction/kit/infinity-slider';
```

## Markup

```html
<div data-marquee>
  <span>Brand A</span>
  <span>Brand B</span>
  <span>Brand C</span>
</div>
```

## Usage

```js
const slider = new InfiniteSlider(document.querySelector('[data-marquee]'), {
  direction: 'left',
  speed: 0.5,
  pauseOnHover: true,
});
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `direction` | `'left'` | `'left'`, `'right'`, `'up'`, or `'down'`. |
| `speed` | `0.5` | Pixels per animation frame. |
| `pauseOnHover` | `false` | Pause on hover and resume on leave. |
| `showInfo` | `false` | Log debug info. |
| `onStart` | `null` | Called when restarted. |
| `onStop` | `null` | Called when stopped. |
| `onTick` | `null` | Called with current position each frame. |

## Methods

```js
slider.start();
slider.stop();
slider.destroy();
```

## Notes

- The container is set to `overflow: hidden`.
- Children are wrapped in `.infinite-slider__track`.
- On destroy, original base items are restored to the container.

