const API_URL = "https://ultrarareofficial-backend.onrender.com/pokemonCards";
const FEATURED_URL = "https://ultrarareofficial-backend.onrender.com/featuredCard";

let allCards = [];
let currentFilter = "all";

// ===== DOM =====
const cardsGrid = document.getElementById("cardsGrid");
const skeletonGrid = document.getElementById("skeletonGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterChips = document.querySelectorAll(".filter-chip");
const detailModal = document.getElementById("detailModal");
const modalClose = document.getElementById("modalClose");

// Stats
const statTotal = document.getElementById("statTotal");
const statAvailable = document.getElementById("statAvailable");
const statHolo = document.getElementById("statHolo");
const statLanguages = document.getElementById("statLanguages");

// ===== CONDITION MAP =====
const conditionMap = {
  Mint: { percent: 100, color: "#4fc337" },
  "Near Mint": { percent: 85, color: "#4fc337" },
  Excellent: { percent: 72, color: "#8bc34a" },
  Good: { percent: 58, color: "#ffde00" },
  "Light Played": { percent: 42, color: "#ffa726" },
  Played: { percent: 25, color: "#ff7043" },
  Poor: { percent: 10, color: "#ff1c1c" },
};

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  createParticles();
  initPhysicsBalls();
  loadFeaturedCard();
  loadCards();
  bindEvents();
});

function bindEvents() {
  searchInput.addEventListener("input", renderFiltered);

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentFilter = chip.dataset.filter;
      renderFiltered();
    });
  });

  modalClose.addEventListener("click", closeModal);
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// ===== PARTICLES =====
function createParticles() {
  const container = document.getElementById("particles");
  const colors = ["#ff1c1c", "#3b4cca", "#ffde00", "#4fc337"];

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.animationDuration = 15 + Math.random() * 20 + "s";
    particle.style.animationDelay = Math.random() * 15 + "s";
    particle.style.width = particle.style.height = 4 + Math.random() * 8 + "px";
    container.appendChild(particle);
  }
}

// ===== FEATURED CARD =====
async function loadFeaturedCard() {
  try {
    const res = await fetch(FEATURED_URL);
    if (!res.ok) return;

    const data = await res.json();
    const card = data.card;
    if (!card) return;

    const section = document.getElementById("featuredSection");
    section.classList.remove("hidden");

    // Label
    const labelEl = document.getElementById("featuredLabel");
    labelEl.innerHTML = `<ion-icon name="star"></ion-icon> ${data.label || "Featured this week"}`;

    // Name
    document.getElementById("featuredName").textContent = card.nome;

    // Meta: set · lingua · condizioni
    const metaEl = document.getElementById("featuredMeta");
    let metaHtml = "";
    if (card.set) metaHtml += `<span>${card.set}</span>`;
    metaHtml += `<span>${card.lingua}</span>`;
    metaHtml += `<span>${card.condizioni}</span>`;
    metaEl.innerHTML = metaHtml;

    // Description
    const descEl = document.getElementById("featuredDesc");
    descEl.textContent = data.descrizione || "";
    if (!data.descrizione) descEl.style.display = "none";

    // Card image
    document.getElementById("featuredImg").src = card.foto;
    document.getElementById("featuredImg").alt = card.nome;

    // Card overlay info
    document.getElementById("featuredCardSet").textContent = card.set || "";
    document.getElementById("featuredCardLang").textContent = card.lingua;
    document.getElementById("featuredCardName").textContent = card.nome;
    document.getElementById("featuredCardCond").textContent = card.condizioni;

    // Holo badge
    const holoEl = document.getElementById("featuredCardHolo");
    holoEl.classList.toggle("hidden", !card.olografica);

    // Status badge
    const statusEl = document.getElementById("featuredCardStatus");
    if (card.disponibilita) {
      statusEl.textContent = "Disponibile";
      statusEl.classList.remove("featured__card-status--unavailable");
    } else {
      statusEl.textContent = "Non disponibile";
      statusEl.classList.add("featured__card-status--unavailable");
    }

    // Condition badge color
    const condColors = {
      Mint: "#4fc337", "Near Mint": "#4fc337", Excellent: "#8bc34a",
      Good: "#ffde00", "Light Played": "#ffa726", Played: "#ff7043", Poor: "#ff1c1c",
    };
    const condEl = document.getElementById("featuredCardCond");
    condEl.style.background = condColors[card.condizioni] || "#ffde00";

    // Click to open modal
    document.getElementById("featuredCard").onclick = () => openModal(card);

  } catch (err) {
    console.error("Featured card error:", err);
  }
}

