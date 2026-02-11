'use client';

import { useState, useEffect, useRef } from 'react';

const MAX_COUNT = 108;

export default function Home() {
  const [currentCount, setCurrentCount] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Refs for non-reactive state or imperative APIs
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const counterCircleRef = useRef<HTMLDivElement>(null);
  const countDisplayRef = useRef<HTMLDivElement>(null);

  // Initialize Audio
  const initAudio = () => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
  };

  // Play Gentle Notification Sound
  const playCompletionSound = () => {
    initAudio();
    const ac = audioContextRef.current;
    if (ac) {
      if (ac.state === 'suspended') {
        ac.resume();
      }

      const osc = ac.createOscillator();
      const gainNode = ac.createGain();

      osc.connect(gainNode);
      gainNode.connect(ac.destination);

      // Bell-like sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ac.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(130.81, ac.currentTime + 1.5); // C3

      gainNode.gain.setValueAtTime(0.3, ac.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.5);

      osc.start();
      osc.stop(ac.currentTime + 1.5);
    }
  };

  // Vibrate Device
  const vibrateDevice = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  // Format Time
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Timer Logic
  const startTimer = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const pauseTimer = () => {
    if (isTimerRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setIsTimerRunning(false);
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setTimerSeconds(0);
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  // Increment Counter Logic
  const incrementCount = () => {
    const isFreshStart = (totalCount === 0 && timerSeconds === 0 && !isTimerRunning);

    if (isFreshStart) {
      startTimer();
    } else if (!isTimerRunning) {
      // Blocked - shake animation
      if (counterCircleRef.current) {
        const el = counterCircleRef.current;
        el.style.transform = 'translate(-50%, -50%) translateX(5px)';
        setTimeout(() => {
          el.style.transform = 'translate(-50%, -50%) translateX(-5px)';
          setTimeout(() => {
            el.style.transform = 'translate(-50%, -50%)';
          }, 50);
        }, 50);
      }
      return;
    }

    // Initialize audio on user interaction
    initAudio();

    if (isRoundComplete) {
      setCurrentCount(1);
      setTotalCount(prev => prev + 1);
      setIsRoundComplete(false);
      return;
    }

    if (currentCount < MAX_COUNT) {
      const newCount = currentCount + 1;
      setCurrentCount(newCount);
      setTotalCount(prev => prev + 1);

      // Scale animation
      if (countDisplayRef.current) {
        countDisplayRef.current.style.transform = 'scale(1.1)';
        setTimeout(() => {
          if (countDisplayRef.current) countDisplayRef.current.style.transform = 'scale(1)';
        }, 150);
      }

      if (newCount === MAX_COUNT) {
        completeRound();
      }
    }
  };

  const completeRound = () => {
    setRoundsCompleted(prev => prev + 1);
    setIsRoundComplete(true);
    playCompletionSound();
    vibrateDevice();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all counts and timer?')) {
      setCurrentCount(0);
      setTotalCount(0);
      setRoundsCompleted(0);
      setIsRoundComplete(false);
      resetTimer();
    }
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        incrementCount();
      }
      if (event.code === 'Escape') {
        event.preventDefault();
        if (event.shiftKey) {
          handleReset();
        } else {
          toggleTimer();
        }
      }
    };

    // We need to attach current state to the event handler or use a ref-backed handler?
    // Since incrementCount depends on state (isTimerRunning), and useEffect closure captures state...
    // Ideally we should use function form of state updates or refs. 
    // But incrementCount logic is complex.
    // Let's bind the listener to window but be careful about closure staleness.
    // A better way is to save callbacks in refs or dependency array.

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

    // We include all dependencies to re-bind when state changes. 
    // This is efficient enough for this app.
  }, [isTimerRunning, totalCount, timerSeconds, currentCount, isRoundComplete]);
  // NOTE: This effect re-runs on every tick of timer if we include timerSeconds. 
  // timerSeconds is NOT used in incrementCount, so we can omit it if we check isTimerRunning (which is stable relative to timer ticks).
  // Wait, incrementCount USES timerSeconds for isFreshStart check.
  // So we function depends on it. 
  // Re-binding on every second is okay for this simple app.

  // Progress Background
  const progress = currentCount / MAX_COUNT;
  const degrees = progress * 360;
  const backgroundStyle = {
    background: `conic-gradient(rgba(74, 144, 226, 0.5) ${degrees}deg, rgba(20, 30, 80, 0.25) ${degrees}deg)`
  };

  // Apply visual disabled state based on timer
  const circleStyle = {
    ...backgroundStyle,
    opacity: (!isTimerRunning && !(totalCount === 0 && timerSeconds === 0)) ? 0.5 : 1,
    cursor: (!isTimerRunning && !(totalCount === 0 && timerSeconds === 0)) ? 'not-allowed' : 'pointer'
  };

  return (
    <div className="container">
      {/* Cosmic Background - Managed in globals.css via body, but we can add overlay divs here if needed for stars/nebula */}
      <div className="cosmic-background">
        <div className="stars"></div>
        <div className="nebula"></div>
      </div>

      {/* Mantra Header */}
      <div className="mantra-panel mb-8 z-10">
        <div className="mantra-text invocation">
          jaya sri-krishna-chaitanya prabhu nityananda<br />
          sri-adwaita gadadhara srivasadi-gaura-bhakta-vrinda
        </div>
      </div>

      <div className="mantra-panel maha-mantra z-10">
        <div className="mantra-text">
          Hare Krishna, Hare Krishna,<br />
          Krishna Krishna, Hare Hare<br />
          Hare Rama, Hare Rama,<br />
          Rama Rama, Hare Hare
        </div>
      </div>

      {/* Central Japa Counter */}
      <div className="counter-container floating-gentle z-10">
        <div
          className="counter-circle glass"
          ref={counterCircleRef}
          style={circleStyle}
          onClick={incrementCount}
        >
          <div className="count-display" ref={countDisplayRef}>{currentCount}</div>
          <div className="space-hint">Press SPACE</div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="dashboard glass-panel z-10">
        <div className="dashboard-section left">
          <div className="dashboard-card-timer">
            <div className="timer-display-small">{formatTime(timerSeconds)}</div>
            <div className="timer-mini-controls">
              <button
                className={`mini-btn play ${isTimerRunning ? 'active' : ''}`}
                onClick={toggleTimer}
              >
                {isTimerRunning ? '⏸' : '▶'}
              </button>
            </div>
          </div>

          <div className="dashboard-card-small">
            <div className="card-label">Total Count</div>
            <div className="card-value-small">{totalCount}</div>
          </div>
        </div>

        <div className="vertical-separator"></div>

        <div className="dashboard-section right">
          <div className="dashboard-card-small">
            <div className="card-label">Rounds</div>
            <div className="card-value-small">{roundsCompleted}</div>
          </div>

          <button
            className="dashboard-card-reset red-glass"
            onClick={handleReset}
            title="Reset All Counts"
          >
            <div className="reset-label">RESET</div>
          </button>
        </div>
      </div>

      {/* Completion Message */}
      <div className={`completion-message glass ${isRoundComplete ? 'show' : ''}`} id="completionMessage">
        <div className="completion-text">🙏💫Haribol! round completed 🙏</div>
      </div>

      <div className="watermark">created by @avaneeshbhirdi</div>
    </div>
  );
}
