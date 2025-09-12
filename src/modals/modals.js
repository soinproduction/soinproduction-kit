import {disableScroll} from "../functions/disable-scroll.js";
import {enableScroll} from "../functions/enable-scroll.js";
import {addCustomClass, fadeIn, removeCustomClass} from "../functions/customFunctions.js";

class ModalManager {
    constructor({
            activeMode = '',
            fadeInTimeout = 300,
            fadeOutTimeout = 300,
            closeOnEsc = true,
            closeOnOverlayClick = true
        } = {}) {
        // Валидация элементов
        this.overlay = document.querySelector('[data-overlay]');
        if (!this.overlay) {
            console.error('ModalManager: Overlay element not found!');
            return;
        }

        this.modals = document.querySelectorAll('[data-popup]');
        if (this.modals.length === 0) {
            console.warn('ModalManager: No modals found');
        }

        // Настройки
        this.activeClass = 'active';
        this.activeMode = activeMode;
        this.timeIn = fadeInTimeout;
        this.timeOut = fadeOutTimeout;
        this.closeOnEsc = closeOnEsc;
        this.closeOnOverlayClick = closeOnOverlayClick;
        this.currentModal = null;

        // Инициализация
        this.bindEvents();
        this.checkURLHash();
    }

    // ==================== Основные методы ====================
    async openModal(modalId) {
        if (!modalId || !this.overlay) return false;

        const modal = this.overlay.querySelector(`[data-popup="${modalId}"]`);
        if (!modal) {
            console.error(`ModalManager: Modal "${modalId}" not found`);
            return false;
        }

        // Закрываем все модалки перед открытием новой
        await this.closeAllModals();

        // Открываем новую
        addCustomClass(this.overlay, this.activeClass);
        this.activeMode && addCustomClass(this.overlay, this.activeMode);
        addCustomClass(modal, this.activeClass);
        await fadeIn(modal, this.timeIn, 'flex');
        disableScroll();
        this.currentModal = modal;

        // Обновляем URL
        history.pushState({modal: modalId}, '', `#${modalId}`);
        this.toggleAriaAttributes(modal, true);

        return true;
    }

    async closeAllModals() {
        if (!this.overlay) return;

        removeCustomClass(this.overlay, this.activeClass);
        this.activeMode && removeCustomClass(this.overlay, this.activeMode);

        const fadeOutPromises = Array.from(this.modals).map(modal => {
            removeCustomClass(modal, this.activeClass);
            return fadeOut(modal, this.timeOut);
        });

        await Promise.all(fadeOutPromises);
        enableScroll();
        this.currentModal = null;
        this.toggleAriaAttributes(null, false);
    }

    // ==================== Обработчики событий ====================
    bindEvents() {
        // Делегирование событий для кнопок
        document.addEventListener('click', (e) => {
            // Обработка кнопок с data-btn-modal
            const modalBtn = e.target.closest('[data-btn-modal], a[href^="#modal_"]');
            if (modalBtn) {
                e.preventDefault();
                const modalId = modalBtn.hasAttribute('data-btn-modal')
                    ? modalBtn.getAttribute('data-btn-modal')
                    : modalBtn.getAttribute('href').replace('#', '');
                this.openModal(modalId);
            }

            // Обработка внутренних кнопок
            const innerBtn = e.target.closest('[data-btn-inner]');
            if (innerBtn) {
                e.preventDefault();
                this.openModal(innerBtn.getAttribute('data-btn-inner'));
            }
        });

        // Клик по оверлею или кнопке закрытия
        this.overlay.addEventListener('click', (e) => {
            if (
                (e.target === this.overlay && this.closeOnOverlayClick) ||
                e.target.classList.contains('close')
            ) {
                this.closeAllModals();
                history.replaceState({}, '', window.location.pathname);
            }
        });

        // Закрытие по Escape
        if (this.closeOnEsc) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay.classList.contains(this.activeClass)) {
                    this.closeAllModals();
                    history.replaceState({}, '', window.location.pathname);
                }
            });
        }

        // Обработка истории браузера
        window.addEventListener('popstate', (e) => {
            if (e.state?.modal) {
                this.openModal(e.state.modal);
            } else {
                this.closeAllModals();
            }
        });
    }

    // ==================== Вспомогательные методы ====================
    checkURLHash() {
        const modalId = window.location.hash.replace('#', '');
        if (modalId && this.overlay.querySelector(`[data-popup="${modalId}"]`)) {
            this.openModal(modalId);
        }
    }

    toggleAriaAttributes(modal, isOpen) {
        if (!modal) {
            document.querySelectorAll('[data-popup]').forEach(m => {
                m.setAttribute('aria-hidden', 'true');
            });
            return;
        }
        modal.setAttribute('aria-hidden', 'false');
        this.overlay.setAttribute('aria-hidden', 'false');
        document.querySelectorAll('[data-btn-modal]').forEach(btn => {
            btn.setAttribute('aria-expanded', isOpen);
        });
    }
}

export default ModalManager;
