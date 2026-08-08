# @soinproduction/kit

Модульный front-end kit для WordPress-тем и обычных проектов: UI-контроллеры с lifecycle-хуками, DOM-хелперы, блокировка скролла, AJAX-утилиты и небольшие production-скрипты.

У пакета нет default export. Используй named imports из корневого entrypoint или, что лучше для проектов, subpath imports.

## Установка

```bash
npm i @soinproduction/kit
```

## Быстрый старт

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

## Документация

Начинай отсюда:

- [Индекс документации](docs/README.md)
- [Карта импортов](docs/imports.md)
- [Публикация и release checklist](docs/publishing.md)
- [Заметки по миграции](docs/migration.md)

Компоненты:

- [Switcher](docs/components/switcher.md)
- [AdditionalToggle](docs/components/additional-toggle.md)
- [ModalManager](docs/components/modal-manager.md)
- [CustomSelect](docs/components/custom-select.md)
- [InfiniteSlider](docs/components/infinite-slider.md)
- [ReadMore](docs/components/read-more.md)

Функции и скрипты:

- [DOM и scroll helpers](docs/functions/helpers.md)
- [Scripts](docs/functions/scripts.md)

## Entry Points

Корневой импорт:

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

Рекомендуемый формат - subpath imports:

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

Admin SCSS подключается через Sass package importer:

```scss
@use "pkg:@soinproduction/kit/admin";
@use "pkg:@soinproduction/kit/admin/wyse/style";
@use "pkg:@soinproduction/kit/admin/plugins/link-picker";
```

## Demo и Source Assets

Demo HTML и SCSS публикуются через `src/*`:

```js
import '@soinproduction/kit/src/custom-select/select.scss';
```

Полезные пути:

```txt
@soinproduction/kit/src/content-switcher/index.html
@soinproduction/kit/src/drawers/index.html
@soinproduction/kit/src/custom-select/index.html
@soinproduction/kit/src/read-more-admin/index.html
@soinproduction/kit/src/infinitySlider/slider.html
```

## Локальная разработка

```bash
npm run build
npm pack --dry-run --cache /private/tmp/soinproduction-kit-npm-cache
```

## Публикация

```bash
npm login
npm publish --access public --cache /private/tmp/soinproduction-kit-npm-cache
```
