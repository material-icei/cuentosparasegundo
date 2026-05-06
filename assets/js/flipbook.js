/**
 * FLIPBOOK CANVAS ENGINE v3
 * Modelo de spreads:  izquierda = imagen (par) | derecha = texto (impar)
 *
 *   Página 0  → portada  (derecha sola, sin imagen izquierda)
 *   Spread 1  → izq: pagina1.png   | der: página de texto 1
 *   Spread 2  → izq: pagina2.png   | der: página de texto 2
 *   ...
 *   Último    → página final (derecha sola o con imagen vacía)
 *
 * Las imágenes se cargan desde  imagenes/pagina1.png, pagina2.png…
 * Las páginas .pg del HTML son SOLO páginas de texto/tapa/fin.
 *
 * Uso:
 *   const fb = new FlipbookCanvas({ pages: [...nodos .pg...] });
 */
class FlipbookCanvas {
  constructor({ pages, onTurn, imagePath, videoSrc }) {
    this.pages        = pages;
    this.onTurn       = onTurn || (() => {});
    this.spread       = 0;
    this.totalSpreads = pages.length;
    this.busy         = false;
    this.dir          = 1;
    this.progress     = 0;
    this.rafId        = null;
    this.imagePath    = imagePath || 'imagenes/pagina';
    this.imgCache     = {};
    // Video de la página final izquierda
    // Si no se pasa videoSrc, busca automáticamente video/cuento.mp4
    this.videoSrc     = videoSrc || 'video/cuento.mp4';
    this.videoEl      = null;   // elemento <video> superpuesto

    this._buildDOM();
    this._buildVideo();
    this._preloadImages();
    this._bindEvents();
    this._generateStars();
    this._renderStatic();
  }

  /* ─── Precarga de imágenes ────────────────────────────── */
  _preloadImages() {
    // pagina1.png … paginaN.png  (N = páginas de texto - 1, sin contar portada/fin)
    const total = this.pages.length;
    for (let i = 1; i <= total; i++) {
      const img = new Image();
      img.src = this.imagePath + i + '.png';
      img.onload  = () => this._renderStatic();
      img.onerror = () => {};        // silencioso si no existe
      this.imgCache[i] = img;
    }
  }

  /* ─── Elemento <video> superpuesto para la última página ─ */
  _buildVideo() {
    const vid = document.createElement('video');
    vid.controls = true;
    vid.preload  = 'metadata';
    vid.loop     = false;
    vid.style.cssText = [
      'position:absolute',
      'top:0','left:0',
      'width:50%','height:100%',
      'object-fit:cover',
      'border-radius:3px 0 0 3px',
      'display:none',
      'z-index:2',
      'background:#000',
    ].join(';');

    const src = document.createElement('source');
    src.src  = this.videoSrc;
    src.type = 'video/mp4';
    vid.appendChild(src);

    this.bookOpen.appendChild(vid);
    this.videoEl = vid;
  }

  /* ─── Mostrar/ocultar video según el spread actual ──────── */
  _syncVideo() {
    if (!this.videoEl) return;
    const isLast = this.spread === this.totalSpreads - 1;
    // Solo visible en el último spread Y sin animación en curso
    if (isLast && !this.busy) {
      this.videoEl.style.display = 'block';
    } else {
      this.videoEl.style.display = 'none';
      if (!isLast) this.videoEl.pause();
    }
  }

