import { supabase } from './supabaseClient'

// ============================================
// 1. CÁLCULO DE INGREDIENTES
// ============================================

export async function calcularIngredientesPizza(tamanioId, saborId, toppingsIds = [], cantidad = 1) {
    try {
        const ingredientes = {}

        // 1.1 Obtener receta base del tamaño
        const { data: recetasBase, error: errorBase } = await supabase
            .from('recetas_base')
            .select(`
                ingrediente_id,
                cantidad_por_porcion,
                ingredientes (nombre, unidad)
            `)
            .eq('tamanio_id', tamanioId)

        if (errorBase) throw errorBase

        // 1.2 Obtener el tamaño para saber las porciones
        const { data: tamanio, error: errorTamanio } = await supabase
            .from('tamanios_pizza')
            .select('porciones')
            .eq('id', tamanioId)
            .single()

        if (errorTamanio) throw errorTamanio

        const porciones = tamanio?.porciones || 1

        // 1.3 Agregar ingredientes base (masa, salsa, queso)
        recetasBase.forEach(item => {
            const nombre = item.ingredientes?.nombre || 'Ingrediente'
            const cantidadTotal = item.cantidad_por_porcion * porciones * cantidad
            if (ingredientes[nombre]) {
                ingredientes[nombre].cantidad += cantidadTotal
            } else {
                ingredientes[nombre] = {
                    cantidad: cantidadTotal,
                    unidad: item.ingredientes?.unidad || 'g',
                    ingrediente_id: item.ingrediente_id
                }
            }
        })

        // 1.4 Si tiene sabor, agregar ingredientes del sabor
        if (saborId) {
            const { data: sabor, error: errorSabor } = await supabase
                .from('sabores_pizza')
                .select('ingredientes_base')
                .eq('id', saborId)
                .single()

            if (errorSabor) throw errorSabor

            if (sabor?.ingredientes_base && Array.isArray(sabor.ingredientes_base)) {
                for (const item of sabor.ingredientes_base) {
                    const nombre = item.nombre || 'Ingrediente'
                    const cantidadTotal = (item.cantidad || 0) * porciones * cantidad
                    if (ingredientes[nombre]) {
                        ingredientes[nombre].cantidad += cantidadTotal
                    } else {
                        ingredientes[nombre] = {
                            cantidad: cantidadTotal,
                            unidad: item.unidad || 'g',
                            ingrediente_id: item.ingrediente_id || null
                        }
                    }
                }
            }
        }

        // 1.5 Agregar toppings
        if (toppingsIds && toppingsIds.length > 0) {
            const { data: toppingsData, error: errorToppings } = await supabase
                .from('toppings')
                .select(`
                    id,
                    nombre,
                    cantidad_por_porcion,
                    precio_extra,
                    ingrediente_id,
                    ingredientes (nombre, unidad)
                `)
                .in('id', toppingsIds)

            if (errorToppings) throw errorToppings

            toppingsData.forEach(item => {
                const nombre = item.ingredientes?.nombre || item.nombre || 'Topping'
                const cantidadTotal = (item.cantidad_por_porcion || 0) * porciones * cantidad
                if (ingredientes[nombre]) {
                    ingredientes[nombre].cantidad += cantidadTotal
                } else {
                    ingredientes[nombre] = {
                        cantidad: cantidadTotal,
                        unidad: item.ingredientes?.unidad || 'g',
                        ingrediente_id: item.ingrediente_id
                    }
                }
            })
        }

        return ingredientes
    } catch (error) {
        console.error('Error calculando ingredientes:', error)
        throw error
    }
}

// ============================================
// 2. VERIFICACIÓN DE STOCK
// ============================================

