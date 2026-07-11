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
     * @param {'click'|'hover'} options.triggerEvent - Событие для открытия
     * @param {boolean} options.showInfo - Показывать отладочную информацию
     * @param {Object|null} options.responsive - Настройки адаптивности {breakpoint: number, mode: string}
     * @param {Object|null} options.breakpoints - Карта адаптивных переопределений {640: {single: false}}
     * @param {boolean} options.autoInitNested - Автоинициализация вложенных элементов
     * @param {boolean} options.resetMaxHeightAfterOpen - Сбрасывать max-height после завершения открытия
     * @param {Function|null} options.onOpen - Колбэк при открытии
     * @param {Function|null} options.afterOpen - Колбэк после завершения открытия
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
            triggerEvent: 'click',
            showInfo: false,
            responsive: null,
            breakpoints: null,
            autoInitNested: true,
            resetMaxHeightAfterOpen: false,
            onOpen: null,
            afterOpen: null,
            onClose: null,
            beforeOpen: null,
            afterClose: null,
        };

        this.defaultOptions = defaultOptions;
        this.baseOptions = { ...defaultOptions, ...options };
        this.options = { ...this.baseOptions };
        this.currentMode = this.options.mode;
        this.handlers = new WeakMap();
        this.transitionTokens = new WeakMap();
        this.currentBreakpointKey = null;
        this.instances = [];
    }

    _setupInstances() {
        this.instances = Array.from(this.elements).map(parent => {
            const buttons = Array.from(parent.querySelectorAll(`[${this.options.attrNav}]`));
            const contents = Array.from(parent.querySelectorAll(`[${this.options.attrContent}]`));

            this._setupEventListeners(parent, buttons);
            this._activateDefault(parent);

            return { parent, buttons, contents };
        });
    }

    _setupEventListeners(parent, buttons) {
        buttons.forEach(btn => {
            const triggerEvent = this._getTriggerEvent(parent);
            const handlers = [];

            if (triggerEvent === 'hover') {
                const openHandler = (e) => this._handleTrigger(e, btn, parent);
                const clickHandler = (e) => this._handleTrigger(e, btn, parent);

                btn.addEventListener('mouseenter', openHandler);
                btn.addEventListener('focus', openHandler);
                btn.addEventListener('click', clickHandler);

                handlers.push(['mouseenter', openHandler], ['focus', openHandler], ['click', clickHandler]);
            } else {
                const clickHandler = (e) => this._handleTrigger(e, btn, parent);

                btn.addEventListener('click', clickHandler);
                handlers.push(['click', clickHandler]);
            }

            this.handlers.set(btn, handlers);
        });
    }

    _getTriggerEvent(parent) {
        const triggerEvent = parent.dataset.triggerEvent || this.options.triggerEvent;

        return triggerEvent === 'hover' ? 'hover' : 'click';
    }

    _activateDefault(parent) {
        const defaultId = parent.dataset.default || this.options.default;
        if (defaultId) {
            this._forceOpen(defaultId, parent);
        }
    }

    _initResponsive() {
        if (!this.baseOptions.responsive && !this.baseOptions.breakpoints) return;

        this._applyResponsiveOptions();

        window.addEventListener('resize', this._handleResponsiveChange);
    }

    _handleResponsiveChange = () => {
        const previousOptions = this.options;

        this._applyResponsiveOptions();

        if (this._shouldReinitForOptions(previousOptions, this.options)) {
            this.currentMode = this.options.mode;
            this.reinit();
        }
    }

    _applyResponsiveOptions() {
        const { key, options } = this._getBreakpointOptions();

        this.currentBreakpointKey = key;
        this.options = { ...this.baseOptions, ...options };
        this.currentMode = this.options.mode;
    }

    _getBreakpointOptions() {
        const breakpoints = this._mergeBreakpointOptions(
            this._getLegacyResponsiveBreakpoint(),
            this.baseOptions.breakpoints || {}
        );
        const width = window.innerWidth;
        const breakpointKey = Object.keys(breakpoints)
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => a - b)
            .find(breakpoint => width <= breakpoint);

        if (!breakpointKey) {
            return { key: null, options: {} };
        }

        return {
            key: breakpointKey,
            options: breakpoints[breakpointKey] || {},
        };
    }

    _mergeBreakpointOptions(...breakpointGroups) {
        return breakpointGroups.reduce((merged, group) => {
            Object.entries(group || {}).forEach(([breakpoint, options]) => {
                merged[breakpoint] = {
                    ...(merged[breakpoint] || {}),
                    ...(options || {}),
                };
            });

            return merged;
        }, {});
    }

    _getLegacyResponsiveBreakpoint() {
        if (!this.baseOptions.responsive?.breakpoint) {
            return {};
        }

        return {
            [this.baseOptions.responsive.breakpoint]: {
                mode: this.baseOptions.responsive.mode,
            },
        };
    }

    _shouldReinitForOptions(previousOptions, nextOptions) {
        const reinitKeys = ['mode', 'triggerEvent', 'attrNav', 'attrContent'];

        return reinitKeys.some(key => previousOptions[key] !== nextOptions[key]);
    }

    _handleTrigger(e, btn, parent) {
        if (e.type === 'click') {
            e.preventDefault();
        }

        const id = btn.getAttribute(this.options.attrNav);
        const { buttons, contents } = this._getTargets(id, parent);
        if (!buttons.length || !contents.length) return;

        const isOpen = contents.some(content => content.classList.contains(this.options.activeClass));
        const isHoverTrigger = this._getTriggerEvent(parent) === 'hover';

        if (this.currentMode === 'accordion') {
            isOpen
                ? !isHoverTrigger && this._close(contents, buttons, id, parent, e, btn)
                : this._openAccordion(contents, buttons, id, parent, e, btn);
        } else {
            this._openTab(contents, buttons, id, parent, e, btn);
        }
    }

    _openTab(contents, buttons, id, parent, event = null, triggerButton = null) {
        this._executeCallback('beforeOpen', id, this._createContext(buttons, contents, parent, event, triggerButton));
        this._closeAll(parent);
        this._toggleElements(contents, buttons, true, parent);
        this._executeCallback('onOpen', id, this._createContext(buttons, contents, parent, event, triggerButton));
        contents.forEach(content => this._initNested(content));
    }

    _openAccordion(contents, buttons, id, parent, event = null, triggerButton = null) {
        const context = this._createContext(buttons, contents, parent, event, triggerButton);

        this._executeCallback('beforeOpen', id, context);

        const shouldCloseOthers = this.options.single &&
            (!this.options.breakpoint || window.innerWidth <= this.options.breakpoint);

        if (shouldCloseOthers) {
            this._closeAll(parent, id, event);
        }

        this._toggleElements(contents, buttons, true, parent);
        this._executeCallback('onOpen', id, context);
        contents.forEach(content => this._initNested(content));

        this._afterTransition(contents, () => {
            this._executeCallback('afterOpen', id, context);

            if (this.options.resetMaxHeightAfterOpen) {
                contents.forEach(content => {
                    content.style.maxHeight = 'initial';
                });
            }
        });
    }

    _close(contents, buttons, id, parent, event = null, triggerButton = null) {
        const context = this._createContext(buttons, contents, parent, event, triggerButton);

        if (this.currentMode === 'accordion') {
            contents.forEach(content => {
                this._prepareAccordionClose(content);
            });
        }

        this._toggleElements(contents, buttons, false, parent);
        this._executeCallback('onClose', id, context);

        if (this.currentMode === 'accordion') {
            this._afterTransition(contents, () => {
                this._executeCallback('afterClose', id, context);
            });
        } else {
            this._executeCallback('afterClose', id, context);
        }
    }

    _toggleElements(contents, buttons, isOpen, parent) {
        const method = isOpen ? 'add' : 'remove';

        buttons.forEach(btn => {
            btn.classList[method](this.options.activeClass);

            const wrapper = btn.closest('[class*="item"]');
            wrapper?.classList[method](this.options.activeClass);
        });

        contents.forEach(content => {
            content.classList[method](this.options.activeClass);

            if (isOpen && this.currentMode === 'accordion') {
                content.style.maxHeight = `${content.scrollHeight}px`;
            }
        });
    }

    _closeAll(parent, exceptId = null, event = null) {
        const instance = this.instances.find(inst => inst.parent === parent);
        if (!instance) return;

        if (this.currentMode === 'accordion') {
            this._getActiveIds(instance)
                .filter(id => id !== exceptId)
                .forEach(id => {
                    const { buttons, contents } = this._getTargets(id, parent);
                    this._close(contents, buttons, id, parent, event);
                });

            return;
        }

        instance.buttons.forEach(btn => {
            btn.classList.remove(this.options.activeClass);
            const wrapper = btn.closest('[class*="item"]');
            wrapper?.classList.remove(this.options.activeClass);
        });

        instance.contents.forEach(content => {
            content.classList.remove(this.options.activeClass);
        });
    }

    _forceOpen(id, parent) {
        const { buttons, contents } = this._getTargets(id, parent);

        if (buttons.length && contents.length) {
            this._toggleElements(contents, buttons, true, parent);
        }
    }

    _getInstance(parent) {
        return this.instances.find(inst => inst.parent === parent);
    }

    _getTargets(id, parent) {
        const instance = this._getInstance(parent);
        const buttons = instance
            ? instance.buttons.filter(btn => btn.getAttribute(this.options.attrNav) === id)
            : Array.from(parent.querySelectorAll(`[${this.options.attrNav}]`)).filter(btn => btn.getAttribute(this.options.attrNav) === id);
        const contents = instance
            ? instance.contents.filter(content => content.getAttribute(this.options.attrContent) === id)
            : Array.from(parent.querySelectorAll(`[${this.options.attrContent}]`)).filter(content => content.getAttribute(this.options.attrContent) === id);

        return { buttons, contents };
    }

    _getActiveIds(instance) {
        return [...new Set(instance.contents
            .filter(content => content.classList.contains(this.options.activeClass))
            .map(content => content.getAttribute(this.options.attrContent))
            .filter(Boolean))];
    }

    _createContext(buttons, contents, parent, event = null, triggerButton = null) {
        const button = triggerButton || buttons[0] || null;

        return {
            btn: button,
            button,
            content: contents[0] || null,
            buttons,
            contents,
            parent,
            event,
        };
    }

    _prepareAccordionClose(content) {
        if (content.style.maxHeight === 'initial' || content.style.maxHeight === 'none' || !content.style.maxHeight) {
            content.style.maxHeight = `${content.scrollHeight}px`;
            content.offsetHeight;
        }

        content.style.maxHeight = '0';
    }

    _afterTransition(contents, callback, property = 'max-height') {
        const tokens = contents.map(content => {
            const token = Symbol('switcher-transition');
            this.transitionTokens.set(content, token);

            return { content, token };
        });

        Promise.all(tokens.map(({ content }) => this._waitTransition(content, property))).then(() => {
            const isCurrent = tokens.every(({ content, token }) => this.transitionTokens.get(content) === token);

            if (isCurrent) {
                callback();
            }
        });
    }

    _waitTransition(content, property = 'max-height') {
        return new Promise(resolve => {
            const { duration, total } = this._getTransitionTiming(content, property);

            if (!duration) {
                resolve();
                return;
            }

            const cleanup = () => {
                content.removeEventListener('transitionend', onEnd);
                clearTimeout(timer);
            };

            const onEnd = event => {
                if (event.target === content && (event.propertyName === property || event.propertyName === 'all')) {
                    cleanup();
                    resolve();
                }
            };

            content.addEventListener('transitionend', onEnd);

            const timer = setTimeout(() => {
                cleanup();
                resolve();
            }, total + 50);
        });
    }

    _getTransitionTiming(content, property = 'max-height') {
        const styles = window.getComputedStyle(content);
        const properties = this._splitTransitionList(styles.transitionProperty);
        const durations = this._splitTransitionList(styles.transitionDuration).map(value => this._parseTransitionTime(value));
        const delays = this._splitTransitionList(styles.transitionDelay).map(value => this._parseTransitionTime(value));

        let duration = 0;
        let total = 0;

        properties.forEach((transitionProperty, index) => {
            if (transitionProperty !== property && transitionProperty !== 'all') return;

            const currentDuration = durations[index % durations.length] || 0;
            const currentDelay = delays[index % delays.length] || 0;

            if (currentDuration > 0 && currentDuration + currentDelay > total) {
                duration = currentDuration;
                total = currentDuration + currentDelay;
            }
        });

        return { duration, total };
    }

    _splitTransitionList(value) {
        return String(value || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }

    _parseTransitionTime(value) {
        const time = parseFloat(value);

        if (!time) return 0;

        return String(value).trim().endsWith('ms') ? time : time * 1000;
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
        console.log('%cCurrent breakpoint:', 'color: #10b981', this.currentBreakpointKey);
        console.log('%cInstances:', 'color: #10b981', this.instances);
        console.log('%cOptions:', 'color: #10b981', this.options);
        console.groupEnd();
    }

    // === Public Methods ===

    open(id) {
        this.instances.forEach(({ parent }) => {
            const { buttons, contents } = this._getTargets(id, parent);

            if (buttons.length && contents.length) {
                this.currentMode === 'accordion'
                    ? this._openAccordion(contents, buttons, id, parent)
                    : this._openTab(contents, buttons, id, parent);
            }
        });
    }

    close(id) {
        this.instances.forEach(({ parent }) => {
            const { buttons, contents } = this._getTargets(id, parent);

            if (buttons.length && contents.length) {
                this._close(contents, buttons, id, parent);
            }
        });
    }

    toggle(id) {
        this.instances.forEach(({ parent }) => {
            const { buttons, contents } = this._getTargets(id, parent);

            if (!buttons.length || !contents.length) return;

            const isOpen = contents.some(content => content.classList.contains(this.options.activeClass));
            isOpen
                ? this._close(contents, buttons, id, parent)
                : this.currentMode === 'accordion'
                    ? this._openAccordion(contents, buttons, id, parent)
                    : this._openTab(contents, buttons, id, parent);
        });
    }

    reinit() {
        this.destroy(false);
        this._setupInstances();
    }

    destroy(removeResponsive = true) {
        if (removeResponsive && this._handleResponsiveChange) {
            window.removeEventListener('resize', this._handleResponsiveChange);
        }

        this.instances.forEach(({ buttons }) => {
            buttons.forEach(btn => {
                const handlers = this.handlers.get(btn);
                if (handlers) {
                    handlers.forEach(([eventName, handler]) => {
                        btn.removeEventListener(eventName, handler);
                    });
                }
            });
        });

        this.instances = [];
        this.handlers = new WeakMap();
    }
}
