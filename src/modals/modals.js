import { disableScroll } from "../functions/disable-scroll.js";
import { enableScroll } from "../functions/enable-scroll.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class ModalManager {
    constructor(options = {}) {
        this.options = {
            overlay: "[data-overlay]",
            modalSelector: "[data-popup]",
            triggerSelector: '[data-btn-modal], a[href^="#"]',
            closeSelector: "[data-modal-close], .close",
            innerSelector: "[data-btn-inner]",
            activeClass: "active",
            activeMode: "",
            fadeInTimeout: 300,
            fadeOutTimeout: 300,
            animationMode: "js-fade",
            waitTransition: false,
            transitionTarget: "modal",
            transitionProperty: "auto",
            transitionEvent: "transitionend",
            transitionTimeout: "auto",
            closeOnEsc: true,
            closeOnOverlayClick: true,
            focusOnOpen: "first",
            returnFocusOnClose: true,
            trapFocus: true,
            inertBackground: false,
            autoA11y: true,
            history: true,
            hash: true,
            hashMode: "push",
            closeOnBack: true,
            openOnHashLoad: true,
            queue: false,
            animationStrategy: "ignore",
            modals: {},
            bodyActiveClass: "modal-open",
            bodyModeClass: null,
            modalOpeningClass: "is-opening",
            modalClosingClass: "is-closing",
            scroll: true,
            beforeOpen: null,
            afterOpen: null,
            beforeClose: null,
            afterClose: null,
            ...options
        };

        if (this.options.queue && this.options.animationStrategy === "ignore") {
            this.options.animationStrategy = "queue";
        }

        this.overlay = this._getElement(this.options.overlay);
        if (!this.overlay) {
            console.error("ModalManager: Overlay element not found!");
            return;
        }

        this.modals = [];
        this.currentModal = null;
        this.previousModal = null;
        this.lastTrigger = null;
        this._animating = false;
        this._operationQueue = Promise.resolve();
        this._operationToken = 0;
        this._inertElements = [];
        this._listeners = [];

        this.hooks = {
            beforeOpen: this.options.beforeOpen,
            afterOpen: this.options.afterOpen,
            beforeClose: this.options.beforeClose,
            afterClose: this.options.afterClose
        };

        this.on = (name, fn) => {
            this.hooks[name] = fn;
            return this;
        };
        this.off = (name) => {
            this.hooks[name] = null;
            return this;
        };
        this.once = (name, fn) => {
            const wrap = async (ctx) => {
                try {
                    await fn(ctx);
                } finally {
                    this.off(name);
                }
            };

            return this.on(name, wrap);
        };

        this.reinit();
    }

    /* ================= setup ================= */

    reinit() {
        this.destroy(false);

        this.overlay = this._getElement(this.options.overlay);
        this.modals = Array.from(this.overlay?.querySelectorAll(this.options.modalSelector) || []);

        if (!this.modals.length) {
            console.warn(`ModalManager: No modals found inside ${this.options.overlay}`);
        }

        this._bindEvents();
        this._setAriaForAllHidden();

        if (this.options.openOnHashLoad) {
            this._checkURLHashOnLoad();
        }
    }

    destroy(clearState = true) {
        this._listeners.forEach(({ el, type, handler, opts }) => {
            el.removeEventListener(type, handler, opts);
        });
        this._listeners = [];

        if (clearState) {
            this._clearInert();
            enableScroll();
        }
    }

    _on(el, type, handler, opts) {
        if (!el) return;
        el.addEventListener(type, handler, opts);
        this._listeners.push({ el, type, handler, opts });
    }

    _bindEvents() {
        this._on(document, "click", (event) => {
            const innerBtn = event.target.closest(this.options.innerSelector);
            if (innerBtn) {
                const to = innerBtn.getAttribute("data-btn-inner");
                if (to) {
                    event.preventDefault();
                    this.switchTo(to, { event, trigger: innerBtn });
                    return;
                }
            }

            const closeBtn = event.target.closest(this.options.closeSelector);
            if (closeBtn && this.overlay.contains(closeBtn)) {
                event.preventDefault();
                this.close(null, { event, closeReason: "button" });
                return;
            }

            const trigger = event.target.closest(this.options.triggerSelector);
            if (!trigger) return;

            const modalId = this._getModalIdFromTrigger(trigger);
            if (modalId && this.getModal(modalId)) {
                event.preventDefault();
                this.open(modalId, { event, trigger });
            }
        });

        this._on(this.overlay, "click", (event) => {
            if (event.target !== this.overlay) return;

            const currentId = this.getCurrent()?.id;
            const config = currentId ? this._getModalOptions(currentId) : this.options;

            if (config.closeOnOverlayClick !== false) {
                this.close(null, { event, closeReason: "overlay" });
            }
        });

        this._on(document, "keydown", (event) => {
            if (event.key === "Escape") {
                const currentId = this.getCurrent()?.id;
                const config = currentId ? this._getModalOptions(currentId) : this.options;

                if (config.closeOnEsc !== false) {
                    this.close(null, { event, closeReason: "escape" });
                }
            }

            if (event.key === "Tab" && this.options.trapFocus && this.currentModal) {
                this._trapFocus(event, this.currentModal);
            }
        });

        this._on(window, "popstate", () => {
            if (!this.options.closeOnBack) return;

            const modalId = (history.state && history.state.modal) || (window.location.hash || "").slice(1);
            if (modalId && this.getModal(modalId)) {
                this.open(modalId, { closeReason: "history" });
                return;
            }

            this.closeAll({ force: true, closeReason: "history" });
        });
    }

    /* ================= public API ================= */

    open(id, options = {}) {
        return this._runOperation(() => this._open(id, options));
    }

    close(id = null, options = {}) {
        return this._runOperation(() => this._close(id, options));
    }

    closeAll(options = {}) {
        return this._runOperation(() => this._closeAll(options));
    }

    toggle(id, options = {}) {
        const modal = this.getModal(id);
        if (!modal) return Promise.resolve(false);

        return this.isOpen(id) ? this.close(id, options) : this.open(id, options);
    }

    switchTo(id, options = {}) {
        return this._runOperation(() => this._open(id, { ...options, action: "switch", closeReason: "switch" }));
    }

    openModal(id, options = {}) {
        return this.open(id, options);
    }

    closeAllModals(options = {}) {
        return this.closeAll(options);
    }

    isOpen(id = null) {
        if (!id) return !!this.currentModal;

        const modal = this.getModal(id);
        const options = modal ? this._getModalOptions(this._getModalId(modal)) : this.options;

        return !!modal && modal.classList.contains(options.activeClass);
    }

    getCurrent() {
        if (!this.currentModal) return null;

        return {
            id: this._getModalId(this.currentModal),
            modal: this.currentModal
        };
    }

    getModal(id) {
        return this._getModalEl(id);
    }

    /* ================= operations ================= */

    _runOperation(task) {
        const strategy = this.options.animationStrategy;

        if (this._animating) {
            if (strategy === "queue") {
                this._operationQueue = this._operationQueue.then(task, task);
                return this._operationQueue;
            }

            if (strategy === "interrupt") {
                this._operationToken++;
            } else {
                return Promise.resolve(false);
            }
        }

        return task();
    }

    async _open(modalId, options = {}) {
        const modal = this._getModalEl(modalId);
        if (!modal) {
            console.error(`ModalManager: Modal "${modalId}" not found`);
            return false;
        }

        const token = ++this._operationToken;
        const id = this._getModalId(modal);
        const modalOptions = this._getModalOptions(id);
        const action = options.action || (this.currentModal && this.currentModal !== modal ? "switch" : "open");
        const previousModal = this.currentModal;
        const trigger = options.trigger || null;
        const event = options.event || null;

        if (this.currentModal === modal && this.isOpen(id)) return true;

        this._animating = true;
        this.previousModal = previousModal;
        this.lastTrigger = trigger || document.activeElement;

        const beforeCtx = this._createContext({
            id,
            modal,
            trigger,
            event,
            action,
            phase: "beforeOpen",
            previousModal,
            currentModal: this.currentModal,
            closeReason: options.closeReason || null,
            options: modalOptions
        });

        this._emit("modal:beforeopen", beforeCtx);
        const canOpen = await this._callHook("beforeOpen", beforeCtx);
        if (canOpen === false) {
            this._animating = false;
            return false;
        }

        if (previousModal && previousModal !== modal) {
            const closed = await this._close(this._getModalId(previousModal), {
                force: true,
                keepOverlay: true,
                keepAnimating: true,
                operationToken: token,
                closeReason: "switch",
                action: "switch",
                event,
                trigger
            });

            if (!closed && this.options.animationStrategy !== "interrupt") {
                this._animating = false;
                return false;
            }
        }

        this._setOverlayActive(true, id, modalOptions);
        this._setBodyActive(true, id);
        this._setModalOpening(modal, true);
        this._showModal(modal, modalOptions);

        if (modalOptions.scroll !== false) {
            disableScroll();
        }

        this.currentModal = modal;
        this._setA11yForOpen(modal, trigger);
        this._setInert(true);

        await this._waitLifecycle(beforeCtx, "open", token);

        this._setModalOpening(modal, false);
        this._focusOnOpen(modal, modalOptions);
        this._updateHash(id);

        const afterCtx = this._createContext({
            id,
            modal,
            trigger,
            event,
            action,
            phase: "afterOpen",
            previousModal,
            currentModal: modal,
            closeReason: options.closeReason || null,
            options: modalOptions
        });

        await this._callHook("afterOpen", afterCtx);
        this._emit("modal:afteropen", afterCtx);

        if (this._operationToken === token) {
            this._animating = false;
        }

        return true;
    }

    async _close(id = null, options = {}) {
        const modal = id ? this._getModalEl(id) : this.currentModal;
        if (!modal || !this._visible(modal)) return true;

        const token = options.operationToken || ++this._operationToken;
        const modalId = this._getModalId(modal);
        const modalOptions = this._getModalOptions(modalId);
        const event = options.event || null;
        const action = options.action || "close";
        const closeReason = options.closeReason || "api";

        this._animating = true;

        const beforeCtx = this._createContext({
            id: modalId,
            modal,
            trigger: options.trigger || this.lastTrigger,
            event,
            action,
            phase: "beforeClose",
            previousModal: modal,
            currentModal: this.currentModal,
            closeReason,
            options: modalOptions
        });

        this._emit("modal:beforeclose", beforeCtx);
        if (!options.force) {
            const canClose = await this._callHook("beforeClose", beforeCtx);
            if (canClose === false) {
                this._animating = false;
                return false;
            }
        }

        this._setModalClosing(modal, true);
        this._hideModal(modal, modalOptions);

        if (!options.keepOverlay) {
            this._setOverlayActive(false, modalId, modalOptions);
            this._setBodyActive(false);
        }

        await this._waitLifecycle(beforeCtx, "close", token);

        this._setModalClosing(modal, false);

        if (!options.keepOverlay) {
            enableScroll();
            this.currentModal = null;
            this._setAriaForAllHidden();
            this._setInert(false);
            this._clearHash();
        } else if (this.currentModal === modal) {
            this.currentModal = null;
        }

        this._returnFocus(modalOptions);

        const afterCtx = this._createContext({
            id: modalId,
            modal,
            trigger: options.trigger || this.lastTrigger,
            event,
            action,
            phase: "afterClose",
            previousModal: modal,
            currentModal: this.currentModal,
            closeReason,
            options: modalOptions
        });

        await this._callHook("afterClose", afterCtx);
        this._emit("modal:afterclose", afterCtx);

        if (!options.keepAnimating && this._operationToken === token) {
            this._animating = false;
        }

        return true;
    }

    async _closeAll(options = {}) {
        if (this._animating && !options.force && this.options.animationStrategy === "ignore") return false;

        const except = options.except || null;
        const toClose = this.modals.filter((modal) => {
            const id = this._getModalId(modal);
            if (except && id === except) return false;
            return this._visible(modal);
        });

        const results = [];

        for (const modal of toClose) {
            results.push(await this._close(this._getModalId(modal), {
                ...options,
                keepOverlay: options.keepOverlay,
                force: options.force
            }));
        }

        if (!toClose.length && !options.keepOverlay) {
            this._setOverlayActive(false);
            this._setBodyActive(false);
            enableScroll();
            this.currentModal = null;
            this._setAriaForAllHidden();
            this._setInert(false);
            this._clearHash();
        }

        return results.every(Boolean);
    }

    /* ================= rendering ================= */

    _showModal(modal, options) {
        modal.classList.add(options.activeClass);

        if (options.animationMode === "js-fade") {
            modal.style.display = "flex";
            modal.style.opacity = "0";
            modal.style.transition = `opacity ${options.fadeInTimeout}ms`;
            modal.offsetHeight;
            modal.style.opacity = "1";
        }
    }

    _hideModal(modal, options) {
        modal.classList.remove(options.activeClass);

        if (options.animationMode === "js-fade") {
            modal.style.opacity = "0";
            modal.style.transition = `opacity ${options.fadeOutTimeout}ms`;
            setTimeout(() => {
                if (!modal.classList.contains(options.activeClass)) {
                    modal.style.display = "none";
                }
            }, options.fadeOutTimeout);
        }
    }

    _setOverlayActive(on, id = null, options = this.options) {
        this.overlay.classList.toggle(options.activeClass, on);

        const modeClass = this._getBodyModeClass(id);
        if (this.options.activeMode) {
            this.overlay.classList.toggle(this.options.activeMode, on);
        }
        if (modeClass) {
            this.overlay.classList.toggle(modeClass, on);
        }

        if (this.options.autoA11y) {
            this.overlay.setAttribute("aria-hidden", on ? "false" : "true");
        }
    }

    _setBodyActive(on, id = null) {
        if (this.options.bodyActiveClass) {
            document.body.classList.toggle(this.options.bodyActiveClass, on);
        }

        const modeClass = this._getBodyModeClass(id);
        if (modeClass) {
            document.body.classList.toggle(modeClass, on);
        }
    }

    _getBodyModeClass(id) {
        if (!this.options.bodyModeClass || !id) return "";

        return typeof this.options.bodyModeClass === "function"
            ? this.options.bodyModeClass(id)
            : this.options.bodyModeClass;
    }

    _setModalOpening(modal, on) {
        if (this.options.modalOpeningClass) {
            modal.classList.toggle(this.options.modalOpeningClass, on);
        }
    }

    _setModalClosing(modal, on) {
        if (this.options.modalClosingClass) {
            modal.classList.toggle(this.options.modalClosingClass, on);
        }
    }

    /* ================= lifecycle ================= */

    _createContext(payload) {
        return {
            manager: this,
            overlay: this.overlay,
            ...payload
        };
    }

    async _callHook(name, ctx) {
        const modalHook = ctx.options?.[name];
        const globalHook = this.hooks?.[name];

        try {
            if (name.startsWith("before")) {
                const globalResult = typeof globalHook === "function" ? await globalHook(ctx) : undefined;
                if (globalResult === false) return false;

                const modalResult = typeof modalHook === "function" ? await modalHook(ctx) : undefined;
                if (modalResult === false) return false;
            } else {
                if (typeof modalHook === "function") await modalHook(ctx);
                if (typeof globalHook === "function") await globalHook(ctx);
            }
        } catch (error) {
            console.error(`ModalManager: hook "${name}" error`, error);
        }

        return undefined;
    }

    _emit(type, ctx) {
        this.overlay.dispatchEvent(new CustomEvent(type, {
            bubbles: true,
            detail: ctx
        }));
    }

    async _waitLifecycle(ctx, phase, token) {
        const options = ctx.options || this.options;

        if (options.waitTransition) {
            await this._waitTransition(ctx);
        } else {
            await sleep(phase === "open" ? options.fadeInTimeout : options.fadeOutTimeout);
        }

        return this._operationToken === token;
    }

    _waitTransition(ctx) {
        const targets = this._resolveTransitionTargets(ctx);
        if (!targets.length) return Promise.resolve();

        const meaningfulTargets = targets.filter((target) => this._getTargetTiming(target, ctx).total > 0);
        if (!meaningfulTargets.length) return Promise.resolve();

        return Promise.all(meaningfulTargets.map((target) => this._waitElementTransition(target, ctx))).then(() => undefined);
    }

    _resolveTransitionTargets(ctx) {
        const option = ctx.options.transitionTarget || "modal";

        if (option === "modal") return ctx.modal ? [ctx.modal] : [];
        if (option === "overlay") return this.overlay ? [this.overlay] : [];
        if (typeof option === "string") return [...document.querySelectorAll(option)];
        if (option instanceof HTMLElement) return [option];
        if (typeof option === "function") {
            const result = option(ctx);
            if (result instanceof HTMLElement) return [result];
            if (Array.isArray(result) || NodeList.prototype.isPrototypeOf(result)) {
                return [...result].filter((el) => el instanceof HTMLElement);
            }
        }

        return [];
    }

    _waitElementTransition(target, ctx) {
        return new Promise((resolve) => {
            const timing = this._getTargetTiming(target, ctx);
            if (!timing.total) {
                resolve();
                return;
            }

            const events = this._getTransitionEvents(ctx.options.transitionEvent);
            const cleanup = () => {
                events.forEach((eventName) => target.removeEventListener(eventName, onEnd));
                clearTimeout(timer);
            };
            const finish = () => {
                cleanup();
                resolve();
            };
            const onEnd = (event) => {
                if (event.target !== target) return;
                if (!this._isExpectedTransitionEvent(event, ctx)) return;
                finish();
            };

            events.forEach((eventName) => target.addEventListener(eventName, onEnd));

            const fallback = typeof ctx.options.transitionTimeout === "number"
                ? ctx.options.transitionTimeout
                : timing.total + 50;
            const timer = setTimeout(finish, fallback || this.options.fadeOutTimeout);
        });
    }

    _getTransitionEvents(eventName) {
        if (eventName === "auto") return ["transitionend", "animationend"];
        if (eventName === "animationend") return ["animationend"];

        return ["transitionend"];
    }

    _isExpectedTransitionEvent(event, ctx) {
        if (event.type === "animationend") return true;

        const property = ctx.options.transitionProperty;
        if (property === "auto") return true;

        const properties = Array.isArray(property) ? property : [property];

        return properties.includes(event.propertyName) || event.propertyName === "all";
    }

    _getTargetTiming(target, ctx) {
        const styles = window.getComputedStyle(target);
        const eventType = ctx.options.transitionEvent;
        const transitionTotal = eventType === "transitionend" || eventType === "auto"
            ? this._getTransitionTiming(styles, ctx.options.transitionProperty)
            : 0;
        const animationTotal = eventType === "animationend" || eventType === "auto"
            ? this._getAnimationTiming(styles)
            : 0;

        return { total: Math.max(transitionTotal, animationTotal) };
    }

    _getTransitionTiming(styles, property = "auto") {
        const properties = this._splitList(styles.transitionProperty);
        if (!properties.length || properties.every((item) => item === "none")) return 0;

        const durations = this._splitList(styles.transitionDuration).map((value) => this._parseTime(value));
        const delays = this._splitList(styles.transitionDelay).map((value) => this._parseTime(value));
        const expected = property === "auto"
            ? null
            : Array.isArray(property) ? property : [property];

        return properties.reduce((total, transitionProperty, index) => {
            const matches = !expected ||
                expected.includes(transitionProperty) ||
                transitionProperty === "all";
            if (!matches) return total;

            const duration = durations[index % durations.length] || 0;
            const delay = delays[index % delays.length] || 0;

            return Math.max(total, duration + delay);
        }, 0);
    }

    _getAnimationTiming(styles) {
        const names = this._splitList(styles.animationName);
        if (!names.length || names.every((name) => name === "none")) return 0;

        const durations = this._splitList(styles.animationDuration).map((value) => this._parseTime(value));
        const delays = this._splitList(styles.animationDelay).map((value) => this._parseTime(value));

        return durations.reduce((total, duration, index) => {
            const delay = delays[index % delays.length] || 0;
            return Math.max(total, duration + delay);
        }, 0);
    }

    _splitList(value) {
        return String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    _parseTime(value) {
        const time = parseFloat(value);
        if (!time) return 0;

        return String(value).trim().endsWith("ms") ? time : time * 1000;
    }

    /* ================= focus / a11y / history ================= */

    _setAriaForAllHidden() {
        if (!this.options.autoA11y || !this.overlay) return;

        this.modals.forEach((modal) => {
            modal.setAttribute("aria-hidden", "true");
            if (!modal.getAttribute("role")) modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-modal", "true");
        });
        this.overlay.setAttribute("aria-hidden", "true");
        document.querySelectorAll(this.options.triggerSelector).forEach((trigger) => {
            if (trigger.hasAttribute("data-btn-modal")) {
                trigger.setAttribute("aria-expanded", "false");
            }
        });
    }

    _setA11yForOpen(modal, trigger) {
        if (!this.options.autoA11y) return;

        this.modals.forEach((item) => item.setAttribute("aria-hidden", item === modal ? "false" : "true"));
        modal.setAttribute("role", modal.getAttribute("role") || "dialog");
        modal.setAttribute("aria-modal", "true");
        this.overlay.setAttribute("aria-hidden", "false");

        const id = this._getModalId(modal);
        document.querySelectorAll(this.options.triggerSelector).forEach((btn) => {
            if (this._getModalIdFromTrigger(btn) !== id) return;

            btn.setAttribute("aria-expanded", "true");
            if (modal.id) {
                btn.setAttribute("aria-controls", modal.id);
            }
        });

        if (trigger && this._getModalIdFromTrigger(trigger) === id) {
            trigger.setAttribute("aria-expanded", "true");
        }
    }

    _focusOnOpen(modal, options) {
        const target = this._resolveFocusTarget(options.focusOnOpen, modal);
        if (target && typeof target.focus === "function") {
            target.focus();
        }
    }

    _returnFocus(options) {
        if (options.returnFocusOnClose === false) return;

        const target = this.lastTrigger;
        if (target && typeof target.focus === "function") {
            target.focus();
        }
    }

    _resolveFocusTarget(ref, modal) {
        if (ref === false) return null;
        if (ref instanceof HTMLElement) return ref;
        if (typeof ref === "string" && ref !== "first") return modal.querySelector(ref);

        return modal.querySelector([
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "[tabindex]:not([tabindex='-1'])"
        ].join(","));
    }

    _trapFocus(event, modal) {
        const focusables = Array.from(modal.querySelectorAll([
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "[tabindex]:not([tabindex='-1'])"
        ].join(","))).filter((el) => el.offsetParent !== null);

        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    _setInert(on) {
        if (!this.options.inertBackground) return;

        if (!on) {
            this._clearInert();
            return;
        }

        this._inertElements = Array.from(document.body.children)
            .filter((el) => el !== this.overlay);

        this._inertElements.forEach((el) => {
            el.inert = true;
        });
    }

    _clearInert() {
        this._inertElements.forEach((el) => {
            el.inert = false;
        });
        this._inertElements = [];
    }

    _updateHash(id) {
        if (!this.options.history || !this.options.hash) return;

        const currentHash = (window.location.hash || "").slice(1);
        if (currentHash === id) return;

        const method = this.options.hashMode === "replace" ? "replaceState" : "pushState";
        history[method]({ modal: id }, "", `#${id}`);
    }

    _clearHash() {
        if (!this.options.history || !this.options.hash) return;

        const url = new URL(window.location.href);
        url.hash = "";
        history.replaceState({}, "", url.toString());
    }

    _checkURLHashOnLoad() {
        const modalId = (window.location.hash || "").slice(1);
        if (modalId && this.getModal(modalId)) {
            this.open(modalId, { closeReason: "history" });
        }
    }

    /* ================= lookup ================= */

    _getElement(ref) {
        if (!ref) return null;
        if (typeof ref === "string") return document.querySelector(ref);
        if (ref instanceof HTMLElement) return ref;
        return null;
    }

    _getModalEl(modalId) {
        if (!modalId) return null;
        const safeModalId = window.CSS?.escape ? CSS.escape(modalId) : String(modalId).replace(/["\\]/g, "\\$&");

        return this.overlay.querySelector(`[data-popup="${safeModalId}"]`);
    }

    _getModalId(modal) {
        return modal?.getAttribute("data-popup") || "";
    }

    _getModalOptions(id) {
        return {
            ...this.options,
            ...(this.options.modals?.[id] || {})
        };
    }

    _getModalIdFromTrigger(trigger) {
        if (!trigger) return "";

        if (trigger.hasAttribute("data-btn-modal")) {
            return (trigger.getAttribute("data-btn-modal") || "").trim();
        }

        const href = (trigger.getAttribute("href") || "").trim();
        if (!href || !href.startsWith("#")) return "";

        return href.slice(1);
    }

    _visible(el) {
        const options = this._getModalOptions(this._getModalId(el));

        return el.classList.contains(options.activeClass) || this.currentModal === el;
    }
}
