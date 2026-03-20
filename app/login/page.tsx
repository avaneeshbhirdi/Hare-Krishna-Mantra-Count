import { login, signup, signInWithGoogle } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sp = await searchParams;
    const message = sp.message as string;

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground glass-panel p-8 rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                <h2 className="text-2xl font-bold text-center text-white mb-6 uppercase tracking-widest">Authentication</h2>

                <label className="text-xs uppercase tracking-widest text-blue-300 mb-1" htmlFor="email">Email</label>
                <input
                    className="rounded-md px-4 py-3 bg-black/50 border border-white/20 mb-6 text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    name="email"
                    placeholder="you@example.com"
                    required
                />

                <label className="text-xs uppercase tracking-widest text-blue-300 mb-1" htmlFor="password">Password</label>
                <input
                    className="rounded-md px-4 py-3 bg-black/50 border border-white/20 mb-6 text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                />

                <div className="flex gap-4 mt-2">
                    <button formAction={login} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md px-4 py-3 text-sm uppercase tracking-widest transition-colors shadow-lg">
                        Sign In
                    </button>
                    <button formAction={signup} className="flex-1 border border-white/20 hover:bg-white/10 text-white font-bold rounded-md px-4 py-3 text-sm uppercase tracking-widest transition-colors">
                        Sign Up
                    </button>
                </div>

                <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-white/20"></div>
                    <span className="px-3 text-xs uppercase tracking-widest text-blue-300">Or</span>
                    <div className="flex-1 border-t border-white/20"></div>
                </div>

                <button formAction={signInWithGoogle} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-bold rounded-md px-4 py-3 text-sm uppercase tracking-widest transition-colors shadow-lg mb-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Continue with Google
                </button>


                {message && <p className="mt-6 p-4 bg-red-900/40 border border-red-500/50 text-red-200 text-center rounded-md text-sm">{message}</p>}
            </form>
        </div>
    )
}