export async function verificarStock(ingredientes) {
    const errores = []

    for (const [nombre, data] of Object.entries(ingredientes)) {
        if (!data.ingrediente_id) {
            console.warn(`⚠️ Ingrediente ${nombre} sin ID, omitiendo verificación`)
            continue
        }

        const { data: stockData, error } = await supabase
            .from('ingredientes')
            .select('stock_actual, stock_minimo, nombre')
            .eq('id', data.ingrediente_id)
            .single()

        if (error) {
            errores.push(`❌ No se pudo verificar stock de ${nombre}`)
            continue
        }

        if (stockData.stock_actual < data.cantidad) {
            errores.push({
                ingrediente: stockData.nombre,
                disponible: stockData.stock_actual,
                necesario: data.cantidad,
                faltante: data.cantidad - stockData.stock_actual,
                unidad: data.unidad
            })
        }
    }

    return errores
}

// ============================================
// 3. DESCUENTO DE INGREDIENTES
// ============================================

export async function descontarIngredientes(ingredientes, pedidoId, productoMenuId, usuarioId) {
    const resultados = {
        exitosos: [],
        fallidos: []
    }

    for (const [nombre, data] of Object.entries(ingredientes)) {
        if (!data.ingrediente_id) {
            resultados.fallidos.push({
                ingrediente: nombre,
                error: 'Sin ID de ingrediente'
            })
            continue
        }

        try {
            // 3.1 Obtener stock actual
            const { data: stockData, error: stockError } = await supabase
                .from('ingredientes')
                .select('stock_actual')
                .eq('id', data.ingrediente_id)
                .single()

            if (stockError) throw stockError

            const nuevoStock = Math.max(0, stockData.stock_actual - data.cantidad)

            // 3.2 Actualizar stock
            const { error: updateError } = await supabase
                .from('ingredientes')
                .update({ stock_actual: nuevoStock })
                .eq('id', data.ingrediente_id)

            if (updateError) throw updateError

            // 3.3 Registrar movimiento
            const { error: movError } = await supabase
                .from('inventario_movimientos')
                .insert({
                    ingrediente_id: data.ingrediente_id,
                    pedido_id: pedidoId,
                    producto_menu_id: productoMenuId,
                    tipo: 'salida',
                    cantidad: -data.cantidad,
                    motivo: `Venta - Pedido #${pedidoId.slice(0, 8)}`,
                    usuario_id: usuarioId
                })

            if (movError) throw movError

            resultados.exitosos.push({
                ingrediente: nombre,
                cantidad: data.cantidad,
                nuevoStock: nuevoStock
            })

        } catch (error) {
            console.error(`Error descontando ${nombre}:`, error)
            resultados.fallidos.push({
                ingrediente: nombre,
                error: error.message
            })
        }
    }

    return resultados
}

// ============================================
// 4. DESCUENTO DE PRODUCTOS SIMPLES
// ============================================

