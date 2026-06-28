"use client"

import { History } from "lucide-react"
import type { GuessRow } from "@/lib/game-api"

interface HistoryTableProps {
  history: GuessRow[]
}

export function HistoryTable({ history }: HistoryTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Historial de intentos</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {history.length} {history.length === 1 ? "intento" : "intentos"}
        </span>
      </div>

      {history.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Aún no has arriesgado ningún número. ¡Empieza a adivinar!
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {/* Most recent first */}
          {[...history].reverse().map((row, idx) => {
            const turn = history.length - idx
            return (
              <li key={row.id} className="flex items-center gap-4 px-5 py-3 animate-float-up">
                <span className="w-6 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">#{turn}</span>
                <span className="font-mono text-lg font-bold tracking-[0.3em] tabular-nums">{row.number}</span>
                <div className="ml-auto flex items-center gap-2">
                  {row.famas !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-fama/15 px-2.5 py-1 text-xs font-semibold text-fama">
                      {row.famas} Famas
                    </span>
                  )}
                  {row.picas !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-pica/15 px-2.5 py-1 text-xs font-semibold text-pica">
                      {row.picas} Picas
                    </span>
                  )}
                  {row.famas === null && row.picas === null && (
                    <span className="max-w-[14rem] truncate text-xs text-muted-foreground" title={row.message}>
                      {row.message}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
