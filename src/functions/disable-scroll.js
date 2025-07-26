export const disableScroll = () => {
  const body = document.body;
  const html = document.documentElement;
  const scrollY = window.scrollY || window.pageYOffset;
  const paddingOffset = `${window.innerWidth - body.offsetWidth}px`;

  if (body.classList.contains('dis-scroll')) return;

  html.style.scrollBehavior = 'auto';

  document.querySelectorAll('.fixed-block').forEach(el => {
    el.style.paddingRight = paddingOffset;
  });

  body.style.paddingRight = paddingOffset;
  body.style.top = `-${scrollY}px`;
  body.dataset.position = scrollY;
  body.classList.add('dis-scroll');
};
