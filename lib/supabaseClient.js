import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
})

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export const testConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('count', { count: 'exact', head: true })
        
        if (error) {
            console.error('❌ Error de conexión:', error)
            return { success: false, error }
        }
        console.log('✅ Conexión exitosa a Supabase')
        return { success: true, data }
    } catch (error) {
        console.error('❌ Error en testConnection:', error)
        return { success: false, error }
    }
}