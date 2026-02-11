'use client';

import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton
} from '@clerk/nextjs';

export default function Header() {
    return (
        <header className="fixed top-6 right-6 z-50 flex items-center gap-4">
            <SignedOut>
                <SignInButton mode="modal">
                    <button className="cursor-pointer px-8 py-3 text-xs font-semibold uppercase tracking-widest text-blue-100/90 hover:text-white bg-[#141e50]/40 backdrop-blur-xl border border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(100,150,255,0.1)] hover:shadow-[0_0_25px_rgba(100,150,255,0.25)] rounded-2xl transition-all active:scale-95">
                        Sign In
                    </button>
                </SignInButton>

                <SignUpButton mode="modal">
                    <button className="cursor-pointer px-8 py-3 text-xs font-semibold uppercase tracking-widest text-blue-100/90 hover:text-white bg-[#141e50]/40 backdrop-blur-xl border border-white/20 hover:border-white/40 shadow-[0_0_15px_rgba(100,150,255,0.1)] hover:shadow-[0_0_25px_rgba(100,150,255,0.25)] rounded-2xl transition-all active:scale-95">
                        Sign Up
                    </button>
                </SignUpButton>
            </SignedOut>

            <SignedIn>
                <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-[#141e50]/40 backdrop-blur-xl border border-white/20 shadow-lg">
                    <span className="text-xs font-medium text-blue-100/80 uppercase tracking-widest hidden sm:block">
                        Devotee
                    </span>
                    <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
                    <UserButton
                        appearance={{
                            elements: {
                                userButtonAvatarBox: "w-8 h-8 ring-2 ring-white/10 hover:ring-white/30 transition-all",
                                userButtonPopoverCard: "bg-[#0a0e27] border border-white/10 shadow-2xl backdrop-blur-xl",
                                userButtonPopoverActionButton: "hover:bg-white/5 text-blue-100",
                                userButtonPopoverActionButtonText: "text-blue-100",
                                userButtonPopoverFooter: "hidden"
                            }
                        }}
                    />
                </div>
            </SignedIn>
        </header>
    );
}