export async function descontarStockProductoSimple(productoMenuId, cantidad, pedidoId, usuarioId) {
    try {
        const { data: producto, error: errorProducto } = await supabase
            .from('productos_menu')
            .select('stock, nombre')
            .eq('id', productoMenuId)
            .single()

        if (errorProducto) throw errorProducto

        if (producto.stock < cantidad) {
            return {
                success: false,
                error: `Stock insuficiente de ${producto.nombre}. Disponible: ${producto.stock}, Necesario: ${cantidad}`
            }
        }

        const nuevoStock = producto.stock - cantidad
        const { error: updateError } = await supabase
            .from('productos_menu')
            .update({ stock: nuevoStock })
            .eq('id', productoMenuId)

        if (updateError) throw updateError

        await supabase
            .from('auditoria')
            .insert({
                usuario_id: usuarioId,
                accion: `Descontó ${cantidad} unidades de ${producto.nombre} - Pedido #${pedidoId.slice(0, 8)}`
            })

        return {
            success: true,
            nuevoStock: nuevoStock,
            descontado: cantidad,
            producto: producto.nombre
        }
    } catch (error) {
        console.error('Error descontando stock de producto simple:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

// ============================================
// 5. REPOSICIÓN DE INGREDIENTES
// ============================================

export async function reponerIngredientes(pedidoId, usuarioId) {
    try {
        const { data: movimientos, error } = await supabase
            .from('inventario_movimientos')
            .select('*')
            .eq('pedido_id', pedidoId)
            .eq('tipo', 'salida')

        if (error) throw error

        if (!movimientos || movimientos.length === 0) {
            return { success: true, mensaje: 'No hay movimientos que reponer' }
        }

        const resultados = {
            exitosos: [],
            fallidos: []
        }

        for (const mov of movimientos) {
            try {
                const { data: stockData } = await supabase
                    .from('ingredientes')
                    .select('stock_actual')
                    .eq('id', mov.ingrediente_id)
                    .single()

                const nuevoStock = (stockData?.stock_actual || 0) + Math.abs(mov.cantidad)

                await supabase
                    .from('ingredientes')
                    .update({ stock_actual: nuevoStock })
                    .eq('id', mov.ingrediente_id)

                await supabase
                    .from('inventario_movimientos')
                    .insert({
                        ingrediente_id: mov.ingrediente_id,
                        pedido_id: pedidoId,
                        tipo: 'entrada',
                        cantidad: Math.abs(mov.cantidad),
                        motivo: `Reposición - Pedido #${pedidoId.slice(0, 8)} cancelado`,
                        usuario_id: usuarioId
                    })

                resultados.exitosos.push({
                    ingrediente: mov.ingrediente_id,
                    cantidad: Math.abs(mov.cantidad)
                })

            } catch (err) {
                resultados.fallidos.push({
                    ingrediente: mov.ingrediente_id,
                    error: err.message
                })
            }
        }

        return {
            success: resultados.fallidos.length === 0,
            resultados
        }

    } catch (error) {
        console.error('Error reponiendo ingredientes:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// 6. OBTENER RESUMEN DE INGREDIENTES DE UN PEDIDO
// ============================================

export async function obtenerResumenIngredientesPedido(pedidoId) {
    try {
        const { data: detalles, error } = await supabase
            .from('pedido_detalles')
            .select(`
                cantidad,
                tamanio_nombre,
                sabor_nombre,
                toppings_seleccionados
            `)
            .eq('pedido_id', pedidoId)

        if (error) throw error

        let resumen = {}

        for (const detalle of detalles) {
            if (detalle.tamanio_nombre) {
                const { data: tamanio } = await supabase
                    .from('tamanios_pizza')
                    .select('id')
                    .eq('nombre', detalle.tamanio_nombre)
                    .single()

                if (!tamanio) continue

                let saborId = null
                if (detalle.sabor_nombre) {
                    const { data: sabor } = await supabase
                        .from('sabores_pizza')
                        .select('id')
                        .eq('nombre', detalle.sabor_nombre)
                        .single()
                    if (sabor) saborId = sabor.id
                }

                const ingredientes = await calcularIngredientesPizza(
                    tamanio.id,
                    saborId,
                    detalle.toppings_seleccionados || [],
                    detalle.cantidad || 1
                )

                for (const [nombre, data] of Object.entries(ingredientes)) {
                    if (resumen[nombre]) {
                        resumen[nombre].cantidad += data.cantidad
                    } else {
                        resumen[nombre] = { ...data }
                    }
                }
            }
        }

        return resumen
    } catch (error) {
        console.error('Error obteniendo resumen de ingredientes:', error)
        return {}
    }
}

// ============================================
// 7. DESCUENTO DE INGREDIENTES POR PEDIDO (ENTREGA)
// ============================================

export async function descontarIngredientesPorPedido(pedidoId, usuarioId) {
    try {
        console.log('🔍 Descontando ingredientes para pedido:', pedidoId)

        const { data: pedido, error: pedidoError } = await supabase
            .from('pedidos')
            .select('id, estado')
            .eq('id', pedidoId)
            .single()

        if (pedidoError) {
            console.error('❌ Error verificando pedido:', pedidoError)
            return { success: false, error: pedidoError.message }
        }

        if (!pedido) {
            console.error('❌ Pedido no encontrado:', pedidoId)
            return { success: false, error: 'Pedido no encontrado' }
        }

        console.log(`✅ Pedido ${pedidoId} encontrado, estado: ${pedido.estado}`)

        const { data: detalles, error: detallesError } = await supabase
            .from('pedido_detalles')
            .select('*')
            .eq('pedido_id', pedidoId)

        if (detallesError) {
            console.error('❌ Error obteniendo detalles:', detallesError)
            return { success: false, error: detallesError.message }
        }

        if (!detalles || detalles.length === 0) {
            console.log('ℹ️ No hay detalles para este pedido')
            return { success: true, mensaje: 'No hay detalles que procesar' }
        }

        console.log(`📦 Encontrados ${detalles.length} detalles`)

        const detallesConTamanio = detalles.filter(d => d.tamanio_nombre)
        
        if (detallesConTamanio.length === 0) {
            console.log('ℹ️ No hay pizzas en este pedido')
            return { success: true, mensaje: 'No hay pizzas en el pedido' }
        }

        console.log(`🍕 ${detallesConTamanio.length} pizzas encontradas`)

        const ingredientesParaDescontar = {}

        for (const detalle of detallesConTamanio) {
            const { data: tamanio, error: tamanioError } = await supabase
                .from('tamanios_pizza')
                .select('id')
                .eq('nombre', detalle.tamanio_nombre)
                .single()

            if (tamanioError) {
                console.warn(`⚠️ No se encontró tamaño: ${detalle.tamanio_nombre}`, tamanioError)
                continue
            }

            let saborId = null
            if (detalle.sabor_nombre) {
                const { data: sabor, error: saborError } = await supabase
                    .from('sabores_pizza')
                    .select('id')
                    .eq('nombre', detalle.sabor_nombre)
                    .single()
                if (!saborError && sabor) {
                    saborId = sabor.id
                }
            }

            const ingredientes = await calcularIngredientesPizza(
                tamanio.id,
                saborId,
                detalle.toppings_seleccionados || [],
                detalle.cantidad || 1
            )

            for (const [nombre, data] of Object.entries(ingredientes)) {
                if (!data.ingrediente_id) continue
                
                if (ingredientesParaDescontar[nombre]) {
                    ingredientesParaDescontar[nombre].cantidad += data.cantidad
                } else {
                    ingredientesParaDescontar[nombre] = {
                        cantidad: data.cantidad,
                        unidad: data.unidad,
                        ingrediente_id: data.ingrediente_id
                    }
                }
            }
        }

        if (Object.keys(ingredientesParaDescontar).length === 0) {
            console.log('ℹ️ No hay ingredientes para descontar')
            return { success: true, mensaje: 'No hay ingredientes para descontar' }
        }

        const erroresStock = await verificarStock(ingredientesParaDescontar)
        if (erroresStock.length > 0) {
            console.warn('⚠️ Stock insuficiente:', erroresStock)
            return { 
                success: false, 
                errores: erroresStock,
                mensaje: 'Stock insuficiente para completar el pedido'
            }
        }

        const resultado = await descontarIngredientes(
            ingredientesParaDescontar,
            pedidoId,
            null,
            usuarioId
        )

        console.log(`✅ Descontados ${resultado.exitosos.length} ingredientes`)
        
        return { 
            success: true, 
            resultado,
            mensaje: `Se descontaron ${resultado.exitosos.length} ingredientes`
        }

    } catch (error) {
        console.error('❌ Error en descontarIngredientesPorPedido:', error)
        return { 
            success: false, 
            error: error.message,
            mensaje: 'Error al descontar ingredientes'
        }
    }
}