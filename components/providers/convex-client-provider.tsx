"use strict";
"use client";

import { ReactNode, useState } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth, SignedIn, SignedOut, SignIn, useSignIn } from "@clerk/nextjs";
import { SyncUser } from "@/components/auth/sync-user";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function GuestSignInButton() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const [isLoading, setIsLoading] = useState(false);

    const handleGuestLogin = async () => {
        if (!isLoaded || isLoading) return;
        setIsLoading(true);
        try {
            const result = await signIn.create({
                identifier: "guest@tars-chat.com",
                password: "GuestPassword123!",
            });
            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
            }
        } catch (err) {
            console.error("Guest login failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full max-w-[400px] py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-md transition-all active:scale-95 text-sm"
        >
            {isLoading ? "Signing in..." : "Sign in as Guest Recruiter (One-click)"}
        </button>
    );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!} afterSignOutUrl="/">
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <SignedIn>
                    <SyncUser />
                    {children}
                </SignedIn>
                <SignedOut>
                    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8faff] p-4 gap-4">
                        <div className="text-center max-w-sm mb-2">
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">Tars Chat App</h2>
                            <p className="text-sm text-slate-500">Sign in to start messaging in real-time</p>
                        </div>
                        <SignIn routing="hash" />
                        <div className="w-full max-w-[400px] flex items-center my-1">
                            <hr className="flex-grow border-slate-200" />
                            <span className="px-3 text-xs text-slate-400 font-semibold uppercase">Or</span>
                            <hr className="flex-grow border-slate-200" />
                        </div>
                        <GuestSignInButton />
                    </div>
                </SignedOut>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
