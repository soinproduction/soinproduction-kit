import { enableScroll } from "../functions/enable-scroll.js";
import { disableScroll } from "../functions/disable-scroll.js";

/**
 * AdditionalToggle
 * Поддерживает множественные trigger/target/close, overlay, hover, breakpoints и async lifecycle.
 */
export class AdditionalToggle {
    /**
     * @param {Object} cfg
     * @param {Array<Object>} cfg.items
     * @param {string|HTMLElement|null} [cfg.overlay=null]
     * @param {string} [cfg.activeClass='active']
     * @param {Function} [cfg.beforeOpen]
     * @param {Function} [cfg.afterOpen]
     * @param {Function} [cfg.beforeClose]
     * @param {Function} [cfg.afterClose]
     */
    constructor(cfg = {}) {
        const {
            items = [],
            overlay = null,
            activeClass = "active",
            beforeOpen = null,
            afterOpen = null,
            beforeClose = null,
            afterClose = null,
            ...globalOptions
        } = cfg;

        this.itemsConfig = items;
        this.overlaySelector = overlay;
        this.activeClass = (activeClass || "active").trim();
        this.globalOptions = this._normalizeOptions(globalOptions);

        this.gHooks = {
            beforeOpen: typeof beforeOpen === "function" ? beforeOpen : null,
            afterOpen: typeof afterOpen === "function" ? afterOpen : null,
            beforeClose: typeof beforeClose === "function" ? beforeClose : null,
            afterClose: typeof afterClose === "function" ? afterClose : null
        };

        this.instances = [];
        this.overlay = null;

        this._boundDocClick = null;
        this._boundOverlayClick = null;
        this._boundResize = null;
        this._boundKeydown = null;
        this._listeners = [];
        this._transitionTokens = new WeakMap();

        this.reinit();
    }

    /* ================= helpers ================= */

    _normalizeOptions(options = {}) {
        return {
            targetActiveClass: null,
            overlayExtraClass: "",
            scroll: false,
            overlay: true,
            clickOnOverlay: true,
            single: true,
            group: null,
            toggleOnTrigger: true,
            closeOnTrigger: true,
            triggerEvent: "click",
            hoverOpenDelay: 0,
            hoverCloseDelay: 120,
            hoverSafeArea: true,
            hoverInteractiveTarget: true,
            clickFallback: true,
            enabled: true,
            closeOnLeave: true,
            waitTransition: false,
            transitionTarget: "targets",
            transitionProperty: "auto",
            transitionEvent: "transitionend",
            transitionTimeout: "auto",
            waitAllTransitions: false,
            resetTransitionStyles: false,
            autoA11y: true,
            focusOnOpen: false,
            returnFocusOnClose: true,
            breakpoints: null,
            ...options
        };
    }

    _isNodeListLike(v) {
        return NodeList.prototype.isPrototypeOf(v) || Array.isArray(v);
    }

    _getElement(ref) {
        if (!ref) return null;
        if (typeof ref === "string") return document.querySelector(ref);
        if (ref instanceof HTMLElement) return ref;
        return null;
    }

    _getElements(ref) {
        if (!ref) return [];
        if (typeof ref === "string") return [...document.querySelectorAll(ref)];
        if (ref instanceof HTMLElement) return [ref];
        if (this._isNodeListLike(ref)) return [...ref].filter((el) => el instanceof HTMLElement);
        return [];
    }

    _on(el, type, handler, opts) {
        if (!el) return;
        el.addEventListener(type, handler, opts);
        this._listeners.push({ el, type, handler, opts });
    }

    _offAll() {
        for (const { el, type, handler, opts } of this._listeners) {
            el.removeEventListener(type, handler, opts);
        }
        this._listeners = [];
    }

    _anyOpen() {
        return this.instances.some((inst) => inst.isOpen);
    }

    _safeCall(fn, ctx) {
        if (typeof fn !== "function") return undefined;
        try {
            return fn(ctx);
        } catch (e) {
            console.error("[AdditionalToggle hook error]:", e);
            return undefined;
        }
    }

    _syncOverlayState() {
        if (!this.overlay) return;

        for (const it of this.instances) {
            if (it.overlayExtraClass) this.overlay.classList.remove(it.overlayExtraClass);
        }

        const current = this.instances.find((it) => it.isOpen && it.overlay === true);

        if (current) {
            this.overlay.classList.add(this.activeClass);
            if (current.overlayExtraClass) {
                this.overlay.classList.add(current.overlayExtraClass);
            }
        } else {
            this.overlay.classList.remove(this.activeClass);
        }
    }

