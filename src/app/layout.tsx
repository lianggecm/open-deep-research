import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { Header } from "@/components/Header";
import PlausibleProvider from "next-plausible";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepSeek Research",
  description: "Let AI do research for you",
  openGraph: {
    images: ["https://www.deepseekresearch.io/og.jpg"],
  },
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
          <head>
            <PlausibleProvider domain="deepseekresearch.io" />
          </head>
          <body
            className={`${figtree.variable} flex min-h-full flex-col antialiased`}
          >
            <Header />
            <Toaster position="top-center" richColors />
            {children}
          </body>
        </html>
      </SidebarProvider>
    </ClerkProvider>
  );
}
