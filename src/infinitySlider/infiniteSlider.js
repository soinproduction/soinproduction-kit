export class InfiniteSlider {
    constructor(container, options = {}) {
        if (!container) throw new Error('Container is required');

        this.container = container;
        this.options = {
            direction: options.direction || 'left',
            speed: options.speed || 0.5,
            pauseOnHover: options.pauseOnHover || false,
            showInfo: options.showInfo || false,

            onStart: typeof options.onStart === 'function' ? options.onStart : null,
            onStop: typeof options.onStop === 'function' ? options.onStop : null,
            onTick: typeof options.onTick === 'function' ? options.onTick : null,
            onSlideLoop: typeof options.onSlideLoop === 'function' ? options.onSlideLoop : null,
        };

        this.slides = Array.from(this.container.children);
        this.x = 0;
        this.isRunning = true;

        this.cloneSlides();
        this.initStyles();
        this.bindEvents();
        this.animate();

        if (this.options.showInfo) this.showInfo();
    }

    cloneSlides() {
        this.slides.forEach(slide => {
            const clone = slide.cloneNode(true);
            this.container.appendChild(clone);
        });
        this.slides = Array.from(this.container.children);
    }

    initStyles() {
        this.container.style.display = 'flex';
        this.container.style.willChange = 'transform';
    }

    bindEvents() {
        if (this.options.pauseOnHover) {
            this.container.addEventListener('mouseenter', () => this.stop());
            this.container.addEventListener('mouseleave', () => this.start());
        }
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
        this.container.style.transform = '';
        this.container.innerHTML = '';
        this.slides = [];
        if (this.options.showInfo) {
            console.log('🧹 InfiniteSlider destroyed.');
        }
    }

    animate = () => {
        if (this.isRunning) {
            this.x += this.options.direction === 'left' ? -this.options.speed : this.options.speed;
            this.container.style.transform = `translateX(${this.x}px)`;

            if (this.options.onTick) this.options.onTick(this.x);

            const firstSlide = this.slides[0];
            const lastSlide = this.slides[this.slides.length - 1];

            if (!firstSlide || !lastSlide) return;

            const firstRect = firstSlide.getBoundingClientRect();
            const lastRect = lastSlide.getBoundingClientRect();

            if (this.options.direction === 'left' && firstRect.right < 0) {
                this.container.appendChild(firstSlide);
                this.slides.push(this.slides.shift());
                this.x += firstRect.width;
                this.container.style.transform = `translateX(${this.x}px)`;
                if (this.options.onSlideLoop) this.options.onSlideLoop('left');
            }

            if (this.options.direction === 'right' && lastRect.left > window.innerWidth) {
                this.container.insertBefore(lastSlide, this.slides[0]);
                this.slides.unshift(this.slides.pop());
                this.x -= lastRect.width;
                this.container.style.transform = `translateX(${this.x}px)`;
                if (this.options.onSlideLoop) this.options.onSlideLoop('right');
            }
        }

        requestAnimationFrame(this.animate);
    };

    showInfo() {
        console.groupCollapsed('%c🌀 InfiniteSlider Info', 'color: #06f; font-weight: bold');
        console.log('%cOptions:', 'color: #999', this.options);
        console.log('%cPublic methods:', 'color: #999');
        console.table([
            { name: 'start()', desc: 'Запускает слайдер' },
            { name: 'stop()', desc: 'Останавливает слайдер' },
            { name: 'destroy()', desc: 'Полностью удаляет слайдер и обнуляет контейнер' },
        ]);
        console.log('%cEvents (через options):', 'color: #999');
        console.table([
            {name: 'direction', desc: 'Настройка направлнеия left / right'},
            {name: 'speed', desc: '0.5 Настройки скорости'},
            {name: 'pauseOnHover', desc: 'Остановка при наведении'},
            {name: 'onStart', desc: 'Вызывается при старте'},
            {name: 'onStop', desc: 'Вызывается при остановке'},
            {name: 'onTick', desc: 'Вызывается каждый кадр с текущим X'},
            {name: 'onSlideLoop', desc: 'Вызывается при перемещении слайда в конец/начало'},
        ]);
        console.groupEnd();
    }
};
