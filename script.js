// Japa Counter State
let currentCount = 0;
let roundsCompleted = 0;
let totalCount = 0;
let isRoundComplete = false;
const MAX_COUNT = 108;

// DOM Elements
const countDisplay = document.getElementById('countDisplay');
// The ID was changed in HTML to 'totalCount' from 'currentCount'
const totalCountDisplay = document.getElementById('totalCount');
const roundsCompletedDisplay = document.getElementById('roundsCompleted');
const progressCircle = document.getElementById('progressCircle');
const completionMessage = document.getElementById('completionMessage');

// Audio Context for Sound
let audioContext = null;

// Progress Ring Calculation
const radius = 120;
const circumference = 2 * Math.PI * radius;

// Initialize Progress Ring
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

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

// Update Progress Ring
function updateProgress(count) {
    const progress = count / MAX_COUNT;
    const offset = circumference - (progress * circumference);
    progressCircle.style.strokeDashoffset = offset;
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

// Increment Counter
function incrementCount() {
    initAudio(); // Ensure audio context is ready

    // Handling Round Completion Reset
    if (isRoundComplete) {
        // Reset for next round
        currentCount = 1;
        totalCount++; // Count the first bead of the new round
        isRoundComplete = false;
        completionMessage.classList.remove('show');
        updateDisplay();
        return;
    }

    // Normal Counting
    if (currentCount < MAX_COUNT) {
        currentCount++;
        totalCount++;
        updateDisplay();

        // Add subtle pulse effect
        countDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => {
            countDisplay.style.transform = 'scale(1)';
        }, 150);
    }

    // Check if round is complete
    if (currentCount === MAX_COUNT) {
        completeRound();
    }
}

// Complete Round
function completeRound() {
    // Increment rounds immediately upon completion
    roundsCompleted++;
    isRoundComplete = true;
    updateDisplay(); // Update rounds display immediately

    // Show completion message
    completionMessage.classList.add('show');

    // Play Sound and Vibrate
    playCompletionSound();
    vibrateDevice();

    // Removed the setTimeout auto-reset logic
    // The user must press space again to start the next round
}

// Keyboard Event Listener
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scroll
        incrementCount();
    }
});

// Click Event Listener for Counter Circle
document.querySelector('.counter-circle').addEventListener('click', () => {
    incrementCount();
});

// Initialize Display
updateDisplay();

// Add smooth transition to count display
countDisplay.style.transition = 'transform 0.15s ease';
