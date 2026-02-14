'use client';

import { useState } from 'react';
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton
} from '@clerk/nextjs';

interface HeaderProps {
    totalCount?: number;
    roundsCompleted?: number;
    historyLog?: any[];
}

export default function Header({ totalCount = 0, roundsCompleted = 0, historyLog = [] }: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="fixed top-6 sm:top-8 left-0 w-full px-10 sm:px-12 z-50 flex items-start justify-between pointer-events-none">
            {/* Left Side: Sadhana Log (Expanding) */}
            <div className="pointer-events-auto flex flex-col items-start relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 cursor-pointer py-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-blue-100/60 hover:text-white transition-all active:scale-95 group"
                >
                    <span className="text-xl group-hover:scale-110 transition-transform">📿</span>
                    <span className="hidden sm:inline">Sadhana</span>
                </button>

                {/* Expanding Panel with CSS Transition */}
                <div
                    className={`absolute top-12 left-0 w-[320px] sm:w-[400px] flex flex-col bg-[#0a0e27]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-500 ease-out origin-top-left ${isOpen
                        ? 'max-h-[70vh] opacity-100 translate-y-0 pointer-events-auto'
                        : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
                        }`}
                >
                    {/* Header Stats */}
                    <div className="grid grid-cols-2 gap-4 p-4 border-b border-white/10 bg-white/5">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase text-blue-300/60 tracking-wider">Total</span>
                            <span className="text-xl font-bold text-white">{totalCount}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase text-blue-300/60 tracking-wider">Rounds</span>
                            <span className="text-xl font-bold text-yellow-400">{roundsCompleted}</span>
                        </div>
                    </div>

                    {/* Scrollable History List */}
                    <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                        {historyLog.length === 0 ? (
                            <div className="text-center text-blue-200/40 py-6 text-xs italic">
                                Start chanting to see your journey!
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {historyLog.map((entry) => (
                                    <div key={entry.id} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-blue-100 text-xs font-medium">{entry.day}</span>
                                            <span className="text-blue-300/50 text-[10px]">{entry.date} • {entry.time}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">{entry.counts} <span className="text-[9px] font-normal text-blue-300/60">cnts</span></div>
                                            {entry.rounds > 0 && (
                                                <div className="text-[10px] text-yellow-400">{entry.rounds} <span className="text-[9px] text-yellow-400/60">rnds</span></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Buttons */}
            <div className="pointer-events-auto flex items-center gap-4">
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="cursor-pointer px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-blue-100/60 hover:text-white bg-[#141e50]/40 backdrop-blur-xl border border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(100,150,255,0.1)] hover:shadow-[0_0_25px_rgba(100,150,255,0.25)] rounded-lg transition-all active:scale-95">
                            Sign In
                        </button>
                    </SignInButton>

                    <SignUpButton mode="modal">
                        <button className="cursor-pointer px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-blue-100/60 hover:text-white bg-[#141e50]/40 backdrop-blur-xl border border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(100,150,255,0.1)] hover:shadow-[0_0_25px_rgba(100,150,255,0.25)] rounded-lg transition-all active:scale-95">
                            Sign Up
                        </button>
                    </SignUpButton>
                </SignedOut>

                <SignedIn>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-blue-100/60 uppercase tracking-widest hidden sm:block">
                            Devotee
                        </span>
                        <div className="w-px h-4 bg-white/20 hidden sm:block"></div>
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "w-9 h-9 ring-2 ring-white/20 hover:ring-white/40 transition-all",
                                    userButtonPopoverCard: "bg-[#0a0e27] border border-white/10 shadow-2xl backdrop-blur-xl",
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
