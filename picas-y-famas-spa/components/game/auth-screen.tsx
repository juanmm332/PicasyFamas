"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Target, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError, login, register, setToken } from "@/lib/game-api"

interface AuthScreenProps {
  onAuthenticated: () => void
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [loading, setLoading] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register state
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [edad, setEdad] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error("Completa email y contraseña.")
      return
    }
    setLoading(true)
    try {
      const res = await login({ email: loginEmail.trim(), password: loginPassword })
      if (!res?.token) throw new ApiError("La respuesta no incluyó un token válido.", 200)
      setToken(res.token)
      toast.success(res.message || "¡Bienvenido de nuevo!")
      onAuthenticated()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim() || !edad.trim() || !regEmail.trim() || !regPassword.trim()) {
      toast.error("Todos los campos son obligatorios.")
      return
    }
    const edadNum = Number(edad)
    if (!Number.isInteger(edadNum) || edadNum <= 0) {
      toast.error("Ingresa una edad válida.")
      return
    }
    setLoading(true)
    try {
      const res = await register({
        firstname: nombre.trim(),
        lastname: apellido.trim(),
        age: edadNum,
        email: regEmail.trim(),
        password: regPassword,
      })
      // Some backends return a token on register; if so, log the user straight in.
      if (res?.token) {
        setToken(res.token)
        toast.success(res.message || "¡Cuenta creada! Sesión iniciada.")
        onAuthenticated()
      } else {
        toast.success(res?.message || "¡Cuenta creada! Ahora inicia sesión.")
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-pop-in">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Target className="h-7 w-7" />
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight">Picas y Famas</h1>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Adivina el número secreto de 4 dígitos. Inicia sesión para empezar a jugar.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/30">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="mt-2 font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          {/* REGISTER */}
          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reg-nombre">Nombre</Label>
                  <Input id="reg-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ada" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reg-apellido">Apellido</Label>
                  <Input
                    id="reg-apellido"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Lovelace"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-edad">Edad</Label>
                <Input
                  id="reg-edad"
                  type="number"
                  min={1}
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-password">Contraseña</Label>
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={loading} className="mt-2 font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
