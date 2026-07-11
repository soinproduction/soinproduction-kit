# Switcher

Импорт:

```js
import { Switcher } from '@soinproduction/kit/content-switcher';
```

`Switcher` управляет tabs/accordion интерфейсами. Он умеет работать по click или hover, поддерживает несколько кнопок и несколько content-блоков на один id, а lifecycle-хуки открытия/закрытия учитывают CSS transition по `max-height`.

## Markup

```html
<div data-switcher>
  <button data-switcher-button="one">One</button>
  <button data-switcher-button="two">Two</button>

  <div data-switcher-content="one">Content one</div>
  <div data-switcher-content="two">Content two</div>
</div>
```

## Базовое использование

```js
new Switcher('[data-switcher]', {
  mode: 'tabs',
  attrNav: 'data-switcher-button',
  attrContent: 'data-switcher-content',
});
```

## Accordion с lifecycle

```js
new Switcher('[data-accordion]', {
  mode: 'accordion',
  triggerEvent: 'click',

  beforeOpen(id, ctx) {
    // Перед закрытием других items и перед открытием текущего.
  },

  onOpen(id, ctx) {
    // active уже поставлен, maxHeight уже задан.
  },

  afterOpen(id, ctx) {
    // max-height transition открытия завершился.
  },

  onClose(id, ctx) {
    // Закрытие стартовало.
  },

  afterClose(id, ctx) {
    // max-height transition закрытия завершился.
  },
});
```

## Options

| Option | Default | Описание |
| --- | --- | --- |
| `mode` | `'tabs'` | `'tabs'` или `'accordion'`. |
| `attrNav` | `'data-switcher-button'` | Атрибут trigger-кнопок. |
| `attrContent` | `'data-switcher-content'` | Атрибут content-блоков. |
| `activeClass` | `'active'` | Класс активного trigger/content. |
| `single` | `true` | Для accordion закрывает остальные items перед открытием текущего. |
| `triggerEvent` | `'click'` | `'click'` или `'hover'`. |
| `hoverDelay` | `0` | Задержка hover-открытия. |
| `resetMaxHeightAfterOpen` | `false` | После `afterOpen` ставит `content.style.maxHeight = 'initial'`. |
| `breakpoints` | `{}` | Переопределение любых options по ширине. |
| `responsive` | `{}` | Legacy alias для `breakpoints`. |
| `beforeOpen` | `null` | Хук перед открытием. |
| `onOpen` | `null` | Хук сразу после active/maxHeight. |
| `afterOpen` | `null` | Хук после transition открытия. |
| `onClose` | `null` | Хук после старта закрытия. |
| `afterClose` | `null` | Хук после transition закрытия. |

## Breakpoints

`Switcher` использует max-width breakpoints. Ключ применяется, когда `window.innerWidth <= breakpoint`.

```js
new Switcher('[data-switcher]', {
  triggerEvent: 'hover',
  single: true,
  breakpoints: {
    640: {
      single: false,
      triggerEvent: 'click',
    },
    1024: {
      triggerEvent: 'click',
    },
  },
});
```

Любая option может быть переопределена внутри breakpoint.

## Hook Context

В хуки приходит `ctx`:

```js
{
  parent,
  buttons,
  contents,
  btn,
  button,
  content,
  event
}
```

`buttons` и `contents` всегда массивы для текущего id. `btn` и `button` указывают на trigger, который вызвал действие. `content` содержит первый content-блок для текущего id, если он есть. `event` передается при пользовательском действии.

## Методы

```js
const switcher = new Switcher('[data-switcher]');

switcher.open('one');
switcher.close('one');
switcher.toggle('one');
switcher.destroy();
```

## Notes

- `afterOpen` и `afterClose` ждут именно transition по `max-height`.
- Если transition отсутствует, hooks вызываются сразу.
- Если `transitionend` не пришел, сработает fallback timeout.
- `transition-property: all` считается подходящим transition.
- Несколько trigger/content с одинаковым id синхронизируются вместе.
