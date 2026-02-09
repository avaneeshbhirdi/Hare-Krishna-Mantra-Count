// Japa Counter State
let currentCount = 0;
let roundsCompleted = 0;
let totalCount = 0;
let isRoundComplete = false;
const MAX_COUNT = 108;

// DOM Elements
const countDisplay = document.getElementById('countDisplay');
const totalCountDisplay = document.getElementById('totalCount');
const roundsCompletedDisplay = document.getElementById('roundsCompleted');
const counterCircle = document.querySelector('.counter-circle');
const completionMessage = document.getElementById('completionMessage');

// Timer Elements
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const resetBtn = document.getElementById('resetBtn');

// Audio Context for Sound
let audioContext = null;

// Timer State
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

// Initialize Audio on First Interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play Gentle Notification Sound
function playCompletionSound() {
    if (!audioContext) initAudio();
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Bell-like sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(130.81, audioContext.currentTime + 1.5); // C3

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);

    osc.start();
    osc.stop(audioContext.currentTime + 1.5);
}

// Vibrate Device
function vibrateDevice() {
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
}

// Timer Functions
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(timerSeconds);
    }
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        if (startTimerBtn) {
            startTimerBtn.textContent = '⏸'; // Pause icon
            startTimerBtn.classList.add('active');
        }
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);

        // Ensure counting is enabled visually if we modify styles
        counterCircle.style.opacity = '1';
        counterCircle.style.cursor = 'pointer';
    }
}

function pauseTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        if (startTimerBtn) {
            startTimerBtn.textContent = '▶'; // Play icon
            startTimerBtn.classList.remove('active');
        }

        // Visually indicate counting is disabled
        counterCircle.style.opacity = '0.5';
        counterCircle.style.cursor = 'not-allowed';
    }
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
}

// Start/Pause Button Logic
if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });
}

// Update Background Fill
function updateProgress(count) {
    const progress = count / MAX_COUNT;
    const degrees = progress * 360;
    counterCircle.style.background = `conic-gradient(rgba(74, 144, 226, 0.5) ${degrees}deg, rgba(20, 30, 80, 0.25) ${degrees}deg)`;
}

// Update Display
function updateDisplay() {
    countDisplay.textContent = currentCount;
    if (totalCountDisplay) {
        totalCountDisplay.textContent = totalCount;
    }
    roundsCompletedDisplay.textContent = roundsCompleted;
    updateProgress(currentCount);
}

// Increment Counter Logic
function incrementCount() {
    // If timer is not running and counts > 0 (meaning paused mid-session), block input.
    // If timer is not running and counts == 0 (fresh start), start timer and count.

    // Check if it's a fresh start (totalCount 0, timer 0)
    const isFreshStart = (totalCount === 0 && timerSeconds === 0 && !isTimerRunning);

    if (isFreshStart) {
        startTimer();
    } else if (!isTimerRunning) {
        // BLOCKED: Timer is paused, so counting is paused.
        // Maybe affordance: shake animation?
        if (counterCircle) {
            counterCircle.style.transform = 'translate(-50%, -50%) translateX(5px)';
            setTimeout(() => {
                counterCircle.style.transform = 'translate(-50%, -50%) translateX(-5px)';
                setTimeout(() => {
                    counterCircle.style.transform = 'translate(-50%, -50%)';
                }, 50);
            }, 50);
        }
        return;
    }

    // Now proceed with normal counting logic
    initAudio();

    if (isRoundComplete) {
        currentCount = 1;
        totalCount++;
        isRoundComplete = false;
        completionMessage.classList.remove('show');
        updateDisplay();
        return;
    }

    if (currentCount < MAX_COUNT) {
        currentCount++;
        totalCount++;
        updateDisplay();

        countDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => {
            countDisplay.style.transform = 'scale(1)';
        }, 150);
    }

    if (currentCount === MAX_COUNT) {
        completeRound();
    }
}

// Complete Round
function completeRound() {
    roundsCompleted++;
    isRoundComplete = true;
    updateDisplay();
    completionMessage.classList.add('show');
    playCompletionSound();
    vibrateDevice();
}

// Reset Logic (Global)
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all counts and timer?')) {
            currentCount = 0;
            totalCount = 0;
            roundsCompleted = 0;
            isRoundComplete = false;
            completionMessage.classList.remove('show');
            resetTimer(); // Also resets timer
            updateDisplay();

            // Re-enable visual state for fresh start
            counterCircle.style.opacity = '1';
            counterCircle.style.cursor = 'pointer';
        }
    });
}

// Keyboard Event Listener
document.addEventListener('keydown', (event) => {
    // Spacebar to count
    if (event.code === 'Space') {
        event.preventDefault();
        incrementCount();
    }

    // Escape Handler
    if (event.code === 'Escape') {
        event.preventDefault();

        if (event.shiftKey) {
            // Shift + Escape -> Reset
            if (resetBtn) resetBtn.click();
        } else {
            // Escape -> Toggle Start/Pause
            if (startTimerBtn) startTimerBtn.click();
        }
    }
});

// Click Event Listener for Counter Circle
if (counterCircle) {
    counterCircle.addEventListener('click', () => {
        incrementCount();
    });
}

// Initialize Display
updateDisplay();
countDisplay.style.transition = 'transform 0.15s ease';
