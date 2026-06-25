'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginForm() {
    // Estados para manejar el formulario
    const [usuario, setUsuario] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    
    // Router para redirigir después del login
    const router = useRouter()

    // Función que se ejecuta cuando se envía el formulario
    const handleSubmit = async (e) => {
        e.preventDefault() // Evita que la página se recargue
        setCargando(true)
        setError('')

        try {
            // 1. Buscar el usuario en la base de datos
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('usuario', usuario)
                .eq('contrasena', contrasena)
                .single()

            // 2. Verificar si hay error o no se encontró el usuario
            if (userError || !userData) {
                throw new Error('Usuario o contraseña incorrectos')
            }

            // 3. Verificar si el usuario está activo
            if (!userData.activo) {
                throw new Error('Usuario desactivado. Contacta al administrador.')
            }

            // 4. ¡Éxito! Guardar usuario en localStorage
            localStorage.setItem('usuario', JSON.stringify(userData))
            
            // 5. Redirigir al dashboard
            router.push('/dashboard')
            
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🍕</div>
                    <h1 className="text-3xl font-bold text-gray-800">Pizzería POS</h1>
                    <p className="text-gray-600 mt-2">Sistema de punto de venta</p>
                </div>

                {/* Formulario de login */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Mensaje de error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                            ❌ {error}
                        </div>
                    )}

                    {/* Campo: Usuario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            👤 Usuario
                        </label>
                        <input
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Ingresa tu usuario"
                            required
                        />
                    </div>

                    {/* Campo: Contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🔒 Contraseña
                        </label>
                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Ingresa tu contraseña"
                            required
                        />
                    </div>

                    {/* Botón de enviar */}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cargando ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
                    </button>
                </form>

                {/* Credenciales de prueba */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-600 mb-2">
                        🔑 Credenciales de prueba:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="font-medium">Admin:</span><br />
                            usuario: <span className="font-mono">admin</span><br />
                            contraseña: <span className="font-mono">admin123</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="font-medium">Empleado:</span><br />
                            usuario: <span className="font-mono">juan</span><br />
                            contraseña: <span className="font-mono">empleado123</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}