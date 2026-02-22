"use strict";
"use client";

import { ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { SyncUser } from "@/components/auth/sync-user";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <SignedIn>
                    <SyncUser />
                    {children}
                </SignedIn>
                <SignedOut>
                    <div className="flex items-center justify-center min-h-screen bg-[#f8faff]">
                        <RedirectToSignIn />
                    </div>
                </SignedOut>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
