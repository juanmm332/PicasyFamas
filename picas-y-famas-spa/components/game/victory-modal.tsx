"use client"

import { Trophy, Sparkles } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface VictoryModalProps {
  open: boolean
  attempts: number
  onPlayAgain: () => void
  onClose: () => void
}

export function VictoryModal({ open, attempts, onPlayAgain, onClose }: VictoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-border bg-card text-center sm:max-w-sm">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-fama/15">
            <Sparkles className="absolute -right-1 -top-1 h-6 w-6 animate-pulse text-fama" />
            <Trophy className="h-10 w-10 text-fama" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">¡Felicidades!</h2>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Descifraste el número secreto con <span className="font-semibold text-foreground">4 Famas</span> en{" "}
              <span className="font-semibold text-foreground">{attempts}</span>{" "}
              {attempts === 1 ? "intento" : "intentos"}.
            </p>
          </div>
          <Button onClick={onPlayAgain} className="mt-2 w-full font-semibold">
            Iniciar nueva partida
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
