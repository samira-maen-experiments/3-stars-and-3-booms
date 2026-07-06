/* ============================================================
   buttons.js  –  Like / Linktree / Pearl Button (Framer)
   ============================================================ */

// ── Like Button ─────────────────────────────────────────────
const likeCheckbox = document.getElementById('on');
const likeCountOne = document.getElementById('like-count-one');
const likeCountTwo = document.getElementById('like-count-two');

const BASE_COUNT = parseInt(localStorage.getItem('3stars3booms_count') ?? '7');
let liked = localStorage.getItem('3stars3booms_liked') === 'true';

function renderLikeCount() {
  likeCountOne.textContent = BASE_COUNT;
  likeCountTwo.textContent = BASE_COUNT + 1;
  likeCheckbox.checked = liked;
}

likeCheckbox.addEventListener('change', () => {
  liked = likeCheckbox.checked;
  localStorage.setItem('3stars3booms_liked', liked);
  localStorage.setItem('3stars3booms_count', BASE_COUNT);
});

renderLikeCount();


// ── Bear Eyes Mouse-Tracking (from 417-Interactive-Mouse-Tracking-Eyes) ──
// Initialize base positions for highlights
document.querySelectorAll('.bear-highlight').forEach((h) => {
  if (!h.dataset.baseCxInit) {
    h.dataset.baseCxInit = h.getAttribute('cx');
    h.dataset.baseCyInit = h.getAttribute('cy');
  }
});

document.addEventListener('mousemove', (e) => {
  document.querySelectorAll('.bear-eye-group').forEach((eye) => {
    const cx        = parseFloat(eye.getAttribute('data-cx'));
    const cy        = parseFloat(eye.getAttribute('data-cy'));
    const maxRadius = parseFloat(eye.getAttribute('data-r'));

    const rect       = eye.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width  / 2;
    const eyeCenterY = rect.top  + rect.height / 2;

    const dx    = e.clientX - eyeCenterX;
    const dy    = e.clientY - eyeCenterY;
    const angle = Math.atan2(dy, dx);
    const dist  = Math.min(Math.sqrt(dx * dx + dy * dy), maxRadius * 3);
    const move  = (dist / (maxRadius * 3)) * maxRadius;

    const newX = cx + Math.cos(angle) * move;
    const newY = cy + Math.sin(angle) * move;

    const pupil = eye.querySelector('.bear-pupil');
    if (pupil) { pupil.setAttribute('cx', newX); pupil.setAttribute('cy', newY); }

    const hl = eye.querySelector('.bear-highlight');
    if (hl) {
      hl.setAttribute('cx', parseFloat(hl.dataset.baseCxInit) + (newX - cx) * 0.5);
      hl.setAttribute('cy', parseFloat(hl.dataset.baseCyInit) + (newY - cy) * 0.5);
    }
  });
});


// ── Action Buttons Listeners ─────────────────────────────────
const linktreeBtn = document.getElementById('linktree-btn');
const pearlBtn    = document.getElementById('pearl-btn');

const LINKTREE_URL = 'https://linktr.ee/samira.digital.co';
const FRAMER_URL   = 'https://samiramaen.framer.website/';

if (linktreeBtn) {
  linktreeBtn.addEventListener('click', () => {
    window.open(LINKTREE_URL, '_blank', 'noopener,noreferrer');
  });
}

if (pearlBtn) {
  pearlBtn.addEventListener('click', () => {
    window.open(FRAMER_URL, '_blank', 'noopener,noreferrer');
  });
}
