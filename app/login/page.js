'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import { Pizza, User, Lock, Sparkles, Flame } from 'lucide-react'

export default function LoginPage() {
    const [usuario, setUsuario] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            router.push('/comandas')
        }
    }, [router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setCargando(true)
        setError('')

        try {
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('usuario', usuario)
                .eq('contrasena', contrasena)
                .single()

            if (userError || !userData) {
                throw new Error('Usuario o contraseña incorrectos')
            }

            if (!userData.activo) {
                throw new Error('Usuario desactivado. Contacta al administrador.')
            }

            localStorage.setItem('usuario', JSON.stringify(userData))
            router.push('/comandas')
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#0F0F1A] via-[#1A1A2E] to-[#16213E]">
            {/* Partículas de fuego */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-orange-500/30 animate-fire-particles" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-red-500/30 animate-fire-particles" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-10 left-1/2 w-5 h-5 rounded-full bg-yellow-500/20 animate-fire-particles" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-orange-400/40 animate-fire-particles" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute bottom-1/3 left-1/4 w-3 h-3 rounded-full bg-red-400/30 animate-fire-particles" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-10 w-2 h-2 rounded-full bg-yellow-300/40 animate-fire-particles" style={{ animationDelay: '0.8s' }}></div>
                <div className="absolute top-1/4 right-10 w-4 h-4 rounded-full bg-orange-500/25 animate-fire-particles" style={{ animationDelay: '1.2s' }}></div>
            </div>

            {/* Glow principal */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-3xl blur-2xl opacity-40 animate-golden-glow"></div>
                        <div className="relative bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-3xl p-4 shadow-2xl border border-white/10">
                            <div className="relative w-20 h-20 mx-auto">
                                <Image
                                    src="/images/logo.png"
                                    alt="Golden on Fire"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 blur-xl opacity-30 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mt-4">
                        <span className="text-gradient-golden">Golden</span>
                        <span className="text-white"> on </span>
                        <span className="text-gradient-fire">Fire</span>
                    </h1>
                    <p className="text-white/40 mt-2 text-sm">🔥 Sistema de punto de venta</p>
                </div>

                {/* Card de login con glassmorphism */}
                <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm backdrop-blur-sm">
                                ❌ {error}
                            </div>
                        )}

                        <div>
                            <label className="input-label">👤 Usuario</label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="Ingresa tu usuario"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">🔒 Contraseña</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="password"
                                    value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="Ingresa tu contraseña"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="btn-golden w-full justify-center text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cargando ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Iniciando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Flame size={18} />
                                    Iniciar Sesión
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Credenciales */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-center text-sm text-white/30 mb-3">🔑 Credenciales de prueba</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="glass rounded-xl p-3 text-center border border-white/5">
                                <span className="text-white/60 font-medium">Admin</span>
                                <p className="text-white/30 font-mono mt-1">admin</p>
                                <p className="text-white/30 font-mono">admin123</p>
                            </div>
                            <div className="glass rounded-xl p-3 text-center border border-white/5">
                                <span className="text-white/60 font-medium">Empleado</span>
                                <p className="text-white/30 font-mono mt-1">juan</p>
                                <p className="text-white/30 font-mono">empleado123</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}