  /* ─── Dibuja imagen a página completa (cover-fit) ─────── */
  _drawImage(num, x, y, w, h) {
    const ctx = this.ctx;
    const img = this.imgCache[num];

    if (!img || !img.complete || img.naturalWidth === 0) {
      // Fallback: fondo crema con indicador sutil
      ctx.fillStyle = '#f5f0e8';
      ctx.fillRect(x, y, w, h);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.font = `700 ${Math.round(h * 0.038)}px 'Nunito', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ilustración ' + num, x + w / 2, y + h / 2);
      ctx.textAlign = 'left';
      ctx.restore();
      return;
    }

    // object-fit: cover
    const ir = img.naturalWidth / img.naturalHeight;
    const rr = w / h;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (ir > rr) { sw = sh * rr; sx = (img.naturalWidth  - sw) / 2; }
    else         { sh = sw / rr; sy = (img.naturalHeight - sh) / 2; }

    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);

    // Viñeta suave
    const vig = ctx.createRadialGradient(
      x + w / 2, y + h / 2, h * 0.28,
      x + w / 2, y + h / 2, h * 0.78
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  /* ─── Dibuja una página de texto (.pg) en canvas ──────── */
  _drawPage(idx, x, y, w, h) {
    const ctx  = this.ctx;
    const node = idx >= 0 && idx < this.pages.length ? this.pages[idx] : null;

    if (!node) {
      ctx.fillStyle = '#f5f0e8'; ctx.fillRect(x, y, w, h); return;
    }

    const rs   = getComputedStyle(document.documentElement);
    const cCol = rs.getPropertyValue('--cover-color').trim()  || '#FF6B6B';
    const cCol2= rs.getPropertyValue('--cover-color2').trim() || '#FFD93D';

    // ── Fondo ──────────────────────────────────────────────
    if (node.classList.contains('pg-cover')) {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, cCol); g.addColorStop(1, cCol2);
      ctx.fillStyle = g;
    } else if (node.classList.contains('pg-end')) {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#6BCB77'); g.addColorStop(1, '#4D96FF');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = '#fffef8';
    }
    ctx.fillRect(x, y, w, h);

    // Sombra de lomo interna (páginas de contenido)
    if (!node.classList.contains('pg-cover') && !node.classList.contains('pg-end')) {
      const sg = ctx.createLinearGradient(x, 0, x + 28, 0);
      sg.addColorStop(0, 'rgba(0,0,0,0.09)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.fillRect(x, y, w, h);
    }

    // ── Contenido ──────────────────────────────────────────
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, h - 4); ctx.clip();

    const PAD_X = Math.round(w * 0.062);
    const PAD_Y = Math.round(h * 0.052);
    const tx    = x + PAD_X;
    const maxTW = w - PAD_X * 2;

    if (node.classList.contains('pg-cover')) {
      // ── TAPA ────────────────────────────────────────────
      const title = node.querySelector('.cov-title')?.textContent.trim() || '';
      const sub   = node.querySelector('.cov-sub')?.textContent.trim()   || '';
      let fs = Math.round(w * 0.1);
      ctx.font = `800 ${fs}px 'Baloo 2', cursive`;
      while (fs > 12 && ctx.measureText(title).width > maxTW * 0.88) {
        fs--; ctx.font = `800 ${fs}px 'Baloo 2', cursive`;
      }
      const lh     = Math.round(fs * 1.25);
      const tLines = this._wrapText(ctx, title, maxTW * 0.86);
      const subH   = sub ? Math.round(fs * 0.52) + 12 : 0;
      const totalH = tLines.length * lh + subH;
      let cy = y + (h - totalH) / 2 + lh * 0.85;

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.textAlign = 'center';
      for (const ln of tLines) { ctx.fillText(ln, x + w / 2, cy); cy += lh; }
      if (sub) {
        const sfs = Math.max(Math.round(fs * 0.46), 11);
        ctx.font = `700 ${sfs}px 'Nunito', sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.80)';
        for (const ln of this._wrapText(ctx, sub, maxTW * 0.80)) {
          ctx.fillText(ln, x + w / 2, cy + 8); cy += sfs + 4;
        }
      }
      ctx.textAlign = 'left';

    } else if (node.classList.contains('pg-end')) {
      // ── FIN ─────────────────────────────────────────────
      const title = node.querySelector('.end-title')?.textContent.trim() || '¡Fin!';
      const sub   = node.querySelector('.end-sub')?.textContent.trim()   || '';
      let fs = Math.round(w * 0.1);
      ctx.font = `800 ${fs}px 'Baloo 2', cursive`;
      while (fs > 12 && ctx.measureText(title).width > maxTW * 0.86) {
        fs--; ctx.font = `800 ${fs}px 'Baloo 2', cursive`;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.textAlign = 'center';
      ctx.fillText(title, x + w / 2, y + h * 0.44);
      if (sub) {
        const sfs = Math.max(Math.round(fs * 0.47), 11);
        ctx.font = `700 ${sfs}px 'Nunito', sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        let sy = y + h * 0.44 + Math.round(fs * 1.3);
        for (const ln of this._wrapText(ctx, sub.replace(/\n/g,' '), maxTW * 0.82)) {
          ctx.fillText(ln, x + w / 2, sy); sy += sfs + 5;
        }
      }
      ctx.textAlign = 'left';

    } else {
      // ── PÁGINA DE TEXTO ─────────────────────────────────
      const hasVideo = !!node.querySelector('.pg-video, video');
      const hasAudio = !!node.querySelector('audio');
      const chapter  = node.querySelector('.pg-chapter');
      const body     = node.querySelector('.story-body');

      const hasMedia  = hasVideo || hasAudio;
      const mediaH    = hasMedia ? Math.round(h * 0.12) : 0; // solo indicador, no render
      const topUsed   = PAD_Y + (chapter ? Math.round(h * 0.075) : 0);
      const botUsed   = PAD_Y + 14 + mediaH;
      const availH    = h - topUsed - botUsed;

      // Recopilar bloques de texto
      const blocks = [];
      if (body) {
        for (const seg of body.childNodes) {
          if (seg.nodeType === Node.TEXT_NODE && !seg.textContent.trim()) continue;
          if (seg.nodeType !== Node.ELEMENT_NODE && seg.nodeType !== Node.TEXT_NODE) continue;
          const raw = seg.textContent.replace(/\n/g,' ').replace(/\s+/g,' ').trim();
          if (!raw) continue;
          const isQ = seg.nodeName === 'SPAN' && seg.classList?.contains('story-quote');
          blocks.push({ text: raw, isQ });
        }
      }

      // Auto-fit: mayor fs donde todo cabe
      const fsMin = 11, fsMax = Math.round(h * 0.14);
      let bestFs = fsMin;
      for (let fs = fsMax; fs >= fsMin; fs--) {
        const lh = Math.round(fs * 1.58);
        const gp = Math.round(fs * 0.42);
        let need = 0;
        for (const blk of blocks) {
          ctx.font = `600 ${fs}px 'Nunito', sans-serif`;
          need += this._wrapText(ctx, blk.text, maxTW - (blk.isQ ? 14 : 0)).length * lh + gp;
        }
        if (need <= availH) { bestFs = fs; break; }
      }

      const fs = bestFs;
      const lh = Math.round(fs * 1.58);
      const gp = Math.round(fs * 0.42);
      let curY = y + topUsed;

      // Capítulo
      if (chapter) {
        const cfs = Math.max(Math.round(fs * 0.65), 10);
        ctx.fillStyle = cCol;
        ctx.font = `800 ${cfs}px 'Baloo 2', cursive`;
        ctx.fillText(chapter.textContent.toUpperCase(), tx, y + PAD_Y + cfs);
        curY = y + PAD_Y + cfs + Math.round(cfs * 0.7);
      }

      // Bloques
      for (const blk of blocks) {
        ctx.font = `${blk.isQ ? 'italic ' : ''}600 ${fs}px 'Nunito', sans-serif`;
        const indent = blk.isQ ? tx + 10 : tx;
        const lineW  = blk.isQ ? maxTW - 14 : maxTW;
        const lines  = this._wrapText(ctx, blk.text, lineW);

        if (blk.isQ) {
          const qH = lines.length * lh + 4;
          ctx.fillStyle = cCol + '1A';
          ctx.fillRect(tx, curY - fs * 0.88, lineW + 14, qH);
          ctx.fillStyle = cCol;
          ctx.fillRect(tx, curY - fs * 0.88, 3, qH);
        }

        ctx.fillStyle = blk.isQ ? cCol : '#2d2d4e';
        for (const ln of lines) { ctx.fillText(ln, indent, curY); curY += lh; }
        curY += gp;
      }

      // Indicador de media
      if (hasMedia) {
        const mfs = Math.max(Math.round(fs * 0.6), 10);
        ctx.font = `700 ${mfs}px 'Nunito', sans-serif`;
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillText(hasVideo ? '▶ video incluido' : '♪ audio incluido', tx, y + h - botUsed + mfs);
      }

      // Número de página
      const num = node.querySelector('.pg-num');
      if (num) {
        const nfs = Math.max(Math.round(fs * 0.56), 9);
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.font = `700 ${nfs}px 'Nunito', sans-serif`;
        const nTxt = num.textContent.trim();
        if (num.classList.contains('right')) {
          ctx.textAlign = 'right';
          ctx.fillText(nTxt, x + w - PAD_X, y + h - Math.round(PAD_Y * 0.55));
        } else {
          ctx.fillText(nTxt, tx, y + h - Math.round(PAD_Y * 0.55));
        }
        ctx.textAlign = 'left';
      }
    }

    ctx.restore();
  }

  /* ─── Construcción del DOM canvas ─────────────────────── */
  _buildDOM() {
    this.bookOpen = document.querySelector('.book-open');
    this.bookOpen.innerHTML = '';
    this.bookOpen.style.cssText += ';position:relative;overflow:hidden;';

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;border-radius:3px 6px 6px 3px;cursor:pointer;';
    this.bookOpen.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this.bookOpen);
    this._resize();

    this.btnPrev  = document.getElementById('btnPrev');
    this.btnNext  = document.getElementById('btnNext');
    this.progFill = document.getElementById('progressFill');
    this.navPages = document.getElementById('navPages');
  }

  _resize() {
    const r   = this.bookOpen.getBoundingClientRect();
    this.W    = r.width  || 700;
    this.H    = r.height || 460;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width  = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.ctx.scale(dpr, dpr);
    this._renderStatic();
  }

  /* ─── Frame principal ──────────────────────────────────── */
  _drawFrame(prog) {
    const ctx  = this.ctx;
    const W = this.W, H = this.H;
    const MID = W / 2;
    const PAD = 6;
    const lW  = MID - PAD;
    const pH  = H - PAD * 2;

    ctx.clearRect(0, 0, W, H);

    // Sombra del libro
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#bbb'; ctx.fillRect(PAD, PAD, W - PAD * 2, pH);
    ctx.restore();

    // ── Estado de los spreads ──────────────────────────────
    // spread 0     → izq:nada  | der: pages[0] (portada)
    // spread 1..N  → izq: imagen N | der: pages[N]
    // Al avanzar: la hoja voladora lleva pages[spread] hacia la izquierda
    //             y revela izqImagen[spread+1] + pages[spread+1]
    //
    // Durante animación avanzando (dir=1):
    //   fondo izq: imagen del spread DESTINO (spread+1)
    //   fondo der: pages[spread+1]  (aparece al cruzar 90°)
    //   hoja:  frente=pages[spread], reverso=color liso

    if (this.busy) {
      const t      = this._ease(prog);
      const isBack = Math.cos(t * Math.PI) < 0;

      if (this.dir > 0) {
        // Avanzando →
        // Izquierda: imagen del spread DESTINO ya visible de fondo
        if (this.spread + 1 > 0) {
          this._drawImage(this.spread + 1, PAD, PAD, lW, pH);
        } else {
          ctx.fillStyle = '#f5f0e8'; ctx.fillRect(PAD, PAD, lW, pH);
        }
        // Derecha: página del spread destino aparece tras los 90°
        if (isBack) {
          this._drawPage(this.spread + 1, MID, PAD, lW, pH);
        } else {
          this._drawPage(this.spread, MID, PAD, lW, pH);
        }
      } else {
        // Retrocediendo ←
        // Izquierda: imagen del spread ORIGEN (permanece) → luego la del destino
        const imgNum = isBack
          ? Math.max(this.spread - 1, 0)
          : this.spread;
        if (imgNum > 0) {
          this._drawImage(imgNum, PAD, PAD, lW, pH);
        } else {
          ctx.fillStyle = '#f5f0e8'; ctx.fillRect(PAD, PAD, lW, pH);
        }
        // Derecha: siempre la página del spread actual (destino al retroceder)
        this._drawPage(this.spread - 1 >= 0 ? this.spread : 0, MID, PAD, lW, pH);
      }

    } else {
      // ── Reposo ────────────────────────────────────────────
      const isLastSpread = this.spread === this.totalSpreads - 1;
      if (isLastSpread) {
        // Último spread: izquierda es el video (HTML superpuesto)
        // Dibujamos fondo negro para que el video tenga soporte
        ctx.fillStyle = '#111'; ctx.fillRect(PAD, PAD, lW, pH);
      } else if (this.spread > 0) {
        this._drawImage(this.spread, PAD, PAD, lW, pH);
      } else {
        ctx.fillStyle = '#f5f0e8';
        ctx.fillRect(PAD, PAD, lW, pH);
      }
      // Derecha: página de texto del spread actual
      this._drawPage(this.spread, MID, PAD, lW, pH);
    }

    // ── Lomo ──────────────────────────────────────────────
    const lomoG = ctx.createLinearGradient(MID - 5, 0, MID + 5, 0);
    lomoG.addColorStop(0,   'rgba(0,0,0,0.24)');
    lomoG.addColorStop(0.5, 'rgba(0,0,0,0.05)');
    lomoG.addColorStop(1,   'rgba(0,0,0,0.24)');
    ctx.fillStyle = lomoG; ctx.fillRect(MID - 4, PAD, 8, pH);

    // ── Hoja voladora ─────────────────────────────────────
    if (this.busy) this._drawFlyingPage(prog);

    // Marco
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 1;
    ctx.strokeRect(PAD + .5, PAD + .5, W - PAD * 2 - 1, H - PAD * 2 - 1);
  }

  /* ─── Hoja voladora con curvatura Bézier ──────────────── */
  _drawFlyingPage(t) {
    const ctx  = this.ctx;
    const W = this.W, H = this.H;
    const MID = W / 2, PAD = 6;

    const angle  = this._ease(t) * Math.PI;
    const cosA   = Math.cos(angle);
    const sinA   = Math.sin(angle);
    const isBack = cosA < 0;
    const projW  = Math.abs(cosA) * (MID - PAD);
    const curveY = sinA * Math.min(H * 0.07, 28);

    const x0   = isBack ? MID - projW : MID;
    const x1   = isBack ? MID         : MID + projW;
    const xMid = (x0 + x1) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, PAD);
    ctx.quadraticCurveTo(xMid, PAD - curveY * 0.5, x1, PAD);
    ctx.lineTo(x1, H - PAD);
    ctx.quadraticCurveTo(xMid, H - PAD + curveY * 0.4, x0, H - PAD);
    ctx.closePath();
    ctx.clip();

    if (!isBack) {
      // Cara frontal: página de texto del spread actual (la que "se va")
      const goingIdx = this.dir > 0 ? this.spread : this.spread + 1;
      this._drawPage(goingIdx, x0, 0, projW, H);
    } else {
      // Cara trasera: fondo liso neutro (sin texto espejado)
      ctx.fillStyle = '#f0ece2';
      ctx.fillRect(x0, 0, projW + 2, H);
    }

    // Gradiente de sombra / brillo del pliegue
    const shadG = ctx.createLinearGradient(x0, 0, x1, 0);
    if (!isBack) {
      shadG.addColorStop(0,    'rgba(0,0,0,0.28)');
      shadG.addColorStop(0.14, 'rgba(0,0,0,0.09)');
      shadG.addColorStop(0.7,  'rgba(255,255,255,0.03)');
      shadG.addColorStop(1,    'rgba(255,255,255,0)');
    } else {
      shadG.addColorStop(0,    'rgba(255,255,255,0)');
      shadG.addColorStop(0.3,  'rgba(255,255,255,0.04)');
      shadG.addColorStop(0.88, 'rgba(0,0,0,0.09)');
      shadG.addColorStop(1,    'rgba(0,0,0,0.26)');
    }
    ctx.fillStyle = shadG;
    ctx.fillRect(x0, 0, x1 - x0 + 2, H);
    ctx.restore();

    // Línea de lomo
    const lomX = isBack ? x1 : x0;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(lomX, PAD + 2); ctx.lineTo(lomX, H - PAD - 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  /* ─── Animación ────────────────────────────────────────── */
  _renderStatic() { this._drawFrame(0); this._updateControls(); this._syncVideo(); }

  _animate() {
    this.progress += 0.022;
    if (this.progress >= 1) {
      this.progress = 0;
      this.spread   = this.dir > 0
        ? Math.min(this.spread + 1, this.totalSpreads - 1)
        : Math.max(this.spread - 1, 0);
      this.busy = false;
      this._renderStatic();   // llama _syncVideo internamente
      this.onTurn(this.spread);
      return;
    }
    this._drawFrame(this.progress);
    this.rafId = requestAnimationFrame(() => this._animate());
  }

  next() {
    if (this.busy || this.spread >= this.totalSpreads - 1) return;
    this._syncVideo();   // oculta el video antes de animar
    this.dir = 1; this.busy = true; this.progress = 0;
    cancelAnimationFrame(this.rafId);
    this._animate();
  }

  prev() {
    if (this.busy || this.spread <= 0) return;
    this._syncVideo();   // oculta el video antes de animar
    this.dir = -1; this.busy = true; this.progress = 0;
    cancelAnimationFrame(this.rafId);
    this._animate();
  }

  /* ─── Controles UI ─────────────────────────────────────── */
  _updateControls() {
    if (this.btnPrev) this.btnPrev.disabled = this.spread <= 0;
    if (this.btnNext) this.btnNext.disabled = this.spread >= this.totalSpreads - 1;
    const pct = this.totalSpreads > 1
      ? (this.spread / (this.totalSpreads - 1)) * 100 : 100;
    if (this.progFill) this.progFill.style.width = Math.round(pct) + '%';
    if (this.navPages) {
      this.navPages.textContent = `${this.spread + 1} / ${this.totalSpreads}`;
    }
  }

  /* ─── Eventos ──────────────────────────────────────────── */
  _bindEvents() {
    document.getElementById('btnPrev')?.addEventListener('click', () => this.prev());
    document.getElementById('btnNext')?.addEventListener('click', () => this.next());
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   this.prev();
    });
    let sx = null;
    const el = document.querySelector('.book-open') || document.body;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend',   e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { dx < 0 ? this.next() : this.prev(); }
      sx = null;
    }, { passive: true });
    this.canvas?.addEventListener('click', e => {
      e.offsetX > this.W / 2 ? this.next() : this.prev();
    });
  }

  /* ─── Estrellas de fondo ───────────────────────────────── */
  _generateStars() {
    const c = document.querySelector('.stars-bg');
    if (!c) return;
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const sz = Math.random() * 2.5 + 0.8;
      s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${(Math.random()*3+2).toFixed(1)}s;--d:${(Math.random()*4).toFixed(1)}s;opacity:${(Math.random()*.4+.05).toFixed(2)};`;
      c.appendChild(s);
    }
  }

  /* ─── Utilidades ───────────────────────────────────────── */
  _wrapText(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  _ease(t) { return t < .5 ? 2*t*t : -1+(4-2*t)*t; }
}

// Alias de compatibilidad
const Flipbook3D = FlipbookCanvas;
