'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        usuario: '',
        contrasena: '',
        rol: 'empleado',
        avatar: '👤'
    })

    const AVATARS = ['👤', '🍕', '🚀', '🍔', '👨‍🍳', '👩‍🍳', '⭐', '💪', '🎯', '🔥']

    useEffect(() => {
        cargarUsuarios()
    }, [])

    const cargarUsuarios = async () => {
        setCargando(true)
        try {
            const { data } = await supabase
                .from('usuarios')
                .select('*')
                .order('nombre')
            
            setUsuarios(data || [])
        } catch (error) {
            console.error('Error cargando usuarios:', error)
        } finally {
            setCargando(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre || !formData.usuario || !formData.contrasena) {
            alert('Por favor, completa todos los campos requeridos')
            return
        }

        try {
            // Verificar si el usuario ya existe
            const { data: existente } = await supabase
                .from('usuarios')
                .select('id')
                .eq('usuario', formData.usuario)
                .single()

            if (existente) {
                alert('❌ El nombre de usuario ya está en uso')
                return
            }

            const { error } = await supabase
                .from('usuarios')
                .insert({
                    nombre: formData.nombre,
                    usuario: formData.usuario,
                    contrasena: formData.contrasena,
                    rol: formData.rol,
                    avatar: formData.avatar,
                    activo: true
                })

            if (error) throw error
            alert('✅ Usuario creado correctamente')
            setFormData({ nombre: '', usuario: '', contrasena: '', rol: 'empleado', avatar: '👤' })
            setMostrarFormulario(false)
            cargarUsuarios()
        } catch (error) {
            console.error('Error creando usuario:', error)
            alert('❌ Error al crear el usuario')
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return

        try {
            const { error } = await supabase
                .from('usuarios')
                .update({ activo: false })
                .eq('id', id)

            if (error) throw error
            alert('✅ Usuario eliminado correctamente')
            cargarUsuarios()
        } catch (error) {
            console.error('Error eliminando usuario:', error)
            alert('❌ Error al eliminar el usuario')
        }
    }

    const handleReactivar = async (id) => {
        try {
            const { error } = await supabase
                .from('usuarios')
                .update({ activo: true })
                .eq('id', id)

            if (error) throw error
            alert('✅ Usuario reactivado correctamente')
            cargarUsuarios()
        } catch (error) {
            console.error('Error reactivando usuario:', error)
            alert('❌ Error al reactivar el usuario')
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">👥 Gestión de Usuarios</h2>
                    <button
                        onClick={() => setMostrarFormulario(!mostrarFormulario)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Usuario'}
                    </button>
                </div>

                {/* Formulario */}
                {mostrarFormulario && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-orange-200">
                        <h3 className="text-lg font-semibold mb-4">📝 Nuevo Usuario</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Ej: María González"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Usuario *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.usuario}
                                        onChange={(e) => setFormData({...formData, usuario: e.target.value.toLowerCase()})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Ej: maria"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contrasena}
                                        onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Ej: 123456"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rol
                                    </label>
                                    <select
                                        value={formData.rol}
                                        onChange={(e) => setFormData({...formData, rol: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="empleado">👨‍🍳 Empleado</option>
                                        <option value="admin">👑 Administrador</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Avatar (elige uno)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {AVATARS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setFormData({...formData, avatar: emoji})}
                                                className={`text-2xl p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                                                    formData.avatar === emoji ? 'bg-orange-100 border-2 border-orange-500' : 'border-2 border-transparent'
                                                }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    💾 Crear Usuario
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMostrarFormulario(false)
                                        setFormData({ nombre: '', usuario: '', contrasena: '', rol: 'empleado', avatar: '👤' })
                                    }}
                                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de usuarios */}
                {cargando ? (
                    <div className="text-center py-8 text-gray-500">Cargando usuarios...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avatar</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {usuarios.map((usuario) => (
                                        <tr key={usuario.id} className={!usuario.activo ? 'bg-gray-50 opacity-60' : ''}>
                                            <td className="px-4 py-3 text-2xl">{usuario.avatar || '👤'}</td>
                                            <td className="px-4 py-3 font-medium">{usuario.nombre}</td>
                                            <td className="px-4 py-3">{usuario.usuario}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    usuario.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {usuario.rol === 'admin' ? '👑 Admin' : '👨‍🍳 Empleado'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    usuario.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {usuario.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 space-x-2">
                                                {usuario.activo ? (
                                                    <button
                                                        onClick={() => handleEliminar(usuario.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Eliminar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivar(usuario.id)}
                                                        className="text-green-600 hover:text-green-800 text-sm"
                                                    >
                                                        Reactivar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {usuarios.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8 text-gray-500">
                                                No hay usuarios registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}