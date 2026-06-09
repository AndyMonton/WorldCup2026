"use client";

import React, { useState } from "react";
import { CreditCard, Check, Copy } from "lucide-react";

interface TransferAliasCardProps {
  alias: string | null;
  amount: number | null;
  leagueName: string;
  transferAccountName: string | null;
  transferPhone: string | null;
}

export function TransferAliasCard({
  alias,
  amount,
  leagueName,
  transferAccountName,
  transferPhone,
}: TransferAliasCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!alias) return;
    try {
      await navigator.clipboard.writeText(alias);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
    }
  };

  const formattedAmount = amount !== null
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount)
    : null;

  return (
    <section className="glass-panel border-2 border-primary/30 rounded-2xl p-6 md:p-8 shadow-xl bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
      {/* Luz de fondo sutil */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-start gap-4 z-10 flex-1">
        <div className="p-3.5 bg-primary/15 border border-primary/25 text-primary rounded-2xl flex-shrink-0 animate-pulse">
          <CreditCard className="w-8 h-8" />
        </div>
        <div className="space-y-1 text-center md:text-left w-full">
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">
            Inscripción a la Liga
          </h2>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Para participar oficialmente en el ranking, clasificaciones y premios de la liga{" "}
            <span className="font-bold text-foreground">{leagueName}</span>, recordá completar los datos de inscripción.
          </p>
          {formattedAmount && (
            <p className="text-sm font-bold text-slate-200 pt-1">
              Importe a transferir: <span className="text-gradient text-base font-extrabold">{formattedAmount}</span>
            </p>
          )}
          {(transferAccountName || transferPhone) && (
            <div className="text-xs text-slate-300 mt-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 max-w-lg leading-relaxed text-left">
              Una vez realizada la transferencia, enviar el comprobante{" "}
              {transferAccountName && (
                <>
                  a <span className="font-bold text-foreground">{transferAccountName}</span>
                </>
              )}
              {transferAccountName && transferPhone && " "}
              {transferPhone && (
                <>
                  al teléfono <span className="font-bold text-foreground">{transferPhone}</span>
                </>
              )}
              .
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-950/80 border border-border/80 rounded-2xl flex flex-col items-center md:items-start min-w-[260px] text-center md:text-left relative overflow-hidden group z-10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 opacity-50 blur-[20px] rounded-full pointer-events-none transition-all group-hover:scale-150"></div>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Alias de la Liga</span>
        
        {alias ? (
          <div className="flex items-center gap-2 mt-1.5 w-full">
            <span className="text-sm font-mono font-bold text-primary select-all bg-slate-900/60 px-3 py-1.5 rounded-xl border border-border/50 flex-1 truncate">
              {alias}
            </span>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-slate-900 border border-border hover:bg-slate-800 text-slate-400 hover:text-foreground transition-all cursor-pointer flex-shrink-0"
              title="Copiar Alias"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <span className="text-xs font-semibold text-amber-500 mt-2">
            Consulte al administrador para el Alias
          </span>
        )}
      </div>
    </section>
  );
}
