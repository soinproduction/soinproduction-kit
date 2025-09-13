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
     *   overlay?:boolean,
     *   clickOnOverlay?:boolean,
     *   beforeOpen?:Function,
     *   afterOpen?:Function,
     *   beforeClose?:Function,
     *   afterClose?:Function
     * }>} cfg.items
     * @param {string|HTMLElement|null} [cfg.overlay=null]
     * @param {string} [cfg.activeClass='active']
     * @param {Function} [cfg.beforeOpen]
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
     * Пересчитать состояние overlay с учётом открытых инстансов.
     * Включает/выключает overlay и единожды добавляет overlayExtraClass текущего открытого инстанса (если есть).
     */
    _syncOverlayState() {
        if (!this.overlay) return;

        // очистить все возможные overlayExtraClass
        for (const it of this.instances) {
            if (it.overlayExtraClass) this.overlay.classList.remove(it.overlayExtraClass);
        }

        // найти открытый инстанс, который использует overlay
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

        if (inst.scroll === true) {
            enableScroll();
        }

        // пересчитать overlay (учитываем per-item overlay)
        this._syncOverlayState();

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

        // закрыть все прочие без учёта clickOnOverlay (force=true)
        const allClosed = this.closeAll(true);
        if (!allClosed && this._anyOpen()) return;

        // beforeOpen: глобальный → item
        const g = this._safeCall(this.gHooks.beforeOpen, inst);
        if (g === false) return;
        const i = this._safeCall(inst.hooks.beforeOpen, inst);
        if (i === false) return;

        inst.isOpen = true;

        inst.target.classList.add(inst.targetClass);
        inst.triggers.forEach((t) => t.classList.add(this.activeClass));

        if (inst.scroll === true) {
            disableScroll();
        }

        // пересчитать overlay (включаем только если inst.overlay === true)
        this._syncOverlayState();

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

            // NEW: overlay / clickOnOverlay (оба по умолчанию true)
            const overlay = item.overlay === false ? false : true;
            const clickOnOverlay = item.clickOnOverlay === false ? false : true;

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
                overlay,          // NEW
                clickOnOverlay,   // NEW
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

        // клик-вне (учитываем per-item clickOnOverlay)
        this._boundDocClick = (e) => {
            let changed = false;

            this.instances.forEach((inst) => {
                if (!inst.isOpen) return;

                const insideTarget = inst.target?.contains(e.target);
                const insideTrigger = inst.triggers.some((t) => t.contains(e.target));

                // закрываем кликом-вне только если разрешено для этого инстанса
                if (!insideTarget && !insideTrigger && inst.clickOnOverlay === true) {
                    const ok = this._closeInstance(inst);
                    if (ok) changed = true;
                }
            });

            if (changed) this._syncOverlayState();
        };
        document.addEventListener("click", this._boundDocClick);

        // клик по overlay: закрыть только те инстансы, где clickOnOverlay === true
        if (this.overlay) {
            this._boundOverlayClick = (e) => {
                if (e.target === this.overlay) {
                    let changed = false;
                    this.instances.forEach((inst) => {
                        if (inst.isOpen && inst.clickOnOverlay === true) {
                            const ok = this._closeInstance(inst);
                            if (ok) changed = true;
                        }
                    });
                    if (changed) this._syncOverlayState();
                }
            };
            this.overlay.addEventListener("click", this._boundOverlayClick);
        }

        // на всякий случай привести overlay к корректному начальному состоянию
        this._syncOverlayState();
    }

    /**
     * Закрыть всё.
     * @param {boolean} [force=false] — если true, игнорирует флаг clickOnOverlay и закрывает программно
     * @returns {boolean} true — все закрылись; false — хотя бы один отказал (beforeClose=false)
     */
    closeAll(force = false) {
        let allClosed = true;

        this.instances.forEach((inst) => {
            if (!force && inst.clickOnOverlay === false) return; // уважаем запрет на клик-вне
            const ok = this._closeInstance(inst);
            if (!ok) allClosed = false;
        });

        // синхронизация overlay
        this._syncOverlayState();

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

    open(ref) {
        const inst = this._findInstance(ref);
        if (inst) this._openInstance(inst);
    }

    close(ref) {
        const inst = this._findInstance(ref);
        if (inst) this._closeInstance(inst);
    }

    toggle(ref) {
        const inst = this._findInstance(ref);
        if (!inst) return;
        if (inst.isOpen) {
            this._closeInstance(inst);
        } else {
            this._openInstance(inst);
        }
    }

    _findInstance(ref) {
        if (typeof ref === "number") {
            return this.instances[ref] || null;
        }
        if (typeof ref === "string") {
            return this.instances.find(inst => inst.target?.matches(ref)) || null;
        }
        if (ref instanceof HTMLElement) {
            return this.instances.find(inst => inst.target === ref) || null;
        }
        return null;
    }

}
