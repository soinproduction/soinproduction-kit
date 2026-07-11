# CustomSelect

Импорт:

```js
import { CustomSelect, selectInstace, selectInstance } from '@soinproduction/kit/custom-select';
```

`CustomSelect` создает кастомный select поверх markup и синхронизирует выбранные значения с hidden input. Поддерживает single/multiple режимы, remove button, placeholder, callbacks и программное управление.

## Markup

```html
<div class="custom-select" data-custom-select data-name="service">
  <button type="button" data-custom-select-current>Select service</button>
  <div data-custom-select-dropdown>
    <button type="button" data-custom-select-option value="design">Design</button>
    <button type="button" data-custom-select-option value="dev">Development</button>
  </div>
  <input type="hidden" name="service" data-custom-select-input>
</div>
```

Для multiple:

```html
<div data-custom-select data-mode="multiple" data-name="services">
  ...
</div>
```

## Использование

```js
const select = new CustomSelect('[data-custom-select]', {
  mode: 'single',
  placeholder: 'Choose option',
  onSelect(value, ctx) {},
  onRemove(value, ctx) {},
});
```

`selectInstace` и `selectInstance` хранят instances в `Map`.

## Options

| Option | Default | Описание |
| --- | --- | --- |
| `mode` | `'single'` | `'single'` или `'multiple'`. |
| `showRemoveButton` | `true` | Показывать кнопку удаления выбранного значения. |
| `placeholder` | `''` | Текст, когда ничего не выбрано. |
| `onSelect` | `null` | Callback при выборе. |
| `onRemove` | `null` | Callback при удалении. |
| `hideOnSelect` | `true` | Закрывать dropdown после выбора. |
| `hideOnClear` | `true` | Закрывать dropdown после clear. |
| `name` | `null` | Имя hidden input. |
| `showInfo` | `false` | Включить debug-информацию. |

## Методы

```js
select.setValue('design');
select.setValues(['design', 'dev']);
select.clear();
select.reset();

select.getValues();

select.disableOptions(['dev']);
select.enableOptions(['dev']);
select.enableAllOptions();

select.toggleDropdown();
select.closeDropdown();
select.destroy();
```

Callbacks:

```js
select.onSelect((value, ctx) => {});
select.onRemove((value, ctx) => {});
```

## Notes

- Значение берется из `value` option-кнопки.
- В multiple режиме hidden input получает список выбранных значений.
- `selectInstance` - alias для старого `selectInstace`.
