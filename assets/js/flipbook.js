/**
 * FLIPBOOK3D ENGINE
 * Efecto libro físico: dos páginas visibles, hoja que se dobla sobre el eje central.
 *
 * Estructura HTML esperada:
 *  .book-open
 *    .half-left     ← página izquierda estática
 *    .half-right    ← página derecha estática
 *    .flipper       ← hoja voladora (encima de half-right)
 *      .fl-front    ← cara A de la hoja
 *      .fl-back     ← cara B de la hoja (invertida)
 *    .spine
 *
 * Modelo de "spreads" (pares de páginas):
 *   spread 0  → [blank, portada]     ← estado inicial
 *   spread 1  → [pág 1, pág 2]
 *   spread 2  → [pág 3, pág 4]
 *   ...
 *   spread N  → [contraportada, blank]
 *
 * Uso:
 *   const fb = new Flipbook3D({ pages: [ ...contentNodeArrays... ] });
 */

class Flipbook3D {
  /**
   * @param {Object} cfg
   * @param {HTMLElement[]} cfg.pages   Array de nodos .pg a mostrar, en orden
   * @param {Function}      cfg.onTurn  Callback(spreadIndex)
   */
  constructor({ pages, onTurn }) {
    this.pages    = pages;          // nodos individuales de página
    this.onTurn   = onTurn || (() => {});
    this.busy     = false;

    // Estado actual del spread visible
    // Cada spread muestra dos páginas: [leftIdx, rightIdx]
    // Usamos índice -1 para "en blanco"
    this.spreadIndex = 0;
    this.spreads     = this._buildSpreads();

    this._dom();
    this._render(false);
    this._bindEvents();
    this._generateStars();
  }

  /* ── Construcción de spreads ───────────────────────── */
  _buildSpreads() {
    const n = this.pages.length;
    const spreads = [];

    // Spread 0: [blank, página 0]   (portada a la derecha)
    spreads.push([-1, 0]);

    // Spreads intermedios: de 2 en 2
    for (let i = 1; i < n - 1; i += 2) {
      spreads.push([i, i + 1 < n ? i + 1 : -1]);
    }

    // Si n es par, el último spread es [n-1, blank]
    // Si n es impar, ya quedó cubierto arriba
    if (n > 1 && n % 2 === 0) {
      // El último elemento individual queda solo
      spreads.push([n - 1, -1]);
    }

    return spreads;
  }

  /* ── Referencias DOM ───────────────────────────────── */
  _dom() {
    this.halfLeft  = document.querySelector('.half-left');
    this.halfRight = document.querySelector('.half-right');
    this.flipper   = document.querySelector('.flipper');
    this.flFront   = document.querySelector('.fl-front');
    this.flBack    = document.querySelector('.fl-back');
    this.btnPrev   = document.getElementById('btnPrev');
    this.btnNext   = document.getElementById('btnNext');
    this.progFill  = document.getElementById('progressFill');
    this.navPages  = document.getElementById('navPages');
  }

  /* ── Renderizado sin animación ─────────────────────── */
  _render(animate) {
    const [li, ri] = this.spreads[this.spreadIndex];

    // Mostrar páginas estáticas
    this._setContent(this.halfLeft,  li);
    this._setContent(this.halfRight, ri);

    // Flipper en reposo: muestra la página derecha encima (para la próxima animación)
    // Ponemos el siguiente contenido en el flipper (preparado)
    const nextSpread   = this.spreads[this.spreadIndex + 1] || null;
    const prevSpread   = this.spreads[this.spreadIndex - 1] || null;

    if (nextSpread) {
      this._setContent(this.flFront, nextSpread[1] !== undefined ? ri   : -1); // misma que la derecha
      this._setContent(this.flBack,  nextSpread[0] !== undefined ? nextSpread[0] : -1);
    }

    // Posición de reposo: flipper tapando la derecha, sin rotar
    this.flipper.style.transition = 'none';
    this.flipper.classList.remove('flipped', 'animating', 'is-left');
    this.flipper.style.left = '50%';
    this.flipper.style.right = '';
    this.flipper.style.transformOrigin = 'left center';
    this.flipper.style.transform = 'rotateY(0deg)';

    this._updateControls();
  }

  /* ── Poner contenido en un contenedor ─────────────── */
  _setContent(container, pageIdx) {
    // Quitar contenido anterior
    container.innerHTML = '';
    if (pageIdx === -1 || pageIdx === undefined) {
      // Página en blanco
      const blank = document.createElement('div');
      blank.className = 'pg pg-blank';
      blank.innerHTML = '<span class="pg-blank-deco">📚</span>';
      container.appendChild(blank);
      return;
    }
    const node = this.pages[pageIdx];
    if (node) container.appendChild(node.cloneNode(true));
  }

