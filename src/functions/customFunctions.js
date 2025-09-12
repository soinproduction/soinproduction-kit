/**
 * Плавное появление элемента с анимацией opacity
 * @param {HTMLElement} el - Элемент для анимации
 * @param {number} timeout - Длительность анимации (мс)
 * @param {string} [display='flex'] - CSS-свойство display после появления
 */
export const fadeIn = (el, timeout, display) => {
	el.style.opacity = 0;
	el.style.display = display || 'flex';
	el.style.transition = `all ${timeout}ms`;
	setTimeout(() => {
		el.style.opacity = 1;
	}, 10); // Минимальная задержка для запуска анимации
};

/**
 * Плавное исчезновение элемента с анимацией opacity
 * @param {HTMLElement} el - Элемент для анимации
 * @param {number} timeout - Длительность анимации (мс)
 */
export const fadeOut = (el, timeout) => {
	el.style.opacity = 1;
	el.style.transition = `all ${timeout}ms ease`;
	el.style.opacity = 0;

	setTimeout(() => {
		el.style.display = 'none';
	}, timeout); // Скрытие после завершения анимации
};

/**
 * Добавляет несколько обработчиков событий к элементу
 * @param {HTMLElement} element - Целевой элемент
 * @param {string} eventNames - Строка с именами событий через пробел
 * @param {Function} listener - Функция-обработчик
 */
export function addMultiListener(element, eventNames, listener) {
	const events = eventNames.split(' ');
	events.forEach(event => {
		element.addEventListener(event, listener, false);
	});
}

/**
 * Проверяет, является ли число четным
 * @param {number} n - Проверяемое число
 * @returns {boolean} - Результат проверки
 */
export const even = n => !(n % 2);

/**
 * Удаляет класс(ы) у элемента
 * @param {HTMLElement} item - Целевой элемент
 * @param {string} [customClass='active'] - Класс(ы) для удаления (через запятую)
 */
export const removeCustomClass = (item, customClass = 'active') => {
	const classes = customClass.split(',').map(cls => cls.trim());
	classes.forEach(className => {
		item.classList.remove(className);
	});
};

/**
 * Переключает класс(ы) у элемента
 * @param {HTMLElement} item - Целевой элемент
 * @param {string} [customClasses='active'] - Класс(ы) для переключения (через запятую)
 */
export const toggleCustomClass = (item, customClasses = 'active') => {
	const classes = customClasses.split(',').map(cls => cls.trim());
	classes.forEach(className => {
		item.classList.toggle(className);
	});
};

/**
 * Добавляет класс(ы) к элементу
 * @param {HTMLElement} item - Целевой элемент
 * @param {string} [customClass='active'] - Класс(ы) для добавления (через запятую)
 */
export const addCustomClass = (item, customClass = 'active') => {
	const classes = customClass.split(',').map(cls => cls.trim());
	classes.forEach(className => {
		item.classList.add(className);
	});
};

/**
 * Удаляет класс(ы) у всех элементов массива
 * @param {HTMLElement[]} arr - Массив элементов
 * @param {string} [customClass='active'] - Класс(ы) для удаления (через запятую)
 */
export const removeClassInArray = (arr, customClass = 'active') => {
	const classes = customClass.split(',').map(cls => cls.trim());
	arr.forEach((item) => {
		classes.forEach(className => {
			item.classList.remove(className);
		});
	});
};

/**
 * Добавляет класс(ы) всем элементам массива
 * @param {HTMLElement[]} arr - Массив элементов
 * @param {string} [customClass='active'] - Класс(ы) для добавления (через запятую)
 */
export const addClassInArray = (arr, customClass = 'active') => {
	const classes = customClass.split(',').map(cls => cls.trim());
	arr.forEach((item) => {
		classes.forEach(className => {
			item.classList.add(className);
		});
	});
};

/**
 * Переключает класс(ы) у всех элементов массива
 * @param {HTMLElement[]} arr - Массив элементов
 * @param {string} [customClass='active'] - Класс(ы) для переключения (через запятую)
 */
export const toggleClassInArray = (arr, customClass = 'active') => {
	const classes = customClass.split(',').map(cls => cls.trim());
	arr.forEach((item) => {
		classes.forEach(className => {
			item.classList.toggle(className);
		});
	});
};

/**
 * Устанавливает CSS-переменную на основе размеров элемента
 * @param {HTMLElement} el - Элемент для измерения
 * @param {string} variableName - Имя CSS-переменной
 * @param {string} [type='height'] - Тип измерения (height/width)
 */
export const setVariable = (el, variableName, type = 'height') => {
	if (el) {
		function initListener() {
			const rect = el.getBoundingClientRect();
			let elementOption;
			if (type === 'height') {
				elementOption = rect.height;
			}
			if (type === 'width') {
				elementOption = rect.width;
			}
			document.documentElement.style.setProperty(`--${variableName}`, `${elementOption}px`);
		}

		initListener();
		window.addEventListener('resize', initListener);
	}
};


