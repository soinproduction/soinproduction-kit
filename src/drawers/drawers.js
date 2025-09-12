import { enableScroll } from "../functions/enable-scroll.js";
import { disableScroll } from "../functions/disable-scroll.js";

export class AdditionalToggle {
    /**
     * @param {Object} cfg
     * @param {Array<{
     *   trigger:string|HTMLElement|NodeList|Array,
     *   target:string|HTMLElement,
     *   close?:string|HTMLElement|NodeList|Array,
     *   targetActiveClass?:string,
     *   overlayExtraClass?:string,
     *   scroll?:boolean,
     *   beforeOpen?:Function,
     *   afterOpen?:Function,
     *   beforeClose?:Function,
     *   afterClose?:Function
     * }>} cfg.items
     * @param {string|HTMLElement|null} [cfg.overlay=null]
     * @param {string} [cfg.activeClass='active']
     * @param {Function} [cfg.beforeOpen]    // глобальные хуки
     * @param {Function} [cfg.afterOpen]
     * @param {Function} [cfg.beforeClose]
     * @param {Function} [cfg.afterClose]
     */
    constructor({
                    items = [],
                    overlay = null,
                    activeClass = "active",
                    beforeOpen = null,
                    afterOpen = null,
                    beforeClose = null,
                    afterClose = null
                } = {}) {
        this.itemsConfig = items;
        this.overlaySelector = overlay;
        this.activeClass = (activeClass || "active").trim();

        // глобальные хуки
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
        this._listeners = [];

        this.reinit();
    }

    /* ================= helpers ================= */

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

    _safeCall(fn, arg) {
        if (typeof fn !== "function") return undefined;
        try { return fn(arg); } catch (e) {
            console.error("[AdditionalToggle hook error]:", e);
            return undefined;
        }
    }

    /**
     * Закрыть конкретный инстанс.
     * @returns {boolean} true — закрыл, false — отменено хуком/нечего закрывать
     */
    _closeInstance(inst) {
        if (!inst || !inst.target || !inst.isOpen) return true;

        // beforeClose: глобальный → item
        const g = this._safeCall(this.gHooks.beforeClose, inst);
        if (g === false) return false;
        const i = this._safeCall(inst.hooks.beforeClose, inst);
        if (i === false) return false;

        inst.isOpen = false;

        inst.target.classList.remove(inst.targetClass);
        inst.triggers.forEach((t) => t.classList.remove(this.activeClass));

        if (this.overlay && inst.overlayExtraClass) {
            this.overlay.classList.remove(inst.overlayExtraClass);
        }

        if (inst.scroll === true) {
            enableScroll();
        }

        if (!this._anyOpen() && this.overlay) {
            this.overlay.classList.remove(this.activeClass);
        }

        // afterClose: item → глобальный
        this._safeCall(inst.hooks.afterClose, inst);
        this._safeCall(this.gHooks.afterClose, inst);

        return true;
    }

    /**
     * Открыть конкретный инстанс. Предварительно пытается закрыть остальные.
     */
    _openInstance(inst) {
        if (!inst || !inst.target) return;

        // закрыть все прочие; если что-то нельзя закрыть — не открываем новый
        const allClosed = this.closeAll();
        if (!allClosed && this._anyOpen()) return;

        // убрать все overlayExtraClass (чистое состояние)
        if (this.overlay) {
            for (const it of this.instances) {
                if (it.overlayExtraClass) this.overlay.classList.remove(it.overlayExtraClass);
            }
        }

        // beforeOpen: глобальный → item
        const g = this._safeCall(this.gHooks.beforeOpen, inst);
        if (g === false) return;
        const i = this._safeCall(inst.hooks.beforeOpen, inst);
        if (i === false) return;

        inst.isOpen = true;

        inst.target.classList.add(inst.targetClass);
        inst.triggers.forEach((t) => t.classList.add(this.activeClass));

        if (this.overlay) {
            this.overlay.classList.add(this.activeClass);
            if (inst.overlayExtraClass) this.overlay.classList.add(inst.overlayExtraClass);
        }

        if (inst.scroll === true) {
            disableScroll();
        }

        // afterOpen: item → глобальный
        this._safeCall(inst.hooks.afterOpen, inst);
        this._safeCall(this.gHooks.afterOpen, inst);
    }

    /* ================= public ================= */

    reinit() {
        this.destroy(); // снять старые обработчики

        this.overlay = this._getElement(this.overlaySelector);

        this.instances = this.itemsConfig.map((item) => {
            const triggers = this._getElements(item.trigger);
            const target = this._getElement(item.target);
            const closes = this._getElements(item.close);

            const targetClass = (item.targetActiveClass || this.activeClass).toString().trim() || this.activeClass;
            const overlayExtraClass = (item.overlayExtraClass || "").toString().trim();
            const scroll = item.scroll === true;

            const hooks = {
                beforeOpen: typeof item.beforeOpen === "function" ? item.beforeOpen : null,
                afterOpen: typeof item.afterOpen === "function" ? item.afterOpen : null,
                beforeClose: typeof item.beforeClose === "function" ? item.beforeClose : null,
                afterClose: typeof item.afterClose === "function" ? item.afterClose : null
            };

            return {
                triggers,
                target,
                closes,
                targetClass,
                overlayExtraClass,
                scroll,
                hooks,
                isOpen: false
            };
        });

        // обработчики на триггеры/close
        this.instances.forEach((inst) => {
            const { triggers, closes, target } = inst;
            if (!target || !triggers.length) return;

            triggers.forEach((btn) => {
                this._on(btn, "click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (inst.isOpen) {
                        this._closeInstance(inst);
                    } else {
                        this._openInstance(inst);
                    }
                });
            });

            closes.forEach((btn) => {
                this._on(btn, "click", (e) => {
                    e.preventDefault();
                    this._closeInstance(inst);
                });
            });
        });

        // клик-вне
        this._boundDocClick = (e) => {
            let changed = false;

            this.instances.forEach((inst) => {
                if (!inst.isOpen) return;

                const insideTarget = inst.target?.contains(e.target);
                const insideTrigger = inst.triggers.some((t) => t.contains(e.target));

                if (!insideTarget && !insideTrigger) {
                    const ok = this._closeInstance(inst);
                    if (ok) changed = true;
                }
            });

            if (changed && this.overlay && !this._anyOpen()) {
                this.overlay.classList.remove(this.activeClass);
            }
        };
        document.addEventListener("click", this._boundDocClick);

        // клик по overlay
        if (this.overlay) {
            this._boundOverlayClick = (e) => {
                if (e.target === this.overlay) {
                    this.closeAll();
                }
            };
            this.overlay.addEventListener("click", this._boundOverlayClick);
        }
    }

    /**
     * Закрыть всё.
     * @returns {boolean} true — все закрылись; false — хотя бы один отказал (beforeClose=false)
     */
    closeAll() {
        let allClosed = true;
        this.instances.forEach((inst) => {
            const ok = this._closeInstance(inst);
            if (!ok) allClosed = false;
        });

        if (allClosed && this.overlay) {
            this.overlay.classList.remove(this.activeClass);
            for (const it of this.instances) {
                if (it.overlayExtraClass) this.overlay.classList.remove(it.overlayExtraClass);
            }
        }
        return allClosed;
    }

    destroy() {
        this._offAll();

        if (this._boundDocClick) {
            document.removeEventListener("click", this._boundDocClick);
            this._boundDocClick = null;
        }
        if (this.overlay && this._boundOverlayClick) {
            this.overlay.removeEventListener("click", this._boundOverlayClick);
            this._boundOverlayClick = null;
        }
    }
}
