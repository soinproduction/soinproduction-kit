# Switcher

`Switcher` controls tabs and accordions. It supports click or hover triggers, multiple buttons/content blocks per id, transition-aware accordion lifecycle hooks, nested switchers, and max-width breakpoints.

```js
import { Switcher } from '@soinproduction/kit/content-switcher';
```

## Markup

```html
<div data-tabs>
  <button type="button" data-tab="overview">Overview</button>
  <button type="button" data-tab="overview">Overview duplicate trigger</button>
  <button type="button" data-tab="specs">Specs</button>

  <section data-tab-content="overview">Overview block A</section>
  <section data-tab-content="overview">Overview block B</section>
  <section data-tab-content="specs">Specs</section>
</div>
```

## Basic Usage

```js
new Switcher('[data-tabs]', {
  mode: 'tabs',
  attrNav: 'data-tab',
  attrContent: 'data-tab-content',
});
```

## Accordion With Lifecycle

```js
new Switcher('[data-accordion]', {
  mode: 'accordion',
  single: true,
  triggerEvent: 'click',
  resetMaxHeightAfterOpen: true,

  beforeOpen(id, ctx) {},
  onOpen(id, ctx) {},
  afterOpen(id, ctx) {},
  onClose(id, ctx) {},
  afterClose(id, ctx) {},
});
```

For accordion mode, `afterOpen` and `afterClose` wait for the `max-height` transition. If there is no transition, hooks run immediately through the fallback path.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `mode` | `'tabs'` | `'tabs'` or `'accordion'`. |
| `single` | `false` | Accordion: close siblings before opening the next item. |
| `breakpoint` | `null` | Legacy single-mode breakpoint for accordion behavior. |
| `default` | `null` | Id to open on init. Can also be set with `data-default`. |
| `activeClass` | `'active'` | Class applied to triggers, content, and nearest `*item*` wrapper. |
| `attrNav` | `'data-id'` | Trigger attribute. |
| `attrContent` | `'data-content'` | Content attribute. |
| `triggerEvent` | `'click'` | `'click'` or `'hover'`. Hover also binds focus and click fallback. |
| `responsive` | `null` | Legacy `{ breakpoint, mode }`; still supported. |
| `breakpoints` | `null` | Max-width override map. |
| `autoInitNested` | `true` | Auto-init nested `.tabs-wrapper` and `.accordion`. |
| `resetMaxHeightAfterOpen` | `false` | Set `maxHeight = 'initial'` after `afterOpen`. |
| `showInfo` | `false` | Log debug info. |

## Breakpoints

`Switcher` breakpoints use max-width semantics. The first matching breakpoint is applied.

```js
new Switcher('[data-accordion]', {
  mode: 'accordion',
  single: true,
  triggerEvent: 'hover',

  breakpoints: {
    640: {
      single: false,
      triggerEvent: 'click',
    },
    768: {
      single: true,
      resetMaxHeightAfterOpen: false,
    },
    1024: {
      mode: 'tabs',
      activeClass: 'is-active',
    },
  },
});
```

## Hook Context

Hooks receive:

```js
{
  btn,
  button,
  content,
  buttons,
  contents,
  parent,
  event,
}
```

`btn` and `content` are the first matched elements for backward compatibility. Use `buttons` and `contents` when multiple elements share the same id.

## Methods

```js
const switcher = new Switcher('[data-tabs]');

switcher.open('overview');
switcher.close('overview');
switcher.toggle('overview');
switcher.reinit();
switcher.destroy();
```

## Notes

- For hover accordions, clicking an already-open trigger does not close it by default; hover owns the open state.
- If `resetMaxHeightAfterOpen` is enabled, close animation still works: the component restores pixel `max-height` before collapsing.

