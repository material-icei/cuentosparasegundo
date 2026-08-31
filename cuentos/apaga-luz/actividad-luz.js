/* =========================================================
   ACTIVIDAD DE COMPRENSIÓN LECTORA
   "Cuando se apaga la luz"
   ========================================================= */

// ── Fondo de estrellitas decorativas ─────────────────────
(function initStars() {
  const layer = document.getElementById('stars');
  const total = 40;
  for (let i = 0; i < total; i++) {
    const s = document.createElement('div');
    s.style.position = 'absolute';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    const size = Math.random() * 2.5 + 1;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.borderRadius = '50%';
    s.style.background = '#fff';
    s.style.opacity = Math.random() * 0.6 + 0.15;
    layer.appendChild(s);
  }
})();

// ── Banco de preguntas ───────────────────────────────────
const QUESTIONS = [
  {
    type: 'mc',
    text: '¿Quiénes son los protagonistas del cuento?',
    options: ['Lila y Teo', 'Cala y Juan', 'Simón y Manchitas', 'Lía y Mora'],
    correct: 0
  },
  {
    type: 'vf',
    text: 'Lila le pidió a mamá que apagara completamente todas las luces.',
    correct: false
  },
  {
    type: 'mc',
    text: '¿Qué le preocupaba a Lila antes de dormir?',
    options: ['Tener hambre', 'Escuchar un ruido en la oscuridad', 'Perder su peluche', 'Llegar tarde a la escuela'],
    correct: 1
  },
  {
    type: 'vf',
    text: 'Mamá le explicó a Lila que a la noche todo suena distinto, y que puede ser el viento o la casa.',
    correct: true
  },
  {
    type: 'mc',
    text: '¿Qué abrazó Lila para sentirse acompañada?',
    options: ['Una almohada', 'Su peluche', 'Un libro', 'Una manta extra'],
    correct: 1
  },
  {
    type: 'vf',
    text: 'Teo llamó a su papá porque había escuchado algo.',
    correct: true
  },
  {
    type: 'mc',
    text: '¿Qué le pidió papá a Teo que trajera?',
    options: ['Su superhéroe', 'Su pelota', 'Un cuento', 'Su almohada favorita'],
    correct: 0
  },
  {
    type: 'vf',
    text: 'Papá le dijo a Teo que se quedaría despierto toda la noche cuidándolo.',
    correct: false
  },
  {
    type: 'mc',
    text: '¿Cómo terminaron sintiéndose Lila y Teo al final del cuento?',
    options: ['Asustados toda la noche', 'Tranquilos y en calma', 'Enojados', 'Aburridos'],
    correct: 1
  },
  {
    type: 'order',
    text: 'Ordená lo que pasó en el cuento, del primero al último:',
    items: [
      'Lila le pide a mamá dejar prendida la lamparita chiquita',
      'Lila abraza su peluche y se siente acompañada',
      'Teo llama a papá porque escuchó algo',
      'Lila y Teo se quedan dormidos tranquilos'
    ],
    correct: [0, 1, 2, 3]
  }
];

// ── Estado ────────────────────────────────────────────────
let currentIndex = 0;
let stars = 0;
let answered = false;

const appEl = document.getElementById('app');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const starCountEl = document.getElementById('starCount');
const starsCounterWrap = document.querySelector('.stars-counter');
const finalScreen = document.getElementById('finalScreen');

// ── Utilidades ────────────────────────────────────────────
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateProgress() {
  const pct = (currentIndex / QUESTIONS.length) * 100;
  progressFill.style.width = pct + '%';
  progressLabel.textContent = `Pregunta ${Math.min(currentIndex + 1, QUESTIONS.length)} de ${QUESTIONS.length}`;
}

function addStar() {
  stars++;
  starCountEl.textContent = stars;
  starsCounterWrap.classList.remove('pop');
  void starsCounterWrap.offsetWidth; // reinicia animación
  starsCounterWrap.classList.add('pop');
}

