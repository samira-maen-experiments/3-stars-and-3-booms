// Game State Variables
let characters = [
  { id: 'star_0', type: 'star', position: 'right', inBoat: false, img: 'Frame%209.png' },
  { id: 'star_1', type: 'star', position: 'right', inBoat: false, img: 'Frame%209.png' },
  { id: 'star_2', type: 'star', position: 'right', inBoat: false, img: 'Frame%209.png' },
  { id: 'bomb_0', type: 'bomb', position: 'right', inBoat: false, img: 'Frame%204.png' },
  { id: 'bomb_1', type: 'bomb', position: 'right', inBoat: false, img: 'Frame%204.png' },
  { id: 'bomb_2', type: 'bomb', position: 'right', inBoat: false, img: 'Frame%204.png' }
];

let boatPosition = 'right'; // 'left' or 'right'
let boatPassengers = []; // array of character ids (max length 2)
let movesCount = 0;
let gameState = 'playing'; // 'playing', 'sailing', 'gameover', 'victory'
let soundEnabled = true;

// Sound System
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    if (type === 'jump') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === 'sail') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.4);
      osc.frequency.linearRampToValueAtTime(100, now + 0.8);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      osc.start();
      osc.stop(now + 0.8);
    } else if (type === 'explosion') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.7);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      
      osc.start();
      osc.stop(now + 0.7);
      
      // Noise burst
      const bufferSize = ctx.sampleRate * 0.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + 0.6);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noise.start();
      noise.stop(now + 0.6);
    } else if (type === 'victory') {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        
        gain.gain.setValueAtTime(0.12, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.35);
        
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      osc.start();
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.error('Audio failed to play:', e);
  }
}

// Layout coordinate constants
const bankSlots = {
  left: {
    star_0: { left: 25, bottom: 220 },
    star_1: { left: 73, bottom: 220 },
    star_2: { left: 121, bottom: 220 },
    bomb_0: { left: 169, bottom: 220 },
    bomb_1: { left: 217, bottom: 220 },
    bomb_2: { left: 265, bottom: 220 }
  },
  right: {
    star_0: { left: 701, bottom: 220 },
    star_1: { left: 749, bottom: 220 },
    star_2: { left: 797, bottom: 220 },
    bomb_0: { left: 845, bottom: 220 },
    bomb_1: { left: 893, bottom: 220 },
    bomb_2: { left: 941, bottom: 220 }
  }
};

const boatLeftPositions = {
  left: 320,
  right: 524
};

// ----------- Responsive Scaling -----------
// The game canvas is designed at 1024×600. On smaller screens we
// apply a CSS scale transform so all the pixel-based coordinates
// in this file remain valid without any changes.
const GAME_W = 1024;
const GAME_H = 600;
const MOBILE_MARGIN = 24; // px on each side on mobile

function scaleGame() {
  const wrapper = document.querySelector('.game-wrapper');
  const container = document.getElementById('game-container');
  if (!wrapper || !container) return;

  // wrapper.clientWidth already respects body padding set by CSS,
  // but on mobile we also need to leave 24px margin on each side
  // for the game itself (within the wrapper).
  const isMobile = window.innerWidth <= 768;
  const availableWidth = isMobile
    ? wrapper.clientWidth - MOBILE_MARGIN * 2  // 24px each side
    : wrapper.clientWidth;

  const scale = Math.min(availableWidth / GAME_W, 1); // never scale up past 100%

  container.style.transform = `scale(${scale})`;
  container.style.transformOrigin = 'top center';

  // Pull elements below up — CSS transform doesn't affect layout flow,
  // so we compensate with a negative bottom margin.
  const scaledH = GAME_H * scale;
  container.style.marginBottom = `-${GAME_H - scaledH}px`;
}
// ------------------------------------------


// Calculate coordinates for a character based on current state
function getCharacterCoords(char) {
  if (char.inBoat) {
    const idx = boatPassengers.indexOf(char.id);
    const boatLeft = boatLeftPositions[boatPosition];
    return {
      left: boatLeft + (idx === 0 ? 30 : 92),
      bottom: 170 // raised up a bit more to sit nicely in the boat
    };
  } else {
    return bankSlots[char.position][char.id];
  }
}

