export const cf7Reinit = (parent) => {
    const form = parent.querySelector('form');
    if (form) {
        const oldAttr = form.getAttribute('action').split('#')[1];
        form.setAttribute('action', `/#${oldAttr}`);

        if (typeof wpcf7 !== 'undefined' && typeof wpcf7.initForm === 'function') {
            wpcf7.initForm(form);
        }
        if (typeof wpcf7 !== 'undefined' && wpcf7.cached && typeof wpcf7.refill === 'function') {
            wpcf7.refill(form);
        }
    }
}