export class InfiniteSlider {
    constructor(container, options = {}) {
        if (!container) throw new Error('Container is required');

        this.container = container;

        this.options = {
            direction: options.direction || 'left', // left | right | up | down
            speed: typeof options.speed === 'number' ? options.speed : 0.5,
            pauseOnHover: !!options.pauseOnHover,
            showInfo: !!options.showInfo,

            onStart: typeof options.onStart === 'function' ? options.onStart : null,
            onStop: typeof options.onStop === 'function' ? options.onStop : null,
            onTick: typeof options.onTick === 'function' ? options.onTick : null,
        };

        this.isVertical = this.options.direction === 'up' || this.options.direction === 'down';

        this.isRunning = true;
        this._raf = 0;

        this.pos = 0;
        this.loopSize = 0;

        this.track = null;
        this.baseItems = [];
        this._lastTarget = 0;

        this._resizeTimer = 0;
        this._onResize = this._onResize.bind(this);
        this.animate = this.animate.bind(this);

        this._build();
        this._ensureFill(true);
        this._bindEvents();

        this._raf = requestAnimationFrame(this.animate);

        if (this.options.showInfo) this._info();
    }

    _build() {
        this.container.style.overflow = 'hidden';
        if (!this.container.style.position) this.container.style.position = 'relative';

        const track = document.createElement('div');
        track.className = 'infinite-slider__track';
        track.style.willChange = 'transform';
        track.style.display = 'flex';
        track.style.flexDirection = this.isVertical ? 'column' : 'row';

        const children = Array.from(this.container.children);
        children.forEach((node) => track.appendChild(node));
        this.container.appendChild(track);

        this.track = track;
        this.baseItems = Array.from(this.track.children);
    }

    _containerSize() {
        return this.isVertical ? this.container.clientHeight : this.container.clientWidth;
    }

    _itemSize(el) {
        return this.isVertical ? el.offsetHeight : el.offsetWidth;
    }

    _sumSize(els) {
        let sum = 0;
        els.forEach((el) => { sum += this._itemSize(el); });
        return sum;
    }

    _getAllItems() {
        return Array.from(this.track.children);
    }

    _applyTransform() {
        const x = this.isVertical ? 0 : this.pos;
        const y = this.isVertical ? this.pos : 0;
        this.track.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
    }

    _ensureFill(force = false) {
        if (!this.baseItems.length) return;
        const baseSize = this._sumSize(this.baseItems);
        if (baseSize <= 0) {
            requestAnimationFrame(() => this._ensureFill(force));
            return;
        }

        const target = this._containerSize() * 3;

        if (!force && this._lastTarget >= target) {
            this.loopSize = this._sumSize(this.baseItems);
            if (this.loopSize > 0) this._normalizePos();
            this._applyTransform();
            return;
        }

        this.loopSize = baseSize;
        let all = this._getAllItems();
        if (all.length === this.baseItems.length) {
            this.baseItems.forEach((el) => this.track.appendChild(el.cloneNode(true)));
            all = this._getAllItems();
        }

        while (this._sumSize(all) < target) {
            this.baseItems.forEach((el) => this.track.appendChild(el.cloneNode(true)));
            all = this._getAllItems();
        }

        this._lastTarget = target;
        this._normalizePos();
        this._applyTransform();
    }

    _normalizePos() {
        if (!this.loopSize) return;
        if (this.pos <= -this.loopSize) this.pos = this.pos % this.loopSize;
        if (this.pos > 0) this.pos = -((Math.abs(this.pos) % this.loopSize));
    }

    _bindEvents() {
        if (this.options.pauseOnHover) {
            this.container.addEventListener('mouseenter', () => this.stop());
            this.container.addEventListener('mouseleave', () => this.start());
        }

        window.addEventListener('resize', this._onResize, { passive: true });
        window.addEventListener('load', () => {
            this._ensureFill(true);
        }, { once: true });
    }

    _onResize() {
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(() => {
            this._ensureFill(false);
        }, 150);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            if (this.options.onStart) this.options.onStart();
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.options.onStop) this.options.onStop();
        }
    }

    destroy() {
        this.stop();
        cancelAnimationFrame(this._raf);
        this._raf = 0;

        clearTimeout(this._resizeTimer);
        window.removeEventListener('resize', this._onResize);

        if (this.track) {
            const kids = Array.from(this.track.children);
            this.container.innerHTML = '';
            this.baseItems.forEach((el) => this.container.appendChild(el));

            this.track.remove();
            this.track = null;
        }

        this.container.style.overflow = '';
        this.container.style.position = '';
    }

    animate() {
        this._raf = requestAnimationFrame(this.animate);

        if (!this.isRunning) return;
        if (!this.loopSize) return;

        const dir = this.options.direction;
        const speed = this.options.speed;

        if (dir === 'left') this.pos -= speed;
        if (dir === 'right') this.pos += speed;
        if (dir === 'up') this.pos -= speed;
        if (dir === 'down') this.pos += speed;

        if (this.pos <= -this.loopSize) this.pos += this.loopSize;
        if (this.pos >= 0) this.pos -= this.loopSize;

        this._applyTransform();

        if (this.options.onTick) this.options.onTick(this.pos);
    }

    _info() {
        console.groupCollapsed('%c🌀 InfiniteSlider', 'color:#06f;font-weight:bold');
        console.log('direction:', this.options.direction);
        console.log('isVertical:', this.isVertical);
        console.log('loopSize:', this.loopSize);
        console.log('baseItems:', this.baseItems.length);
        console.groupEnd();
    }
}
