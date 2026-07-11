# Helpers

Импорт:

```js
import {
  getAjaxData,
  disableScroll,
  enableScroll,
  elementSize,
  fadeIn,
  fadeOut,
  addMultiListener,
  even,
  addClassOnCondition,
  removeClassOnCondition,
  toggleClassOnCondition,
  classToScroll,
  stickyHeader,
  scrollToSection,
  initParallaxEffect,
  animateInit,
  scrollToElement,
} from '@soinproduction/kit/functions';
```

Можно импортировать отдельный helper:

```js
import { disableScroll } from '@soinproduction/kit/functions/disable-scroll';
```

## AJAX

```js
const data = await getAjaxData('/wp-json/my-route/v1/items', {
  method: 'POST',
  body: JSON.stringify({ id: 1 }),
});
```

`getAjaxData` - небольшой wrapper для `fetch`, который возвращает распарсенный JSON.

## Scroll Lock

```js
disableScroll();
enableScroll();
```

Используется в drawers/modals и может применяться отдельно. Обычно нужен для открытых меню, drawer, modal и fullscreen overlays.

## CSS Variable From Element Size

```js
elementSize('[data-header]', '--header-height', 'height');
```

Helper измеряет элемент и записывает значение в CSS custom property.

Пример CSS:

```css
:root {
  --header-height: 0px;
}

.page {
  padding-top: var(--header-height);
}
```

## Class Helpers

```js
addClassOnCondition(element, 'is-active', condition);
removeClassOnCondition(element, 'is-hidden', condition);
toggleClassOnCondition(element, 'is-open', condition);
```

`classToScroll` и `stickyHeader` помогают менять классы при scroll:

```js
classToScroll(document.body, 'is-scrolled', 20);
stickyHeader('[data-header]', 'is-sticky');
```

## Animation и Scroll Helpers

```js
fadeIn(element, 300);
fadeOut(element, 300);

scrollToSection('[data-section]');
scrollToElement(document.querySelector('#target'));

initParallaxEffect('[data-parallax]');
animateInit('[data-animate]');
```

## Small Utilities

```js
addMultiListener(element, 'click touchstart', handler);
even(4); // true
```

`addMultiListener` вешает один handler на несколько событий. `even` проверяет четность числа.
