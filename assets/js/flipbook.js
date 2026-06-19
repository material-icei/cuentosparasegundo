/**
 * SLIDESHOW ENGINE — 16:9 dos columnas
 * Cada slide es un .pg del DOM (oculto).
 * El motor lo clona y lo muestra con fade en #slide-container.
 * Los .pg-spread se activan como flex al mostrarse.
 */
class FlipbookCanvas {
  constructor({ pages, onTurn }) {
    this.pages   = pages;
    this.onTurn  = onTurn || (() => {});
    this.current = 0;
    this.busy    = false;

    this._show(false);   // mostrar sin fade la primera vez
    this._bindEvents();
    this._generateStars();
  }

  _show(withFade = true) {
    const container = document.getElementById('slide-container');
    if (!container) return;

    const doRender = () => {
      container.innerHTML = '';
      const node  = this.pages[this.current];
      if (!node) return;
      const clone = node.cloneNode(true);

      // Activar display correcto según tipo de página
      if (clone.classList.contains('pg-spread')) {
        clone.style.display = 'flex';
      } else if (
        clone.classList.contains('pg-cover')   ||
        clone.classList.contains('pg-end')     ||
        clone.classList.contains('pg-video-full')
      ) {
        clone.style.display = 'flex';
      } else {
        clone.style.display = 'flex';
      }

      container.appendChild(clone);
      if (withFade) {
        requestAnimationFrame(() => { container.style.opacity = '1'; });
      } else {
        container.style.opacity = '1';
      }
      this.busy = false;
      this._updateControls();
      this.onTurn(this.current);
    };

    if (withFade) {
      container.style.opacity = '0';
      setTimeout(doRender, 200);
    } else {
      doRender();
    }
  }

  next() {
    if (this.busy || this.current >= this.pages.length - 1) return;
    this.busy = true;
    this.current++;
    this._show();
  }

  prev() {
    if (this.busy || this.current <= 0) return;
    this.busy = true;
    this.current--;
    this._show();
  }

  _updateControls() {
    const btnPrev  = document.getElementById('btnPrev');
    const btnNext  = document.getElementById('btnNext');
    const progFill = document.getElementById('progressFill');
    const navPages = document.getElementById('navPages');

    if (btnPrev) btnPrev.disabled = this.current === 0;
    if (btnNext) btnNext.disabled = this.current === this.pages.length - 1;

    const pct = this.pages.length > 1
      ? (this.current / (this.pages.length - 1)) * 100 : 100;
    if (progFill) progFill.style.width = Math.round(pct) + '%';
    if (navPages) navPages.textContent = `${this.current + 1} / ${this.pages.length}`;
  }

  _bindEvents() {
    document.getElementById('btnPrev')?.addEventListener('click', () => this.prev());
    document.getElementById('btnNext')?.addEventListener('click', () => this.next());

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   this.prev();
    });

    let sx = null;
    document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend',   e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { dx < 0 ? this.next() : this.prev(); }
      sx = null;
    }, { passive: true });
  }

  _generateStars() {
    const c = document.querySelector('.stars-bg');
    if (!c) return;
    for (let i = 0; i < 60; i++) {
      const s  = document.createElement('div');
      s.className = 'star';
      const sz = Math.random() * 2.5 + 0.8;
      s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${(Math.random()*3+2).toFixed(1)}s;--d:${(Math.random()*4).toFixed(1)}s;opacity:${(Math.random()*.4+.05).toFixed(2)};`;
      c.appendChild(s);
    }
  }
}

const Flipbook3D = FlipbookCanvas;

