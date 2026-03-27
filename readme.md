# @soinproduction/kit

UI-kit с модульной структурой и стабильными поштучными импортами.

## Установка

```bash
npm i @soinproduction/kit
```

## Быстрый старт

```js
import { ModalManager, CustomSelect } from '@soinproduction/kit';
```

В пакете **нет default export**. Используй только named imports.

## Поштучные импорты (рекомендуется)

### Компоненты

```js
import { Switcher } from '@soinproduction/kit/content-switcher';
import { AdditionalToggle } from '@soinproduction/kit/drawers';
import { InfiniteSlider } from '@soinproduction/kit/infinity-slider';
import { CustomSelect } from '@soinproduction/kit/custom-select';
import { ReadMore } from '@soinproduction/kit/read-more';
import { ModalManager } from '@soinproduction/kit/modals';
```

### Функции

```js
import { disableScroll, enableScroll } from '@soinproduction/kit/functions';
import { getAjaxData } from '@soinproduction/kit/functions/ajax-get-data';
import { fadeIn, fadeOut } from '@soinproduction/kit/functions/customFunctions';
```

### Scripts

```js
import { AnchorObserver, cf7Reinit, loaderInstanse } from '@soinproduction/kit/functions/scripts';
```

## Доступ к demo/html/scss-файлам

Файлы шаблонов и стилей остаются в публикации и доступны через `src/*`:

```js
import '@soinproduction/kit/src/custom-select/select.scss';
```

```txt
@soinproduction/kit/src/custom-select/index.html
@soinproduction/kit/src/drawers/index.html
@soinproduction/kit/src/read-more-admin/index.html
@soinproduction/kit/src/infinitySlider/slider.html
```

## Экспортируемые entrypoints

- `@soinproduction/kit`
- `@soinproduction/kit/content-switcher`
- `@soinproduction/kit/drawers`
- `@soinproduction/kit/infinity-slider`
- `@soinproduction/kit/custom-select`
- `@soinproduction/kit/read-more`
- `@soinproduction/kit/modals`
- `@soinproduction/kit/functions`
- `@soinproduction/kit/functions/*`
- `@soinproduction/kit/functions/scripts`
- `@soinproduction/kit/functions/scripts/*`
- `@soinproduction/kit/src/*` (assets/demo)

## Локальная сборка

```bash
npm run build
```

## Публикация

```bash
npm version patch
npm publish --access public
```
