# ModalManager

Импорт:

```js
import { ModalManager } from '@soinproduction/kit/modals';
```

`ModalManager` управляет модальными окнами. Он поддерживает JS fade или CSS-class анимацию, transition-aware lifecycle, переключение между модалками, focus management, history/hash и настройки для конкретных modal id.

## Markup

```html
<button data-modal-target="contact">Open contact</button>

<div data-modal="contact">
  <div data-modal-inner>
    <button data-modal-close>Close</button>
    Contact form
  </div>
</div>
```

## Базовое использование

```js
const modals = new ModalManager({
  modalSelector: '[data-modal]',
  triggerSelector: '[data-modal-target]',
  closeSelector: '[data-modal-close]',
});
```

## CSS-Class Animation

```js
new ModalManager({
  animationMode: 'css-class',
  waitTransition: true,
  transitionTarget: 'modal',
  transitionProperty: 'opacity',
  modalOpeningClass: 'is-opening',
  modalClosingClass: 'is-closing',
  activeClass: 'is-active',
});
```

Пример CSS:

```css
[data-modal] {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

[data-modal].is-active {
  opacity: 1;
  pointer-events: auto;
}
```

## Options

| Option | Default | Описание |
| --- | --- | --- |
| `modalSelector` | `'[data-modal]'` | Selector модалок. |
| `triggerSelector` | `'[data-modal-target]'` | Selector trigger-кнопок. |
| `closeSelector` | `'[data-modal-close]'` | Selector close-кнопок. |
| `innerSelector` | `'[data-modal-inner]'` | Selector внутреннего контейнера. |
| `activeClass` | `'active'` | Класс открытой модалки. |
| `bodyActiveClass` | `'modal-open'` | Класс body при открытой модалке. |
| `bodyModeClass` | `null` | Дополнительный класс body. |
| `modalOpeningClass` | `'is-opening'` | Класс во время открытия. |
| `modalClosingClass` | `'is-closing'` | Класс во время закрытия. |
| `animationMode` | `'js-fade'` | `'js-fade'` или `'css-class'`. |
| `fadeInTimeout` | `300` | Длительность JS fade in. |
| `fadeOutTimeout` | `300` | Длительность JS fade out. |
| `waitTransition` | `false` | Ждать CSS transition/animation. |
| `transitionTarget` | `'modal'` | `'modal'`, `'inner'`, `'overlay'` или element/function. |
| `transitionProperty` | `'all'` | CSS property, которую нужно ждать. |
| `transitionEvent` | `'transitionend'` | `'transitionend'` или `'animationend'`. |
| `transitionTimeout` | `null` | Ручной fallback timeout. |
| `animationStrategy` | `'interrupt'` | `'ignore'`, `'queue'` или `'interrupt'`. |
| `queue` | `false` | Shortcut для `animationStrategy: 'queue'`. |
| `closeOnEsc` | `true` | Закрывать по Escape. |
| `closeOnOverlayClick` | `true` | Закрывать по клику вне inner. |
| `scrollLock` | `true` | Блокировать body scroll. |
| `focusOnOpen` | `null` | Selector/element/function для фокуса после открытия. |
| `returnFocusOnClose` | `true` | Вернуть фокус на trigger. |
| `trapFocus` | `true` | Удерживать Tab внутри модалки. |
| `inertBackground` | `false` | Ставить inert на соседние элементы body. |
| `autoA11y` | `true` | Автоматические role/aria атрибуты. |
| `history` | `false` | Интеграция с browser history. |
| `hash` | `false` | Открытие/закрытие через URL hash. |
| `hashMode` | `'modal'` | Prefix hash-режима. |
| `closeOnBack` | `true` | Закрывать по back при history/hash. |
| `openOnHashLoad` | `true` | Открыть модалку из hash при загрузке. |
| `modals` | `{}` | Per-modal config. |

## Transition Lifecycle

Хуки открытия:

```txt
beforeOpen -> onOpen -> afterOpen
```

Хуки закрытия:

```txt
beforeClose -> onClose -> afterClose
```

При `animationMode: 'css-class'` и `waitTransition: true`:

- `onOpen` вызывается после установки active/opening классов;
- `afterOpen` вызывается после transition/animation;
- `onClose` вызывается после старта закрытия;
- `afterClose` вызывается после transition/animation закрытия.

Если transition отсутствует, hook вызывается сразу. Если browser не отправил event, используется fallback timeout.

## Hooks и Events

```js
new ModalManager({
  beforeOpen(id, ctx) {},
  onOpen(id, ctx) {},
  afterOpen(id, ctx) {},
  beforeClose(id, ctx) {},
  onClose(id, ctx) {},
  afterClose(id, ctx) {},
  onSwitch(fromId, toId, ctx) {},
});
```

`ctx` содержит:

```js
{
  id,
  modal,
  manager,
  overlay,
  trigger,
  event,
  action,
  phase,
  previousModal,
  currentModal,
  closeReason,
  options
}
```

Можно также слушать DOM events:

```js
document.addEventListener('modal:after-open', (event) => {
  console.log(event.detail.id);
});
```

Events:

```txt
modal:before-open
modal:open
modal:after-open
modal:before-close
modal:close
modal:after-close
modal:switch
```

## Per-Modal Config

```js
new ModalManager({
  animationMode: 'css-class',
  modals: {
    contact: {
      focusOnOpen: '[name="email"]',
      transitionProperty: 'transform',
    },
    video: {
      scrollLock: false,
      closeOnOverlayClick: false,
    },
  },
});
```

Per-modal options мержатся поверх глобальных options для выбранного id.

## Методы

```js
const manager = new ModalManager();

await manager.open('contact', event);
await manager.close('contact', event);
await manager.closeAll(event);
await manager.toggle('contact', event);
await manager.switchTo('video', event);

manager.isOpen('contact');
manager.getCurrent();
manager.getModal('contact');
manager.destroy();
manager.reinit();
```

Aliases:

```js
manager.openModal('contact', event);
manager.closeAllModals(event);
```

## Operation Strategies

`animationStrategy` управляет тем, что делать, если новая операция пришла во время анимации:

| Strategy | Поведение |
| --- | --- |
| `interrupt` | Прерывает текущую операцию и запускает новую. |
| `ignore` | Игнорирует новую операцию, пока идет текущая. |
| `queue` | Ставит новую операцию в очередь. |

`queue: true` включает `animationStrategy: 'queue'`.
