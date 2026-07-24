'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Shield, Pizza, Package, FolderOpen, Users, FileText, Ruler, Tag, Scale, Utensils, ChefHat } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('usuario')
        if (!userData) {
            router.push('/login')
            return
        }
        const usuario = JSON.parse(userData)
        if (usuario.rol !== 'admin') {
            router.push('/dashboard')
        }
    }, [router])

    const adminModules = [
        { href: '/productos', icon: Pizza, label: 'Productos', desc: 'Gestionar productos del menú' },
        { href: '/inventario', icon: Package, label: 'Inventario', desc: 'Control de ingredientes' },
        { href: '/categorias', icon: FolderOpen, label: 'Categorías', desc: 'Gestionar categorías' },
        { href: '/usuarios', icon: Users, label: 'Usuarios', desc: 'Gestionar empleados' },
        { href: '/auditoria', icon: FileText, label: 'Auditoría', desc: 'Ver historial de acciones' },
        { href: '/mesas', icon: Utensils, label: 'Mesas', desc: 'Gestionar mesas del restaurante' },
        { href: '/admin/tamanios', icon: Ruler, label: 'Tamaños', desc: 'Modificar tamaños de pizza' },
        { href: '/admin/tipos', icon: Tag, label: 'Tipos', desc: 'Gestionar tipos de productos' },
        { href: '/admin/unidades', icon: Scale, label: 'Unidades', desc: 'Gestionar unidades de medida' },
        { href: '/cocina', icon: ChefHat, label: 'Cocina', desc: 'Panel de cocina' },
    ]

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Shield size={32} className="text-golden" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Panel de Administración</h2>
                        <p className="text-sm text-white/40">Gestiona todos los aspectos del sistema</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adminModules.map((mod) => (
                        <Link
                            key={mod.href}
                            href={mod.href}
                            className="glass rounded-xl p-5 border border-white/10 hover:border-golden/30 hover:shadow-golden transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-golden/10 rounded-xl p-3 border border-golden/20">
                                    <mod.icon size={22} className="text-golden" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{mod.label}</h3>
                                    <p className="text-sm text-white/40 mt-0.5">{mod.desc}</p>
                                    <span className="text-xs text-golden group-hover:underline inline-flex items-center gap-1 mt-1">
                                        Gestionar →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="glass-golden rounded-xl p-4 border border-golden/20">
                    <p className="text-sm text-golden/80 flex items-center gap-2">
                        <Shield size={16} />
                        Estas herramientas solo están disponibles para administradores
                    </p>
                </div>
            </div>
        </DashboardLayout>
    )
}