// ===== API =====
async function loadCards() {
  skeletonGrid.classList.remove("hidden");
  cardsGrid.classList.add("hidden");
  emptyState.classList.add("hidden");

  try {
    const res = await fetch(API_URL);
    allCards = await res.json();
    updateStats();

    skeletonGrid.classList.add("hidden");
    renderFiltered();
  } catch (err) {
    skeletonGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
  }
}

// ===== FILTER & RENDER =====
function getFilteredCards() {
  let cards = [...allCards];
  const query = searchInput.value.toLowerCase().trim();

  // Skip search filter when rocket easter egg is active
  if (query && !(window.__rocketActive && window.__rocketActive())) {
    cards = cards.filter(
      (c) =>
        c.nome.toLowerCase().includes(query) ||
        (c.set && c.set.toLowerCase().includes(query)) ||
        c.condizioni.toLowerCase().includes(query) ||
        c.lingua.toLowerCase().includes(query)
    );
  }

  if (currentFilter === "available") {
    cards = cards.filter((c) => c.disponibilita);
  } else if (currentFilter === "holo") {
    cards = cards.filter((c) => c.olografica);
  }

  return cards;
}

function renderFiltered() {
  const cards = getFilteredCards();

  if (cards.length === 0) {
    cardsGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  cardsGrid.classList.remove("hidden");
  renderCards(cards);
}

function renderCards(cards) {
  cardsGrid.innerHTML = "";

  const condShort = { Mint: "M", "Near Mint": "NM", Excellent: "EX", Good: "GD", "Light Played": "LP", Played: "PL", Poor: "PR" };
  const condColors = { Mint: "#4fc337", "Near Mint": "#4fc337", Excellent: "#8bc34a", Good: "#ffde00", "Light Played": "#ffa726", Played: "#ff7043", Poor: "#ff1c1c" };
  const langShort = { Italiano: "IT", Inglese: "EN", Giapponese: "JP", Francese: "FR", Tedesco: "DE", Spagnolo: "ES", Coreano: "KR", Cinese: "CN" };

  cards.forEach((card) => {
    const typeEmoji = card.olografica ? "✦" : "●";
    const condLabel = condShort[card.condizioni] || card.condizioni;
    const condColor = condColors[card.condizioni] || "#ffde00";
    const condPct = (conditionMap[card.condizioni] || { percent: 50 }).percent;
    const lang = langShort[card.lingua] || card.lingua;

    const el = document.createElement("div");
    el.className = "pokemon-card" + (card.olografica ? " pokemon-card--holo" : "");
    el.onclick = () => openModal(card);

    el.innerHTML = `
      <div class="pokemon-card__inner">
        <div class="pokemon-card__header">
          <span class="pokemon-card__type-dot">${typeEmoji}</span>
          <span class="pokemon-card__title">${card.nome}</span>
          <span class="pokemon-card__hp">
            <span class="pokemon-card__hp-label">Cond</span>
            <span class="pokemon-card__hp-val" style="color:${condColor}">${condLabel}</span>
          </span>
        </div>
        <div class="pokemon-card__img-wrap">
          <img class="pokemon-card__img" src="${card.foto}" alt="${card.nome}" loading="lazy" />
          ${card.olografica ? '<div class="pokemon-card__holo-overlay"></div>' : ""}
          ${card.olografica ? '<span class="pokemon-card__holo-badge">✦ Holo</span>' : ""}
          <span class="pokemon-card__status pokemon-card__status--${card.disponibilita ? "yes" : "no"}">${card.disponibilita ? "Disponibile" : "Non disp."}</span>
        </div>
        <div class="pokemon-card__cond">
          <span class="pokemon-card__cond-label">Condizione</span>
          <div class="pokemon-card__cond-track">
            <div class="pokemon-card__cond-fill" style="width:${condPct}%;background:${condColor}"></div>
          </div>
          <span class="pokemon-card__cond-name">${card.condizioni}</span>
        </div>
        <div class="pokemon-card__stats">
          <div class="pokemon-card__stat">
            <ion-icon name="albums-outline"></ion-icon>
            <span class="pokemon-card__stat-label">Set</span>
            <span class="pokemon-card__stat-value pokemon-card__set">${card.set || "—"}</span>
          </div>
          <div class="pokemon-card__stat">
            <ion-icon name="language-outline"></ion-icon>
            <span class="pokemon-card__stat-label">Lingua</span>
            <span class="pokemon-card__stat-value pokemon-card__lang">${lang}</span>
          </div>
          <div class="pokemon-card__stat">
            <ion-icon name="copy-outline"></ion-icon>
            <span class="pokemon-card__stat-label">Quantità</span>
            <span class="pokemon-card__stat-value pokemon-card__qty">${card.quantita || 1}</span>
          </div>
        </div>
      </div>
    `;

    cardsGrid.appendChild(el);
  });
}

// ===== STATS =====
function updateStats() {
  const total = allCards.length;
  const available = allCards.filter((c) => c.disponibilita).length;
  const holo = allCards.filter((c) => c.olografica).length;
  const languages = new Set(allCards.map((c) => c.lingua)).size;

  animateCounter(statTotal, total);
  animateCounter(statAvailable, available);
  animateCounter(statHolo, holo);
  animateCounter(statLanguages, languages);
}

function animateCounter(el, target) {
  const duration = 800;
  const start = parseInt(el.textContent) || 0;
  const increment = target - start;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + increment * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ===== MODAL =====
function openModal(card) {
  const cond = conditionMap[card.condizioni] || { percent: 50, color: "#ffde00" };

  document.getElementById("modalImg").src = card.foto;
  document.getElementById("modalImg").alt = card.nome;
  document.getElementById("modalName").textContent = card.nome;
  document.getElementById("modalCondizioni").textContent = card.condizioni;
  document.getElementById("modalSet").textContent = card.set || "—";
  document.getElementById("modalLingua").textContent = card.lingua;
  document.getElementById("modalQuantita").textContent = card.quantita || 1;

  const dispEl = document.getElementById("modalDisponibilita");
  dispEl.textContent = card.disponibilita ? "Disponibile" : "Non disponibile";
  dispEl.style.color = card.disponibilita ? "#4fc337" : "#ff1c1c";

  const holoEl = document.getElementById("modalHolo");
  holoEl.classList.toggle("hidden", !card.olografica);

  const condBar = document.getElementById("modalConditionBar");
  condBar.style.width = "0%";
  condBar.style.background = cond.color;

  const telegramMsg = encodeURIComponent(`ciao ti scrivo per ${card.nome} è ancora disponibile?`);
  document.getElementById("modalTelegramBtn").href = `https://t.me/Zarathustra2030?text=${telegramMsg}`;

  detailModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Animate bar after modal opens
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      condBar.style.width = cond.percent + "%";
    });
  });
}

