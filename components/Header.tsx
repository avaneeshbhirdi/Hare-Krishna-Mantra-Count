'use client';

import React, { useState } from 'react';
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton
} from '@clerk/nextjs';
import { HistoryEntry } from '../types';

interface HeaderProps {
    totalCount?: number;
    roundsCompleted?: number;
    historyLog?: HistoryEntry[];
}

export default function Header({ totalCount = 0, roundsCompleted = 0, historyLog = [] }: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 w-full px-6 py-4 sm:px-10 sm:py-6 z-50 flex items-start justify-between pointer-events-none transition-all duration-300">

            {/* Left Side: Sadhana Log */}
            <div className="pointer-events-auto relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.2)] group ${isOpen
                            ? 'bg-blue-900/40 border-yellow-400/50 text-yellow-100'
                            : 'bg-[#0f172a]/40 border-white/10 text-blue-100/80 hover:bg-[#1a237e]/50 hover:border-white/30 hover:text-white'
                        }`}
                >
                    <span className={`text-sm transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                    <span className="text-xs font-semibold tracking-[0.2em] uppercase">Sadhana Log</span>
                </button>

                {/* Dropdown Panel - Aligned Left */}
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
                            <span className="text-[10px] uppercase text-yellow-500/80 tracking-widest mb-1">Rounds</span>
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

            {/* Right Side: Auth */}
            <div className="pointer-events-auto">
                <SignedOut>
                    <div className="flex items-center gap-3">
                        <SignInButton mode="modal">
                            <button className="hidden sm:block px-5 py-2.5 text-xs font-bold text-blue-200 transition-colors hover:text-white uppercase tracking-wider backdrop-blur-md rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
                                Sign In
                            </button>
                        </SignInButton>

                        <SignUpButton mode="modal">
                            <button className="px-6 py-2.5 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/50 transition-all hover:scale-105 border border-white/10 backdrop-blur-md">
                                Start Japa
                            </button>
                        </SignUpButton>
                    </div>
                </SignedOut>

                <SignedIn>
                    <div className="flex items-center gap-4 bg-[#0a0e27]/40 px-3 pl-5 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
                        <div className="hidden sm:flex flex-col items-end mr-1">
                            <span className="text-[9px] text-blue-300 uppercase tracking-wider">Welcome</span>
                            <span className="text-xs font-semibold text-white">Devotee</span>
                        </div>
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "w-8 h-8 ring-2 ring-white/10 hover:ring-white/30 transition-all",
                                    userButtonPopoverCard: "bg-[#0f172a] border border-white/10 shadow-2xl backdrop-blur-xl",
                                    userButtonPopoverActionButton: "hover:bg-white/5 text-blue-100",
                                    userButtonPopoverActionButtonText: "text-blue-100",
                                    userButtonPopoverFooter: "hidden"
                                }
                            }}
                        />
                    </div>
                </SignedIn>
            </div>
        </header>
    );
}
