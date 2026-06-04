"use client";

import React, { useState, useEffect } from "react";

interface TimeRemaining {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export function CountdownTimer() {
  // El mundial comienza el 11 de Junio del 2026 a las 16:00 hs de Argentina (UTC-3), lo que es 19:00 hs UTC.
  const targetDate = new Date("2026-06-11T19:00:00Z");

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setHasStarted(true);
        setTimeRemaining({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
        return;
      }

      const daysVal = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hoursVal = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutesVal = Math.floor(
        (difference % (1000 * 60 * 60)) / (1000 * 60)
      );
      const secondsVal = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days: daysVal.toString().padStart(2, "0"),
        hours: hoursVal.toString().padStart(2, "0"),
        minutes: minutesVal.toString().padStart(2, "0"),
        seconds: secondsVal.toString().padStart(2, "0"),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel border-2 border-primary/30 rounded-3xl p-5 md:p-6 bg-gradient-to-r from-primary/5 via-slate-900/40 to-slate-950/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Decorative Blur Background */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Left side: Logo & Title */}
      <div className="flex items-center gap-4 z-10">
        <div className="relative w-16 h-16 shrink-0 bg-slate-900/80 border border-border rounded-2xl flex items-center justify-center p-2.5 shadow-inner">
          <img
            src="/images/fifa-logo.jpg"
            alt="FIFA 26 Logo"
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>
        <div className="text-center md:text-left">
          <span className="text-[10px] text-primary font-black uppercase tracking-widest block mb-0.5">
            Cuenta Regresiva Oficial
          </span>
          <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight">
            El Mundial <span className="text-gradient">Comienza en:</span>
          </h2>
        </div>
      </div>

      {/* Right side: Countdown Cards */}
      <div className="grid grid-cols-4 gap-3 md:gap-4 z-10 w-full md:w-auto max-w-sm md:max-w-none">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950/85 border border-border/80 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-[50%] bg-white/[0.02] border-b border-white/[0.04]"></div>
            <span className="text-2xl md:text-3xl font-black text-primary font-mono tracking-tight animate-pulse-slow">
              {timeRemaining.days}
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
            Días
          </span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950/85 border border-border/80 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-[50%] bg-white/[0.02] border-b border-white/[0.04]"></div>
            <span className="text-2xl md:text-3xl font-black text-foreground font-mono tracking-tight">
              {timeRemaining.hours}
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
            Horas
          </span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950/85 border border-border/80 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-[50%] bg-white/[0.02] border-b border-white/[0.04]"></div>
            <span className="text-2xl md:text-3xl font-black text-foreground font-mono tracking-tight">
              {timeRemaining.minutes}
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
            Min
          </span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950/85 border border-primary/25 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-[50%] bg-white/[0.02] border-b border-white/[0.04]"></div>
            <span className="text-2xl md:text-3xl font-black text-primary font-mono tracking-tight">
              {timeRemaining.seconds}
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
            Seg
          </span>
        </div>
      </div>
    </div>
  );
}
