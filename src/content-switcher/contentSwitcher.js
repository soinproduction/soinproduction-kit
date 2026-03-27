/**
 * Универсальный переключатель между табами и аккордеоном с поддержкой адаптивности
 */
export class Switcher {
    /**
     * @param {string|Element|NodeList} selector - Селектор/элемент(ы) контейнера
     * @param {Object} options - Настройки
     * @param {'tabs'|'accordion'} options.mode - Режим работы
     * @param {boolean} options.single - Только один открытый элемент (для аккордеона)
     * @param {number|null} options.breakpoint - Брейкпоинт для single-режима
     * @param {string|null} options.default - ID элемента по умолчанию
     * @param {string} options.activeClass - CSS-класс активного элемента
     * @param {string} options.attrNav - Атрибут кнопки-переключателя
     * @param {string} options.attrContent - Атрибут контента
     * @param {boolean} options.showInfo - Показывать отладочную информацию
     * @param {Object|null} options.responsive - Настройки адаптивности {breakpoint: number, mode: string}
     * @param {boolean} options.autoInitNested - Автоинициализация вложенных элементов
     * @param {Function|null} options.onOpen - Колбэк при открытии
     * @param {Function|null} options.onClose - Колбэк при закрытии
     * @param {Function|null} options.beforeOpen - Колбэк перед открытием
     * @param {Function|null} options.afterClose - Колбэк после закрытия
     */
    constructor(selector, options = {}) {
        this._validateSelector(selector);
        this._initOptions(options);
        this._setupInstances();
        this._initResponsive();

        if (this.options.showInfo) {
            this._showDebugInfo();
        }
    }

    // === Private Methods ===

    _validateSelector(selector) {
        if (typeof selector === 'string') {
            this.elements = document.querySelectorAll(selector);
        } else if (selector instanceof Element) {
            this.elements = [selector];
        } else if (selector instanceof NodeList || Array.isArray(selector)) {
            this.elements = Array.from(selector);
        } else {
            console.warn('[Switcher] Invalid selector:', selector);
            this.elements = [];
        }
    }

    _initOptions(options) {
        const defaultOptions = {
            mode: 'tabs',
            single: false,
            breakpoint: null,
            default: null,
            activeClass: 'active',
            attrNav: 'data-id',
            attrContent: 'data-content',
            showInfo: false,
            responsive: null,
            autoInitNested: true,
            onOpen: null,
            onClose: null,
            beforeOpen: null,
            afterClose: null,
        };

        this.options = { ...defaultOptions, ...options };
        this.currentMode = this.options.mode;
        this.handlers = new WeakMap();
        this.instances = [];
    }

    _setupInstances() {
        this.instances = Array.from(this.elements).map(parent => {
            const buttons = parent.querySelectorAll(`[${this.options.attrNav}]`);
            const contents = parent.querySelectorAll(`[${this.options.attrContent}]`);

            this._setupEventListeners(parent, buttons);
            this._activateDefault(parent);

            return { parent, buttons, contents };
        });
    }

    _setupEventListeners(parent, buttons) {
        buttons.forEach(btn => {
            const handler = (e) => this._handleButtonClick(e, btn, parent);
            this.handlers.set(btn, handler);
            btn.addEventListener('click', handler);
        });
    }

    _activateDefault(parent) {
        const defaultId = parent.dataset.default || this.options.default;
        if (defaultId) {
            this._forceOpen(defaultId, parent);
        }
    }

    _initResponsive() {
        if (!this.options.responsive) return;

        const mediaQuery = window.matchMedia(
            `(max-width: ${this.options.responsive.breakpoint}px)`
        );

        const handleModeChange = () => {
            const newMode = mediaQuery.matches
                ? this.options.responsive.mode
                : this.options.mode;

            if (newMode !== this.currentMode) {
                this.currentMode = newMode;
                this.reinit();
            }
        };

        mediaQuery.addEventListener('change', handleModeChange);
        handleModeChange();
    }

    _handleButtonClick(e, btn, parent) {
        e.preventDefault();

        const id = btn.getAttribute(this.options.attrNav);
        const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);
        if (!content) return;

        const isOpen = content.classList.contains(this.options.activeClass);

