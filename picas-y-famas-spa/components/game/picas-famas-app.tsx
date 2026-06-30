"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Target, LogOut, Loader2, Play, RotateCcw, Gamepad2, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AuthScreen } from "@/components/game/auth-screen"
import { GuessZone } from "@/components/game/guess-zone"
import { HistoryTable } from "@/components/game/history-table"
import { VictoryModal } from "@/components/game/victory-modal"
import { MetricsDashboard } from "@/components/game/metrics-dashboard"
import {
  ApiError,
  clearToken,
  extractGameId,
  getPersistedGame,
  getToken,
  parseResult,
  sendGuess,
  setPersistedGame,
  startGame,
  type GuessRow,
} from "@/lib/game-api"

export function PicasFamasApp() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [view, setView] = useState<"game" | "dashboard">("game")
  const [gameId, setGameId] = useState<number | null>(null)
  const [history, setHistory] = useState<GuessRow[]>([])
  const [finished, setFinished] = useState(false)

  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [victoryOpen, setVictoryOpen] = useState(false)
  const [resumeId, setResumeId] = useState<number | null>(null)

  // Restore session + active game on mount.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setAuthed(false)
      return
    }
    setAuthed(true)
    const persisted = getPersistedGame()
    if (persisted) {
      setGameId(persisted.gameId)
      setHistory(persisted.history)
      setFinished(persisted.finished)
    }
  }, [])

  const persist = useCallback((id: number | null, rows: GuessRow[], isFinished: boolean) => {
    if (id === null) {
      setPersistedGame(null)
    } else {
      setPersistedGame({ gameId: id, history: rows, finished: isFinished })
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setPersistedGame(null)
    setAuthed(false)
    setGameId(null)
    setHistory([])
    setFinished(false)
  }, [])

  function handleSessionError(err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      toast.error("Tu sesión expiró. Inicia sesión nuevamente.")
      logout()
      return true
    }
    return false
  }

  function beginGame(id: number, message?: string) {
    setGameId(id)
    setHistory([])
    setFinished(false)
    setVictoryOpen(false)
    persist(id, [], false)
    if (message) toast.success(message)
  }

  async function handleStart() {
    setStarting(true)
    try {
      const res = await startGame()
      beginGame(res.gameId, res.message || "¡Nueva partida iniciada!")
    } catch (err) {
      if (handleSessionError(err)) return
      if (err instanceof ApiError && err.status === 400) {
        const existing = extractGameId(err.body)
        if (existing !== null) {
          setResumeId(existing)
          return
        }
      }
      toast.error(err instanceof ApiError ? err.message : "No se pudo iniciar la partida.")
    } finally {
      setStarting(false)
    }
  }

  async function handleGuess(value: string) {
    if (gameId === null) return
    setSubmitting(true)
    try {
      const res = await sendGuess(gameId, value)
      const { famas, picas } = parseResult(res.message)
      const row: GuessRow = {
        id: `${Date.now()}-${value}`,
        number: value,
        message: res.message,
        famas,
        picas,
        isFinished: res.isFinished,
      }
      const nextHistory = [...history, row]
      const won = res.isFinished || famas === 4
      setHistory(nextHistory)
      setFinished(won)
      persist(gameId, nextHistory, won)

      if (won) {
        setVictoryOpen(true)
      } else {
        toast(res.message, { description: `Número arriesgado: ${value}` })
      }
    } catch (err) {
      if (handleSessionError(err)) return
      toast.error(err instanceof ApiError ? err.message : "No se pudo enviar la jugada.")
    } finally {
      setSubmitting(false)
    }
  }

  function confirmResume() {
    if (resumeId === null) return
    beginGame(resumeId, `Reanudando la partida #${resumeId}.`)
    setResumeId(null)
  }

  // ---------- Loading ----------
  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---------- Auth screen ----------
  if (!authed) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <div className="app-glow pointer-events-none absolute inset-0" />
        <div className="dotted-grid pointer-events-none absolute inset-0" />
        <div className="relative z-10 w-full flex justify-center">
          <AuthScreen onAuthenticated={() => setAuthed(true)} />
        </div>
      </main>
    )
  }

  const hasActiveGame = gameId !== null

  // ---------- Game board ----------
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="app-glow pointer-events-none absolute inset-0" />
      <div className="dotted-grid pointer-events-none absolute inset-0" />

      <div
        className={`relative z-10 mx-auto flex min-h-screen w-full flex-col px-4 py-8 ${
          view === "dashboard" ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">Picas y Famas</h1>
              <p className="text-xs text-muted-foreground">Adivina el número de 4 dígitos</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </Button>
        </header>

        {/* Navegación entre vistas */}
        <nav className="mb-6 inline-flex w-full gap-1 rounded-2xl border border-border bg-card p-1 sm:w-auto sm:self-start">
          <button
            type="button"
            onClick={() => setView("game")}
            aria-current={view === "game"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors sm:flex-none ${
              view === "game"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gamepad2 className="h-4 w-4" /> Juego
          </button>
          <button
            type="button"
            onClick={() => setView("dashboard")}
            aria-current={view === "dashboard"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors sm:flex-none ${
              view === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Dashboard
          </button>
        </nav>

        {view === "dashboard" ? (
          <MetricsDashboard onSessionError={handleSessionError} />
        ) : !hasActiveGame ? (
          // No active game — start screen
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-pop-in">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Play className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-balance text-2xl font-bold tracking-tight">¿Listo para jugar?</h2>
            <p className="mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Inicia una nueva partida y trata de descifrar el número secreto de 4 dígitos en la menor cantidad de
              intentos.
            </p>
            <Button onClick={handleStart} disabled={starting} size="lg" className="mt-6 font-semibold">
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar nueva partida"}
            </Button>
          </div>
        ) : (
          // Active game
          <div className="flex flex-col gap-5">
            {finished && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-fama/30 bg-fama/10 px-5 py-4 animate-pop-in">
                <p className="text-sm font-medium text-fama">¡Partida completada! Descifraste el número secreto.</p>
                <Button onClick={handleStart} disabled={starting} size="sm" className="shrink-0 font-semibold">
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                </Button>
              </div>
            )}

            <GuessZone gameId={gameId} disabled={finished} submitting={submitting} onGuess={handleGuess} />
            <HistoryTable history={history} />
          </div>
        )}
      </div>

      <VictoryModal
        open={victoryOpen}
        attempts={history.length}
        onPlayAgain={() => {
          setVictoryOpen(false)
          handleStart()
        }}
        onClose={() => setVictoryOpen(false)}
      />

      {/* Resume existing-game confirmation */}
      <AlertDialog open={resumeId !== null} onOpenChange={(o) => !o && setResumeId(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Ya tienes una partida activa</AlertDialogTitle>
            <AlertDialogDescription>
              Existe una partida en curso (#{resumeId}). ¿Deseas continuar esa partida en lugar de iniciar una nueva?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResume}>Continuar partida</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
