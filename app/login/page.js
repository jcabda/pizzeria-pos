'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Flame, Sparkles, Shield, User, Lock } from 'lucide-react'

export default function LoginPage() {
    const [usuario, setUsuario] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            router.push('/comandas')
        }
    }, [router])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)

        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('usuario', usuario.toLowerCase())
                .eq('contrasena', contrasena)
                .eq('activo', true)
                .single()

            if (error || !data) {
                setError('❌ Usuario o contraseña incorrectos')
                setCargando(false)
                return
            }

            localStorage.setItem('usuario', JSON.stringify(data))
            router.push('/comandas')
        } catch (err) {
            setError('❌ Error al iniciar sesión')
            setCargando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A12] via-[#12121E] to-[#1A1A2E] p-4">
            {/* Fondo animado con partículas */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-golden/5 rounded-full blur-3xl animate-pulse delay-500"></div>
                
                {/* Partículas flotantes */}
                <div className="absolute top-10 left-10 text-4xl animate-float opacity-20">🔥</div>
                <div className="absolute bottom-20 right-20 text-4xl animate-float delay-700 opacity-20">⭐</div>
                <div className="absolute top-1/3 right-10 text-3xl animate-float delay-500 opacity-20">✨</div>
                <div className="absolute bottom-1/3 left-10 text-3xl animate-float delay-300 opacity-20">🍕</div>
            </div>

            <div className="glass-golden rounded-2xl p-8 md:p-10 max-w-md w-full border border-golden/30 relative z-10 animate-fade-in-up">
                {/* Logo y título */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-28 h-28 mb-4">
                        <img 
                            src="/images/logo.png" 
                            alt="Golden on Fire" 
                            className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 blur-2xl opacity-20 animate-pulse"></div>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold text-center">
                        <span className="text-gradient-golden">Golden</span>
                        <span className="text-white"> on </span>
                        <span className="text-gradient-fire">Fire</span>
                    </h1>
                    <p className="text-sm text-white/40 mt-2 flex items-center gap-2">
                        <Flame size={14} className="text-golden" />
                        Sistema de punto de venta
                        <Flame size={14} className="text-golden" />
                    </p>
                    
                    <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-golden to-transparent mt-4"></div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm text-center animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="input-label flex items-center gap-2">
                            <User size={14} />
                            Usuario
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                className="input-field pl-10"
                                placeholder="Ingresa tu usuario"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="input-label flex items-center gap-2">
                            <Lock size={14} />
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="password"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                className="input-field pl-10"
                                placeholder="Ingresa tu contraseña"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="btn-golden w-full justify-center text-base py-3.5 mt-2"
                    >
                        {cargando ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Iniciando...
                            </>
                        ) : (
                            <>
                                <Flame size={18} />
                                Iniciar Sesión
                            </>
                        )}
                    </button>

                    <div className="text-center text-xs text-white/30 mt-6 pt-4 border-t border-white/5">
                        <p className="text-white/40 text-sm font-medium mb-2">🔑 Credenciales de prueba</p>
                        <div className="flex justify-center gap-6">
                            <div>
                                <span className="text-golden font-medium">admin</span>
                                <span className="text-white/30"> / </span>
                                <span className="text-golden font-medium">admin123</span>
                            </div>
                            <div className="text-white/20">|</div>
                            <div>
                                <span className="text-golden font-medium">juan</span>
                                <span className="text-white/30"> / </span>
                                <span className="text-golden font-medium">empleado123</span>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-white/20 flex items-center justify-center gap-2">
                    <Shield size={12} />
                    Golden on Fire v1.0
                    <Shield size={12} />
                </div>
            </div>
        </div>
    )
}