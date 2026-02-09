// Japa Counter State
let currentCount = 0;
let roundsCompleted = 0;
const MAX_COUNT = 108;

// DOM Elements
const countDisplay = document.getElementById('countDisplay');
const currentCountDisplay = document.getElementById('currentCount');
const roundsCompletedDisplay = document.getElementById('roundsCompleted');
const progressCircle = document.getElementById('progressCircle');
const completionMessage = document.getElementById('completionMessage');

// Progress Ring Calculation
const radius = 120;
const circumference = 2 * Math.PI * radius;

// Initialize Progress Ring
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

// Update Progress Ring
function updateProgress(count) {
    const progress = count / MAX_COUNT;
    const offset = circumference - (progress * circumference);
    progressCircle.style.strokeDashoffset = offset;
}

// Update Display
function updateDisplay() {
    countDisplay.textContent = currentCount;
    currentCountDisplay.textContent = currentCount;
    roundsCompletedDisplay.textContent = roundsCompleted;
    updateProgress(currentCount);
}

// Increment Counter
function incrementCount() {
    if (currentCount < MAX_COUNT) {
        currentCount++;
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
    // Increment rounds
    roundsCompleted++;
    
    // Show completion message
    completionMessage.classList.add('show');
    
    // Reset counter after delay
    setTimeout(() => {
        currentCount = 0;
        updateDisplay();
        
        // Hide completion message
        completionMessage.classList.remove('show');
    }, 2000);
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
