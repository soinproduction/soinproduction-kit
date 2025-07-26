export const enableScroll = () => {
  const body = document.body;
  const html = document.documentElement;
  const pagePosition = parseInt(body.dataset.position || '0', 10);

  if (!body.classList.contains('dis-scroll')) return;

  document.querySelectorAll('.fixed-block').forEach(el => {
    el.style.paddingRight = '0px';
  });

  body.style.paddingRight = '0px';
  body.style.top = '';
  body.classList.remove('dis-scroll');
  body.removeAttribute('data-position');

  html.style.scrollBehavior = '';
  window.scrollTo({ top: pagePosition, left: 0 });
};
