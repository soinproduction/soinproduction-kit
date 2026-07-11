# AdditionalToggle

Импорт:

```js
import { AdditionalToggle } from '@soinproduction/kit/drawers';
```

`AdditionalToggle` управляет drawer, dropdown, меню и другими toggle-поверхностями. Компонент поддерживает click/hover/both, overlay, scroll lock, transition-aware lifecycle, promises, группы, accessibility и mobile-first breakpoints.

## Basic Drawer

```html
<button data-menu-toggle>Menu</button>
<div data-overlay></div>
<aside data-menu>
  <button data-menu-close>Close</button>
</aside>
```

```js
const menu = new AdditionalToggle({
  overlay: '[data-overlay]',
  items: [
    {
      trigger: '[data-menu-toggle]',
      close: '[data-menu-toggle], [data-menu-close]',
      target: '[data-menu]',
      activeClass: 'is-active',
      targetClass: 'is-open',
      scroll: true,
      waitTransition: true,
      transitionTarget: 'target',
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
      trigger: '[data-dropdown-trigger]',
      target: '[data-dropdown]',
      triggerEvent: 'hover',
      hoverOpenDelay: 80,
      hoverCloseDelay: 160,
      closeOnLeave: true,
      interactiveTarget: true,
    },
  ],
});
```

## Options

Глобальные options можно задавать в корне конструктора. Item-level options переопределяют глобальные.

| Option | Default | Описание |
| --- | --- | --- |
| `items` | `[]` | Массив toggle items. |
| `overlay` | `null` | Selector/element overlay. |
| `activeClass` | `'active'` | Класс trigger. |
| `targetClass` | `'active'` | Класс target. |
| `overlayExtraClass` | `'active'` | Класс overlay. |
| `triggerEvent` | `'click'` | `'click'`, `'hover'` или `'both'`. |
| `close` | `undefined` | Selector/element/list close-кнопок. Может включать trigger. |
| `scroll` | `false` | Блокировать body scroll при открытии. |
| `single` | `false` | Внутри группы открытым остается один item. |
| `group` | `'default'` | Имя группы для `single`. |
| `enabled` | `true` | Можно выключить item через breakpoint. |
| `closeOnOutsideClick` | `true` | Закрывать по клику вне target. |
| `closeOnEscape` | `true` | Закрывать по Escape. |
| `closeOnLeave` | `false` | Закрывать при уходе мыши с hover-зоны. |
| `interactiveTarget` | `true` | Hover target остается интерактивным и удерживает открытое состояние. |
| `hoverOpenDelay` | `0` | Задержка открытия hover. |
| `hoverCloseDelay` | `120` | Задержка закрытия hover. |
| `hoverSafeArea` | `0` | Дополнительная область вокруг trigger/target. |
| `waitTransition` | `false` | Ждать transition/animation перед after hooks. |
| `transitionTarget` | `'target'` | `'target'`, `'overlay'` или element/function. |
| `transitionProperty` | `'all'` | CSS property, которую нужно ждать. |
| `transitionEvent` | `'transitionend'` | `'transitionend'` или `'animationend'`. |
| `transitionTimeout` | `null` | Ручной fallback timeout. |
| `waitAllTransitions` | `false` | Ждать самый длинный transition из списка. |
| `resetTransitionStyles` | `false` | Сбрасывать inline transition styles после lifecycle. |
| `autoA11y` | `true` | Автоматически ставить aria-expanded/hidden. |
| `focusOnOpen` | `null` | Selector/element/function для фокуса после открытия. |
| `returnFocusOnClose` | `true` | Возвращать фокус на trigger после закрытия. |
| `breakpoints` | `{}` | Mobile-first overrides. |

## Transition Lifecycle

Если `waitTransition: true`, методы возвращают Promise, который завершится после transition/animation.

```js
await menu.open(0);
await menu.close(0);
await menu.toggle(0);
```

Hook order:

```txt
beforeOpen -> item.beforeOpen -> onOpen -> item.onOpen -> afterOpen -> item.afterOpen
beforeClose -> item.beforeClose -> onClose -> item.onClose -> afterClose -> item.afterClose
```

`afterOpen` и `afterClose` вызываются после ожидаемого transition/animation. Если transition отсутствует, Promise завершается сразу. Если browser не отправил event, используется fallback timeout.

## Hooks

```js
new AdditionalToggle({
  beforeOpen(ctx) {},
  onOpen(ctx) {},
  afterOpen(ctx) {},
  beforeClose(ctx) {},
  onClose(ctx) {},
  afterClose(ctx) {},
  onToggle(ctx) {},
  items: [
    {
      trigger: '[data-menu-toggle]',
      target: '[data-menu]',
      afterOpen(ctx) {},
    },
  ],
});
```

`ctx` содержит:

```js
{
  instance,
  item,
  index,
  action,
  phase,
  event,
  trigger,
  target,
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
  options
}
```

## Breakpoints

`AdditionalToggle` использует mobile-first breakpoints. Ключ применяется, когда `window.innerWidth >= breakpoint`, а настройки каскадно мержатся поверх базовых.

```js
new AdditionalToggle({
  items: [
    {
      trigger: '[data-nav-trigger]',
      target: '[data-nav]',
      triggerEvent: 'click',
      breakpoints: {
        1024: {
          triggerEvent: 'hover',
          closeOnLeave: true,
          scroll: false,
        },
      },
    },
  ],
});
```

## Методы

```js
const toggle = new AdditionalToggle(options);

await toggle.open(0, event);
await toggle.close(0, event);
await toggle.toggle(0, event);
await toggle.closeAll(event);

toggle.isOpen(0);
toggle.getInstance(0);
toggle.destroy();
toggle.reinit();
```

`open`, `close`, `toggle` и `closeAll` возвращают `Promise<boolean>`.
