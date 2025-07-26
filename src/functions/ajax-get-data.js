/**
 * @param {string} url - URL запроса (обычно window.ajaxurl или ajax_object.ajax_url)
 * @param {string} action - AJAX action name
 * @param {Object} params - Объект с параметрами запроса
 * @param {Function} callback - Колбэк на успешный ответ
 * @param {Function} [onError] - Колбэк на ошибку
 */
export function getAjaxData(url, action, params = {}, callback, onError = null) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 400) {
            try {
                const response = JSON.parse(xhr.responseText);
                callback && callback(response);
            } catch (e) {
                console.error('Ошибка парсинга JSON:', e);
                if (typeof onError === 'function') onError(e);
            }
        } else {
            console.error('Ошибка ответа сервера');
            if (typeof onError === 'function') onError(xhr);
        }
    };

    xhr.onerror = function () {
        console.error('Ошибка соединения с сервером');
        if (typeof onError === 'function') onError(xhr);
    };

    const query = new URLSearchParams({ action, ...params }).toString();
    xhr.send(query);
}
