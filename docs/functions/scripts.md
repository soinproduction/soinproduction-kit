# Scripts

```js
import { AnchorObserver, cf7Reinit, loaderInstanse } from '@soinproduction/kit/functions/scripts';
```

## AnchorObserver

Highlights anchor links based on visible sections.

```js
const observer = new AnchorObserver({
  threshold: 0.4,
  anchorSelector: '.nav a',
  sectionSelector: 'section[id]',
  activeClass: 'active',
});

observer.reinit();
observer.disconnect();
```

## Contact Form 7 Reinit

Useful after loading CF7 markup through AJAX or injecting it into a modal.

```js
cf7Reinit(document.querySelector('[data-modal]'));
```

It updates the form action hash and calls `wpcf7.initForm()` / `wpcf7.refill()` when available.

## Loader State

```js
loaderInstanse(document.querySelector('[data-loader]'), true);
loaderInstanse(document.querySelector('[data-loader]'), false);
```

Sets `data-loader` to the provided flag.

## SplitText

`SplitText.js` is published as a script asset under:

```txt
@soinproduction/kit/functions/scripts/SplitText
@soinproduction/kit/src/functions/scripts/SplitText.js
```

It is the GreenSock SplitText-compatible helper bundled in the source tree.

