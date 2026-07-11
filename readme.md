# @soinproduction/kit

Modular front-end kit for WordPress/theme work: lifecycle-aware UI controllers, DOM helpers, scroll locking, AJAX utilities, and small production scripts.

The package has no default export. Use named imports from the root entry or preferred subpath imports.

## Install

```bash
npm i @soinproduction/kit
```

## Quick Start

```js
import { Switcher } from '@soinproduction/kit/content-switcher';
import { AdditionalToggle } from '@soinproduction/kit/drawers';
import { ModalManager } from '@soinproduction/kit/modals';
```

```js
new Switcher('[data-tabs]', {
  mode: 'tabs',
  attrNav: 'data-tab',
  attrContent: 'data-tab-content',
});

const menu = new AdditionalToggle({
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

const modals = new ModalManager({
  animationMode: 'css-class',
  waitTransition: true,
  transitionTarget: 'modal',
});
```

## Documentation

Start here:

- [Documentation index](docs/README.md)
- [Import map](docs/imports.md)
- [Publishing and release checklist](docs/publishing.md)
- [Migration notes](docs/migration.md)

Components:

- [Switcher](docs/components/switcher.md)
- [AdditionalToggle](docs/components/additional-toggle.md)
- [ModalManager](docs/components/modal-manager.md)
- [CustomSelect](docs/components/custom-select.md)
- [InfiniteSlider](docs/components/infinite-slider.md)
- [ReadMore](docs/components/read-more.md)

Functions and scripts:

- [DOM and scroll helpers](docs/functions/helpers.md)
- [Scripts](docs/functions/scripts.md)

## Entrypoints

```js
import {
  Switcher,
  AdditionalToggle,
  ModalManager,
  InfiniteSlider,
  CustomSelect,
  ReadMore,
} from '@soinproduction/kit';
```

Preferred subpath imports:

```js
import { Switcher } from '@soinproduction/kit/content-switcher';
import { AdditionalToggle } from '@soinproduction/kit/drawers';
import { ModalManager } from '@soinproduction/kit/modals';
import { InfiniteSlider } from '@soinproduction/kit/infinity-slider';
import { CustomSelect } from '@soinproduction/kit/custom-select';
import { ReadMore } from '@soinproduction/kit/read-more';
import { disableScroll, enableScroll } from '@soinproduction/kit/functions';
import { AnchorObserver, cf7Reinit, loaderInstanse } from '@soinproduction/kit/functions/scripts';
```

## Demo and Source Assets

Demo HTML and SCSS files are published through `src/*`:

```js
import '@soinproduction/kit/src/custom-select/select.scss';
```

Useful paths:

```txt
@soinproduction/kit/src/content-switcher/index.html
@soinproduction/kit/src/drawers/index.html
@soinproduction/kit/src/custom-select/index.html
@soinproduction/kit/src/read-more-admin/index.html
@soinproduction/kit/src/infinitySlider/slider.html
```

## Local Development

```bash
npm run build
npm pack --dry-run --cache /private/tmp/soinproduction-kit-npm-cache
```

## Publish

```bash
npm login
npm publish --access public --cache /private/tmp/soinproduction-kit-npm-cache
```

