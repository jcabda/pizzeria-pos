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
            unidades: false,
            cocina: false // ✅ NUEVO PERMISO
        }
    })

    const AVATARS = ['👤', '🍕', '🚀', '🍔', '👨‍🍳', '👩‍🍳', '⭐', '💪', '🎯', '🔥', '👑', '🦁', '🐉', '🌟']

    // ✅ NUEVO: PERMISO COCINA AGREGADO
    const PERMISOS_LIST = [
        { key: 'productos', label: '🍕 Productos' },
        { key: 'inventario', label: '🧂 Inventario' },
        { key: 'categorias', label: '📂 Categorías' },
        { key: 'usuarios', label: '👥 Usuarios' },
        { key: 'auditoria', label: '📋 Auditoría' },
        { key: 'tamanios', label: '📏 Tamaños' },
        { key: 'tipos', label: '🏷️ Tipos' },
        { key: 'unidades', label: '📐 Unidades' },
        { key: 'cocina', label: '👨‍🍳 Cocina' } // ✅ NUEVO
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
                unidades: false,
                cocina: false
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
                unidades: false,
                cocina: false
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
            admin: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
            empleado: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            inventario: 'bg-green-500/20 text-green-400 border border-green-500/30',
            cocina: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            mesero: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        }
        return badges[rol] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
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
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">
                            <span className="text-gradient-golden">Golden</span>
                            <span className="text-white"> on </span>
                            <span className="text-gradient-fire">Fire</span>
                            <span className="text-white-60"> - Usuarios</span>
                        </h2>
                        <p className="text-sm text-white-40">Gestiona usuarios y permisos del sistema</p>
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
                    <div className="glass-golden rounded-xl p-6 border border-golden/30 animate-fade-in-up">
                        <h3 className="text-lg font-semibold mb-4 text-white">
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
                                                className={`text-2xl p-2 rounded-lg transition-colors ${
                                                    formData.avatar === emoji 
                                                        ? 'bg-golden/20 border-2 border-golden' 
                                                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                                }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {formData.rol !== 'admin' && (
                                <div className="border-t border-white/10 pt-4">
                                    <label className="input-label flex items-center gap-2">
                                        <Shield size={18} />
                                        Permisos de Admin Tools
                                        <span className="text-xs text-white-40 font-normal">
                                            ({getPermisosActivos(formData.permisos)}/{getTotalPermisos()})
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                        {PERMISOS_LIST.map((permiso) => (
                                            <label
                                                key={permiso.key}
                                                className="flex items-center gap-2 p-2 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permisos[permiso.key] || false}
                                                    onChange={() => togglePermiso(permiso.key)}
                                                    className="w-4 h-4 rounded accent-golden"
                                                />
                                                <span className="text-sm text-white-60">{permiso.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-white-40 mt-2">
                                        💡 Los empleados solo pueden acceder a las herramientas de admin que tengan marcadas.
                                    </p>
                                </div>
                            )}

                            {formData.rol === 'admin' && (
                                <div className="border-t border-white/10 pt-4">
                                    <p className="text-sm text-green-400 flex items-center gap-2">
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

                <div className="glass rounded-xl overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Avatar</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Usuario</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Rol</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Permisos</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-white-40 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {cargando ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-white-40">Cargando...</td></tr>
                                ) : usuarios.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8 text-white-40">No hay usuarios registrados</td></tr>
                                ) : (
                                    usuarios.map((usuario) => {
                                        const permisosActivos = getPermisosActivos(usuario.permisos)
                                        const totalPermisos = getTotalPermisos()
                                        const esAdmin = usuario.rol === 'admin'
                                        
                                        return (
                                            <tr key={usuario.id} className={!usuario.activo ? 'opacity-50' : ''}>
                                                <td className="px-4 py-3 text-2xl">{usuario.avatar || '👤'}</td>
                                                <td className="px-4 py-3 font-medium text-white">{usuario.nombre}</td>
                                                <td className="px-4 py-3 text-white-60">{usuario.usuario}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolBadge(usuario.rol)}`}>
                                                        {getRolEmoji(usuario.rol)} {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-white-60">
                                                            {esAdmin ? '✅ Todos' : `${permisosActivos}/${totalPermisos}`}
                                                        </span>
                                                        {!esAdmin && (
                                                            <button
                                                                onClick={() => togglePermisosVisibles(usuario.id)}
                                                                className="text-white-40 hover:text-white-60"
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
                                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                                            : 'bg-white/5 text-white-30 border border-white/5'
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
                                                        usuario.activo 
                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                            : 'bg-white/10 text-white-40 border border-white/10'
                                                    }`}>
                                                        {usuario.activo ? '✅ Activo' : '⏸️ Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 space-x-2">
                                                    {usuario.activo ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditar(usuario)}
                                                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                            >
                                                                <Edit2 size={14} /> Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleEliminar(usuario.id)}
                                                                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                                            >
                                                                <Trash2 size={14} /> Desactivar
                                                            </button>
                                                            <button
                                                                onClick={() => handleEliminarPermanente(usuario.id)}
                                                                className="text-red-600 hover:text-red-500 text-sm flex items-center gap-1 font-bold"
                                                                title="Eliminar permanentemente"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleReactivar(usuario.id)}
                                                                className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                                                            >
                                                                <RefreshCw size={14} /> Reactivar
                                                            </button>
                                                            <button
                                                                onClick={() => handleEliminarPermanente(usuario.id)}
                                                                className="text-red-600 hover:text-red-500 text-sm flex items-center gap-1 font-bold"
                                                                title="Eliminar permanentemente"
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