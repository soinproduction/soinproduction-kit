# Documentation

This folder is the detailed reference for `@soinproduction/kit`.

## Package

- [Imports](imports.md)
- [Publishing](publishing.md)
- [Migration notes](migration.md)

## Components

- [Switcher](components/switcher.md): tabs and accordion controller with hover, grouped triggers/contents, transition lifecycle hooks, and max-width breakpoints.
- [AdditionalToggle](components/additional-toggle.md): drawer/dropdown/menu controller with click/hover, overlay, scroll lock, transitions, promises, groups, accessibility, and mobile-first breakpoints.
- [ModalManager](components/modal-manager.md): modal controller with CSS or JS animation mode, transition-aware lifecycle, focus management, history/hash, and per-modal config.
- [CustomSelect](components/custom-select.md): accessible custom select for single/multiple values with hidden input sync.
- [InfiniteSlider](components/infinite-slider.md): continuously looping marquee/slider.
- [ReadMore](components/read-more.md): height-animated expandable content.

## Functions

- [Helpers](functions/helpers.md): AJAX, scroll lock, class helpers, sticky header, parallax, smooth scroll, element size CSS variable.
- [Scripts](functions/scripts.md): Contact Form 7 reinit, loader state, anchor observer, SplitText export.

## Recommended Import Style

Prefer subpath imports in projects. They are stable and keep callsites explicit:

```js
import { Switcher } from '@soinproduction/kit/content-switcher';
import { ModalManager } from '@soinproduction/kit/modals';
```

Root imports are supported:

```js
import { Switcher, ModalManager } from '@soinproduction/kit';
```

