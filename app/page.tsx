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
  duration_seconds?: number;
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
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [isDeletingLogs, setIsDeletingLogs] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentTimerRef = useRef(timerSeconds);
  useEffect(() => {
    currentTimerRef.current = timerSeconds;
  }, [timerSeconds]);

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
        setSelectedLogs(prev => prev.filter(id => data.some(log => log.id === id))); // clean up deleted
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      let avatarUrl = user.user_metadata?.avatar_url;
      if (editAvatarFile) {
        const fileExt = editAvatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, editAvatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        if (data) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editName,
          avatar_url: avatarUrl
        }
      });
      if (error) throw error;
      
      setIsEditingProfile(false);
    } catch (e) {
      console.error(e);
      alert("Error saving profile.");
    } finally {
      setIsSavingProfile(false);
      setEditAvatarFile(null);
      setEditAvatarPreview(null);
    }
  };

  const handleDeleteLogs = async () => {
    if (selectedLogs.length === 0) return;
    if (!confirm('Are you sure you want to delete the selected logs? This will permanently remove them and update your lifetime stats.')) return;
    setIsDeletingLogs(true);
    try {
      const { error } = await supabase
        .from('sadhana_logs')
        .delete()
        .in('id', selectedLogs);
      
      if (error) throw error;
      
      setSelectedLogs([]);
      await fetchLogs();
    } catch (e) {
      console.error(e);
      alert("Error deleting logs.");
    } finally {
      setIsDeletingLogs(false);
    }
  };

  const toggleLogSelection = (id: string) => {
    setSelectedLogs(prev => prev.includes(id) ? prev.filter(logId => logId !== id) : [...prev, id]);
  };

  const saveToLog = useCallback(async () => {
    if (!user) return;
    if (totalCount === 0 && roundsCompleted === 0) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    if (currentLogId) {
      const { error } = await supabase
        .from('sadhana_logs')
        .update({
          counts: totalCount,
          rounds: roundsCompleted,
          duration_seconds: currentTimerRef.current
        })
        .eq('id', currentLogId);
      
      if (error) {
        console.error("Error updating log:", error);
      } else {
        await fetchLogs();
      }
    } else {
      const { data, error } = await supabase
        .from('sadhana_logs')
        .insert([{
          user_id: user.id,
          date: dateStr,
          time: timeStr,
          counts: totalCount,
          rounds: roundsCompleted,
          duration_seconds: currentTimerRef.current
        }])
        .select();

      if (error) {
        console.error("Error inserting log:", error);
      } else if (data && data[0]) {
        setCurrentLogId(data[0].id);
        await fetchLogs();
      }
    }
  }, [user, totalCount, roundsCompleted, currentLogId, supabase, fetchLogs]);

  // Auto-Save Effect
  useEffect(() => {
    if (totalCount === 0 && roundsCompleted === 0) return;

    const timeoutId = setTimeout(() => {
      saveToLog();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [totalCount, roundsCompleted, saveToLog]);

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

      {user && (
        <div className="absolute top-6 left-6 sm:top-8 sm:left-10 pointer-events-auto z-50">
          <button onClick={() => setIsLogOpen(prev => !prev)} className="relative px-6 py-2.5 text-xs font-bold text-white uppercase tracking-widest transition-all duration-300 group border border-purple-400/50 rounded-full bg-purple-600/60 hover:bg-purple-600/80 backdrop-blur-xl shadow-2xl cursor-pointer">
            {isLogOpen ? 'Close Log' : 'Sadhana Log'}
          </button>
        </div>
      )}

      <div className="absolute top-6 right-6 sm:top-8 sm:right-10 pointer-events-auto z-50 transition-all duration-500 flex flex-col items-end">
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 shadow-lg hover:scale-105 transition-transform overflow-hidden relative object-cover"
            >
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </button>
            
            {/* Profile Dropdown */}
            <div className={`absolute right-0 top-16 w-72 bg-[#0a0e27]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-300 origin-top-right overflow-hidden ${isProfileOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible pointer-events-none'}`}>
              <div className="p-5 flex flex-col gap-4">
                {isEditingProfile ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-3 border-b border-white/10 pb-4">
                      <div 
                        className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 relative cursor-pointer group flex-shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {editAvatarPreview ? (
                          <img src={editAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-white uppercase tracking-wider">Change</span>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1024 * 1024) {
                              alert("Profile photo must be smaller than 1MB.");
                              return;
                            }
                            setEditAvatarFile(file);
                            const reader = new FileReader();
                            reader.onload = (re) => setEditAvatarPreview(re.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="w-full">
                        <label className="text-[10px] text-blue-300 uppercase tracking-wider mb-1 block">Full Name</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-colors"
                          placeholder="Your Name"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditAvatarFile(null);
                          setEditAvatarPreview(null);
                        }}
                        disabled={isSavingProfile}
                        className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-colors uppercase tracking-wider disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="flex-1 py-2 rounded-xl bg-purple-600/60 hover:bg-purple-600/80 border border-purple-400/50 text-white text-xs font-bold transition-colors uppercase tracking-wider disabled:opacity-50"
                      >
                        {isSavingProfile ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                      <div className="w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center border border-white/20 overflow-hidden relative group">
                        {user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-white font-semibold text-sm truncate">{user.user_metadata?.full_name || 'Devotee'}</span>
                        <span className="text-blue-300 text-[11px] truncate w-full block">{user.email}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setEditName(user.user_metadata?.full_name || '');
                          setEditAvatarFile(null);
                          setEditAvatarPreview(null);
                          setIsEditingProfile(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex-shrink-0"
                        title="Edit Profile"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-gray-400">
                        <span className="block mb-1 font-semibold uppercase tracking-wider">Lifetime Stats</span>
                        <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg mb-1.5">
                          <span>Total Rounds:</span>
                          <span className="text-emerald-300 font-bold">{lifetimeRounds}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg">
                          <span>Total Count:</span>
                          <span className="text-purple-300 font-bold">{lifetimeCounts}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        supabase.auth.signOut();
                      }} 
                      className="mt-2 w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-300 text-sm font-bold transition-colors uppercase tracking-wider shadow-lg"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
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
      <div className="flex flex-col items-center justify-center w-full max-w-4xl z-10 gap-4 sm:gap-6 transition-all duration-500 mt-16 sm:mt-0 h-full max-h-screen pb-4">

        <div className="flex flex-col gap-3 w-full sm:w-fit px-4 order-1">
          {/* Mantra Header */}
          <div className="mantra-panel hidden sm:block">
            <div className="mantra-text invocation">
              jaya sri-krishna-chaitanya prabhu nityananda<br />
              sri-adwaita gadadhara srivasadi-gaura-bhakta-vrinda
            </div>
          </div>

          <div className="mantra-panel maha-mantra py-4 sm:py-8 px-2 sm:px-16 w-full">
            <div className="mantra-text text-sm sm:text-lg">
              Hare Krishna, Hare Krishna,<br />
              Krishna Krishna, Hare Hare<br />
              Hare Rama, Hare Rama,<br />
              Rama Rama, Hare Rama
            </div>
          </div>
        </div>

        {/* Dashboard Cards placed above counter on mobile */}
        <div className="dashboard glass-panel order-2 w-[90%] sm:w-auto">
          <div className="dashboard-section left justify-between sm:justify-start w-full sm:w-auto">
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
              <div className="card-label !text-[10px] sm:!text-xs">Total</div>
              <div className="card-value-small">{totalCount}</div>
            </div>
            
            <div className="dashboard-card-small">
              <div className="card-label !text-[10px] sm:!text-xs">Rounds</div>
              <div className="card-value-small">{roundsCompleted}</div>
            </div>
          </div>

          <div className="vertical-separator hidden sm:block"></div>

          <div className="dashboard-section right justify-center sm:justify-start mt-2 sm:mt-0 w-full sm:w-auto">
            <button
              className="dashboard-card-reset mx-auto sm:mx-0"
              onClick={handleReset}
              title="Reset All Counts"
            >
              <div className="reset-label">RESET</div>
            </button>
          </div>
        </div>

        {/* Central Japa Counter - moved to bottom on mobile */}
        <div className="counter-container order-3 mt-auto sm:mt-0 mb-4 sm:mb-0">
          <div
            className="counter-circle glass"
            ref={counterCircleRef}
            style={circleStyle}
            onClick={incrementCount}
            onPointerDown={(e) => {
              if (e.pointerType === 'touch') {
                incrementCount(); // more responsive on mobile
                e.preventDefault();
              }
            }}
          >
            <div className="count-display" ref={countDisplayRef}>{currentCount}</div>
            <div className="space-hint hidden sm:block">Press SPACE</div>
            <div className="space-hint sm:hidden">TAP TO CHANT</div>
          </div>
        </div>

      </div>

      {/* --- SADHANA LOG SECTION --- */}
      {user && (
        <div ref={logSectionRef} className={`absolute top-20 left-6 sm:top-22 sm:left-10 w-[95vw] max-w-2xl z-40 flex flex-col gap-6 transition-all duration-500 max-h-[75vh] overflow-y-auto custom-scrollbar pb-8 rounded-3xl ${isLogOpen ? 'opacity-100 translate-y-0 visible shadow-[0_0_50px_rgba(30,10,60,0.8)]' : 'opacity-0 -translate-y-4 invisible pointer-events-none'}`}>
          
          <div className="dashboard glass-panel w-full !rounded-3xl flex flex-row flex-wrap sm:flex-nowrap justify-around items-center gap-4 !p-4 border border-white/10 relative">
            <div className="dashboard-card-small !m-0 !bg-transparent !border-0 !shadow-none flex-1 text-center">
              <div className="card-label">Lifetime Total Counts</div>
              <div className="card-value-small !text-purple-300">{lifetimeCounts}</div>
            </div>
            <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
            <div className="dashboard-card-small !m-0 !bg-transparent !border-0 !shadow-none flex-1 text-center">
              <div className="card-label">Lifetime Total Rounds</div>
              <div className="card-value-small !text-emerald-300">{lifetimeRounds}</div>
            </div>
            <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
            <div className="flex-1 flex justify-center w-full sm:w-auto mt-2 sm:mt-0">
               <button 
                 onClick={handleDeleteLogs} 
                 disabled={isDeletingLogs || selectedLogs.length === 0} 
                 className={`w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl border transition-all font-bold text-xs uppercase tracking-wider ${selectedLogs.length > 0 ? 'bg-red-500/20 hover:bg-red-500/40 text-red-300 border-red-500/30 shadow-lg' : 'bg-white/5 text-gray-500 border-white/10'}`}
                 title={selectedLogs.length === 0 ? "Select logs to delete" : "Delete selected"}
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 Delete {selectedLogs.length > 0 && `(${selectedLogs.length})`}
               </button>
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
                      <th className="p-4 font-semibold w-12 text-center">
                        <input 
                          type="checkbox" 
                          aria-label="Select all logs"
                          onChange={(e) => e.target.checked ? setSelectedLogs(logs.map(l => l.id)) : setSelectedLogs([])} 
                          checked={selectedLogs.length === logs.length && logs.length > 0} 
                          className="w-4 h-4 rounded border-white/30 bg-black/40 text-purple-600 focus:ring-purple-500/50 cursor-pointer accent-purple-500 shadow-sm transition-all" 
                        />
                      </th>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Time</th>
                      <th className="p-4 font-semibold">Total Counts</th>
                      <th className="p-4 font-semibold">Session Breakdown</th>
                      <th className="p-4 font-semibold">Duration</th>
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

                      let durationStr = "-";
                      if (log.duration_seconds !== undefined && log.duration_seconds !== null) {
                        const m = Math.floor(log.duration_seconds / 60);
                        const s = log.duration_seconds % 60;
                        if (m > 0) durationStr = `${m}m ${s}s`;
                        else durationStr = `${s}s`;
                      }

                      return (
                        <tr key={log.id} className={`border-b border-white/5 transition-colors ${selectedLogs.includes(log.id) ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'hover:bg-white/5'}`}>
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              aria-label="Select log"
                              onChange={() => toggleLogSelection(log.id)} 
                              checked={selectedLogs.includes(log.id)} 
                              className="w-4 h-4 rounded border-white/30 bg-black/40 text-purple-600 focus:ring-purple-500/50 cursor-pointer accent-purple-500 shadow-sm transition-all" 
                            />
                          </td>
                          <td className="p-4 text-gray-200">{dateStr}</td>
                          <td className="p-4 text-gray-400 text-sm">{timeStr}</td>
                          <td className="p-4 text-purple-200 font-bold">{reqCounts}</td>
                          <td className="p-4 text-emerald-200 font-bold">{breakdownStr}</td>
                          <td className="p-4 text-blue-200 font-bold">{durationStr}</td>
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
