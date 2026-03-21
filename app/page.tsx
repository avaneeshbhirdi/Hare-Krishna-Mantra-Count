'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '../utils/supabase/client';
import { User } from '@supabase/supabase-js';

const MAX_COUNT = 108;

interface SadhanaLog {
  id: string;
  user_id: string;
  date: string;
  time: string;
  counts: number;
  rounds: number;
  created_at?: string;
}

export default function Home() {
  const [currentCount, setCurrentCount] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<SadhanaLog[]>([]);
  const [lifetimeCounts, setLifetimeCounts] = useState(0);
  const [lifetimeRounds, setLifetimeRounds] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Refs for non-reactive state or imperative APIs
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const counterCircleRef = useRef<HTMLDivElement>(null);
  const countDisplayRef = useRef<HTMLDivElement>(null);
  const logSectionRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('sadhana_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching logs:", error);
      } else if (data) {
        setLogs(data as SadhanaLog[]);
        let totalC = 0;
        data.forEach(log => {
          totalC += log.counts || 0;
        });
        setLifetimeCounts(totalC);
        setLifetimeRounds(Math.floor(totalC / 108));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user, supabase]);

  useEffect(() => {
    // Wrap in async IIFE or just call it since it is async naturally
    // Linter is strict, so we schedule it:
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchLogs();
    }
  }, [fetchLogs, user]);

  const scrollToLog = () => {
    logSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveToLog = async () => {
    if (!user) {
      alert("Please log in to save your sadhana.");
      return;
    }
    if (totalCount === 0 && roundsCompleted === 0) {
      alert("No progress to save yet.");
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Assuming we save the current totalCount and roundsCompleted for this session
    const { error } = await supabase
      .from('sadhana_logs')
      .insert([
        {
          user_id: user.id,
          date: dateStr,
          time: timeStr,
          counts: totalCount,
          rounds: roundsCompleted
        }
      ]);

    if (error) {
      console.error("Error saving log:", error);
      alert("Failed to save log. Please ensure the 'sadhana_logs' table exists in Supabase.");
    } else {
      alert("Successfully saved to log!");
      fetchLogs();
      // Optional: reset session counters after save
      setCurrentCount(0);
      setTotalCount(0);
      setRoundsCompleted(0);
      resetTimer();
    }
  };

  // Initialize Audio
  const initAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
  }, []);

  // Play Gentle Notification Sound
  const playCompletionSound = useCallback(() => {
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
  }, [initAudio]);

  // Vibrate Device
  const vibrateDevice = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  // Format Time
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Timer Logic
  const startTimer = useCallback(() => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
  }, [isTimerRunning]);

  const pauseTimer = useCallback(() => {
    if (isTimerRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setIsTimerRunning(false);
    }
  }, [isTimerRunning]);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimerSeconds(0);
  }, [pauseTimer]);

  const toggleTimer = useCallback(() => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [isTimerRunning, pauseTimer, startTimer]);

  // Increment Counter Logic
  const completeRound = useCallback(() => {
    setRoundsCompleted(prev => prev + 1);
    setIsRoundComplete(true);
    playCompletionSound();
    vibrateDevice();
  }, [playCompletionSound, vibrateDevice]); // playCompletionSound and vibrateDevice are effectively stable if defined outside or useCallback'd, but here they are stable-ish. Ideally wrap them too.

  // Increment Counter Logic
  const incrementCount = useCallback(() => {
    const isFreshStart = (timerSeconds === 0 && !isTimerRunning);

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
  }, [timerSeconds, isTimerRunning, startTimer, isRoundComplete, currentCount, completeRound, initAudio]);

  const handleReset = useCallback(() => {
    if (confirm('Reset currrent round progress? This will reset your count to 0.')) {
      setCurrentCount(0);
      setIsRoundComplete(false);
      // We do NOT reset totalCount or roundsCompleted as those are lifetime stats
      resetTimer();
    }
  }, [resetTimer]);

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
  }, [isTimerRunning, totalCount, timerSeconds, currentCount, isRoundComplete, incrementCount, handleReset, toggleTimer]);
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

      <div className="absolute top-6 right-6 sm:top-8 sm:right-10 pointer-events-auto z-50 transition-all duration-500">
        {user ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button onClick={scrollToLog} className="relative px-6 py-2.5 text-xs font-bold text-white uppercase tracking-widest transition-all duration-300 group border border-purple-400/50 rounded-full bg-purple-600/60 hover:bg-purple-600/80 backdrop-blur-xl shadow-2xl cursor-pointer">
              Sadhana Log
            </button>
            <div className="flex items-center gap-4 bg-[#0a0e27]/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl">
              <span className="text-[10px] text-blue-300 uppercase tracking-wider hidden sm:block">Welcome</span>
              <span className="text-xs font-semibold text-white">{user.email}</span>
              <div className="w-px h-4 bg-white/20 mx-1"></div>
              <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-red-300 hover:text-red-100 uppercase tracking-wider font-bold">Sign Out</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <a href="/login" className="cursor-pointer relative px-6 py-2.5 text-xs font-bold text-blue-100 hover:text-white uppercase tracking-widest transition-all duration-300 group border border-white/20 rounded-full bg-[#0a0e27]/40 hover:bg-[#1a237e]/60 backdrop-blur-xl shadow-2xl">
              Log In
            </a>
            <a href="/login" className="cursor-pointer relative px-6 py-2.5 text-xs font-bold text-white hover:text-blue-100 uppercase tracking-widest transition-all duration-300 group border border-blue-400/50 rounded-full bg-blue-600/60 hover:bg-blue-600/80 backdrop-blur-xl shadow-2xl">
              Sign Up
            </a>
          </div>
        )}
      </div>

      {/* Main Game Area - Centered Block */}
      <div className="flex flex-col items-center justify-center w-full max-w-4xl z-10 gap-6 transition-all duration-500">



        <div className="flex flex-col gap-4 w-fit">
          {/* Mantra Header */}
          <div className="mantra-panel">
            <div className="mantra-text invocation">
              jaya sri-krishna-chaitanya prabhu nityananda<br />
              sri-adwaita gadadhara srivasadi-gaura-bhakta-vrinda
            </div>
          </div>

          <div className="mantra-panel maha-mantra">
            <div className="mantra-text">
              Hare Krishna, Hare Krishna,<br />
              Krishna Krishna, Hare Hare<br />
              Hare Rama, Hare Rama,<br />
              Rama Rama, Hare Rama
            </div>
          </div>
        </div>

        {/* Central Japa Counter */}
        <div className="counter-container">
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
        <div className="dashboard glass-panel">
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
              className="dashboard-card-reset"
              onClick={handleReset}
              title="Reset All Counts"
            >
              <div className="reset-label">RESET</div>
            </button>

            {user && (
              <button
                className="ml-2 cursor-pointer relative px-4 py-2 text-[10px] font-bold text-emerald-100 hover:text-white uppercase tracking-widest transition-all duration-300 border border-emerald-400/50 rounded-full bg-emerald-600/40 hover:bg-emerald-600/80 backdrop-blur-xl shadow-lg"
                onClick={saveToLog}
                title="Save session progress to Sadhana Log"
              >
                SAVE LOG
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- SADHANA LOG SECTION --- */}
      {user && (
        <div ref={logSectionRef} className="w-full max-w-4xl z-10 flex flex-col gap-6 transition-all duration-500 mt-20 pb-24">
          
          <div className="dashboard glass-panel w-full !rounded-3xl !flex-col md:!flex-row !justify-between">
            <div className="dashboard-section w-full md:w-auto">
              <div className="dashboard-card-small !items-start">
                <div className="card-label">Lifetime Focus</div>
                <div className="text-sm text-gray-400 mt-1">Consistency is key</div>
              </div>
            </div>
            <div className="vertical-separator hidden md:block"></div>
            <div className="dashboard-section w-full md:w-auto justify-around flex-1">
              <div className="dashboard-card-small">
                <div className="card-label">Lifetime Total Counts</div>
                <div className="card-value-small !text-purple-300">{lifetimeCounts}</div>
              </div>
              <div className="dashboard-card-small">
                <div className="card-label">Lifetime Total Rounds</div>
                <div className="card-value-small !text-emerald-300">{lifetimeRounds}</div>
              </div>
            </div>
          </div>

          <div className="glass w-full rounded-3xl p-6 shadow-2xl overflow-hidden border border-white/10">
            <h2 className="text-2xl font-['Cinzel'] text-white mb-6 border-b border-white/10 pb-4">My Sadhana History</h2>
            {logs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No sadhana logs found. Start chanting and save your progress!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-blue-300/80">
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Time</th>
                      <th className="p-4 font-semibold">Total Counts</th>
                      <th className="p-4 font-semibold">Session Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      let dateStr = log.date;
                      let timeStr = log.time;
                      try {
                        const rowDate = log.created_at ? new Date(log.created_at) : new Date(`${log.date}T${log.time}`);
                        if (!isNaN(rowDate.getTime())) {
                          dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(rowDate);
                          timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(rowDate);
                        }
                      } catch (e) {
                         // fallback to raw strings on error
                      }
                      
                      const reqCounts = log.counts || 0;
                      const sessionRounds = Math.floor(reqCounts / 108);
                      const sessionCounts = reqCounts % 108;
                      let breakdownStr = "";
                      
                      if (sessionRounds > 0 && sessionCounts > 0) breakdownStr = `${sessionRounds} R, ${sessionCounts} C`;
                      else if (sessionRounds > 0) breakdownStr = `${sessionRounds} R`;
                      else breakdownStr = `${sessionCounts} C`;

                      return (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-gray-200">{dateStr}</td>
                          <td className="p-4 text-gray-400 text-sm">{timeStr}</td>
                          <td className="p-4 text-purple-200 font-bold">{reqCounts}</td>
                          <td className="p-4 text-emerald-200 font-bold">{breakdownStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Completion Message */}
      <div className={`completion-message glass ${isRoundComplete ? 'show' : ''}`} id="completionMessage">
        <div className="completion-text">🙏💫Haribol! round completed 🙏</div>
      </div>

      <div className="watermark">created by @avaneeshbhirdi</div>
    </div>
  );
}
