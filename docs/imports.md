# Карта импортов

## Root

Корневой entrypoint экспортирует основные компоненты и helpers:

```js
import {
  Switcher,
  AdditionalToggle,
  ModalManager,
  InfiniteSlider,
  CustomSelect,
  ReadMore,
  disableScroll,
  enableScroll,
} from '@soinproduction/kit';
```

## Components

Рекомендуемый формат для проектов:

```js
import { Switcher } from '@soinproduction/kit/content-switcher';
import { Switcher } from '@soinproduction/kit/contentSwitcher';

import { AdditionalToggle } from '@soinproduction/kit/drawers';

import { ModalManager } from '@soinproduction/kit/modals';

import { InfiniteSlider } from '@soinproduction/kit/infinity-slider';
import { InfiniteSlider } from '@soinproduction/kit/infinitySlider';

import { CustomSelect, selectInstace, selectInstance } from '@soinproduction/kit/custom-select';
import { CustomSelect, selectInstace, selectInstance } from '@soinproduction/kit/customSelect';

import { ReadMore } from '@soinproduction/kit/read-more';
import { ReadMore } from '@soinproduction/kit/readMore';
```

`selectInstace` оставлен как существующий export. `selectInstance` добавлен как более читаемый alias.

## Functions

```js
import {
  getAjaxData,
  disableScroll,
  enableScroll,
  elementSize,
  fadeIn,
  fadeOut,
  addMultiListener,
  even,
  addClassOnCondition,
  removeClassOnCondition,
  toggleClassOnCondition,
  classToScroll,
  stickyHeader,
  scrollToSection,
  initParallaxEffect,
  animateInit,
  scrollToElement,
} from '@soinproduction/kit/functions';
```

Можно импортировать отдельный файл:

```js
import { disableScroll } from '@soinproduction/kit/functions/disable-scroll';
```

## Scripts

```js
import {
  AnchorObserver,
  cf7Reinit,
  loaderInstanse,
  SplitText,
} from '@soinproduction/kit/functions/scripts';
```

## Demo Assets

HTML/SCSS демо-файлы доступны через `src/*`:

```js
import '@soinproduction/kit/src/custom-select/select.scss';
```

Примеры:

```txt
@soinproduction/kit/src/content-switcher/index.html
@soinproduction/kit/src/drawers/index.html
@soinproduction/kit/src/custom-select/index.html
@soinproduction/kit/src/read-more-admin/index.html
@soinproduction/kit/src/infinitySlider/slider.html
```
