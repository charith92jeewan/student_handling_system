import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Applebay Institute — Student Handling System",
  description: "Academic Student Handling & Management Portal • Powered by charithj",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070a12] text-slate-100 aurora-bg selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
