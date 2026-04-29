// Genera estrellas animadas en el fondo de la portada
(function () {
  const container = document.getElementById('stars');
  if (!container) return;

  const COUNT = 80;

  for (let i = 0; i < COUNT; i++) {
    const star = document.createElement('div');
    star.classList.add('star');

    const size = Math.random() * 3 + 1;
    const x    = Math.random() * 100;
    const y    = Math.random() * 100;
    const dur  = (Math.random() * 3 + 2).toFixed(1);
    const del  = (Math.random() * 4).toFixed(1);

    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      top: ${y}%;
      --dur: ${dur}s;
      --delay: ${del}s;
      opacity: ${Math.random() * 0.5 + 0.1};
    `;

    container.appendChild(star);
  }
})();