  /* ── Animación de pasar página hacia adelante ──────── */
  async next() {
    if (this.busy || this.spreadIndex >= this.spreads.length - 1) return;
    this.busy = true;

    const nextSI   = this.spreadIndex + 1;
    const [nli, nri] = this.spreads[nextSI];

    // El flipper tapa la página derecha actual.
    // fl-front = página derecha actual (lo que "se lleva")
    // fl-back  = página izquierda del siguiente spread
    this._setContent(this.flFront, this.spreads[this.spreadIndex][1]);
    this._setContent(this.flBack,  nli);

    // Preparar half-left y half-right del SIGUIENTE spread (debajo)
    this._setContent(this.halfLeft,  nli);
    this._setContent(this.halfRight, nri);

    // Poner flipper en posición inicial (encima de la derecha)
    this.flipper.style.transition   = 'none';
    this.flipper.style.left         = '50%';
    this.flipper.style.right        = '';
    this.flipper.style.transformOrigin = 'left center';
    this.flipper.style.transform    = 'rotateY(0deg)';
    this.flipper.classList.remove('flipped','is-left');

    // Forzar reflow
    void this.flipper.offsetWidth;

    // Animar
    this.flipper.classList.add('animating');
    this.flipper.style.transition = `transform var(--flip-dur) cubic-bezier(.645,.045,.355,1)`;
    this.flipper.style.transform  = 'rotateY(-180deg)';

    await this._wait();

    this.spreadIndex = nextSI;
    this.flipper.classList.remove('animating');
    this._render(false);
    this.busy  = false;
    this.onTurn(this.spreadIndex);
  }

  /* ── Animación de pasar página hacia atrás ─────────── */
  async prev() {
    if (this.busy || this.spreadIndex <= 0) return;
    this.busy = true;

    const prevSI     = this.spreadIndex - 1;
    const [pli, pri] = this.spreads[prevSI];

    // fl-front = página izquierda actual (vista desde la espalda)
    // fl-back  = página derecha del spread anterior
    this._setContent(this.flFront, pri);
    this._setContent(this.flBack,  this.spreads[this.spreadIndex][0]);

    // El flipper sale desde la izquierda (ya rotado -180 = encima de left)
    this.flipper.style.transition   = 'none';
    this.flipper.style.left         = '50%';
    this.flipper.style.right        = '';
    this.flipper.style.transformOrigin = 'left center';
    this.flipper.style.transform    = 'rotateY(-180deg)';
    this.flipper.classList.remove('flipped','is-left');

    // Preparar páginas estáticas del spread anterior (debajo)
    this._setContent(this.halfLeft,  pli);
    this._setContent(this.halfRight, pri);

    void this.flipper.offsetWidth;

    this.flipper.classList.add('animating');
    this.flipper.style.transition = `transform var(--flip-dur) cubic-bezier(.645,.045,.355,1)`;
    this.flipper.style.transform  = 'rotateY(0deg)';

    await this._wait();

    this.spreadIndex = prevSI;
    this.flipper.classList.remove('animating');
    this._render(false);
    this.busy  = false;
    this.onTurn(this.spreadIndex);
  }

  /* ── Controles UI ──────────────────────────────────── */
  _updateControls() {
    if (this.btnPrev) this.btnPrev.disabled = this.spreadIndex === 0;
    if (this.btnNext) this.btnNext.disabled = this.spreadIndex >= this.spreads.length - 1;

    const pct = this.spreads.length > 1
      ? (this.spreadIndex / (this.spreads.length - 1)) * 100
      : 100;
    if (this.progFill) this.progFill.style.width = pct + '%';

    const totalPages = this.pages.length;
    const [li, ri]   = this.spreads[this.spreadIndex];
    const shown      = li >= 0 ? li + 1 : ri >= 0 ? ri + 1 : 1;
    if (this.navPages) this.navPages.textContent = `${shown} / ${totalPages}`;
  }

  /* ── Eventos ───────────────────────────────────────── */
  _bindEvents() {
    this.btnPrev?.addEventListener('click', () => this.prev());
    this.btnNext?.addEventListener('click', () => this.next());

    // Teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   this.prev();
    });

    // Swipe táctil
    let sx = null;
    const book = document.querySelector('.book-open') || document.body;
    book.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    book.addEventListener('touchend',   e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { dx < 0 ? this.next() : this.prev(); }
      sx = null;
    }, { passive: true });

    // Click en mitades del libro
    document.querySelector('.half-right')?.addEventListener('click', () => this.next());
    document.querySelector('.half-left')?.addEventListener('click',  () => this.prev());
  }

  /* ── Estrellas de fondo ────────────────────────────── */
  _generateStars() {
    const c = document.querySelector('.stars-bg');
    if (!c) return;
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const sz = Math.random() * 2.5 + 0.8;
      s.style.cssText = `
        width:${sz}px; height:${sz}px;
        left:${Math.random()*100}%;
        top:${Math.random()*100}%;
        --dur:${(Math.random()*3+2).toFixed(1)}s;
        --d:${(Math.random()*4).toFixed(1)}s;
        opacity:${(Math.random()*.4+.05).toFixed(2)};
      `;
      c.appendChild(s);
    }
  }

  /* ── Utilidad ──────────────────────────────────────── */
  _wait() {
    const ms = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--flip-dur') || '650ms'
    );
    return new Promise(r => setTimeout(r, isNaN(ms) ? 650 : ms + 60));
  }
}
