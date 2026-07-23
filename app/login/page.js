'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

export default function LoginPage() {
    const [usuario, setUsuario] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (userData) {
            router.push('/dashboard')
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
            router.push('/dashboard')
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-3 sm:p-4">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 max-w-md w-full">
                <div className="text-center mb-6 sm:mb-8">
                    {/* ============================================
                        LOGO EN LOGIN
                        ============================================ */}
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        <Image
                            src="/images/logo.png"
                            alt="Pizzería POS"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pizzería POS</h1>
                    <p className="text-gray-500 text-xs sm:text-sm">Sistema de punto de venta</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            ❌ {error}
                        </div>
                    )}

                    <div>
                        <label className="input-label">Usuario</label>
                        <input
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            className="input-field"
                            placeholder="admin"
                            required
                        />
                    </div>

                    <div>
                        <label className="input-label">Contraseña</label>
                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="btn-primary w-full justify-center"
                    >
                        {cargando ? 'Cargando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t text-center text-[10px] sm:text-xs text-gray-400">
                    <p>Admin: admin / admin123</p>
                    <p>Empleado: juan / empleado123</p>
                </div>
            </div>
        </div>
    )
}