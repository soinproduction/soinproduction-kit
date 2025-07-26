export class Switcher {
    constructor(selector, options = {}) {
        this.selector = selector;
        this.baseOptions = {
            mode: 'tabs',
            single: false,
            breakpoint: null,
            default: null,
            activeClass: 'active',
            attrNav: 'data-id',
            attrContent: 'data-content',
            showInfo: false,
            responsive: null, // { breakpoint: 768, mode: 'accordion' }
            autoInitNested: true,
            onOpen: null,
            onClose: null,
            beforeOpen: null,
            afterClose: null,
            ...options,
        };

        this.options = { ...this.baseOptions };
        this.currentMode = this.options.mode;
        this.elements = document.querySelectorAll(this.selector);
        this.instances = [];
        this.handlers = new WeakMap();

        this.initResponsive();
        this.init();

        if (this.options.showInfo) this.showInfo();
    }

    initResponsive() {
        if (!this.baseOptions.responsive) return;

        const { breakpoint, mode } = this.baseOptions.responsive;
        const media = window.matchMedia(`(max-width: ${breakpoint}px)`);

        const updateMode = () => {
            const newMode = media.matches ? mode : this.baseOptions.mode;
            if (newMode !== this.currentMode) {
                this.currentMode = newMode;
                this.options.mode = newMode;
                this.reinit();
            }
        };

        media.addEventListener('change', updateMode);
        updateMode();
    }

    init() {
        this.instances = [];

        this.elements.forEach(parent => {
            const buttons = parent.querySelectorAll(`[${this.options.attrNav}]`);
            const contents = parent.querySelectorAll(`[${this.options.attrContent}]`);
            const isSingle = this.options.single || parent.dataset.single === 'true';
            const breakpoint = this.options.breakpoint || parseInt(parent.dataset.breakpoint) || null;
            const defaultId = parent.dataset.default || this.options.default;

            if (defaultId) {
                this._forceOpen(defaultId, parent);
            }

            buttons.forEach(btn => {
                const handler = (e) => {
                    e.preventDefault();
                    const id = btn.getAttribute(this.options.attrNav);
                    const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);
                    if (!content) return;

                    const isOpen = content.classList.contains(this.options.activeClass);

                    if (this.options.mode === 'accordion') {
                        if (isOpen) {
                            this._close(content, btn, id, parent);
                        } else {
                            if (isSingle && (!breakpoint || window.innerWidth <= breakpoint)) {
                                this._closeAll(parent);
                            }
                            this._open(content, btn, id, parent);
                        }
                    } else {
                        this._closeAll(parent);
                        this._open(content, btn, id, parent);
                    }
                };

                this.handlers.set(btn, handler);
                btn.addEventListener('click', handler);
            });

            this.instances.push({ parent, buttons, contents });
        });
    }

    _open(content, btn, id, parent) {
        if (typeof this.options.beforeOpen === 'function') {
            this.options.beforeOpen(id, { btn, content, parent });
        }

        if (this.options.mode === 'accordion') {
            content.style.maxHeight = `${content.scrollHeight}px`;
        }

        btn.classList.add(this.options.activeClass);
        btn.parentNode?.classList.add(this.options.activeClass);
        content.classList.add(this.options.activeClass);

        if (typeof this.options.onOpen === 'function') {
            this.options.onOpen(id, { btn, content, parent });
        }

        if (this.options.autoInitNested) {
            this._initNested(content);
        }
    }

    _close(content, btn, id, parent) {
        if (this.options.mode === 'accordion') {
            content.style.maxHeight = '0';
        }

        btn.classList.remove(this.options.activeClass);
        btn.parentNode?.classList.remove(this.options.activeClass);
        content.classList.remove(this.options.activeClass);

        if (typeof this.options.onClose === 'function') {
            this.options.onClose(id, { btn, content, parent });
        }

        if (typeof this.options.afterClose === 'function') {
            this.options.afterClose(id, { btn, content, parent });
        }
    }

    _closeAll(parent) {
        const buttons = parent.querySelectorAll(`[${this.options.attrNav}]`);
        const contents = parent.querySelectorAll(`[${this.options.attrContent}]`);

        buttons.forEach(btn => btn.classList.remove(this.options.activeClass));
        contents.forEach(cont => {
            cont.classList.remove(this.options.activeClass);
            if (this.options.mode === 'accordion') cont.style.maxHeight = '0';
        });
    }

    _forceOpen(id, parent) {
        const btn = parent.querySelector(`[${this.options.attrNav}="${id}"]`);
        const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);
        if (btn && content) {
            this._open(content, btn, id, parent);
        }
    }

    _initNested(context) {
        const nestedSelectors = ['.tabs-wrapper', '.accordion'];
        nestedSelectors.forEach(sel => {
            context.querySelectorAll(sel).forEach(el => {
                if (!el.dataset.switcherInited) {
                    new Switcher(sel, this.baseOptions);
                    el.dataset.switcherInited = 'true';
                }
            });
        });
    }

    open(id) {
        this.instances.forEach(({ parent }) => {
            const btn = parent.querySelector(`[${this.options.attrNav}="${id}"]`);
            const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);
            if (btn && content) this._open(content, btn, id, parent);
        });
    }

    close(id) {
        this.instances.forEach(({ parent }) => {
            const btn = parent.querySelector(`[${this.options.attrNav}="${id}"]`);
            const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);
            if (btn && content) this._close(content, btn, id, parent);
        });
    }

    toggle(id) {
        this.instances.forEach(({ parent }) => {
            const btn = parent.querySelector(`[${this.options.attrNav}="${id}"]`);
            const content = parent.querySelector(`[${this.options.attrContent}="${id}"]`);
            if (!btn || !content) return;

            const isOpen = content.classList.contains(this.options.activeClass);
            if (isOpen) {
                this._close(content, btn, id, parent);
            } else {
                this._open(content, btn, id, parent);
            }
        });
    }

    reinit() {
        this.destroy();
        this.init();
    }

    destroy() {
        this.instances.forEach(({ buttons }) => {
            buttons.forEach(btn => {
                const handler = this.handlers.get(btn);
                if (handler) btn.removeEventListener('click', handler);
            });
        });
        this.instances = [];
        this.handlers = new WeakMap();
    }

    showInfo() {
        console.groupCollapsed('%c📌 Switcher Info', 'color: #3b82f6; font-weight: bold');
        console.log('%cOptions:', 'color: #999', this.options);
        console.table([
            { name: 'mode', desc: '"tabs" | "accordion"' },
            { name: 'responsive.mode', desc: 'режим после breakpoint' },
            { name: 'responsive.breakpoint', desc: 'max-width px' },
            { name: 'single', desc: 'для accordion — 1 открыт' },
            { name: 'attrNav', desc: 'Атрибут кнопки (напр. data-id)' },
            { name: 'attrContent', desc: 'Атрибут контента (напр. data-content)' },
            { name: 'autoInitNested', desc: 'включить вложенные Switcher' }
        ]);
        console.log('%cМетоды:', 'color: #999');
        console.table([
            { name: 'open(id)', desc: 'Принудительно открыть блок' },
            { name: 'close(id)', desc: 'Принудительно закрыть блок' },
            { name: 'toggle(id)', desc: 'Переключить состояние' },
            { name: 'reinit()', desc: 'Переинициализация' },
            { name: 'destroy()', desc: 'Удалить слушатели и сбросить' }
        ]);
        console.log('%cСобытия:', 'color: #999');
        console.table([
            { name: 'onOpen(id, ctx)', desc: 'При открытии' },
            { name: 'onClose(id, ctx)', desc: 'При закрытии' },
            { name: 'beforeOpen(id, ctx)', desc: 'Перед открытием' },
            { name: 'afterClose(id, ctx)', desc: 'После закрытия' }
        ]);
        console.groupEnd();
    }
}

