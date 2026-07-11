# Документация

Эта папка содержит подробную справку по `@soinproduction/kit`.

## Пакет

- [Импорты](imports.md)
- [Публикация](publishing.md)
- [Заметки по миграции](migration.md)

## Компоненты

- [Switcher](components/switcher.md): контроллер tabs/accordion с click/hover, несколькими trigger/content для одного id, transition lifecycle hooks и max-width breakpoints.
- [AdditionalToggle](components/additional-toggle.md): контроллер drawer/dropdown/menu с click/hover, overlay, scroll lock, transitions, promises, groups, accessibility и mobile-first breakpoints.
- [ModalManager](components/modal-manager.md): контроллер модалок с CSS или JS анимацией, transition-aware lifecycle, focus management, history/hash и per-modal config.
- [CustomSelect](components/custom-select.md): кастомный select для single/multiple значений с синхронизацией hidden input.
- [InfiniteSlider](components/infinite-slider.md): бесконечный marquee/slider.
- [ReadMore](components/read-more.md): раскрываемый контент с height-анимацией.

## Функции

- [Helpers](functions/helpers.md): AJAX, scroll lock, class helpers, sticky header, parallax, smooth scroll, CSS-переменная от размера элемента.
- [Scripts](functions/scripts.md): reinit Contact Form 7, состояние loader, anchor observer, экспорт SplitText.

## Рекомендуемый импорт

В проектах лучше использовать subpath imports. Так callsite остается явным, а bundler не тянет лишнее:

```js
import { Switcher } from '@soinproduction/kit/content-switcher';
import { ModalManager } from '@soinproduction/kit/modals';
```

Корневые импорты тоже поддерживаются:

```js
import { Switcher, ModalManager } from '@soinproduction/kit';
```
