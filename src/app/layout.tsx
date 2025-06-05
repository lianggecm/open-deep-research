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
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";

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
      <SidebarProvider>
        <AppSidebar />

        <html lang="en" className="h-full">
          <body
            className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col antialiased`}
          >
            <div className="fixed right-0 left-0 w-full top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 z-50">
              <div className="flex justify-center sm:justify-between items-center p-4 ">
                <div className="flex flex-row items-center gap-2 shrink-0 w-full">
                  <div className="flex flex-row items-center gap-4 justify-between w-full">
                    <SidebarTrigger>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1.66669 4.16666C1.66669 3.70643 2.03979 3.33333 2.50002 3.33333H13.3334C13.7936 3.33333 14.1667 3.70643 14.1667 4.16666C14.1667 4.62689 13.7936 4.99999 13.3334 4.99999H2.50002C2.03979 4.99999 1.66669 4.62689 1.66669 4.16666Z"
                          fill="#6A7282"
                        />
                        <path
                          d="M1.66669 9.99999C1.66669 9.53974 2.03979 9.16666 2.50002 9.16666H17.5C17.9603 9.16666 18.3334 9.53974 18.3334 9.99999C18.3334 10.4602 17.9603 10.8333 17.5 10.8333H2.50002C2.03979 10.8333 1.66669 10.4602 1.66669 9.99999Z"
                          fill="#6A7282"
                        />
                        <path
                          d="M2.50002 15C2.03979 15 1.66669 15.3731 1.66669 15.8333C1.66669 16.2936 2.03979 16.6667 2.50002 16.6667H9.16669C9.62694 16.6667 10 16.2936 10 15.8333C10 15.3731 9.62694 15 9.16669 15H2.50002Z"
                          fill="#6A7282"
                        />
                      </svg>
                    </SidebarTrigger>
                    <Link
                      className="md:hidden flex flex-row items-center gap-2"
                      href="/"
                    >
                      <div className="flex flex-row items-center gap-2">
                        <div className=" text-zinc-800 dark:text-zinc-100">
                          <img
                            src="/logo.svg"
                            alt="DeepSeek Research"
                            className="size-6"
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-2 shrink-0"></div>
              </div>
            </div>
            <Toaster position="top-center" />
            {children}
          </body>
        </html>
      </SidebarProvider>
    </ClerkProvider>
  );
}