    _getEffectiveItemOptions(item) {
        const baseOptions = this._normalizeOptions({
            ...this.globalOptions,
            ...item
        });
        const breakpointOptions = this._getBreakpointOptions(baseOptions.breakpoints);

        return this._normalizeOptions({
            ...baseOptions,
            ...breakpointOptions
        });
    }

    _getBreakpointOptions(breakpoints) {
        if (!breakpoints) return {};

        const width = window.innerWidth;

        return Object.keys(breakpoints)
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => a - b)
            .filter((breakpoint) => width >= breakpoint)
            .reduce((merged, breakpoint) => ({
                ...merged,
                ...(breakpoints[breakpoint] || {})
            }), {});
    }

    _isEnabled(inst) {
        if (typeof inst.enabled === "function") {
            return inst.enabled(this._createContext(inst, "toggle", "enabled"));
        }

        return inst.enabled !== false;
    }

    _hasStructuralChanges(previous, next) {
        const keys = [
            "trigger",
            "target",
            "close",
            "activeClass",
            "targetActiveClass",
            "overlay",
            "scroll",
            "single",
            "group",
            "triggerEvent",
            "hoverInteractiveTarget",
            "clickFallback",
            "clickOnOverlay",
            "enabled",
            "closeOnLeave"
        ];

        return keys.some((key) => previous[key] !== next[key]);
    }

    _clearHoverTimers(inst) {
        clearTimeout(inst.hoverOpenTimer);
        clearTimeout(inst.hoverCloseTimer);
        inst.hoverOpenTimer = null;
        inst.hoverCloseTimer = null;
    }

    _createContext(inst, action, phase, event = null, trigger = null, close = null) {
        return {
            instance: inst,
            action,
            phase,
            event,
            trigger,
            close,
            overlay: this.overlay,
            triggers: inst.triggers,
            targets: inst.targets,
            closes: inst.closes,
            activeClass: inst.activeClass,
            targetClass: inst.targetClass,
            overlayExtraClass: inst.overlayExtraClass,
            group: inst.group,
            isOpen: inst.isOpen,
            previousState: inst.previousState,
            nextState: inst.nextState,
            options: inst.options
        };
    }

    async _callBeforeHooks(inst, action, phase, event = null, trigger = null, close = null) {
        const ctx = this._createContext(inst, action, phase, event, trigger, close);
        const globalResult = await this._safeCall(this.gHooks[phase], ctx);
        if (globalResult === false) return false;

        const itemResult = await this._safeCall(inst.hooks[phase], ctx);
        if (itemResult === false) return false;

        return true;
    }

    async _callAfterHooks(inst, action, phase, event = null, trigger = null, close = null) {
        const ctx = this._createContext(inst, action, phase, event, trigger, close);

        await this._safeCall(inst.hooks[phase], ctx);
        await this._safeCall(this.gHooks[phase], ctx);
    }

    _setStateMeta(inst, previousState, nextState) {
        inst.previousState = previousState;
        inst.nextState = nextState;
    }

    _normalizeActionOptions(eventOrOptions = null) {
        if (!eventOrOptions) return {};

        if (typeof eventOrOptions.preventDefault === "function") {
            return { event: eventOrOptions };
        }

        if (typeof eventOrOptions === "object") {
            return eventOrOptions;
        }

        return {};
    }

    _isTriggerElement(inst, el) {
        return inst.triggers.some((trigger) => trigger === el || trigger.contains(el));
    }

    _isInsideHoverArea(inst, target) {
        if (!target) return false;

        const insideTrigger = inst.triggers.some((trigger) => trigger.contains(target));
        const insideTarget = inst.options.hoverInteractiveTarget &&
            inst.targets.some((targetEl) => targetEl.contains(target));

        return insideTrigger || insideTarget;
    }

    _scheduleHoverOpen(inst, event = null, trigger = null) {
        if (!this._isEnabled(inst)) return;

        clearTimeout(inst.hoverCloseTimer);
        clearTimeout(inst.hoverOpenTimer);

        inst.hoverOpenTimer = setTimeout(() => {
            this._openInstance(inst, event, trigger);
        }, inst.options.hoverOpenDelay);
    }

    _scheduleHoverClose(inst, event = null, close = null) {
        clearTimeout(inst.hoverOpenTimer);
        clearTimeout(inst.hoverCloseTimer);

        inst.hoverCloseTimer = setTimeout(() => {
            if (!inst.isOpen) return;

            this._closeInstance(inst, event, null, close);
        }, inst.options.hoverCloseDelay);
    }

    _setupClickListeners(inst) {
        inst.triggers.forEach((btn) => {
            this._on(btn, "click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!this._isEnabled(inst)) return;

                if (inst.isOpen && inst.options.toggleOnTrigger && inst.options.closeOnTrigger) {
                    this._closeInstance(inst, e, btn);
                } else if (!inst.isOpen) {
                    this._openInstance(inst, e, btn);
                }
            });
        });

        this._setupCloseListeners(inst);
    }

    _setupCloseListeners(inst) {
        inst.closes.forEach((btn) => {
            this._on(btn, "click", (e) => {
                const isTrigger = this._isTriggerElement(inst, btn);

                if (isTrigger) return;

                e.preventDefault();
                this._closeInstance(inst, e, null, btn);
            });
        });
    }

    _setupHoverListeners(inst) {
        inst.triggers.forEach((btn) => {
            this._on(btn, "mouseenter", (e) => this._scheduleHoverOpen(inst, e, btn));
            this._on(btn, "mouseleave", (e) => {
                if (!inst.options.hoverSafeArea || !this._isInsideHoverArea(inst, e.relatedTarget)) {
                    this._scheduleHoverClose(inst, e, btn);
                }
            });
            this._on(btn, "focusin", (e) => this._scheduleHoverOpen(inst, e, btn));
            this._on(btn, "focusout", (e) => {
                if (!this._isInsideHoverArea(inst, e.relatedTarget)) {
                    this._scheduleHoverClose(inst, e, btn);
                }
            });
        });

        if (inst.options.hoverInteractiveTarget) {
            inst.targets.forEach((target) => {
                this._on(target, "mouseenter", () => {
                    clearTimeout(inst.hoverCloseTimer);
                });
                this._on(target, "mouseleave", (e) => {
                    if (!inst.options.hoverSafeArea || !this._isInsideHoverArea(inst, e.relatedTarget)) {
                        this._scheduleHoverClose(inst, e, target);
                    }
                });
                this._on(target, "focusin", () => {
                    clearTimeout(inst.hoverCloseTimer);
                });
                this._on(target, "focusout", (e) => {
                    if (!this._isInsideHoverArea(inst, e.relatedTarget)) {
                        this._scheduleHoverClose(inst, e, target);
                    }
                });
            });
        }

        if (inst.options.clickFallback) {
            this._setupClickListeners(inst);
        } else {
            this._setupCloseListeners(inst);
        }
    }

    _setupInstanceListeners(inst) {
        if (!inst.targets.length || !inst.triggers.length || !this._isEnabled(inst)) return;

        const eventType = inst.options.triggerEvent;

        if (eventType === "hover") {
            this._setupHoverListeners(inst);
        } else if (eventType === "both") {
            this._setupHoverListeners(inst);
            if (!inst.options.clickFallback) {
                this._setupClickListeners(inst);
            }
        } else {
            this._setupClickListeners(inst);
        }
    }

    _syncA11y(inst) {
        if (!inst.options.autoA11y) return;

        const expanded = inst.isOpen ? "true" : "false";
        const hidden = inst.isOpen ? "false" : "true";
        const firstTargetWithId = inst.targets.find((target) => target.id);

        inst.triggers.forEach((trigger) => {
            trigger.setAttribute("aria-expanded", expanded);

            if (firstTargetWithId) {
                trigger.setAttribute("aria-controls", firstTargetWithId.id);
            }
        });

        inst.targets.forEach((target) => {
            target.setAttribute("aria-hidden", hidden);
        });
    }

    _focusOnOpen(inst) {
        const target = this._resolveFocusTarget(inst.options.focusOnOpen, inst);

        if (target && typeof target.focus === "function") {
            target.focus();
        }
    }

    _returnFocusOnClose(inst) {
        if (inst.options.returnFocusOnClose === false) return;

        const target = inst.lastTrigger || inst.triggers[0] || null;

        if (target && typeof target.focus === "function") {
            target.focus();
        }
    }

    _resolveFocusTarget(ref, inst) {
        if (ref === false || !ref) return null;
        if (typeof ref === "string") return document.querySelector(ref);
        if (ref instanceof HTMLElement) return ref;
        if (typeof ref === "function") {
            const result = ref(this._createContext(inst, "open", "focus"));

            return result instanceof HTMLElement ? result : null;
        }

        return null;
    }

    _resolveTransitionTargets(ctx) {
        const option = ctx.options.transitionTarget || "targets";

        if (option === "targets") return ctx.targets;
        if (option === "overlay") return ctx.overlay ? [ctx.overlay] : [];
        if (typeof option === "string") return [...document.querySelectorAll(option)];
        if (option instanceof HTMLElement) return [option];
        if (this._isNodeListLike(option)) return [...option].filter((el) => el instanceof HTMLElement);
        if (typeof option === "function") {
            const result = option(ctx);

            if (result instanceof HTMLElement) return [result];
            if (this._isNodeListLike(result)) return [...result].filter((el) => el instanceof HTMLElement);
        }

        return [];
    }

    _waitTransition(ctx) {
        if (!ctx.options.waitTransition) return Promise.resolve();

        const targets = this._resolveTransitionTargets(ctx);
        if (!targets.length) return Promise.resolve();

        const meaningfulTargets = targets.filter((target) => this._getTargetTiming(target, ctx).total > 0);
        if (!meaningfulTargets.length) return Promise.resolve();

        const targetsToWait = ctx.options.waitAllTransitions ? meaningfulTargets : [meaningfulTargets[0]];

        return Promise.all(targetsToWait.map((target) => this._waitElementTransition(target, ctx))).then(() => undefined);
    }

    _waitElementTransition(target, ctx) {
        return new Promise((resolve) => {
            const token = Symbol("additional-toggle-transition");
            this._transitionTokens.set(target, token);

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
                if (this._transitionTokens.get(target) !== token) return;

                cleanup();
                resolve();
            };
            const onEnd = (event) => {
                if (event.target !== target) return;
                if (!this._isExpectedTransitionEvent(event, ctx)) return;

                finish();
            };

            events.forEach((eventName) => target.addEventListener(eventName, onEnd));

            const timeout = typeof ctx.options.transitionTimeout === "number"
                ? ctx.options.transitionTimeout
                : timing.total + 50;
            const timer = setTimeout(finish, timeout);
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
        const shouldCheckTransition = ctx.options.transitionEvent === "transitionend" || ctx.options.transitionEvent === "auto";
        const shouldCheckAnimation = ctx.options.transitionEvent === "animationend" || ctx.options.transitionEvent === "auto";
        const transitionTotal = shouldCheckTransition ? this._getTransitionTiming(styles, ctx.options.transitionProperty) : 0;
        const animationTotal = shouldCheckAnimation ? this._getAnimationTiming(styles) : 0;

        return { total: Math.max(transitionTotal, animationTotal) };
    }

    _getTransitionTiming(styles, property) {
        const properties = this._splitList(styles.transitionProperty);
        if (!properties.length || properties.every((transitionProperty) => transitionProperty === "none")) {
            return 0;
        }

        const durations = this._splitList(styles.transitionDuration).map((value) => this._parseTime(value));
        const delays = this._splitList(styles.transitionDelay).map((value) => this._parseTime(value));
        const expected = property === "auto"
            ? null
            : Array.isArray(property) ? property : [property];

        let total = 0;

        properties.forEach((transitionProperty, index) => {
            const matches = !expected ||
                expected.includes(transitionProperty) ||
                transitionProperty === "all";

            if (!matches) return;

            const duration = durations[index % durations.length] || 0;
            const delay = delays[index % delays.length] || 0;

            total = Math.max(total, duration + delay);
        });

        return total;
    }

    _getAnimationTiming(styles) {
        const names = this._splitList(styles.animationName);
        if (!names.length || names.every((name) => name === "none")) {
            return 0;
        }

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

    /* ================= state ================= */

    async _closeInstance(inst, event = null, trigger = null, close = null) {
        if (!inst || !inst.targets.length || !inst.isOpen) return true;

        this._clearHoverTimers(inst);
        this._setStateMeta(inst, true, false);

        const before = await this._callBeforeHooks(inst, "close", "beforeClose", event, trigger, close);
        if (before === false) return false;

        inst.isOpen = false;

        inst.targets.forEach((t) => t.classList.remove(inst.targetClass));
        inst.triggers.forEach((t) => t.classList.remove(inst.activeClass));
        this._syncA11y(inst);

        if (inst.scroll === true) {
            enableScroll();
        }

        this._syncOverlayState();

        const ctx = this._createContext(inst, "close", "afterClose", event, trigger, close);
        await this._waitTransition(ctx);

        if (inst.options.resetTransitionStyles) {
            inst.targets.forEach((target) => {
                target.style.transition = "";
                target.style.animation = "";
            });
        }

        this._returnFocusOnClose(inst);
        await this._callAfterHooks(inst, "close", "afterClose", event, trigger, close);

        return true;
    }

    async _openInstance(inst, event = null, trigger = null) {
        if (!inst || !inst.targets.length || !this._isEnabled(inst)) return false;
        if (inst.isOpen) return true;

        if (inst.single !== false) {
            const allClosed = await this.closeAll({
                force: true,
                except: inst,
                group: inst.group || undefined
            });
            if (!allClosed && this._anyOpen()) return false;
        }

        this._setStateMeta(inst, false, true);

        const before = await this._callBeforeHooks(inst, "open", "beforeOpen", event, trigger);
        if (before === false) return false;

        inst.isOpen = true;
        inst.lastTrigger = trigger || inst.lastTrigger || inst.triggers[0] || null;

        inst.targets.forEach((t) => t.classList.add(inst.targetClass));
        inst.triggers.forEach((t) => t.classList.add(inst.activeClass));
        this._syncA11y(inst);

        if (inst.scroll === true) {
            disableScroll();
        }

        this._syncOverlayState();

        const ctx = this._createContext(inst, "open", "afterOpen", event, trigger);
        await this._waitTransition(ctx);

        if (inst.options.resetTransitionStyles) {
            inst.targets.forEach((target) => {
                target.style.transition = "";
                target.style.animation = "";
            });
        }

        this._focusOnOpen(inst);
        await this._callAfterHooks(inst, "open", "afterOpen", event, trigger);

        return true;
    }

    /* ================= public ================= */

    reinit() {
        this.destroy(false);

        this.overlay = this._getElement(this.overlaySelector);

        this.instances = this.itemsConfig.map((item) => {
            const options = this._getEffectiveItemOptions(item);
            const triggers = this._getElements(options.trigger);
            const targets = this._getElements(options.target);
            const closes = this._getElements(options.close);
            const activeClass = (options.activeClass || this.activeClass).toString().trim() || this.activeClass;
            const targetClass = (options.targetActiveClass || activeClass).toString().trim() || activeClass;
            const overlayExtraClass = (options.overlayExtraClass || "").toString().trim();

            const hooks = {
                beforeOpen: typeof options.beforeOpen === "function" ? options.beforeOpen : null,
                afterOpen: typeof options.afterOpen === "function" ? options.afterOpen : null,
                beforeClose: typeof options.beforeClose === "function" ? options.beforeClose : null,
                afterClose: typeof options.afterClose === "function" ? options.afterClose : null
            };

            return {
                baseConfig: item,
                options,
                triggers,
                targets,
                closes,
                activeClass,
                targetClass,
                overlayExtraClass,
                overlay: options.overlay !== false,
                clickOnOverlay: options.clickOnOverlay !== false,
                scroll: options.scroll === true,
                single: options.single !== false,
                group: options.group || null,
                enabled: options.enabled,
                closeOnLeave: options.closeOnLeave !== false,
                hooks,
                isOpen: false,
                previousState: false,
                nextState: false,
                lastTrigger: null,
                hoverOpenTimer: null,
                hoverCloseTimer: null
            };
        });

        this.instances.forEach((inst) => this._setupInstanceListeners(inst));
        this.instances.forEach((inst) => this._syncA11y(inst));

        this._boundDocClick = (e) => {
            this.instances.forEach((inst) => {
                if (!inst.isOpen) return;

                const insideTarget = inst.targets.some((t) => t.contains(e.target));
                const insideTrigger = inst.triggers.some((t) => t.contains(e.target));

                if (!insideTarget && !insideTrigger && inst.clickOnOverlay === true) {
                    this._closeInstance(inst, e);
                }
            });
        };
        document.addEventListener("click", this._boundDocClick);

        if (this.overlay) {
            this._boundOverlayClick = (e) => {
                if (e.target === this.overlay) {
                    this.instances.forEach((inst) => {
                        if (inst.isOpen && inst.clickOnOverlay === true) {
                            this._closeInstance(inst, e);
                        }
                    });
                }
            };
            this.overlay.addEventListener("click", this._boundOverlayClick);
        }

        this._boundKeydown = (e) => {
            if (e.key === "Escape") {
                this.closeAll(true);
            }
        };
        document.addEventListener("keydown", this._boundKeydown);

        if (this._boundResize) {
            window.removeEventListener("resize", this._boundResize);
        }

        this._boundResize = () => this._handleResize();
        window.addEventListener("resize", this._boundResize);

        this._syncOverlayState();
    }

    _handleResize() {
        let shouldReinit = false;

        this.instances.forEach((inst) => {
            const nextOptions = this._getEffectiveItemOptions(inst.baseConfig);

            if (this._hasStructuralChanges(inst.options, nextOptions)) {
                shouldReinit = true;
            }

            const enabled = typeof nextOptions.enabled === "function"
                ? nextOptions.enabled(this._createContext(inst, "toggle", "enabled"))
                : nextOptions.enabled !== false;

            if (!enabled && inst.isOpen && nextOptions.closeOnLeave !== false) {
                this._closeInstance(inst);
            }
        });

        if (shouldReinit) {
            this.reinit();
        }
    }

    /**
     * Закрыть всё.
     * @param {boolean} [force=false] — если true, игнорирует флаг clickOnOverlay и закрывает программно
     * @param {Object|null} [except=null] — инстанс, который не нужно закрывать
     * @returns {Promise<boolean>}
     */
    async closeAll(options = {}) {
        const normalized = typeof options === "boolean"
            ? { force: options }
            : options || {};
        const {
            force = false,
            except = null,
            group = undefined
        } = normalized;

        const results = await Promise.all(this.instances.map((inst) => {
            if (inst === except) return Promise.resolve(true);
            if (group !== undefined && inst.group !== group) return Promise.resolve(true);
            if (!force && inst.clickOnOverlay === false) return Promise.resolve(true);

            return this._closeInstance(inst);
        }));

        this._syncOverlayState();

        return results.every(Boolean);
    }

    destroy(removeResize = true) {
        this.instances.forEach((inst) => this._clearHoverTimers(inst));
        this._offAll();

        if (this._boundDocClick) {
            document.removeEventListener("click", this._boundDocClick);
            this._boundDocClick = null;
        }
        if (this.overlay && this._boundOverlayClick) {
            this.overlay.removeEventListener("click", this._boundOverlayClick);
            this._boundOverlayClick = null;
        }
        if (this._boundKeydown) {
            document.removeEventListener("keydown", this._boundKeydown);
            this._boundKeydown = null;
        }
        if (removeResize && this._boundResize) {
            window.removeEventListener("resize", this._boundResize);
            this._boundResize = null;
        }
    }

    open(ref, eventOrOptions = null) {
        const inst = this._findInstance(ref);
        const options = this._normalizeActionOptions(eventOrOptions);

        return inst ? this._openInstance(inst, options.event || null, options.trigger || null) : Promise.resolve(false);
    }

    close(ref, eventOrOptions = null) {
        const inst = this._findInstance(ref);
        const options = this._normalizeActionOptions(eventOrOptions);

        return inst ? this._closeInstance(inst, options.event || null, options.trigger || null, options.close || null) : Promise.resolve(false);
    }

    toggle(ref, eventOrOptions = null) {
        const inst = this._findInstance(ref);
        if (!inst) return Promise.resolve(false);

        const options = this._normalizeActionOptions(eventOrOptions);

        return inst.isOpen
            ? this._closeInstance(inst, options.event || null, options.trigger || null, options.close || null)
            : this._openInstance(inst, options.event || null, options.trigger || null);
    }

    getInstance(ref) {
        return this._findInstance(ref);
    }

    isOpen(ref) {
        const inst = this._findInstance(ref);

        return inst ? inst.isOpen : false;
    }

    _findInstance(ref) {
        if (this.instances.includes(ref)) {
            return ref;
        }
        if (typeof ref === "number") {
            return this.instances[ref] || null;
        }
        if (typeof ref === "string") {
            return this.instances.find((inst) => (
                inst.targets.some((t) => t.matches(ref)) ||
                inst.triggers.some((t) => t.matches(ref))
            )) || null;
        }
        if (ref instanceof HTMLElement) {
            return this.instances.find((inst) => inst.targets.includes(ref) || inst.triggers.includes(ref)) || null;
        }
        return null;
    }
}
