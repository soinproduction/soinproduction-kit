# Helpers

```js
import {
  getAjaxData,
  fadeIn,
  fadeOut,
  addMultiListener,
  even,
  addCustomClass,
  removeCustomClass,
  toggleCustomClass,
  addClassInArray,
  removeClassInArray,
  toggleClassInArray,
  stickyHeader,
  scrollToSection,
  initParallaxEffect,
  animateInit,
  scrollToElement,
  disableScroll,
  enableScroll,
  elementSize,
} from '@soinproduction/kit/functions';
```

## AJAX

```js
getAjaxData(window.ajaxurl, 'load_posts', { page: 2 }, (response) => {
  console.log(response);
}, (error) => {
  console.error(error);
});
```

`getAjaxData(url, action, params, callback, onError)` sends `application/x-www-form-urlencoded` POST data and parses JSON.

## Scroll Lock

```js
disableScroll();
enableScroll();
```

`disableScroll()`:

- adds `body.dis-scroll`;
- preserves scroll position in `body.dataset.position`;
- compensates scrollbar width on `body` and `.fixed-block`;
- disables smooth scroll while locked.

`enableScroll()` restores everything and scrolls back.

## CSS Variable From Element Size

```js
elementSize(document.querySelector('[data-header]'), 'header-height', 'height');
```

Creates/updates:

```css
:root {
  --header-height: 96px;
}
```

## Class Helpers

```js
addCustomClass(el, 'active, visible');
removeCustomClass(el, 'active');
toggleCustomClass(el, 'active');

addClassInArray(items, 'active');
removeClassInArray(items, 'active');
toggleClassInArray(items, 'active');
```

## Animation and Scroll Helpers

```js
fadeIn(panel, 300, 'flex');
fadeOut(panel, 300);

stickyHeader(header, 250, 80, 'ease', 0, 40);
scrollToSection('[data-section]', () => {});
initParallaxEffect('[data-parallax]');
animateInit(items, 'is-active', 1200);
scrollToElement(element, 'down');
```

## Small Utilities

```js
even(2); // true
addMultiListener(window, 'resize orientationchange', () => {});
```

