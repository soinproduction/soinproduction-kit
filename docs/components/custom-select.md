# CustomSelect

`CustomSelect` turns custom markup into a single or multiple select with selected value rendering and hidden input synchronization.

```js
import { CustomSelect, selectInstance } from '@soinproduction/kit/custom-select';
import '@soinproduction/kit/src/custom-select/select.scss';
```

## Markup

```html
<div class="custom-select" data-category-select>
  <div class="select-field">
    <div class="selected-options">
      <span class="placeholder">Choose item</span>
    </div>
  </div>

  <div class="options-container">
    <div class="option" data-value="design">
      <span class="option-text">Design</span>
    </div>
    <div class="option" data-value="development">
      <span class="option-text">Development</span>
    </div>
  </div>

  <div class="selected-values"></div>
</div>
```

## Usage

```js
const select = new CustomSelect('[data-category-select]', {
  mode: 'multiple',
  placeholder: 'Choose categories',
  name: 'categories',
  onSelect(value) {},
  onRemove(value) {},
});
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `mode` | `'multiple'` | `'multiple'` or `'single'`. |
| `showRemoveButton` | `true` | Render remove button inside selected chips. |
| `placeholder` | `'Выберите элемент'` | Placeholder label. |
| `onSelect` | `null` | Called with selected value. |
| `onRemove` | `null` | Called with removed value. |
| `hideOnSelect` | `false` | Single mode: close dropdown after select. |
| `hideOnClear` | `false` | Close dropdown after clearing last value. |
| `name` | `'custom-select-value'` | Hidden input name. |
| `showInfo` | `false` | Log methods table. |

## Methods

```js
select.onSelect((value) => {});
select.onRemove((value) => {});

select.setValue('design');
select.setValues(['design', 'development']);
select.getValues();
select.clear();
select.reset();

select.disableOptions(['design']);
select.enableOptions('design');
select.enableAllOptions();

select.toggleDropdown();
select.closeDropdown();
select.destroy();
```

## Notes

- Selected values are stored in a hidden input.
- Multiple mode serializes values with `|`.
- The global `selectInstance` map stores instances by container element.

