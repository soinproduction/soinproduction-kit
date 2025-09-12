/**
 * Устанавливает CSS-переменную с шириной или высотой указанного элемента.
 *
 * @param {HTMLElement} el - Целевой элемент (не коллекция).
 * @param {string} variableName - Имя создаваемой CSS-переменной.
 * @param {"width"|"height"} [dimension="height"] - Измеряемое свойство: "width" или "height".
 */
export const elementSize = (el, variableName, dimension = 'height') => {
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
