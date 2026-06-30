"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  RefreshCw,
  Sigma,
  Trophy,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ApiError,
  getDashboardMetrics,
  type DashboardMetrics,
} from "@/lib/game-api"

interface MetricsDashboardProps {
  onSessionError?: (err: unknown) => void
}

const regsConfig = {
  count: { label: "Usuarios", color: "hsl(158 64% 42%)" },
} satisfies ChartConfig

const attemptsConfig = {
  attemptsCount: { label: "Intentos", color: "hsl(199 89% 55%)" },
} satisfies ChartConfig

export function MetricsDashboard({ onSessionError }: MetricsDashboardProps) {
  const [data, setData] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getDashboardMetrics()
      setData(res)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionError?.(err)
        return
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las métricas del dashboard.",
      )
    } finally {
      setLoading(false)
    }
  }, [onSessionError])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Cargando métricas de auditoría...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-16 text-center animate-pop-in">
        <AlertTriangle className="h-7 w-7 text-destructive" />
        <p className="max-w-sm text-pretty text-sm text-foreground">{error}</p>
        <Button onClick={load} size="sm" variant="secondary" className="font-semibold">
          <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
        </Button>
      </div>
    )
  }

  if (!data) return null

  const totalRegistered = data.registrationsByDay.reduce((acc, r) => acc + r.count, 0)
  const totalGames = data.attemptsPerGame.length
  const topPalette = [
    "hsl(38 92% 55%)",
    "hsl(158 64% 42%)",
    "hsl(199 89% 55%)",
    "hsl(280 60% 60%)",
    "hsl(215 20% 55%)",
  ]

  const top5 = [...data.top5ShortestGames].sort((a, b) => a.totalAttempts - b.totalAttempts)

  return (
    <div className="flex flex-col gap-5 animate-pop-in">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={<Sigma className="h-5 w-5" />}
          label="Promedio global de intentos"
          value={data.averageAttemptsGlobal.toFixed(2)}
          accent="primary"
          highlight
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Usuarios registrados"
          value={String(totalRegistered)}
          accent="pica"
        />
        <KpiCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Partidas analizadas"
          value={String(totalGames)}
          accent="fama"
        />
      </div>

      {/* Métrica 1: Registros por día */}
      <section className="rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={<Users className="h-4 w-4 text-primary" />}
          title="Usuarios registrados por día"
          subtitle="Métrica 1 · registrationsByDay"
        />
        <div className="px-3 pb-5 pt-2 sm:px-5">
          {data.registrationsByDay.length === 0 ? (
            <EmptyState text="Sin datos de registros disponibles." />
          ) : (
            <ChartContainer config={regsConfig} className="h-[260px] w-full">
              <BarChart data={data.registrationsByDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} maxBarSize={120} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </section>

      {/* Métrica 2: Top 5 juegos más cortos */}
      <section className="rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={<Trophy className="h-4 w-4 text-fama" />}
          title="Top 5 partidas ganadas con menos intentos"
          subtitle="Métrica 2 · top5ShortestGames"
        />
        <div className="px-5 pb-5 pt-1">
          {top5.length === 0 ? (
            <EmptyState text="Todavía no hay partidas finalizadas para rankear." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Jugador</th>
                    <th className="px-4 py-3 font-medium">Partida</th>
                    <th className="px-4 py-3 text-right font-medium">Intentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {top5.map((game, idx) => (
                    <tr key={game.gameId} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${topPalette[idx % topPalette.length]}22`,
                            color: topPalette[idx % topPalette.length],
                          }}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{game.playerName}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground tabular-nums">#{game.gameId}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-fama/15 px-2.5 py-1 text-xs font-semibold tabular-nums text-fama">
                          {game.totalAttempts}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Métrica 3: Intentos por juego */}
      <section className="rounded-2xl border border-border bg-card">
        <SectionHeader
          icon={<BarChart3 className="h-4 w-4 text-pica" />}
          title="Intentos de adivinanza por partida"
          subtitle="Métrica 3 · attemptsPerGame"
        />
        <div className="px-3 pb-5 pt-2 sm:px-5">
          {data.attemptsPerGame.length === 0 ? (
            <EmptyState text="Sin partidas registradas para graficar." />
          ) : (
            <ChartContainer config={attemptsConfig} className="h-[260px] w-full">
              <LineChart
                data={data.attemptsPerGame.map((g) => ({ ...g, label: `#${g.gameId}` }))}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="attemptsCount"
                  stroke="var(--color-attemptsCount)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-attemptsCount)" }}
                  activeDot={{ r: 6 }}
                >
                  {data.attemptsPerGame.map((g) => (
                    <Cell key={g.gameId} />
                  ))}
                </Line>
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </section>

      <div className="flex justify-center pt-1">
        <Button onClick={load} size="sm" variant="ghost" className="text-muted-foreground">
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar métricas
        </Button>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: "primary" | "fama" | "pica"
  highlight?: boolean
}) {
  const accentText = accent === "primary" ? "text-primary" : accent === "fama" ? "text-fama" : "text-pica"
  const accentBg = accent === "primary" ? "bg-primary/15" : accent === "fama" ? "bg-fama/15" : "bg-pica/15"
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border bg-card p-5 ${
        highlight ? "border-primary/40" : "border-border"
      }`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentBg} ${accentText}`}>{icon}</div>
      <div>
        <p className={`tabular-nums font-bold tracking-tight ${highlight ? "text-4xl" : "text-3xl"} ${accentText}`}>
          {value}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-4">
      {icon}
      <div>
        <h3 className="text-sm font-semibold leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-12 text-center text-sm text-muted-foreground">{text}</p>
}