function closeModal() {
  if (detailModal.classList.contains("hidden") || detailModal.classList.contains("closing")) return;

  detailModal.classList.add("closing");
  document.body.style.overflow = "";

  const finish = () => {
    detailModal.classList.remove("closing");
    detailModal.classList.add("hidden");
    detailModal.removeEventListener("animationend", onEnd);
  };
  const onEnd = (e) => {
    if (e.target === detailModal) finish();
  };
  detailModal.addEventListener("animationend", onEnd);
  // Fallback in case animationend doesn't fire
  setTimeout(finish, 400);
}

// ===== PHYSICS ENGINE =====
function initPhysicsBalls() {
  const container = document.getElementById("physicsContainer");
  if (!container) return;

  const isMobile = window.innerWidth <= 768;

  // Lissajous curves for smooth organic float (+ drag interaction on desktop)
  const DAMPING = 0.97;       // how fast throw velocity decays
  const BOUNCE = 0.5;         // soft wall bounce
  const BALL_BOUNCE = 0.5;    // soft ball-to-ball bounce
  const AMPLITUDE_X = isMobile ? 30 : 55;
  const AMPLITUDE_Y = isMobile ? 25 : 40;

  // A bit faster frequencies
  const freqPairs = [
    { fx: 1 / 120, fy: 1 / 165 },
    { fx: 1 / 135, fy: 1 / 190 },
    { fx: 1 / 155, fy: 1 / 130 },
    { fx: 1 / 170, fy: 1 / 145 },
    { fx: 1 / 110, fy: 1 / 175 },
  ];

  const balls = [];
  const ballEls = container.querySelectorAll(".hero__ball");
  const W0 = container.offsetWidth;
  const H0 = container.offsetHeight;

  ballEls.forEach((el, i) => {
    const size = parseInt(el.dataset.size);
    const radius = size / 2;
    const padding = radius + 10;
    // Anchor: the resting center point the ball orbits around
    const anchorX = padding + Math.random() * (W0 - padding * 2);
    const anchorY = padding + Math.random() * (H0 - padding * 2);
    const freq = freqPairs[i % freqPairs.length];

    balls.push({
      el,
      radius,
      anchorX,
      anchorY,
      x: anchorX,
      y: anchorY,
      // Throw velocity (only active after drag release)
      vx: 0,
      vy: 0,
      rotation: Math.random() * 360,
      dragging: false,
      thrown: false, // true while decaying from a throw
      // Lissajous params
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      freqX: freq.fx,
      freqY: freq.fy,
      ampX: AMPLITUDE_X * (0.7 + Math.random() * 0.6),
      ampY: AMPLITUDE_Y * (0.7 + Math.random() * 0.6),
    });
  });

  let t = 0; // global time counter

  // Drag state
  let dragBall = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseVX = 0;
  let mouseVY = 0;

  if (!isMobile) {
    container.addEventListener("mousedown", (e) => {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        const dx = mx - b.x;
        const dy = my - b.y;
        if (dx * dx + dy * dy < b.radius * b.radius) {
          dragBall = b;
          b.dragging = true;
          b.thrown = false;
          dragOffsetX = dx;
          dragOffsetY = dy;
          lastMouseX = mx;
          lastMouseY = my;
          mouseVX = 0;
          mouseVY = 0;
          e.preventDefault();
          break;
        }
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragBall) return;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseVX = mx - lastMouseX;
      mouseVY = my - lastMouseY;
      lastMouseX = mx;
      lastMouseY = my;
      dragBall.x = mx - dragOffsetX;
      dragBall.y = my - dragOffsetY;
    });

    window.addEventListener("mouseup", () => {
      if (dragBall) {
        dragBall.vx = mouseVX * 0.5;
        dragBall.vy = mouseVY * 0.5;
        dragBall.thrown = true;
        dragBall.dragging = false;
        dragBall = null;
      }
    });
  }

  // Physics loop
  function tick() {
    t++;
    const W = container.offsetWidth;
    const H = container.offsetHeight;

    for (const b of balls) {
      if (b.dragging) continue;

      if (b.thrown) {
        // Decay throw velocity
        b.vx *= DAMPING;
        b.vy *= DAMPING;
        b.x += b.vx;
        b.y += b.vy;

        // Move anchor to where the ball ends up, so Lissajous resumes from there
        b.anchorX += b.vx;
        b.anchorY += b.vy;

        // Once velocity is negligible, resume Lissajous from current position
        if (Math.abs(b.vx) < 0.15 && Math.abs(b.vy) < 0.15) {
          b.thrown = false;
          b.vx = 0;
          b.vy = 0;
          // Anchor = exactly where the ball stopped
          b.anchorX = b.x;
          b.anchorY = b.y;
          // Phase = -t*freq so that sin(t*freq + phase) = sin(0) = 0 → no offset at start
          b.phaseX = -t * b.freqX;
          b.phaseY = -t * b.freqY;
        }

        // Wall bounces during throw
        if (b.x - b.radius < 0) { b.x = b.radius; b.vx *= -BOUNCE; b.anchorX = b.x; }
        if (b.x + b.radius > W) { b.x = W - b.radius; b.vx *= -BOUNCE; b.anchorX = b.x; }
        if (b.y - b.radius < 0) { b.y = b.radius; b.vy *= -BOUNCE; b.anchorY = b.y; }
        if (b.y + b.radius > H) { b.y = H - b.radius; b.vy *= -BOUNCE; b.anchorY = b.y; }
      } else {
        // Lissajous orbit: smooth, sinuous, never-repeating curves
        b.x = b.anchorX + Math.sin(t * b.freqX + b.phaseX) * b.ampX;
        b.y = b.anchorY + Math.sin(t * b.freqY + b.phaseY) * b.ampY;

        // Soft clamp inside container
        b.x = Math.max(b.radius, Math.min(W - b.radius, b.x));
        b.y = Math.max(b.radius, Math.min(H - b.radius, b.y));
      }

      // Gentle rotation — follows horizontal movement direction
      const rotSpeed = b.thrown ? b.vx * 1.2 : Math.cos(t * b.freqX + b.phaseX) * 0.3;
      b.rotation += rotSpeed;
    }

    // Ball-to-ball soft push (only during throw)
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const bObj = balls[j];
        if (!a.thrown && !bObj.thrown) continue; // skip if both floating

        const dx = bObj.x - a.x;
        const dy = bObj.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + bObj.radius;

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;

          // Push apart
          if (a.thrown) { a.x -= nx * overlap; a.y -= ny * overlap; }
          if (bObj.thrown) { bObj.x += nx * overlap; bObj.y += ny * overlap; }

          // Transfer some momentum
          if (a.thrown && !bObj.thrown) {
            bObj.vx = a.vx * BALL_BOUNCE;
            bObj.vy = a.vy * BALL_BOUNCE;
            bObj.thrown = true;
            a.vx *= 0.5;
            a.vy *= 0.5;
          } else if (bObj.thrown && !a.thrown) {
            a.vx = bObj.vx * BALL_BOUNCE;
            a.vy = bObj.vy * BALL_BOUNCE;
            a.thrown = true;
            bObj.vx *= 0.5;
            bObj.vy *= 0.5;
          } else {
            // Both thrown
            const dvx = a.vx - bObj.vx;
            const dvy = a.vy - bObj.vy;
            const dot = dvx * nx + dvy * ny;
            if (dot > 0) {
              a.vx -= dot * nx * BALL_BOUNCE;
              a.vy -= dot * ny * BALL_BOUNCE;
              bObj.vx += dot * nx * BALL_BOUNCE;
              bObj.vy += dot * ny * BALL_BOUNCE;
            }
          }
        }
      }
    }

    // Render
    for (const b of balls) {
      b.el.style.transform = `translate(${b.x - b.radius}px, ${b.y - b.radius}px) rotate(${b.rotation}deg)`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ============================================================
// ===== EASTER EGGS ==========================================
// ============================================================

(function initEasterEggs() {
  initTeamRocket();
  initMissingNo();
  initProfessorOak();
})();

// ===== 1. TEAM ROCKET =====
function initTeamRocket() {
  const KEYWORD = "rocket";
  let rocketActive = false;

  searchInput.addEventListener("input", () => {
    const val = searchInput.value.trim().toLowerCase();

    if (val === KEYWORD && !rocketActive) {
      activateRocket();
    } else if (val !== KEYWORD && rocketActive) {
      deactivateRocket();
    }
  });

  function activateRocket() {
    rocketActive = true;
    document.body.classList.add("rocket-mode");

    // Re-render cards ignoring the keyword
    renderFiltered();

    const rEl = document.createElement("div");
    rEl.className = "rocket-r";
    rEl.innerHTML = "<span>R</span>";
    document.body.appendChild(rEl);
    rEl.addEventListener("animationend", () => rEl.remove());
  }

  function deactivateRocket() {
    rocketActive = false;
    document.body.classList.remove("rocket-mode");

    // Re-render with current search value
    renderFiltered();
  }

  // Expose state so filter can check it
  window.__rocketActive = () => rocketActive;
}

// ===== 2. MISSINGNO =====
function initMissingNo() {
  let missingNoActive = false;

  searchInput.addEventListener("input", () => {
    const val = searchInput.value.trim().toLowerCase();
    if (val === "missingno" && !missingNoActive) {
      missingNoActive = true;
      triggerMissingNo();
    }
  });

  function triggerMissingNo() {
    // VHS glitch overlay
    const glitch = document.createElement("div");
    glitch.className = "glitch-overlay";
    document.body.appendChild(glitch);

    // Screen shake
    document.body.style.animation = "none";
    document.body.offsetHeight; // reflow
    document.body.style.animation = "";

    // Flicker the page
    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      document.body.style.filter = flickerCount % 2 === 0
        ? "hue-rotate(90deg) saturate(3) brightness(1.3)"
        : "none";
      flickerCount++;
      if (flickerCount > 8) {
        clearInterval(flickerInterval);
        document.body.style.filter = "none";
      }
    }, 100);

    // MissingNo card appears after glitch starts
    setTimeout(() => {
      const card = document.createElement("div");
      card.className = "missingno-card";
      card.innerHTML = `
        <div class="missingno-card__header">
          <span>?</span>
          <span>MissingNo.</span>
          <span>ERRORE</span>
        </div>
        <div class="missingno-card__img" style="position:relative;">
          <img src="https://archives.bulbagarden.net/media/upload/9/98/Missingno_RB.png" alt="MissingNo" />
          <div class="missingno-card__name">MISSINGNO.</div>
        </div>
        <div class="missingno-card__footer">
          <span>???</span>
          <span>Lv.???</span>
          <span>0/0</span>
        </div>
      `;
      document.body.appendChild(card);

      card.addEventListener("animationend", () => {
        card.remove();
        missingNoActive = false;
      });
    }, 400);

    glitch.addEventListener("animationend", () => glitch.remove());
  }
}

