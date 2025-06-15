import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aether AI",
  description: "Your Conversational AI Companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#020617]">
      <head>
        {/* The Razorpay script is now correctly placed in the head */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        
        {/* The AdSense script is also correctly placed in the head */}
        <script async 
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
          crossOrigin="anonymous">
        </script>
      </head>
      
      <body className={`${inter.className} h-full`}>{children}</body>
    </html>
  );
}