function launchConfetti(count = 26) {
  const layer = document.getElementById('confettiLayer');
  const emojis = ['🎉', '⭐', '🎊', '✨', '🌙'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    el.style.fontSize = (1 + Math.random() * 1.2) + 'rem';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

// ── Render de cada tipo de pregunta ─────────────────────
function renderQuestion() {
  answered = false;
  updateProgress();

  const q = QUESTIONS[currentIndex];
  const card = document.createElement('div');
  card.className = 'q-card';

  const tag = document.createElement('span');
  tag.className = 'q-type-tag ' + q.type;
  tag.textContent = q.type === 'mc' ? 'Opción múltiple' : q.type === 'vf' ? 'Verdadero o falso' : 'Ordená los hechos';
  card.appendChild(tag);

  const qText = document.createElement('p');
  qText.className = 'q-text';
  qText.textContent = q.text;
  card.appendChild(qText);

  if (q.type === 'mc') renderMC(card, q);
  else if (q.type === 'vf') renderVF(card, q);
  else if (q.type === 'order') renderOrder(card, q);

  const feedback = document.createElement('div');
  feedback.className = 'feedback';
  feedback.id = 'feedback';
  card.appendChild(feedback);

  const footer = document.createElement('div');
  footer.className = 'q-footer';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-main';
  nextBtn.id = 'nextBtn';
  nextBtn.textContent = currentIndex === QUESTIONS.length - 1 ? 'Ver resultados 🏁' : 'Siguiente ➡️';
  nextBtn.disabled = true;
  nextBtn.addEventListener('click', goNext);
  footer.appendChild(nextBtn);
  card.appendChild(footer);

  appEl.innerHTML = '';
  appEl.appendChild(card);
}

function renderMC(card, q) {
  const wrap = document.createElement('div');
  wrap.className = 'options';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleChoice(i === q.correct, btn, wrap, i, q.correct));
    wrap.appendChild(btn);
  });
  card.appendChild(wrap);
}

function renderVF(card, q) {
  const wrap = document.createElement('div');
  wrap.className = 'options vf-row';
  [['Verdadero', true], ['Falso', false]].forEach(([label, val]) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => handleChoice(val === q.correct, btn, wrap, val, q.correct));
    wrap.appendChild(btn);
  });
  card.appendChild(wrap);
}

function handleChoice(isCorrect, clickedBtn, wrap, chosenValue, correctValue) {
  if (answered) return;
  answered = true;

  [...wrap.children].forEach(btn => {
    btn.disabled = true;
  });
  clickedBtn.classList.add(isCorrect ? 'correct' : 'wrong');

  // si eligió mal, resaltar cuál era la correcta
  if (!isCorrect) {
    [...wrap.children].forEach((btn, idx) => {
      const val = wrap.classList.contains('vf-row') ? (idx === 0) : idx;
      if (val === correctValue) btn.classList.add('correct');
    });
  }

  showFeedback(isCorrect);
}

function renderOrder(card, q) {
  const shuffledIdx = shuffle(q.items.map((_, i) => i));
  const built = []; // índices en el orden que el chico va eligiendo

  const bank = document.createElement('div');
  bank.className = 'order-bank';

  const seq = document.createElement('div');
  seq.className = 'order-sequence';
  const emptyMsg = document.createElement('p');
  emptyMsg.className = 'seq-empty';
  emptyMsg.textContent = 'Tocá los hechos en el orden correcto 👇';
  seq.appendChild(emptyMsg);

  function refreshSeq() {
    seq.innerHTML = '';
    if (built.length === 0) {
      seq.appendChild(emptyMsg);
      return;
    }
    built.forEach((idx, pos) => {
      const item = document.createElement('div');
      item.className = 'seq-item';
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = pos + 1;
      item.appendChild(num);
      const txt = document.createElement('span');
      txt.textContent = q.items[idx];
      item.appendChild(txt);
      seq.appendChild(item);
    });
  }

  shuffledIdx.forEach(idx => {
    const chip = document.createElement('button');
    chip.className = 'order-chip';
    chip.textContent = q.items[idx];
    chip.addEventListener('click', () => {
      if (answered || chip.classList.contains('used')) return;
      chip.classList.add('used');
      chip.disabled = true;
      built.push(idx);
      refreshSeq();
      if (built.length === q.items.length) {
        checkBtn.disabled = false;
      }
    });
    bank.appendChild(chip);
  });

  card.appendChild(bank);
  card.appendChild(seq);

  const actions = document.createElement('div');
  actions.className = 'order-actions';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn-secondary';
  resetBtn.textContent = '🔄 Reiniciar orden';
  resetBtn.addEventListener('click', () => {
    if (answered) return;
    built.length = 0;
    refreshSeq();
    [...bank.children].forEach(chip => {
      chip.classList.remove('used');
      chip.disabled = false;
    });
    checkBtn.disabled = true;
  });

  const checkBtn = document.createElement('button');
  checkBtn.className = 'btn-main';
  checkBtn.textContent = '✅ Verificar orden';
  checkBtn.disabled = true;
  checkBtn.addEventListener('click', () => {
    if (answered) return;
    const isCorrect = q.correct.every((val, i) => val === built[i]);
    answered = true;
    [...bank.children].forEach(chip => chip.disabled = true);
    resetBtn.disabled = true;
    checkBtn.disabled = true;
    if (!isCorrect) {
      const correctOrderText = document.createElement('p');
      correctOrderText.className = 'seq-empty';
      correctOrderText.style.marginTop = '10px';
      correctOrderText.textContent = '✔️ Orden correcto: ' + q.correct.map(i => q.items[i]).join(' → ');
      seq.appendChild(correctOrderText);
    }
    showFeedback(isCorrect);
  });

  actions.appendChild(resetBtn);
  actions.appendChild(checkBtn);
  card.appendChild(actions);
}

