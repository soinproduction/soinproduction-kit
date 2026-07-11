# Заметки по миграции

## Version 1.1.10

Релиз расширяет `Switcher`, `AdditionalToggle` и `ModalManager`, а также добавляет полноценную документацию внутри npm-пакета.

## Switcher

Добавлено:

- `triggerEvent: 'click' | 'hover'`;
- несколько trigger-кнопок и несколько content-блоков на один id;
- `afterOpen`, который ждет завершения `max-height` transition;
- `afterClose`, который теперь тоже ждет завершения закрывающего transition;
- `_waitTransition(content, property)`;
- `resetMaxHeightAfterOpen`;
- `breakpoints` для переопределения любых настроек.

Важно: `breakpoints` у `Switcher` работают как max-width overrides. Например ключ `768` применится при `window.innerWidth <= 768`.

```js
new Switcher('[data-switcher]', {
  triggerEvent: 'hover',
  breakpoints: {
    768: {
      triggerEvent: 'click',
      single: false,
    },
  },
});
```

## AdditionalToggle

Добавлено:

- `triggerEvent: 'click' | 'hover' | 'both'`;
- hover delays и safe area;
- `waitTransition`, `transitionTarget`, `transitionProperty`;
- Promise API для `open`, `close`, `toggle`, `closeAll`;
- `single` и `group`;
- `enabled`;
- `autoA11y`;
- `focusOnOpen`, `returnFocusOnClose`;
- rich hook context;
- mobile-first `breakpoints`.

Важно: `breakpoints` у `AdditionalToggle` работают mobile-first. Настройки применяются каскадно при `window.innerWidth >= breakpoint`.

```js
new AdditionalToggle({
  items: [
    {
      trigger: '[data-menu-toggle]',
      target: '[data-menu]',
      breakpoints: {
        1024: {
          triggerEvent: 'hover',
          closeOnLeave: true,
        },
      },
    },
  ],
});
```

## ModalManager

Добавлено:

- `animationMode: 'js-fade' | 'css-class'`;
- transition-aware lifecycle;
- `beforeOpen`, `onOpen`, `afterOpen`, `beforeClose`, `onClose`, `afterClose`;
- `animationStrategy: 'ignore' | 'queue' | 'interrupt'`;
- `switchTo`;
- `history`, `hash`, `hashMode`, `closeOnBack`, `openOnHashLoad`;
- `focusOnOpen`, `returnFocusOnClose`, `trapFocus`, `inertBackground`;
- `autoA11y`;
- per-modal config через `modals`.

Если раньше использовалась только JS fade-анимация, старый сценарий продолжит работать через default `animationMode: 'js-fade'`.

Для CSS transition лучше перейти на:

```js
new ModalManager({
  animationMode: 'css-class',
  waitTransition: true,
  transitionTarget: 'modal',
  transitionProperty: 'opacity',
});
```

## Публикация

Перед publish обязательно:

```bash
npm run build
npm pack --dry-run --cache /private/tmp/soinproduction-kit-npm-cache
```

`dist` не хранится в git, но публикуется в npm tarball через `files`.
