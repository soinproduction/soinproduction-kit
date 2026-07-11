# AdditionalToggle

`AdditionalToggle` controls drawers, menus, dropdowns, offcanvas panels, and any target toggled by one or more triggers. It supports click and hover, overlay state, scroll lock, transition-aware hooks, promises, groups, breakpoints, and accessibility.

```js
import { AdditionalToggle } from '@soinproduction/kit/drawers';
```

## Basic Drawer

```html
<button data-menu-toggle>Menu</button>
<div data-overlay></div>
<nav data-menu>
  <button data-menu-close>Close</button>
</nav>
```

```js
const toggle = new AdditionalToggle({
  overlay: '[data-overlay]',
  items: [
    {
      trigger: '[data-menu-toggle]',
      close: '[data-menu-toggle], [data-menu-close]',
      target: '[data-menu]',
      scroll: true,
      waitTransition: true,
      transitionProperty: 'transform',
    },
  ],
});
```

## Hover Dropdown

```js
new AdditionalToggle({
  items: [
    {
      trigger: '[data-nav-trigger]',
      target: '[data-nav-dropdown]',
      triggerEvent: 'hover',
      hoverCloseDelay: 160,
      hoverInteractiveTarget: true,
      waitTransition: true,
      transitionProperty: 'opacity',
    },
  ],
});
```

## Options

Global options can be passed to the constructor. Item options override them.

| Option | Default | Description |
| --- | --- | --- |
| `overlay` | constructor: `null`, item: `true` | Overlay selector/element globally; item controls whether it uses overlay state. |
| `activeClass` | `'active'` | Class for triggers and overlay. |
| `targetActiveClass` | `activeClass` | Class for target elements. |
| `overlayExtraClass` | `''` | Extra overlay class while this item is open. |
| `trigger` | required | Selector/element/list of trigger buttons. |
| `target` | required | Selector/element/list of controlled targets. |
| `close` | `undefined` | Selector/element/list of close buttons. Can include trigger. |
| `scroll` | `false` | Lock body scroll while open. |
| `clickOnOverlay` | `true` | Close on outside/overlay click. |
| `single` | `true` | Close other open items before opening. |
| `group` | `null` | If set, `single` closes only items in the same group. |
| `toggleOnTrigger` | `true` | Trigger can toggle the target. |
| `closeOnTrigger` | `true` | Open trigger click can close the target. |
| `triggerEvent` | `'click'` | `'click'`, `'hover'`, or `'both'`. |
| `hoverOpenDelay` | `0` | Delay before hover open. |
| `hoverCloseDelay` | `120` | Delay before hover close. |
| `hoverSafeArea` | `true` | Do not close when moving between trigger and target. |
| `hoverInteractiveTarget` | `true` | Target itself keeps hover dropdown open. |
| `clickFallback` | `true` | Click also works in hover mode. |
| `enabled` | `true` | Boolean or function returning whether item is active. |
| `closeOnLeave` | `true` | Close if breakpoint disables an open item. |
| `autoA11y` | `true` | Manage ARIA state. |
| `focusOnOpen` | `false` | Selector/element/function to focus after open. |
| `returnFocusOnClose` | `true` | Return focus to last trigger. |

## Transition Lifecycle

```js
new AdditionalToggle({
  waitTransition: true,
  transitionTarget: 'targets',
  transitionProperty: 'transform',
  transitionEvent: 'auto',
  transitionTimeout: 'auto',
  waitAllTransitions: false,
  items: [
    {
      trigger: '[data-toggle]',
      target: '[data-panel]',
      afterOpen(ctx) {},
      afterClose(ctx) {},
    },
  ],
});
```

Transition options:

| Option | Default | Description |
| --- | --- | --- |
| `waitTransition` | `false` | If true, `afterOpen/afterClose` wait for transition/animation. |
| `transitionTarget` | `'targets'` | `'targets'`, `'overlay'`, selector, element, element list, or function. |
| `transitionProperty` | `'auto'` | Property name, array, or `'auto'`. |
| `transitionEvent` | `'transitionend'` | `'transitionend'`, `'animationend'`, or `'auto'`. |
| `transitionTimeout` | `'auto'` | Number or computed duration + delay + 50ms. |
| `waitAllTransitions` | `false` | Wait all meaningful targets instead of first one. |
| `resetTransitionStyles` | `false` | Clear inline transition/animation after lifecycle wait. |

## Hooks

Order:

1. global `beforeOpen`
2. item `beforeOpen`
3. item `afterOpen`
4. global `afterOpen`
5. global `beforeClose`
6. item `beforeClose`
7. item `afterClose`
8. global `afterClose`

Returning `false` from `beforeOpen` or `beforeClose` cancels the action.

Hook context:

```js
{
  instance,
  action,
  phase,
  event,
  trigger,
  close,
  overlay,
  triggers,
  targets,
  closes,
  activeClass,
  targetClass,
  overlayExtraClass,
  group,
  isOpen,
  previousState,
  nextState,
  options,
}
```

## Breakpoints

Breakpoints are mobile-first and cascade. Base options are applied first, then all keys where `window.innerWidth >= breakpoint`.

```js
new AdditionalToggle({
  items: [
    {
      trigger: '[data-mobile-menu-toggle]',
      target: '[data-mobile-menu]',
      scroll: true,
      enabled: true,
      breakpoints: {
        1024: {
          enabled: false,
          closeOnLeave: true,
        },
      },
    },
  ],
});
```

## Methods

All methods return `Promise<boolean>`.

```js
await toggle.open(ref, { event, trigger });
await toggle.close(ref, { event, trigger, close });
await toggle.toggle(ref, { event, trigger });
await toggle.closeAll({ force: true, group: 'nav' });

toggle.getInstance(ref);
toggle.isOpen(ref);
toggle.reinit();
toggle.destroy();
```

`ref` can be an item index, target selector, target element, trigger element, or the instance object.

