// API client for the "Picas y Famas" .NET 8 backend.
// The base URL can be overridden with NEXT_PUBLIC_API_BASE_URL.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://localhost:7272"

// ---------- Storage keys ----------
const TOKEN_KEY = "pf_token"
const GAME_KEY = "pf_game"

// ---------- Types ----------
export interface RegisterPayload {
  firstname: string
  lastname: string
  age: number
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  message?: string
}

export interface StartResponse {
  message: string
  gameId: number
}

export interface GuessResponse {
  gameId: number
  message: string
  isFinished: boolean
}

export interface GuessRow {
  id: string
  number: string
  message: string
  famas: number | null
  picas: number | null
  isFinished: boolean
}

export interface PersistedGame {
  gameId: number
  history: GuessRow[]
  finished: boolean
}

// ---------- Metrics / Dashboard (BONUS) ----------
export interface UsersByDay {
  day: string
  count: number
}

export interface TopGame {
  gameId: number
  playerName: string
  totalAttempts: number
}

export interface GameAttemptsDetail {
  gameId: number
  attemptsCount: number
}

export interface DashboardMetrics {
  registrationsByDay: UsersByDay[]
  top5ShortestGames: TopGame[]
  attemptsPerGame: GameAttemptsDetail[]
  averageAttemptsGlobal: number
}

// Custom error carrying the HTTP status and any parsed body.
export class ApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

// ---------- Session helpers ----------
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

export function getPersistedGame(): PersistedGame | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(GAME_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PersistedGame
  } catch {
    return null
  }
}

export function setPersistedGame(game: PersistedGame | null) {
  if (game) {
    window.localStorage.setItem(GAME_KEY, JSON.stringify(game))
  } else {
    window.localStorage.removeItem(GAME_KEY)
  }
}

// ---------- Core fetch wrapper ----------
async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth, headers, ...rest } = options
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  }

  if (auth) {
    const token = getToken()
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers: finalHeaders })
  } catch {
    throw new ApiError(
      `No se pudo conectar con el servidor (${API_BASE_URL}). Verifica que el backend esté en ejecución y que el certificado HTTPS sea de confianza.`,
      0,
    )
  }

  // Try to parse a JSON body; tolerate empty/non-JSON responses.
  let body: unknown = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body && (body as { message?: string }).message) ||
      (typeof body === "string" && body) ||
      defaultMessageForStatus(res.status)
    throw new ApiError(message as string, res.status, body)
  }

  return body as T
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Solicitud inválida."
    case 401:
      return "Tu sesión expiró o no es válida. Inicia sesión nuevamente."
    case 403:
      return "No tienes permiso para realizar esta acción."
    case 404:
      return "Recurso no encontrado."
    case 500:
      return "Error interno del servidor."
    default:
      return `Ocurrió un error inesperado (código ${status}).`
  }
}

// ---------- Endpoints ----------
export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/api/Game/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/api/Game/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function startGame(): Promise<StartResponse> {
  return request<StartResponse>("/api/Game/start", {
    method: "POST",
    auth: true,
  })
}

export function sendGuess(gameId: number, number: string): Promise<GuessResponse> {
  return request<GuessResponse>(`/api/Game/guess/${gameId}`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ number }),
  })
}

// Fetches the consolidated dashboard metrics (BONUS section).
export function getDashboardMetrics(): Promise<DashboardMetrics> {
  return request<DashboardMetrics>("/api/Metrics/dashboard", {
    method: "GET",
    auth: true,
  })
}

// ---------- Helpers ----------
// Extracts "Famas" and "Picas" counts from the API message, e.g. "Famas: 1, Picas: 2".
export function parseResult(message: string): { famas: number | null; picas: number | null } {
  const famaMatch = message.match(/famas?\s*[:=]?\s*(\d+)/i)
  const picaMatch = message.match(/picas?\s*[:=]?\s*(\d+)/i)
  return {
    famas: famaMatch ? Number(famaMatch[1]) : null,
    picas: picaMatch ? Number(picaMatch[1]) : null,
  }
}

// Pulls a gameId out of a 400 "active game" error body, if present.
export function extractGameId(body: unknown): number | null {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>
    for (const key of ["gameId", "GameId", "id", "Id"]) {
      const val = obj[key]
      if (typeof val === "number") return val
      if (typeof val === "string" && /^\d+$/.test(val)) return Number(val)
    }
  }
  return null
}

// Strict validation: exactly 4 digits, no repeats.
export function validateGuess(value: string): string | null {
  if (!/^\d{4}$/.test(value)) {
    return "Debe ingresar exactamente 4 dígitos numéricos."
  }
  if (new Set(value.split("")).size !== 4) {
    return "Los 4 dígitos deben ser distintos (sin repetidos)."
  }
  return null
}
