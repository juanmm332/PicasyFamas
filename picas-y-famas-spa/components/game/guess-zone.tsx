"use client"

import { useState } from "react"
import { Loader2, Send, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validateGuess } from "@/lib/game-api"

interface GuessZoneProps {
  gameId: number
  disabled: boolean
  submitting: boolean
  onGuess: (value: string) => void
}

export function GuessZone({ gameId, disabled, submitting, onGuess }: GuessZoneProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleChange(raw: string) {
    // Strictly allow only digits, max length 4.
    const cleaned = raw.replace(/\D/g, "").slice(0, 4)
    setValue(cleaned)
    if (error) setError(null)
  }

  function submit() {
    const validationError = validateGuess(value)
    if (validationError) {
      setError(validationError)
      return
    }
    onGuess(value)
    setValue("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tu jugada</h3>
        <span className="text-xs text-muted-foreground">Partida #{gameId}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0000"
          aria-label="Número de 4 dígitos"
          className="h-14 flex-1 text-center font-mono text-2xl font-bold tracking-[0.5em] tabular-nums placeholder:tracking-[0.5em] placeholder:text-muted-foreground/40"
        />
        <Button
          onClick={submit}
          disabled={disabled || submitting || value.length !== 4}
          className="h-14 px-6 font-semibold sm:w-auto"
        >
          {disabled ? (
            <>
              <Lock className="mr-2 h-4 w-4" /> Bloqueado
            </>
          ) : submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Arriesgar
            </>
          )}
        </Button>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Ingresa 4 dígitos distintos. Una <span className="font-medium text-fama">Fama</span> es dígito correcto en
          posición correcta; una <span className="font-medium text-pica">Pica</span> es dígito correcto en posición
          incorrecta.
        </p>
      )}
    </div>
  )
}
