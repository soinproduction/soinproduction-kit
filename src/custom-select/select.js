export const selectInstace = new Map();

export class CustomSelect {
    /**
     * @param {HTMLElement|string} element
     * @param {Object} config
     * @param {"multiple"|"single"} [config.mode="multiple"]
     * @param {boolean} [config.showRemoveButton=true]
     * @param {string} [config.placeholder="Выберите элемент"]
     * @param {function} [config.onSelect=null]
     * @param {function} [config.onRemove=null]
     * @param {boolean} [config.hideOnSelect=false]
     * @param {boolean} [config.hideOnClear=false]
     * @param {string} [config.name="custom-select-value"]
     * @param {boolean} [config.showInfo=false]
     */
    constructor(element, config = {}) {
        this.container = this.#resolveElement(element);

        if (!this.container) {
            const hint = typeof element === 'string' ? `по селектору "${element}"` : '(DOM-элемент не передан/удалён)';
            throw new Error(`Контейнер не найден ${hint}`);
        }

        this.selectField = this.container.querySelector('.select-field');
        this.optionsContainer = this.container.querySelector('.options-container');
        this.selectedOptionsContainer = this.container.querySelector('.selected-options');
        this.selectedValuesContainer = this.container.querySelector('.selected-values');

        if (!this.selectField || !this.optionsContainer || !this.selectedOptionsContainer) {
            throw new Error('Не найдены необходимые элементы: .select-field, .options-container, .selected-options');
        }

        this.config = {
            mode: config.mode || 'multiple',
            showRemoveButton: config.showRemoveButton !== false,
            placeholder: config.placeholder || 'Выберите элемент',
            onSelect: typeof config.onSelect === 'function' ? config.onSelect : null,
            onRemove: typeof config.onRemove === 'function' ? config.onRemove : null,
            hideOnSelect: config.hideOnSelect === true,
            hideOnClear: config.hideOnClear === true,
            name: config.name || 'custom-select-value',
            showInfo: config.showInfo === true,
        };

        this.selectedValues = new Set();
        this.suppressEvents = false;
        this.isInitialized = false;
        this.prevHiddenValue = '';

        this.hiddenInput = document.createElement('input');
        this.hiddenInput.type = 'hidden';
        this.hiddenInput.name = this.config.name;
        this.container.insertAdjacentElement('afterbegin', this.hiddenInput);

        this.container.setAttribute('role', 'combobox');
        this.container.setAttribute('aria-haspopup', 'listbox');
        this.container.setAttribute('aria-expanded', 'false');
        this.optionsContainer.setAttribute('role', 'listbox');
        if (this.config.mode === 'multiple') {
            this.optionsContainer.setAttribute('aria-multiselectable', 'true');
        }

        this.#onToggleClick = this.#handleToggleClick.bind(this);
        this.#onDocClick = this.#handleDocumentClick.bind(this);
        this.#onKeydown = this.#handleKeydown.bind(this);
        this.#onOptionsClick = this.#handleOptionsClick.bind(this);
        this.#onFormReset = this.#handleFormReset.bind(this);
        this.init();

        selectInstace.set(this.container, this);

        if (this.config.showInfo) this.logAvailableMethods();
    }

    onSelect(callback) { this.config.onSelect = typeof callback === 'function' ? callback : null; }
    onRemove(callback) { this.config.onRemove = typeof callback === 'function' ? callback : null; }

    init() {

        this.selectField.addEventListener('click', this.#onToggleClick);
        this.optionsContainer.addEventListener('click', this.#onOptionsClick);

        document.addEventListener('click', this.#onDocClick);
        document.addEventListener('keydown', this.#onKeydown);

        const ph = this.selectedOptionsContainer.querySelector('.placeholder');
        if (ph) ph.textContent = this.config.placeholder;

        const initiallyActive = this.optionsContainer.querySelectorAll('.option.active:not(.disabled)');
        this.suppressEvents = true;
        initiallyActive.forEach((option) => {
            const value = option.dataset.value;
            if (value != null && value !== '') this.setValue(value);
        });
        this.suppressEvents = false;

        if (initiallyActive.length > 0) this.container.classList.add('selected');

        const form = this.container.closest('form');
        if (form) form.addEventListener('reset', this.#onFormReset);

        this.isInitialized = true;
    }

    #handleFormReset() {
        setTimeout(() => this.reset(), 0);
    }

    #handleToggleClick(e) {
        e.stopPropagation();
        this.toggleDropdown();
    }

    #handleDocumentClick(e) {
        if (!this.container.contains(e.target)) this.closeDropdown();
    }

    #handleKeydown(e) {
        if (e.key === 'Escape') this.closeDropdown();
    }

    #handleOptionsClick(e) {
        e.stopPropagation();

        const option = e.target.closest('.option');
        if (!option || !this.optionsContainer.contains(option)) return;
        if (option.classList.contains('disabled')) return;

        const value = option.dataset.value;
        if (value == null || value === '') return;

        if (this.config.mode === 'single') {
            const [prev] = this.selectedValues;
            if (prev != null && prev !== value) {
                this.removeValue(prev);
                const prevEl = this.optionsContainer.querySelector(`.option[data-value="${CSS.escape(prev)}"]`);
                if (prevEl) prevEl.classList.remove('active');
            }
        }

        if (this.selectedValues.has(value)) {
            this.removeValue(value);
            option.classList.remove('active');
        } else {
            this.addValue(value);
            option.classList.add('active');

            if (this.config.onSelect && this.isInitialized && !this.suppressEvents) {
                this.config.onSelect(value);
            }
            if (this.config.mode === 'single' && this.config.hideOnSelect) {
                this.closeDropdown();
            }
        }
    }