function showFeedback(isCorrect) {
  const feedback = document.getElementById('feedback');
  feedback.classList.add('show', isCorrect ? 'ok' : 'bad');
  feedback.textContent = isCorrect
    ? '¡Muy bien! 🎉 Respuesta correcta.'
    : '¡Casi! 💪 Fijate bien la respuesta correcta.';
  if (isCorrect) addStar();
  document.getElementById('nextBtn').disabled = false;
}

function goNext() {
  currentIndex++;
  if (currentIndex >= QUESTIONS.length) {
    showFinalScreen();
  } else {
    renderQuestion();
  }
}

// ── Pantalla final ───────────────────────────────────────
function showFinalScreen() {
  updateProgress();
  progressLabel.textContent = `¡Actividad completa!`;
  appEl.innerHTML = '';
  finalScreen.classList.remove('hidden');

  const total = QUESTIONS.length;
  const pct = stars / total;

  const finalEmoji = document.getElementById('finalEmoji');
  const finalTitle = document.getElementById('finalTitle');
  const finalMsg = document.getElementById('finalMsg');
  const finalStars = document.getElementById('finalStars');
  const badgesRow = document.getElementById('badgesRow');

  finalStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(total - stars);

  if (pct >= 0.8) {
    finalEmoji.textContent = '🏆';
    finalTitle.textContent = '¡Excelente lector/a!';
    finalMsg.textContent = `Respondiste ${stars} de ${total} correctamente. ¡Te acordás de todo el cuento!`;
    launchConfetti(36);
  } else if (pct >= 0.5) {
    finalEmoji.textContent = '🥈';
    finalTitle.textContent = '¡Muy buen trabajo!';
    finalMsg.textContent = `Respondiste ${stars} de ${total} correctamente. ¡Vas muy bien!`;
    launchConfetti(18);
  } else {
    finalEmoji.textContent = '🌱';
    finalTitle.textContent = '¡Sigamos practicando!';
    finalMsg.textContent = `Respondiste ${stars} de ${total} correctamente. ¡Podés volver a leer el cuento e intentar de nuevo!`;
  }

  // Insignias
  badgesRow.innerHTML = '';
  const badges = [];
  if (stars >= 5) badges.push({ emoji: '🎖️', label: 'Detective de historias' });
  if (stars === total) badges.push({ emoji: '🌙', label: 'Guardián de los sueños tranquilos' });
  if (badges.length === 0) badges.push({ emoji: '📖', label: 'Sigue leyendo' });

  badges.forEach(b => {
    const div = document.createElement('div');
    div.className = 'badge';
    div.innerHTML = `<span class="badge-emoji">${b.emoji}</span><span>${b.label}</span>`;
    badgesRow.appendChild(div);
  });
}

document.getElementById('retryBtn').addEventListener('click', () => {
  currentIndex = 0;
  stars = 0;
  starCountEl.textContent = '0';
  finalScreen.classList.add('hidden');
  renderQuestion();
});

// ── Inicio ────────────────────────────────────────────────
renderQuestion();
