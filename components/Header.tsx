'use client';

import React, { useState } from 'react';
import { HistoryEntry } from '../types';

interface HeaderProps {
    totalCount?: number;
    roundsCompleted?: number;
    historyLog?: HistoryEntry[];
}

export default function Header({ totalCount = 0, roundsCompleted = 0, historyLog = [] }: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="fixed inset-0 z-50 pointer-events-none">

            {/* Left Side: Sadhana Log - Top Left Corner */}
            <div className="absolute top-6 left-6 sm:top-8 sm:left-10 pointer-events-auto">
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.2)] group ${isOpen
                            ? 'bg-blue-900/40 border-yellow-400/50 text-yellow-100'
                            : 'bg-[#0f172a]/40 border-white/10 text-blue-100/80 hover:bg-[#1a237e]/50 hover:border-white/30 hover:text-white'
                            }`}
                    >
                        <span className={`text-sm transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                        <span className="text-xs font-semibold tracking-[0.2em] uppercase">Sadhana Log</span>
                    </button>

                    {/* Dropdown Panel */}
                    <div
                        className={`absolute top-full left-0 mt-4 w-[300px] sm:w-[380px] bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ease-out origin-top-left ${isOpen
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 -translate-y-2 pointer-events-none'
                            }`}
                    >
                        {/* Header Stats */}
                        <div className="grid grid-cols-2 divide-x divide-white/10 bg-gradient-to-b from-white/5 to-transparent">
                            <div className="p-4 flex flex-col items-center">
                                <span className="text-[10px] uppercase text-blue-400 tracking-widest mb-1">Total Mantras</span>
                                <span className="text-2xl font-bold text-white font-serif">{totalCount}</span>
                            </div>
                            <div className="p-4 flex flex-col items-center">
                                <span className="text-[10px] uppercase text-yellow-500/80 tracking-widest mb-1">Total Rounds</span>
                                <span className="text-2xl font-bold text-yellow-400 font-serif">{roundsCompleted}</span>
                            </div>
                        </div>

                        {/* Recent History */}
                        <div className="p-4 bg-black/20">
                            <div className="text-[10px] uppercase text-blue-300/40 tracking-widest mb-3 pl-1">Recent Sessions</div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {historyLog.length === 0 ? (
                                    <div className="text-center py-8 text-blue-200/30 text-xs italic">
                                        No sessions recorded yet.<br />Start chanting!
                                    </div>
                                ) : (
                                    historyLog.map((entry) => (
                                        <div key={entry.id} className="group flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all">
                                            <div>
                                                <div className="text-blue-100 text-xs font-medium">{entry.day}</div>
                                                <div className="text-[10px] text-blue-400/60">{entry.time}</div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-white block">{entry.counts}</span>
                                                {entry.rounds > 0 && <span className="text-[10px] text-yellow-500/80">{entry.rounds} rnds</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </header>
    );
}