    #resolveElement(el) {
        if (!el) return null;
        if (typeof el === 'string') return document.querySelector(el);
        if (el instanceof HTMLElement) return el;
        return null;
    }

    toggleDropdown() {
        const willOpen = !this.optionsContainer.classList.contains('active');


        if (willOpen) {
            for (const [container, instance] of selectInstace.entries()) {
                if (container !== this.container) instance.closeDropdown();
            }
        }

        this.selectField.classList.toggle('active', willOpen);
        this.optionsContainer.classList.toggle('active', willOpen);
        this.container.setAttribute('aria-expanded', String(willOpen));
    }

    closeDropdown() {
        this.selectField.classList.remove('active');
        this.optionsContainer.classList.remove('active');
        this.container.setAttribute('aria-expanded', 'false');
    }

    addValue(value) {
        if (this.selectedValues.has(value)) return;

        const option = this.optionsContainer.querySelector(`.option[data-value="${value}"]`);
        if (!option || option.classList.contains('disabled')) return;

        this.selectedValues.add(value);

        const icon = option.querySelector('i.sprite')?.cloneNode(true);
        const text = option.querySelector('.option-text')?.textContent || value;

        const selectedOption = document.createElement('div');
        selectedOption.className = 'selected-option';
        selectedOption.dataset.value = value;

        const content = document.createElement('span');
        content.classList.add('option-label');
        content.textContent = text;

        if (icon) {
            selectedOption.appendChild(icon || document.createElement('span'));
        }
        selectedOption.appendChild(content);

        if (this.config.showRemoveButton) {
            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-btn';
            removeBtn.dataset.value = value;
            removeBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 12">
                    <path fill="currentColor" d="M.2.2a1 1 0 0 1 1.1 0L6 5 10.7.2a.8.8 0 0 1 1 1.1L7.2 6l4.7 4.7a.8.8 0 1 1-1.1 1L6 7.2l-4.7 4.7a.8.8 0 1 1-1-1.1L4.8 6 .2 1.3a.8.8 0 0 1 0-1Z"/>
                </svg>`;
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeValue(value);
            });
            selectedOption.appendChild(removeBtn);
        }

        const placeholder = this.selectedOptionsContainer.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        this.selectedOptionsContainer.appendChild(selectedOption);
        this.updateSelectedValuesDisplay();
        this.updateHiddenInput();
    }

    removeValue(value) {
        if (!this.selectedValues.has(value)) return;

        this.selectedValues.delete(value);

        const selectedOption = this.selectedOptionsContainer.querySelector(`.selected-option[data-value="${CSS.escape(value)}"]`);
        if (selectedOption) selectedOption.remove();

        const option = this.optionsContainer.querySelector(`.option[data-value="${CSS.escape(value)}"]`);
        if (option && !option.classList.contains('disabled')) option.classList.remove('active');

        if (this.config.onRemove && !this.suppressEvents) this.config.onRemove(value);

        if (this.selectedValues.size === 0) {
            const placeholder = document.createElement('span');
            placeholder.className = 'placeholder';
            placeholder.textContent = this.config.placeholder;
            this.selectedOptionsContainer.appendChild(placeholder);
            this.container.classList.remove('selected');
            if (this.config.hideOnClear) this.closeDropdown();
        }

        this.updateSelectedValuesDisplay();
        this.updateHiddenInput();
    }

    updateSelectedValuesDisplay() {
        if (!this.selectedValuesContainer) return;

        this.selectedValuesContainer.innerHTML = '';

        if (this.selectedValues.size === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'Нет выбранных элементов';
            this.selectedValuesContainer.appendChild(empty);
            return;
        }

        for (const value of this.selectedValues) {
            const option = this.optionsContainer.querySelector(`.option[data-value="${CSS.escape(value)}"]`);
            if (!option) continue;

            const icon = option.querySelector('i.sprite')?.cloneNode(true) || null;
            const text = (option.querySelector('.option-text')?.textContent || String(value)).trim();

            const item = document.createElement('div');
            item.className = 'selected-value-item';
            if (icon) item.appendChild(icon);

            const label = document.createElement('span');
            label.textContent = text;
            item.appendChild(label);

            this.selectedValuesContainer.appendChild(item);
        }
    }

    updateHiddenInput() {
        const values = Array.from(this.selectedValues);
        const next =
            this.config.mode === 'multiple' ? values.join('|') : (values[0] || '');

        if (next === this.prevHiddenValue) return;

        this.hiddenInput.value = next;
        this.prevHiddenValue = next;

        this.hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    setValue(value) {
        if (this.config.mode === 'single') this.clear();

        const option = this.optionsContainer.querySelector(`.option[data-value="${CSS.escape(value)}"]`);
        if (option && !option.classList.contains('disabled')) {
            this.addValue(value);
            option.classList.add('active');

            if (!this.suppressEvents && this.config.onSelect && this.isInitialized) {
                this.config.onSelect(value);
            }
            this.updateHiddenInput();
        }
    }

    setValues(values) {
        if (!Array.isArray(values)) return;

        if (this.config.mode === 'single') {
            this.setValue(values[0]);
            return;
        }

        for (const value of values) {
            const option = this.optionsContainer.querySelector(`.option[data-value="${CSS.escape(value)}"]`);
            if (option && !option.classList.contains('disabled')) {
                this.addValue(value);
                option.classList.add('active');
                if (!this.suppressEvents && this.config.onSelect && this.isInitialized) {
                    this.config.onSelect(value);
                }
            }
        }
        this.updateHiddenInput();
    }

    clear() {
        const toRemove = Array.from(this.selectedValues);
        for (const v of toRemove) this.removeValue(v);
        this.updateHiddenInput();
    }

    reset() { this.clear(); }

    getValues() { return Array.from(this.selectedValues); }

    disableOptions(values) {
        const arr = Array.isArray(values) ? values : [values];
        for (const value of arr) {
            const option = this.optionsContainer.querySelector(`.option[data-value="${CSS.escape(value)}"]`);
            if (!option) continue;

            option.classList.add('disabled');
            option.setAttribute('aria-disabled', 'true');

            if (this.selectedValues.has(value)) this.removeValue(value);
        }
    }

    enableOptions(values) {
        const arr = Array.isArray(values) ? values : [values];
        for (const value of arr) {
            const option = this.optionsContainer.querySelector(`.option[data-value="${CSS.escape(value)}"]`);
            if (!option) continue;

            option.classList.remove('disabled');
            option.removeAttribute('aria-disabled');
        }
    }

    enableAllOptions() {
        const options = this.optionsContainer.querySelectorAll('.option');
        options.forEach((option) => {
            option.classList.remove('disabled');
            option.removeAttribute('aria-disabled');
        });
    }

    logAvailableMethods() {
        const methodNames = Object.getOwnPropertyNames(CustomSelect.prototype)
            .filter((name) => typeof this[name] === 'function' && name !== 'constructor')
            .map((name) => ({
                method: name + '()',
                description: this.getMethodDescription(name),
            }));

        console.groupCollapsed('[CustomSelect] Available methods');
        console.table(methodNames);
        console.groupEnd();
    }

    getMethodDescription(methodName) {
        const descriptions = {
            onSelect: 'Установить callback при выборе',
            onRemove: 'Установить callback при удалении',
            setValue: 'Установить одно значение',
            setValues: 'Установить список значений',
            clear: 'Очистить выбранные значения',
            getValues: 'Получить выбранные значения',
            reset: 'Сбросить выбранные значения (reset формы)',
            toggleDropdown: 'Открыть/закрыть выпадающий список',
            closeDropdown: 'Закрыть выпадающий список',
            addValue: 'Добавить значение вручную',
            removeValue: 'Удалить значение вручную',
            updateSelectedValuesDisplay: 'Перерисовать список выбранных',
            updateHiddenInput: 'Обновить скрытый input',
            init: 'Инициализация плагина',
            enableOptions: 'Разблокировать указанные опции',
            disableOptions: 'Заблокировать указанные опции',
            enableAllOptions: 'Разблокировать все опции',
            logAvailableMethods: 'Вывести доступные методы',
        };
        return descriptions[methodName] || '';
    }

    destroy() {
        this.selectField.removeEventListener('click', this.#onToggleClick);
        this.optionsContainer.removeEventListener('click', this.#onOptionsClick);
        document.removeEventListener('click', this.#onDocClick);
        document.removeEventListener('keydown', this.#onKeydown);

        const form = this.container.closest('form');
        if (form) form.removeEventListener('reset', this.#onFormReset);

        selectInstace.delete(this.container);
    }

    #onToggleClick = null;
    #onDocClick = null;
    #onKeydown = null;
    #onOptionsClick = null;
    #onFormReset = null;
}

