import {addCustomClass, fadeIn, fadeOut, removeCustomClass} from "../functions/customFunctions.js";
import {disableScroll} from "../functions/disable-scroll.js";
import {enableScroll} from "../functions/enable-scroll.js";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export class ModalManager {
    constructor({
                    activeMode = "",
                    fadeInTimeout = 300,
                    fadeOutTimeout = 300,
                    closeOnEsc = true,
                    closeOnOverlayClick = true,
                    beforeOpen = null,
                    afterOpen = null,
                    beforeClose = null,
                    afterClose = null,
                } = {}) {
        this.overlay = document.querySelector("[data-overlay]");
        if (!this.overlay) {
            console.error("ModalManager: Overlay element not found!");
            return;
        }

        this.modals = Array.from(this.overlay.querySelectorAll("[data-popup]"));
        if (this.modals.length === 0) {
            console.warn("ModalManager: No modals found inside [data-overlay]");
        }

        this.activeClass = "active";
        this.activeMode = (activeMode || "").trim();
        this.timeIn = Number(fadeInTimeout) || 300;
        this.timeOut = Number(fadeOutTimeout) || 300;
        this.closeOnEsc = !!closeOnEsc;
        this.closeOnOverlayClick = !!closeOnOverlayClick;

        this.currentModal = null;
        this._animating = false;

        this.hooks = {beforeOpen, afterOpen, beforeClose, afterClose};

        // удобные шорткаты на лету
        this.on = (name, fn) => {
            this.hooks[name] = fn;
            return this;
        };
        this.off = (name) => {
            this.hooks[name] = null;
            return this;
        };
        this.once = (name, fn) => {
            const wrap = async (payload) => {
                try {
                    await fn(payload);
                } finally {
                    this.off(name);
                }
            };
            return this.on(name, wrap);
        };

        this._bindEvents();
        this._checkURLHashOnLoad();
    }

    /* ================= helpers ================= */

    _getModalEl(modalId) {
        if (!modalId) return null;
        return this.overlay.querySelector(`[data-popup="${modalId}"]`);
    }

    _visible(el) {
        return el.classList.contains(this.activeClass) || getComputedStyle(el).display !== "none";
    }

    _setOverlayActive(on) {
        if (on) {
            addCustomClass(this.overlay, this.activeClass);
            if (this.activeMode) addCustomClass(this.overlay, this.activeMode);
            this.overlay.setAttribute("aria-hidden", "false");
        } else {
            removeCustomClass(this.overlay, this.activeClass);
            if (this.activeMode) removeCustomClass(this.overlay, this.activeMode);
            this.overlay.setAttribute("aria-hidden", "true");
        }
    }

    _setAriaForAllHidden() {
        this.modals.forEach(m => m.setAttribute("aria-hidden", "true"));
        this.overlay.setAttribute("aria-hidden", "true");
        document.querySelectorAll("[data-btn-modal]").forEach(btn => {
            btn.setAttribute("aria-expanded", "false");
        });
    }

    _setAriaForOpen(modal) {
        this.modals.forEach(m => m.setAttribute("aria-hidden", "true"));
        if (modal) modal.setAttribute("aria-hidden", "false");
        this.overlay.setAttribute("aria-hidden", "false");
        document.querySelectorAll("[data-btn-modal]").forEach(btn => {
            btn.setAttribute("aria-expanded", "true");
        });
    }

    _pushModalState(modalId) {
        const currentHash = (window.location.hash || "").slice(1);
        if (currentHash === modalId) return;
        history.pushState({modal: modalId}, "", `#${modalId}`);
    }

    _replaceToPath() {
        const url = new URL(window.location.href);
        url.hash = "";
        history.replaceState({}, "", url.toString());
    }

    _emit(type, id, modal) {
        this.overlay.dispatchEvent(new CustomEvent(type, {
            bubbles: true,
            detail: {id, modal, manager: this},
        }));
    }

    async _callHook(name, id, modal) {
        const fn = this.hooks?.[name];
        if (typeof fn === "function") {
            try {
                return await fn({id, modal, manager: this});
            } catch (e) {
                console.error(`ModalManager: hook "${name}" error`, e);
            }
        }
        return undefined;
    }

    /* ================= API ================= */

    async openModal(modalId) {
        const modal = this._getModalEl(modalId);
        if (!modal) {
            console.error(`ModalManager: Modal "${modalId}" not found inside [data-overlay]`);
            return false;
        }
        if (this._animating) return false;
        this._animating = true;

        this._emit("modal:beforeopen", modalId, modal);
        const canOpen = await this._callHook("beforeOpen", modalId, modal);
        if (canOpen === false) {
            this._animating = false;
            return false;
        }

        const anyOpen = this.modals.some(m => this._visible(m));
        if (anyOpen) {
            await this.closeAllModals({except: modalId, keepOverlay: true, force: true});
        }

        this._setOverlayActive(true);
        addCustomClass(modal, this.activeClass);

        fadeIn(modal, this.timeIn, "flex");
        await sleep(this.timeIn);

        disableScroll();
        this.currentModal = modal;

        this._pushModalState(modalId);
        this._setAriaForOpen(modal);

        await this._callHook("afterOpen", modalId, modal);
        this._emit("modal:afteropen", modalId, modal);

        this._animating = false;
        return true;
    }

    async closeAllModals({except = null, keepOverlay = false, force = false} = {}) {
        if (this._animating && !force) return;
        this._animating = true;

        const toClose = this.modals.filter(m => {
            const id = m.getAttribute("data-popup");
            if (except && id === except) return false;
            return this._visible(m);
        });

        for (const m of toClose) {
            const id = m.getAttribute("data-popup");
            this._emit("modal:beforeclose", id, m);
            await this._callHook("beforeClose", id, m);
        }

        if (!keepOverlay) this._setOverlayActive(false);

        toClose.forEach(m => {
            removeCustomClass(m, this.activeClass);
            fadeOut(m, this.timeOut);
        });

        await sleep(this.timeOut);

        if (!keepOverlay) {
            enableScroll();
            this.currentModal = null;
            this._setAriaForAllHidden();
            this._replaceToPath();
        }

        for (const m of toClose) {
            const id = m.getAttribute("data-popup");
            await this._callHook("afterClose", id, m);
            this._emit("modal:afterclose", id, m);
        }

        this._animating = false;
    }

    /* ================= events ================= */

    _bindEvents() {
        document.addEventListener("click", (e) => {
            const openBtn = e.target.closest('[data-btn-modal], a[href^="/modal_"]');
            if (openBtn) {
                e.preventDefault();
                const modalId = openBtn.hasAttribute("data-btn-modal")
                    ? openBtn.getAttribute("data-btn-modal")
                    : openBtn.getAttribute("href").slice(1);
                this.openModal(modalId);
                return;
            }

            const innerBtn = e.target.closest("[data-btn-inner]");
            if (innerBtn) {
                e.preventDefault();
                const to = innerBtn.getAttribute("data-btn-inner");
                if (to) this.openModal(to);
            }
        });

        this.overlay.addEventListener("click", (e) => {
            if ((e.target === this.overlay && this.closeOnOverlayClick) || e.target.classList.contains("close")) {
                this.closeAllModals();
                this._replaceToPath();
            }
        });

        if (this.closeOnEsc) {
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && this.overlay.classList.contains(this.activeClass)) {
                    this.closeAllModals();
                    this._replaceToPath();
                }
            });
        }

        window.addEventListener("popstate", () => {
            const modalId = (history.state && history.state.modal) || (window.location.hash || "").slice(1);
            if (modalId) {
                const modal = this._getModalEl(modalId);
                if (modal) {
                    this.openModal(modalId);
                    return;
                }
            }
            this.closeAllModals({force: true});
        });
    }

    _checkURLHashOnLoad() {
        const modalId = (window.location.hash || "").slice(1);
        if (modalId && modalId.startsWith("modal_")) {
            const modal = this._getModalEl(modalId);
            if (modal) {
                this.openModal(modalId);
                return;
            }
        }
        this._setAriaForAllHidden();
    }
}
