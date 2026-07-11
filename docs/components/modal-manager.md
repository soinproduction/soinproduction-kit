# ModalManager

`ModalManager` controls modals inside an overlay. It supports old JS fade behavior and CSS-class animation, transition-aware lifecycle hooks, focus management, ARIA, hash/history integration, operation strategies, and per-modal config.

```js
import { ModalManager } from '@soinproduction/kit/modals';
```

## Markup

```html
<button data-btn-modal="search">Open search</button>

<div data-overlay aria-hidden="true">
  <section data-popup="search" id="search-modal">
    <button data-modal-close>Close</button>
    <input type="search" />
  </section>
</div>
```

## Basic Usage

```js
const modals = new ModalManager({
  overlay: '[data-overlay]',
  modalSelector: '[data-popup]',
  triggerSelector: '[data-btn-modal], a[href^="#"]',
  closeSelector: '[data-modal-close], .close',
});
```

## CSS-Class Animation

```js
new ModalManager({
  animationMode: 'css-class',
  waitTransition: true,
  transitionTarget: 'modal',
  transitionProperty: 'opacity',
  transitionEvent: 'auto',
});
```

In `css-class` mode, the manager adds/removes classes only. CSS owns layout, opacity, transform, and animation.

```css
[data-popup] {
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms ease;
}

[data-popup].active {
  opacity: 1;
  pointer-events: auto;
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `overlay` | `'[data-overlay]'` | Overlay selector or element. |
| `modalSelector` | `'[data-popup]'` | Modal selector inside overlay. |
| `triggerSelector` | `'[data-btn-modal], a[href^="#"]'` | Trigger selector. |
| `closeSelector` | `'[data-modal-close], .close'` | Close button selector, resolved with `closest()`. |
| `innerSelector` | `'[data-btn-inner]'` | Button for switching between modals. |
| `activeClass` | `'active'` | Active class for overlay/modal. |
| `activeMode` | `''` | Extra overlay class while any modal is open. |
| `animationMode` | `'js-fade'` | `'js-fade'` or `'css-class'`. |
| `fadeInTimeout` | `300` | JS fade duration or fallback wait. |
| `fadeOutTimeout` | `300` | JS fade duration or fallback wait. |
| `closeOnEsc` | `true` | Escape closes current modal. |
| `closeOnOverlayClick` | `true` | Overlay click closes current modal. |
| `focusOnOpen` | `'first'` | `'first'`, selector, element, or `false`. |
| `returnFocusOnClose` | `true` | Return focus to the opening trigger. |
| `trapFocus` | `true` | Cycle Tab/Shift+Tab inside current modal. |
| `inertBackground` | `false` | Set `inert` on body children except overlay. |
| `autoA11y` | `true` | Manage dialog role, aria-hidden, aria-expanded, aria-controls. |
| `history` | `true` | Enable History API updates. |
| `hash` | `true` | Use hash in URL. |
| `hashMode` | `'push'` | `'push'` or `'replace'`. |
| `closeOnBack` | `true` | React to browser back/popstate. |
| `openOnHashLoad` | `true` | Open matching modal on page load. |
| `animationStrategy` | `'ignore'` | `'ignore'`, `'queue'`, or `'interrupt'`. |
| `queue` | `false` | Legacy shortcut: true sets strategy to `'queue'`. |
| `bodyActiveClass` | `'modal-open'` | Body class while modal is open. |
| `bodyModeClass` | `null` | String or function `(id) => className`. |
| `modalOpeningClass` | `'is-opening'` | Class during open lifecycle. |
| `modalClosingClass` | `'is-closing'` | Class during close lifecycle. |
| `modals` | `{}` | Per-modal config. |

## Transition Lifecycle

```js
new ModalManager({
  waitTransition: true,
  transitionTarget: 'modal',
  transitionProperty: ['opacity', 'transform'],
  transitionEvent: 'auto',
  transitionTimeout: 'auto',
});
```

| Option | Default | Description |
| --- | --- | --- |
| `waitTransition` | `false` | If true, lifecycle waits for transition/animation before after hooks. |
| `transitionTarget` | `'modal'` | `'modal'`, `'overlay'`, selector, element, or function. |
| `transitionProperty` | `'auto'` | Property name, array, or `'auto'`. |
| `transitionEvent` | `'transitionend'` | `'transitionend'`, `'animationend'`, or `'auto'`. |
| `transitionTimeout` | `'auto'` | Number or computed duration + delay + 50ms. |

## Hooks and Events

Global hooks:

```js
new ModalManager({
  beforeOpen(ctx) {},
  afterOpen(ctx) {},
  beforeClose(ctx) {},
  afterClose(ctx) {},
});
```

Runtime hooks:

```js
modals.on('afterOpen', (ctx) => {});
modals.once('afterClose', (ctx) => {});
modals.off('afterOpen');
```

DOM events are dispatched from overlay:

```txt
modal:beforeopen
modal:afteropen
modal:beforeclose
modal:afterclose
```

Hook/event context:

```js
{
  id,
  modal,
  manager,
  overlay,
  trigger,
  event,
  action,       // open | close | switch
  phase,        // beforeOpen | afterOpen | beforeClose | afterClose
  previousModal,
  currentModal,
  closeReason,  // button | overlay | escape | history | api | switch
  options,
}
```

## Per-Modal Config

```js
new ModalManager({
  modals: {
    search: {
      focusOnOpen: 'input[type="search"]',
      closeOnOverlayClick: true,
    },
    video: {
      closeOnOverlayClick: false,
      afterClose({ modal }) {
        // stop video
      },
    },
  },
});
```

## Methods

All public open/close methods return `Promise<boolean>`.

```js
await modals.open('search', { trigger, event });
await modals.close('search', { closeReason: 'api' });
await modals.close();
await modals.closeAll({ force: true });
await modals.toggle('search');
await modals.switchTo('video');

modals.isOpen();
modals.isOpen('search');
modals.getCurrent();
modals.getModal('search');
modals.reinit();
modals.destroy();
```

Backward-compatible aliases:

```js
await modals.openModal('search');
await modals.closeAllModals();
```

## Operation Strategies

| Strategy | Behavior |
| --- | --- |
| `ignore` | If animation is running, new action resolves `false`. |
| `queue` | Queue the next action after the current lifecycle completes. |
| `interrupt` | Invalidate the current operation token and start the next action. |

