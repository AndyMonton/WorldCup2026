"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Detect if mobile (< 768px)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const delay = isMobile ? 3500 : 1500; // 3.5 seconds on mobile, 1.5 seconds on desktop

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 600); // 600ms transition duration
      return () => clearTimeout(fadeTimer);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-700 ease-in-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] px-4 text-center animate-splash-fade-scale">
        <div className="relative rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] border border-slate-800 bg-slate-900/60 backdrop-blur-md p-1">
          <img
            src="/images/splash.jpg"
            alt="FIFA World Cup 2026 Prode"
            className="w-full h-auto object-contain rounded-2xl mx-auto"
          />
        </div>
        
        {/* Animated Loader */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full w-full animate-splash-loading-bar"></div>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
            Cargando aplicación...
          </span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes splashFadeScale {
          0% {
            opacity: 0;
            transform: scale(0.96);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes splashLoadingBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-splash-fade-scale {
          animation: splashFadeScale 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-splash-loading-bar {
          animation: splashLoadingBar 1.8s infinite linear;
        }
      `}} />
    </div>
  );
}
