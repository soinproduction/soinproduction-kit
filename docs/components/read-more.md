# ReadMore

`ReadMore` toggles expandable content using `max-height` and button label changes.

```js
import { ReadMore } from '@soinproduction/kit/read-more';
```

## Markup

```html
<div class="read-more-content">
  Hidden content
</div>
<button data-read-more data-more-text="Read more" data-less-text="Hide">
  <span class="read-more-text">Read more</span>
</button>
```

With explicit target:

```html
<div id="bio" class="read-more-content">Bio content</div>
<button data-read-more data-target="#bio">Read more</button>
```

## Usage

```js
const readMore = new ReadMore({
  buttons: '[data-read-more]',
  contentClass: 'read-more-content',
  animationDuration: 300,
});
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `buttons` | `'[data-read-more]'` | Selector, NodeList, or array of buttons. |
| `contentClass` | `'read-more-content'` | Previous sibling class used when `data-target` is absent. |
| `animationDuration` | `300` | Timeout before setting `max-height: none`. |
| `setAria` | `true` | Set role, aria-expanded, aria-controls. |
| `autoHeightOptimization` | `true` | Set `max-height: none` after expand. |
| `autoInit` | `true` | Initialize in constructor. |

## Methods

```js
readMore.init();
readMore.toggle(button, content);
readMore.destroy();
```