// ===== 3. PROFESSOR OAK =====
function initProfessorOak() {
  const IDLE_TIME = 120000; // 2 minuti
  let idleTimer = null;
  let oakShown = false;

  const oakQuotes = [
    "Non è il momento di stare fermi! Il mondo Pokémon ti aspetta!",
    "Ehi, allenatore! Le carte non si guardano da sole!",
    "Stai cercando di far addormentare un Snorlax? Muoviti!",
    "Anche il mio Pokédex si è spento per la noia...",
    "Un vero allenatore non sta mai con le mani in mano!",
    "Persino Slowpoke si muove più di te!",
  ];

  function resetIdleTimer() {
    if (oakShown) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showOak, IDLE_TIME);
  }

  function showOak() {
    if (oakShown) return;
    oakShown = true;

    const quote = oakQuotes[Math.floor(Math.random() * oakQuotes.length)];

    const bubble = document.createElement("div");
    bubble.className = "oak-bubble";
    bubble.innerHTML = `
      <div class="oak-bubble__text">
        <button class="oak-bubble__close">✕</button>
        <p>${quote}</p>
        <cite>— Prof. Oak</cite>
      </div>
      <div class="oak-bubble__avatar">🧑‍🔬</div>
    `;
    document.body.appendChild(bubble);

    // Close on click
    bubble.querySelector(".oak-bubble__close").addEventListener("click", (e) => {
      e.stopPropagation();
      dismissOak(bubble);
    });

    bubble.addEventListener("click", () => dismissOak(bubble));

    // Auto dismiss after 8 seconds
    setTimeout(() => {
      if (document.body.contains(bubble)) {
        dismissOak(bubble);
      }
    }, 8000);
  }

  function dismissOak(bubble) {
    bubble.classList.add("leaving");
    bubble.addEventListener("animationend", () => {
      bubble.remove();
      oakShown = false;
      resetIdleTimer();
    });
  }

  // Track activity
  ["mousemove", "keydown", "scroll", "click", "touchstart"].forEach((event) => {
    document.addEventListener(event, resetIdleTimer, { passive: true });
  });

  // Start timer
  resetIdleTimer();
}
