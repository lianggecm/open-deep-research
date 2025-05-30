import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Toaster } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepSeek Research",
  description: "Let AI do research for you",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col antialiased`}
        >
          <div className="fixed right-0 left-0 w-full top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 z-50">
            <div className="flex justify-center sm:justify-between items-center p-4 ">
              <div className="flex flex-row items-center gap-2 shrink-0 w-full">
                <div className="flex flex-row items-center gap-4 justify-between w-full">
                  <Link className="flex flex-row items-center gap-2" href="/">
                    <div className="flex flex-row items-center gap-2">
                      <div className=" text-zinc-800 dark:text-zinc-100">
                        <img
                          src="/logo.svg"
                          alt="DeepSeek Research"
                          className="size-6"
                        />
                      </div>
                      <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                        DeepSeek Research
                      </div>
                    </div>
                  </Link>

                  {false && (
                    <div className="flex flex-row items-center gap-2">
                      <SignedOut>
                        <SignInButton>
                          <Button
                            variant="secondary"
                            className="text-xs border"
                          >
                            Log in
                          </Button>
                        </SignInButton>
                        <SignUpButton>
                          <Button className="text-xs">Sign up</Button>
                        </SignUpButton>
                      </SignedOut>
                      <SignedIn>
                        <UserButton />
                      </SignedIn>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-row items-center gap-2 shrink-0"></div>
            </div>
          </div>
          <Toaster position="top-center" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