// Trigger error message toast
function showToast(text, type = 'danger') {
  const toast = document.getElementById('toast-message');
  toast.innerText = text;
  toast.className = `toast toast-${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

// Create particles for explosion animation
function createExplosion(x, y) {
  const container = document.getElementById('game-container');
  const count = 30;
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'explosion-particle';
    
    // Choose random colors: red, orange, yellow
    const colors = ['#ff4d4d', '#ff944d', '#ffd700', '#ff3300'];
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Position at starting coordinate
    particle.style.left = `${x}px`;
    particle.style.bottom = `${y}px`;
    
    // Random direction and distance
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 120;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    
    container.appendChild(particle);
    
    // Cleanup
    setTimeout(() => {
      particle.remove();
    }, 800);
  }
}

// Check Safety rules on both banks
// The rule: Bombs must not outnumber Stars on either bank if there are Stars present (Stars > 0).
// Characters in the boat are considered to be on the bank where the boat is currently docked.
function checkGameState() {
  const leftSide = { stars: 0, bombs: 0 };
  const rightSide = { stars: 0, bombs: 0 };
  
  characters.forEach(c => {
    // If character is in the boat, they count towards the bank the boat is at
    const currentBank = c.inBoat ? boatPosition : c.position;
    if (currentBank === 'left') {
      if (c.type === 'star') leftSide.stars++;
      else leftSide.bombs++;
    } else {
      if (c.type === 'star') rightSide.stars++;
      else rightSide.bombs++;
    }
  });
  
  // Validate safety conditions
  if (leftSide.stars > 0 && leftSide.bombs > leftSide.stars) {
    return { safe: false, bank: 'left', msg: 'The Bombs outnumbered the Stars on the Left Bank!' };
  }
  if (rightSide.stars > 0 && rightSide.bombs > rightSide.stars) {
    return { safe: false, bank: 'right', msg: 'The Bombs outnumbered the Stars on the Right Bank!' };
  }
  
  return { safe: true };
}

// Render components in DOM
function render() {
  // Update Moves counter
  document.getElementById('moves-count').innerText = movesCount;
  
  // Update Boat Position style
  const boatEl = document.getElementById('game-boat');
  boatEl.style.left = `${boatLeftPositions[boatPosition]}px`;
  
  // Make the boat float when playing
  if (gameState === 'playing') {
    boatEl.classList.add('floating');
  } else {
    boatEl.classList.remove('floating');
  }
  
  // Render and update character positions
  const charactersLayer = document.getElementById('characters-layer');
  
  characters.forEach(char => {
    let charEl = document.getElementById(char.id);
    if (!charEl) {
      charEl = document.createElement('div');
      charEl.id = char.id;
      charEl.className = 'character';
      
      const img = document.createElement('img');
      img.src = char.img;
      img.alt = char.type;
      img.draggable = false;
      charEl.appendChild(img);
      
      // Attach click event
      charEl.addEventListener('click', () => handleCharacterClick(char.id));
      charactersLayer.appendChild(charEl);
    }
    
    // Update coordinates
    const coords = getCharacterCoords(char);
    charEl.style.left = `${coords.left}px`;
    charEl.style.bottom = `${coords.bottom}px`;
    
    // Visual indicators depending on interactive state
    charEl.classList.remove('active', 'inactive');
    
    if (gameState === 'playing') {
      const isBoatSide = char.position === boatPosition;
      if (char.inBoat || isBoatSide) {
        charEl.classList.add('active');
      } else {
        charEl.classList.add('inactive');
      }
    } else {
      charEl.classList.add('inactive');
    }
  });
  
  // Update GO Button state
  const btnGo = document.getElementById('btn-go');
  const canGo = gameState === 'playing' && boatPassengers.length > 0;
  btnGo.disabled = !canGo;
  
  if (canGo) {
    btnGo.classList.add('pulse-glow');
  } else {
    btnGo.classList.remove('pulse-glow');
  }
}

// Handle Character Interaction
function handleCharacterClick(charId) {
  if (gameState !== 'playing') return;
  
  const char = characters.find(c => c.id === charId);
  const charEl = document.getElementById(charId);
  
  if (char.inBoat) {
    // Unload character from boat
    playSound('jump');
    char.inBoat = false;
    char.position = boatPosition;
    boatPassengers = boatPassengers.filter(id => id !== charId);
    render();
    checkVictory();
  } else {
    // Load character to boat
    // Check if character is on the boat's side
    if (char.position !== boatPosition) {
      playSound('error');
      charEl.classList.add('shake');
      setTimeout(() => charEl.classList.remove('shake'), 400);
      showToast("Cannot reach this character! Move the boat to their side first.", 'warning');
      return;
    }
    
    // Check boat capacity
    if (boatPassengers.length >= 2) {
      playSound('error');
      charEl.classList.add('shake');
      setTimeout(() => charEl.classList.remove('shake'), 400);
      showToast("The boat is full! Clear a spot first.", 'warning');
      return;
    }
    
    playSound('jump');
    char.inBoat = true;
    boatPassengers.push(charId);
    render();
  }
}

// Execute Boat Movement (Sail)
function handleGoClick() {
  if (gameState !== 'playing' || boatPassengers.length === 0) return;
  
  gameState = 'sailing';
  document.getElementById('game-container').classList.add('sailing-active');
  movesCount++;
  render();
  
  playSound('sail');
  
  // Switch boat position
  const nextPosition = boatPosition === 'right' ? 'left' : 'right';
  boatPosition = nextPosition;
  
  // Update state for passengers: they are now mid-transit. We sync their visual movement by calling render()
  render();
  
  // Wait for sailing transition (3s) to complete
  setTimeout(() => {
    document.getElementById('game-container').classList.remove('sailing-active');
    
    // Docked at destination. Update position of passengers to the new side
    characters.forEach(c => {
      if (c.inBoat) {
        c.position = nextPosition;
      }
    });
    
    // Check if the landing causes a failure rule violation
    const status = checkGameState();
    
    if (!status.safe) {
      // EXPLOSION / Game Over
      gameState = 'gameover';
      render();
      playSound('explosion');
      
      // Determine center coordinates of the failing bank for explosion center
      const explosionX = status.bank === 'left' ? 190 : 830;
      const explosionY = 220;
      createExplosion(explosionX, explosionY);
      
      // Make all characters (both Stars and Bombs) on the failing bank explode!
      characters.forEach(c => {
        if (c.position === status.bank) {
          const el = document.getElementById(c.id);
          if (el) {
            el.classList.add('explode');
          }
        }
      });
      
      // Show failure status
      document.getElementById('status-text').innerText = 'EXPLODED';
      document.getElementById('status-text').className = 'value text-danger';
      
      // Delay showing game over modal screen for impact
      setTimeout(() => {
        document.getElementById('screen-gameover').classList.remove('hidden');
      }, 1000);
      
    } else {
      // Safe docking!
      gameState = 'playing';
      render();
      checkVictory();
    }
  }, 3000);
}

// Check if all characters have successfully crossed and unloaded onto the left bank
function checkVictory() {
  const allCrossed = characters.every(c => c.position === 'left' && !c.inBoat);
  
  if (allCrossed) {
    gameState = 'victory';
    playSound('victory');
    render();
    
    // Show success toast message immediately
    showToast("Success! All Stars & Bombs crossed safely!", "success");
    
    document.getElementById('status-text').innerText = 'VICTORY';
    document.getElementById('status-text').className = 'value text-green';
    document.getElementById('final-moves').innerText = movesCount;
    
    setTimeout(() => {
      document.getElementById('screen-victory').classList.remove('hidden');
    }, 600);
  }
}

// Reset Game State
function restartGame() {
  characters.forEach(c => {
    c.position = 'right';
    c.inBoat = false;
  });
  
  boatPosition = 'right';
  boatPassengers = [];
  movesCount = 0;
  gameState = 'playing';
  
  // Hide screens
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-victory').classList.add('hidden');
  
  // Update status text
  document.getElementById('status-text').innerText = 'SAFE';
  document.getElementById('status-text').className = 'value text-green';
  
  // Clean up any remaining explosion particles
  document.querySelectorAll('.explosion-particle').forEach(p => p.remove());
  
  // Force clean styles on character elements
  characters.forEach(c => {
    const el = document.getElementById(c.id);
    if (el) el.classList.remove('shake', 'explode');
  });
  
  playSound('jump');
  render();
}

// Wire Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Restart Buttons
  document.getElementById('btn-restart').addEventListener('click', restartGame);
  document.getElementById('btn-retry-over').addEventListener('click', restartGame);
  document.getElementById('btn-play-again').addEventListener('click', restartGame);
  
  // Go Button
  document.getElementById('btn-go').addEventListener('click', handleGoClick);
  
  // Boat clicks no longer trigger sail (movement starts only from GO button)

  // Modal Instructions
  const modal = document.getElementById('modal-instructions');
  document.getElementById('btn-how-to').addEventListener('click', () => {
    modal.classList.remove('hidden');
  });
  document.getElementById('btn-close-instructions').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  
  // Sound Toggle
  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.querySelector('.icon').innerText = soundEnabled ? '🔊' : '🔇';
    
    if (soundEnabled) {
      // Resume context to ensure audio capability
      getAudioContext().resume();
      playSound('jump');
    }
  });
  
  // Initial Render
  render();

  // Responsive scaling — run on load and on every resize
  scaleGame();
  window.addEventListener('resize', scaleGame);
});

