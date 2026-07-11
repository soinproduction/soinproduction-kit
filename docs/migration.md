# Migration Notes

## Version 1.1.9

This version expands `Switcher`, `AdditionalToggle`, and `ModalManager` without removing the old entrypoints.

## Switcher

Old click-based tabs and accordions continue to work.

New features:

- `triggerEvent: 'click' | 'hover'`
- multiple triggers and multiple content nodes per id
- `afterOpen`
- transition-aware `afterOpen/afterClose` for accordion `max-height`
- `resetMaxHeightAfterOpen`
- `breakpoints`

Important behavior:

- `ctx.btn` and `ctx.content` still exist for backward compatibility.
- New code should use `ctx.buttons` and `ctx.contents` when multiple elements share one id.

## AdditionalToggle

Old constructor shape still works:

```js
new AdditionalToggle({
  overlay: '[data-overlay]',
  items: [
    {
      trigger: '[data-open]',
      target: '[data-panel]',
      close: '[data-close]',
    },
  ],
});
```

Changes to know:

- `open`, `close`, `toggle`, and `closeAll` now return `Promise<boolean>`.
- Hooks receive `ctx` instead of the raw instance. The instance is available as `ctx.instance`.
- `closeAll(true)` still works; object syntax is preferred: `closeAll({ force: true })`.
- Trigger and close may be the same element; trigger behavior wins.

## ModalManager

Old aliases remain:

```js
modals.openModal('search');
modals.closeAllModals();
```

Preferred new API:

```js
await modals.open('search');
await modals.close();
await modals.closeAll({ force: true });
```

Changes to know:

- Hooks now receive rich `ctx`.
- `animationMode: 'js-fade'` is the default for backward behavior.
- Use `animationMode: 'css-class'` when CSS should fully control modal transitions.
- Hash/history can be disabled with `history: false, hash: false`.

## Publishing

Before publishing:

```bash
npm run build
npm pack --dry-run --cache /private/tmp/soinproduction-kit-npm-cache
```