        if (this.currentMode === 'accordion') {
            isOpen
                ? this._close(content, btn, id, parent)
                : this._openAccordion(content, btn, id, parent);
        } else {
            this._openTab(content, btn, id, parent);
        }
    }

    _openTab(content, btn, id, parent) {
        this._executeCallback('beforeOpen', id, { btn, content, parent });
        this._closeAll(parent);
        this._toggleElements(content, btn, true, parent);
        this._executeCallback('onOpen', id, { btn, content, parent });
        this._initNested(content);
    }

    _openAccordion(content, btn, id, parent) {
        this._executeCallback('beforeOpen', id, { btn, content, parent });

        const shouldCloseOthers = this.options.single &&
            (!this.options.breakpoint || window.innerWidth <= this.options.breakpoint);

        if (shouldCloseOthers) {
            this._closeAll(parent);
        }

        this._toggleElements(content, btn, true, parent);
        this._executeCallback('onOpen', id, { btn, content, parent });
        this._initNested(content);
    }

    _close(content, btn, id, parent) {
        if (this.currentMode === 'accordion') {
            content.style.maxHeight = '0';
        }

        this._toggleElements(content, btn, false, parent);
        this._executeCallback('onClose', id, { btn, content, parent });
        this._executeCallback('afterClose', id, { btn, content, parent });
    }

    _toggleElements(content, btn, isOpen, parent) {
        const method = isOpen ? 'add' : 'remove';

        btn.classList[method](this.options.activeClass);
        content.classList[method](this.options.activeClass);

        if (isOpen && this.currentMode === 'accordion') {
            content.style.maxHeight = `${content.scrollHeight}px`;
        }

        const wrapper = btn.closest('[class*="item"]');
        wrapper?.classList[method](this.options.activeClass);
    }

    _closeAll(parent) {
        const instance = this.instances.find(inst => inst.parent === parent);
        if (!instance) return;

        instance.buttons.forEach(btn => {
            btn.classList.remove(this.options.activeClass);
            const wrapper = btn.closest('[class*="item"]');
            wrapper?.classList.remove(this.options.activeClass);
        });

        instance.contents.forEach(content => {
            content.classList.remove(this.options.activeClass);
            if (this.currentMode === 'accordion') {
                content.style.maxHeight = '0';
            }
        });
    }

    _forceOpen(id, parent) {
        const btn = parent.querySelector(`[${this.options.attrNav}="${id}"]`);
        const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);

        if (btn && content) {
            this._toggleElements(content, btn, true, parent);
        }
    }

    _initNested(context) {
        if (!this.options.autoInitNested) return;

        const nestedSelectors = ['.tabs-wrapper', '.accordion'];
        nestedSelectors.forEach(selector => {
            context.querySelectorAll(selector).forEach(el => {
                if (!el.dataset.switcherInited) {
                    new Switcher(el, this.options);
                    el.dataset.switcherInited = 'true';
                }
            });
        });
    }

    _executeCallback(name, id, context) {
        if (typeof this.options[name] === 'function') {
            this.options[name](id, context);
        }
    }

    _showDebugInfo() {
        console.groupCollapsed('%c📌 Switcher Debug Info', 'color: #3b82f6; font-weight: bold');
        console.log('%cCurrent mode:', 'color: #10b981', this.currentMode);
        console.log('%cInstances:', 'color: #10b981', this.instances);
        console.log('%cOptions:', 'color: #10b981', this.options);
        console.groupEnd();
    }

    // === Public Methods ===

    open(id) {
        this.instances.forEach(({ parent }) => {
            const btn = parent.querySelector(`[${this.options.attrNav}="${id}"]`);
            const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);

            if (btn && content) {
                this.currentMode === 'accordion'
                    ? this._openAccordion(content, btn, id, parent)
                    : this._openTab(content, btn, id, parent);
            }
        });
    }

    close(id) {
        this.instances.forEach(({ parent }) => {
            const btn = parent.querySelector(`[${this.options.attrNav}="${id}"]`);
            const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);

            if (btn && content) {
                this._close(content, btn, id, parent);
            }
        });
    }

    toggle(id) {
        this.instances.forEach(({ parent }) => {
            const btn = parent.querySelector(`[${this.options.attrNav}="${id}"]`);
            const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);

            if (!btn || !content) return;

            const isOpen = content.classList.contains(this.options.activeClass);
            isOpen
                ? this._close(content, btn, id, parent)
                : this.currentMode === 'accordion'
                    ? this._openAccordion(content, btn, id, parent)
                    : this._openTab(content, btn, id, parent);
        });
    }

    reinit() {
        this.destroy();
        this._setupInstances();
    }

    destroy() {
        this.instances.forEach(({ buttons }) => {
            buttons.forEach(btn => {
                const handler = this.handlers.get(btn);
                if (handler) {
                    btn.removeEventListener('click', handler);
                }
            });
        });

        this.instances = [];
        this.handlers = new WeakMap();
    }
}
