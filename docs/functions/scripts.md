# Scripts

Импорт:

```js
import { AnchorObserver, cf7Reinit, loaderInstanse, SplitText } from '@soinproduction/kit/functions/scripts';
```

## AnchorObserver

`AnchorObserver` следит за anchor/section состоянием через observer.

```js
const observer = new AnchorObserver({
  links: '[data-anchor-link]',
  sections: '[data-anchor-section]',
  activeClass: 'is-active',
});
```

Подходит для sticky navigation, table of contents и подсветки текущего section при scroll.

## Contact Form 7 Reinit

```js
cf7Reinit(container);
```

Переинициализирует Contact Form 7 после динамической вставки формы. Полезно для AJAX-loaded modal/drawer content.

## Loader State

```js
loaderInstanse.show();
loaderInstanse.hide();
```

`loaderInstanse` управляет глобальным loader-состоянием, если проект использует соответствующий markup/classes.

## SplitText

```js
import { SplitText } from '@soinproduction/kit/functions/scripts/SplitText';
```

`SplitText` экспортируется как utility для разбивки текста на части перед анимацией.
