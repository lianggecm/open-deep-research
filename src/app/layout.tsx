import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Link from "next/link";

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
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col antialiased`}
      >
        <div className="fixed right-0 left-0 w-full top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 z-50">
          <div className="flex justify-center sm:justify-between items-center p-4 ">
            <div className="flex flex-row items-center gap-2 shrink-0 ">
              <span className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-2 home-links">
                <div className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-4">
                  <Link className="flex flex-row items-center gap-2" href="/">
                    <div className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-2">
                      <div className="jsx-e3e12cc6f9ad5a71 text-zinc-800 dark:text-zinc-100">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g filter="url(#filter0_i_122_1060)">
                            <rect
                              x="12.4902"
                              y="3.51477"
                              width="12"
                              height="8.4"
                              rx="2"
                              transform="rotate(45 12.4902 3.51477)"
                              fill="#072D77"
                            />
                          </g>
                          <g filter="url(#filter1_i_122_1060)">
                            <rect
                              x="9.13806"
                              y="4.78748"
                              width="14.9406"
                              height="8.4"
                              rx="2"
                              transform="rotate(45 9.13806 4.78748)"
                              fill="#1A53C6"
                            />
                          </g>
                          <defs>
                            <filter
                              id="filter0_i_122_1060"
                              x="7.37891"
                              y="4.34314"
                              width="12.7681"
                              height="16.7682"
                              filterUnits="userSpaceOnUse"
                              colorInterpolationFilters="sRGB"
                            >
                              <feFlood
                                floodOpacity="0"
                                result="BackgroundImageFix"
                              />
                              <feBlend
                                mode="normal"
                                in="SourceGraphic"
                                in2="BackgroundImageFix"
                                result="shape"
                              />
                              <feColorMatrix
                                in="SourceAlpha"
                                type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                result="hardAlpha"
                              />
                              <feOffset dy="4" />
                              <feGaussianBlur stdDeviation="2" />
                              <feComposite
                                in2="hardAlpha"
                                operator="arithmetic"
                                k2="-1"
                                k3="1"
                              />
                              <feColorMatrix
                                type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                              />
                              <feBlend
                                mode="normal"
                                in2="shape"
                                result="effect1_innerShadow_122_1060"
                              />
                            </filter>
                            <filter
                              id="filter1_i_122_1060"
                              x="4.02679"
                              y="5.61584"
                              width="14.8475"
                              height="18.8475"
                              filterUnits="userSpaceOnUse"
                              colorInterpolationFilters="sRGB"
                            >
                              <feFlood
                                floodOpacity="0"
                                result="BackgroundImageFix"
                              />
                              <feBlend
                                mode="normal"
                                in="SourceGraphic"
                                in2="BackgroundImageFix"
                                result="shape"
                              />
                              <feColorMatrix
                                in="SourceAlpha"
                                type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                result="hardAlpha"
                              />
                              <feOffset dy="4" />
                              <feGaussianBlur stdDeviation="2" />
                              <feComposite
                                in2="hardAlpha"
                                operator="arithmetic"
                                k2="-1"
                                k3="1"
                              />
                              <feColorMatrix
                                type="matrix"
                                values="0 0 0 0 0.040625 0 0 0 0 0.154455 0 0 0 0 0.375 0 0 0 0.25 0"
                              />
                              <feBlend
                                mode="normal"
                                in2="shape"
                                result="effect1_innerShadow_122_1060"
                              />
                            </filter>
                          </defs>
                        </svg>
                      </div>
                      <div className="jsx-e3e12cc6f9ad5a71 text-lg font-bold text-zinc-800 dark:text-zinc-100">
                        DeepSeek Research
                      </div>
                    </div>
                  </Link>
                </div>
              </span>
            </div>
            <div className="flex flex-row items-center gap-2 shrink-0"></div>
          </div>
        </div>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
