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
        <header className="fixed top-4 right-4 z-50">
            <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-blue-950/30 backdrop-blur-md border border-white/10 shadow-lg transition-all hover:bg-blue-950/40">
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors hover:bg-white/10 rounded-full">
                            Sign In
                        </button>
                    </SignInButton>
                    <div className="w-[1px] h-4 bg-white/20"></div>
                    <SignUpButton mode="modal">
                        <button className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 shadow-sm backdrop-blur-sm">
                            Get Started
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
