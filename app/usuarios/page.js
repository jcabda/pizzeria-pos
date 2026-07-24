'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Edit2, Trash2, RefreshCw, Check, X, Shield, Eye, EyeOff } from 'lucide-react'

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [permisosVisibles, setPermisosVisibles] = useState({})
    const [formData, setFormData] = useState({
        nombre: '',
        usuario: '',
        contrasena: '',
        rol: 'empleado',
        avatar: '👤',
        permisos: {
            productos: false,
            inventario: false,
            categorias: false,
            usuarios: false,
            auditoria: false,
            tamanios: false,
            tipos: false,
            unidades: false
        }
    })

    const AVATARS = ['👤', '🍕', '🚀', '🍔', '👨‍🍳', '👩‍🍳', '⭐', '💪', '🎯', '🔥', '👑', '🦁', '🐉', '🌟']

    const PERMISOS_LIST = [
        { key: 'productos', label: '🍕 Productos' },
        { key: 'inventario', label: '🧂 Inventario' },
        { key: 'categorias', label: '📂 Categorías' },
        { key: 'usuarios', label: '👥 Usuarios' },
        { key: 'auditoria', label: '📋 Auditoría' },
        { key: 'tamanios', label: '📏 Tamaños' },
        { key: 'tipos', label: '🏷️ Tipos' },
        { key: 'unidades', label: '📐 Unidades' },
    ]

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
            
            // Inicializar visibilidad de permisos
            const visibilidad = {}
            data?.forEach(u => {
                visibilidad[u.id] = false
            })
            setPermisosVisibles(visibilidad)
        } catch (error) {
            console.error('Error cargando usuarios:', error)
        } finally {
            setCargando(false)
        }
    }

    const resetFormulario = () => {
        setFormData({
            nombre: '',
            usuario: '',
            contrasena: '',
            rol: 'empleado',
            avatar: '👤',
            permisos: {
                productos: false,
                inventario: false,
                categorias: false,
                usuarios: false,
                auditoria: false,
                tamanios: false,
                tipos: false,
                unidades: false
            }
        })
        setEditandoId(null)
        setMostrarFormulario(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.nombre || !formData.usuario) {
            alert('Por favor, completa todos los campos requeridos')
            return
        }

        try {
            // Si es admin, todos los permisos son true
            let permisos = { ...formData.permisos }
            if (formData.rol === 'admin') {
                Object.keys(permisos).forEach(key => { permisos[key] = true })
            }

            if (editandoId) {
                const updateData = {
                    nombre: formData.nombre,
                    usuario: formData.usuario,
                    rol: formData.rol,
                    avatar: formData.avatar,
                    permisos: permisos
                }
                if (formData.contrasena) {
                    updateData.contrasena = formData.contrasena
                }

                const { error } = await supabase
                    .from('usuarios')
                    .update(updateData)
                    .eq('id', editandoId)

                if (error) throw error
                alert('✅ Usuario actualizado correctamente')
            } else {
                if (!formData.contrasena) {
                    alert('La contraseña es obligatoria para nuevos usuarios')
                    return
                }

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
                        permisos: permisos,
                        activo: true
                    })

                if (error) throw error
                alert('✅ Usuario creado correctamente')
            }

            resetFormulario()
            cargarUsuarios()
        } catch (error) {
            console.error('Error guardando usuario:', error)
            alert('❌ Error al guardar el usuario: ' + error.message)
        }
    }

    const handleEditar = (usuario) => {
        setEditandoId(usuario.id)
        setFormData({
            nombre: usuario.nombre,
            usuario: usuario.usuario,
            contrasena: '',
            rol: usuario.rol,
            avatar: usuario.avatar || '👤',
            permisos: usuario.permisos || {
                productos: false,
                inventario: false,
                categorias: false,
                usuarios: false,
                auditoria: false,
                tamanios: false,
                tipos: false,
                unidades: false
            }
        })
        setMostrarFormulario(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const togglePermiso = (key) => {
        setFormData(prev => ({
            ...prev,
            permisos: {
                ...prev.permisos,
                [key]: !prev.permisos[key]
            }
        }))
    }

    const togglePermisosVisibles = (userId) => {
        setPermisosVisibles(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }))
    }

    const getPermisosActivos = (permisos) => {
        if (!permisos) return 0
        return Object.values(permisos).filter(v => v === true).length
    }

    const getTotalPermisos = () => {
        return PERMISOS_LIST.length
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de desactivar este usuario?')) return

        try {
            const { error } = await supabase
                .from('usuarios')
                .update({ activo: false })
                .eq('id', id)

            if (error) throw error
            alert('✅ Usuario desactivado correctamente')
            cargarUsuarios()
        } catch (error) {
            console.error('Error desactivando usuario:', error)
            alert('❌ Error al desactivar el usuario')
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

    const handleEliminarPermanente = async (id) => {
        if (!confirm('⚠️ ¿Estás seguro de ELIMINAR PERMANENTEMENTE este usuario? Esta acción NO se puede deshacer.')) return

        try {
            const { error } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', id)

            if (error) throw error
            alert('✅ Usuario eliminado permanentemente')
            cargarUsuarios()
        } catch (error) {
            console.error('Error eliminando usuario:', error)
            alert('❌ Error al eliminar el usuario')
        }
    }

    const getRolBadge = (rol) => {
        const badges = {
            admin: 'bg-purple-100 text-purple-800',
            empleado: 'bg-blue-100 text-blue-800',
            inventario: 'bg-green-100 text-green-800',
            cocina: 'bg-yellow-100 text-yellow-800',
            mesero: 'bg-orange-100 text-orange-800',
        }
        return badges[rol] || 'bg-gray-100 text-gray-800'
    }

    const getRolEmoji = (rol) => {
        const emojis = {
            admin: '👑',
            empleado: '👨‍🍳',
            inventario: '📦',
            cocina: '🔪',
            mesero: '🍽️',
        }
        return emojis[rol] || '👤'
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">
                            <span className="text-golden">Golden</span>
                            <span className="text-fire"> on </span>
                            <span className="text-fire-orange">Fire</span>
                            <span className="text-gray-800"> - Usuarios</span>
                        </h2>
                        <p className="text-sm text-gray-500">Gestiona usuarios y permisos del sistema</p>
                    </div>
                    <button
                        onClick={() => {
                            resetFormulario()
                            setMostrarFormulario(!mostrarFormulario)
                        }}
                        className="btn-golden text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {mostrarFormulario ? 'Cancelar' : 'Nuevo Usuario'}
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-golden animate-fade-in">
                        <h3 className="text-lg font-semibold mb-4">
                            {editandoId ? '✏️ Editar Usuario' : '📝 Nuevo Usuario'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Nombre completo *</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="input-field"
                                        placeholder="Ej: María González"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Usuario *</label>
                                    <input
                                        type="text"
                                        value={formData.usuario}
                                        onChange={(e) => setFormData({...formData, usuario: e.target.value.toLowerCase()})}
                                        className="input-field"
                                        placeholder="Ej: maria"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
                                        Contraseña {editandoId ? '(dejar vacío para no cambiar)' : '*'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contrasena}
                                        onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
                                        className="input-field"
                                        placeholder={editandoId ? 'Nueva contraseña (opcional)' : 'Ej: 123456'}
                                        required={!editandoId}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Rol</label>
                                    <select
                                        value={formData.rol}
                                        onChange={(e) => {
                                            const nuevoRol = e.target.value
                                            setFormData(prev => ({ ...prev, rol: nuevoRol }))
                                        }}
                                        className="input-field"
                                    >
                                        <option value="empleado">👨‍🍳 Empleado</option>
                                        <option value="admin">👑 Administrador</option>
                                        <option value="inventario">📦 Inventario</option>
                                        <option value="cocina">🔪 Cocina</option>
                                        <option value="mesero">🍽️ Mesero</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="input-label">Avatar (elige uno)</label>
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

                            {/* Sección de permisos (solo si no es admin) */}
                            {formData.rol !== 'admin' && (
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="input-label flex items-center gap-2">
                                        <Shield size={18} />
                                        Permisos de Admin Tools
                                        <span className="text-xs text-gray-400 font-normal">
                                            ({getPermisosActivos(formData.permisos)}/{getTotalPermisos()})
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                        {PERMISOS_LIST.map((permiso) => (
                                            <label
                                                key={permiso.key}
                                                className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permisos[permiso.key] || false}
                                                    onChange={() => togglePermiso(permiso.key)}
                                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                                />
                                                <span className="text-sm">{permiso.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {formData.rol === 'empleado' && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            💡 Los empleados solo pueden acceder a las herramientas de admin que tengan marcadas.
                                        </p>
                                    )}
                                </div>
                            )}

                            {formData.rol === 'admin' && (
                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm text-green-600 flex items-center gap-2">
                                        <Check size={18} />
                                        Los administradores tienen acceso a todas las herramientas.
                                    </p>
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                <button type="submit" className="btn-golden">
                                    {editandoId ? '💾 Actualizar' : '💾 Crear Usuario'}
                                </button>
                                <button type="button" onClick={resetFormulario} className="btn-secondary">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avatar</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permisos</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cargando ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">Cargando...</td></tr>
                                ) : usuarios.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No hay usuarios registrados</td></tr>
                                ) : (
                                    usuarios.map((usuario) => {
                                        const permisosActivos = getPermisosActivos(usuario.permisos)
                                        const totalPermisos = getTotalPermisos()
                                        const esAdmin = usuario.rol === 'admin'
                                        
                                        return (
                                            <tr key={usuario.id} className={!usuario.activo ? 'bg-gray-50 opacity-60' : ''}>
                                                <td className="px-4 py-3 text-2xl">{usuario.avatar || '👤'}</td>
                                                <td className="px-4 py-3 font-medium">{usuario.nombre}</td>
                                                <td className="px-4 py-3">{usuario.usuario}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolBadge(usuario.rol)}`}>
                                                        {getRolEmoji(usuario.rol)} {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {esAdmin ? '✅ Todos' : `${permisosActivos}/${totalPermisos}`}
                                                        </span>
                                                        {!esAdmin && (
                                                            <button
                                                                onClick={() => togglePermisosVisibles(usuario.id)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                {permisosVisibles[usuario.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {!esAdmin && permisosVisibles[usuario.id] && usuario.permisos && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {PERMISOS_LIST.map(p => (
                                                                <span
                                                                    key={p.key}
                                                                    className={`text-xs px-1.5 py-0.5 rounded ${
                                                                        usuario.permisos[p.key] 
                                                                            ? 'bg-green-100 text-green-700' 
                                                                            : 'bg-gray-100 text-gray-400'
                                                                    }`}
                                                                >
                                                                    {usuario.permisos[p.key] ? '✅' : '❌'} {p.label.split(' ')[1]}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
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
                                                        <>
                                                            <button
                                                                onClick={() => handleEditar(usuario)}
                                                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                                            >
                                                                <Edit2 size={14} /> Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleEliminar(usuario.id)}
                                                                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                                            >
                                                                <Trash2 size={14} /> Desactivar
                                                            </button>
                                                            <button
                                                                onClick={() => handleEliminarPermanente(usuario.id)}
                                                                className="text-red-800 hover:text-red-950 text-sm flex items-center gap-1 font-bold"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleReactivar(usuario.id)}
                                                                className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                                                            >
                                                                <RefreshCw size={14} /> Reactivar
                                                            </button>
                                                            <button
                                                                onClick={() => handleEliminarPermanente(usuario.id)}
                                                                className="text-red-800 hover:text-red-950 text-sm flex items-center gap-1 font-bold"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}