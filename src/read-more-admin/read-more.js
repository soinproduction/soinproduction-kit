export default class ReadMore {
    /**
     * @param {Object} options
     * @param {string|NodeList|HTMLElement[]} [options.buttons='[data-read-more]'] - селектор или список кнопок
     * @param {string} [options.contentClass='read-more-content'] - класс контейнера с контентом (если нет data-target)
     * @param {number} [options.animationDuration=300] - длительность анимации в мс (для синхронизации с CSS)
     * @param {boolean} [options.setAria=true] - выставлять aria-атрибуты
     * @param {boolean} [options.autoHeightOptimization=true] - ставить max-height:'none' после раскрытия
     */
    constructor({buttons = '[data-read-more]', contentClass = 'read-more-content', animationDuration = 300, setAria = true, autoHeightOptimization = true,} = {}) {
        this.options = {buttons, contentClass, animationDuration, setAria, autoHeightOptimization};
        this._buttons = [];
        this._handlers = new Map();
    }

    init() {
        const {buttons} = this.options;
        this._buttons = typeof buttons === 'string' ? Array.from(document.querySelectorAll(buttons)) : Array.from(buttons || []);

        this._buttons.forEach((button, idx) => {
            if (!(button instanceof HTMLElement)) return;

            const targetSelector = button.getAttribute('data-target');
            let content = null;
            if (targetSelector) {
                content = document.querySelector(targetSelector);
            } else {
                const prev = button.previousElementSibling;
                if (prev && prev.classList && prev.classList.contains(this.options.contentClass)) {
                    content = prev;
                }
            }
            if (!content) return;

            if (!content.style.maxHeight) content.style.maxHeight = '0px';
            content.style.overflow = content.style.overflow || 'hidden';

            if (this.options.setAria) {
                button.setAttribute('role', button.getAttribute('role') || 'button');
                button.setAttribute('aria-expanded', 'false');
                if (!content.id) content.id = `readmore-content-${Date.now()}-${idx}`;
                button.setAttribute('aria-controls', content.id);
            }

            if (!button._rmOriginalNonTextNodes) {
                button._rmOriginalNonTextNodes = Array.from(button.childNodes).filter(
                    node => node.nodeType !== Node.TEXT_NODE && !(node.classList && node.classList.contains('read-more-text'))
                );
            }

            let labelSpan = button.querySelector('.read-more-text');
            if (!labelSpan) {
                labelSpan = document.createElement('span');
                labelSpan.className = 'read-more-text';
                button.appendChild(labelSpan);
            }
            const moreText = button.getAttribute('data-more-text') || 'Read More';
            labelSpan.textContent = ' ' + moreText;

            const handler = (e) => {
                e.preventDefault();
                this.toggle(button, content);
            };
            button.addEventListener('click', handler);
            this._handlers.set(button, {handler, content});
        });
    }

    /**
     * Переключение состояния
     * @param {HTMLElement} button
     * @param {HTMLElement} content
     */
    toggle(button, content) {
        const isOpen = this._isOpen(content);
        if (isOpen) {
            this._collapse(button, content);
        } else {
            this._expand(button, content);
        }
    }

    _isOpen(content) {
        const mh = content.style.maxHeight;
        return mh && mh !== '0px';
    }

    _expand(button, content) {
        button.classList.add('active');

        const lessText = button.getAttribute('data-less-text') || 'Hide';
        this._setButtonLabel(button, lessText);

        if (this.options.setAria) button.setAttribute('aria-expanded', 'true');

        if (content.style.maxHeight === 'none') {
            content.style.maxHeight = content.scrollHeight + 'px';
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
        }

        if (this.options.autoHeightOptimization) {
            clearTimeout(content._rmTimer);
            content._rmTimer = setTimeout(() => {
                content.style.maxHeight = 'none';
            }, this.options.animationDuration);
        }
    }

    _collapse(button, content) {
        button.classList.remove('active');

        const moreText = button.getAttribute('data-more-text') || 'Read More';
        this._setButtonLabel(button, moreText);

        if (this.options.setAria) button.setAttribute('aria-expanded', 'false');

        if (content.style.maxHeight === 'none') {
            content.style.maxHeight = content.scrollHeight + 'px';
            requestAnimationFrame(() => {
                content.style.maxHeight = '0px';
            });
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            requestAnimationFrame(() => {
                content.style.maxHeight = '0px';
            });
        }
    }

    _setButtonLabel(button, text) {
        const nonText = button._rmOriginalNonTextNodes || [];
        button.innerHTML = '';
        nonText.forEach(n => button.appendChild(n.cloneNode(true)));
        const labelSpan = document.createElement('span');
        labelSpan.className = 'read-more-text';
        labelSpan.textContent = ' ' + text;
        button.appendChild(labelSpan);
    }

    destroy() {
        this._buttons.forEach((button) => {
            const stored = this._handlers.get(button);
            if (stored) {
                button.removeEventListener('click', stored.handler);
                this._handlers.delete(button);

                if (button._rmOriginalNonTextNodes) {
                    const nonText = button._rmOriginalNonTextNodes;
                    button.innerHTML = '';
                    nonText.forEach(n => button.appendChild(n.cloneNode(true)));
                }

                if (this.options.setAria) {
                    button.removeAttribute('aria-expanded');
                    button.removeAttribute('aria-controls');
                    if (button.getAttribute('role') === 'button') button.removeAttribute('role');
                }
            }
        });
        this._buttons = [];
    }
}
