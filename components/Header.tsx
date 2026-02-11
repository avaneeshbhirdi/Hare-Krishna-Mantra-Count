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
        <header className="fixed top-6 right-6 z-50">
            <div className="flex items-center gap-4 px-6 py-3 rounded-[20px] bg-[#141e50]/30 backdrop-blur-[20px] border border-[#6496ff]/20 shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition-all">
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="px-5 py-2 text-sm font-semibold text-blue-100 hover:text-white border border-white/20 bg-white/5 hover:bg-white/10 rounded-md transition-all shadow-sm">
                            Sign In
                        </button>
                    </SignInButton>
                    <div className="w-[1px] h-5 bg-white/20"></div>
                    <SignUpButton mode="modal">
                        <button className="px-5 py-2 text-sm font-semibold text-blue-100 hover:text-white border border-white/20 bg-white/5 hover:bg-white/10 rounded-md transition-all shadow-sm">
                            Sign Up
                        </button>
                    </SignUpButton>
                </SignedOut>

                <SignedIn>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-blue-100/80 font-medium hidden sm:block">Welcome, Devotee</span>
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "w-9 h-9 border-2 border-white/20 hover:border-white/40 transition-colors",
                                    userButtonPopoverCard: "bg-blue-950 border border-white/10 shadow-xl backdrop-blur-xl",
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