/**
 * Реализует "липкий" (sticky) заголовок с анимацией
 * @param {HTMLElement} block - Заголовок
 * @param {number} duration - Длительность анимации (мс)
 * @param {number} delay - Задержка перед появлением (мс)
 * @param {string} type - Тип анимации (CSS transition-timing-function)
 * @param {number} [offset=0] - Дополнительный отступ
 * @param {number} [scrollThreshold=40] - Порог скролла для появления
 */
export const stickyHeader = (block, duration, delay, type, offset = 0, scrollThreshold = 40) => {
	let lastScrollTop = 0;
	let accumulatedScroll = 0;

	block.style.transition = `all ${duration}ms ${type}`;

	const updateHeaderPosition = () => {
		const currentScroll = window.pageYOffset;
		if (currentScroll > block.offsetHeight + offset) {
			if (currentScroll > lastScrollTop) {
				block.style.top = `-${block.offsetHeight}px`;
				block.style.transitionDelay = '0ms';
				accumulatedScroll = 0;
			} else {
				accumulatedScroll += lastScrollTop - currentScroll;

				if (accumulatedScroll >= scrollThreshold) {
					block.style.top = '0';
					block.style.transitionDelay = `${delay}ms`;
					accumulatedScroll = 0;
				}
			}
		} else {
			block.style.top = '0';
			block.style.transitionDelay = '0ms';
		}

		lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
	};

	const debounce = (func, wait) => {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	};

	const debouncedUpdateHeader = debounce(updateHeaderPosition, 10);
	window.addEventListener('scroll', debouncedUpdateHeader);
};

/**
 * Вызывает действие при скролле до определенной секции
 * @param {string} sectionSelector - Селектор целевой секции
 * @param {Function} action - Функция для выполнения
 */
export const scrollToSection = (sectionSelector, action) => {
	const section = document.querySelector(sectionSelector);

	window.addEventListener('scroll', () => {
		if (!section) return;

		const rect = section.getBoundingClientRect();

		if (rect.top <= window.innerHeight && rect.bottom >= 0) {
			action();
		}
	});
};

/**
 * Инициализирует параллакс-эффект для изображения в контейнере
 * @param {string} containerSelector - Селектор контейнера
 */
export const initParallaxEffect = (containerSelector) => {
	const container = document.querySelector(containerSelector);
	if (!container) return;

	const image = container.querySelector('img');
	if (!image) return;

	document.addEventListener('mousemove', function(e) {
		const x = e.clientX - container.offsetLeft;
		const y = e.clientY - container.offsetTop;

		const width = container.offsetWidth;
		const height = container.offsetHeight;

		const moveY = ((x - width / 2) / width) * 20;
		const moveX = ((y - height / 2) / height) * 22;

		image.style.transform = `translate(${moveX}px, ${moveY}px)`;
	});
};

/**
 * Анимирует переключение классов в массиве элементов
 * @param {HTMLElement[]} array - Массив элементов
 * @param {string} initClass - Класс для анимации
 * @param {number} timing - Интервал переключения (мс)
 */
export const animateInit = (array, initClass, timing) => {
	let currentIndex = 0;
	document.documentElement.style.setProperty(`--${initClass}`, `${timing}ms`);

	const animateListItem = () => {
		array.forEach(item => item.classList.remove(initClass));
		array[currentIndex].classList.add(initClass);

		currentIndex = (currentIndex + 1) % array.length;
		setTimeout(animateListItem, timing);
	};

	animateListItem();
};

/**
 * Плавно скроллит к элементу в указанном направлении
 * @param {HTMLElement} element - Целевой элемент
 * @param {string} direction - Направление ('up' или 'down')
 */
export const scrollToElement = (element, direction) => {
	if (element) {
		const position = element.getBoundingClientRect();
		if (direction === 'up') {
			window.scrollTo({
				top: position.top + window.scrollY - element.offsetHeight,
				behavior: 'smooth'
			});
		} else if (direction === 'down') {
			window.scrollTo({
				top: position.bottom + window.scrollY,
				behavior: 'smooth'
			});
		}
	}
};


export const elementSize = (el, variableName, dimension = 'height') => {
	// el — сам элемент (DOM node, не коллекция)
	// variableName — имя css-переменной (строка)
	// dimension — "width" или "height"

	if (!el) return;

	function updateVar() {
		let value = 0;

		if (dimension === 'width') {
			value = el.offsetWidth;
		} else {
			value = el.offsetHeight;
		}

		document.documentElement.style.setProperty(`--${variableName}`, `${value}px`);
	}

	// Первичная инициализация
	updateVar();

	// Навешиваем слушатели
	window.addEventListener('DOMContentLoaded', updateVar);
	window.addEventListener('resize', updateVar);
};

