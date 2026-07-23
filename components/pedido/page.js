/============================================
============================================

const toppingsConMultiplicador = [
    { id: 'pepperoni', nombre: 'Pepperoni', precio: 2.00, unidades: 1 },
    { id: 'champinones', nombre: 'Champiñones', precio: 1.50, unidades: 1 },
    { id: 'aceitunas', nombre: 'Aceitunas', precio: 1.00, unidades: 1 },
    { id: 'jamon', nombre: 'Jamón', precio: 1.50, unidades: 1 },
    { id: 'pina', nombre: 'Piña', precio: 1.50, unidades: 1 },
    { id: 'carne_desmechada', nombre: 'Carne Desmechada', precio: 2.50, unidades: 1 },
    { id: 'tocineta', nombre: 'Tocineta', precio: 2.00, unidades: 1 },
]

// Multiplicador de toppings
const multiplicadores = [1, 2, 3, 4, 5]

// En el renderizado del configurador, reemplazar la sección de toppings por:

<div>
    <p className="font-medium text-sm mb-2">
        🧀 Acompañamientos (máx {limiteToppings}):
        <span className="text-orange-600 ml-2">
            {pizzaSeleccion.toppings.length}/{limiteToppings}
        </span>
    </p>
    <div className="grid grid-cols-1 gap-2">
        {toppingsConMultiplicador.map(t => {
            const selected = pizzaSeleccion.toppings.find(t2 => t2.id === t.id)
            const cantidad = selected?.cantidad || 0
            return (
                <div key={t.id} className="flex items-center gap-2 bg-white rounded-lg border p-2">
                    <button
                        onClick={() => {
                            if (selected) {
                                // Si ya está seleccionado, aumentar cantidad o quitar
                                if (selected.cantidad >= 5) {
                                    setPizzaSeleccion(prev => ({
                                        ...prev,
                                        toppings: prev.toppings.filter(t2 => t2.id !== t.id)
                                    }))
                                } else {
                                    setPizzaSeleccion(prev => ({
                                        ...prev,
                                        toppings: prev.toppings.map(t2 =>
                                            t2.id === t.id
                                                ? { ...t2, cantidad: t2.cantidad + 1 }
                                                : t2
                                        )
                                    }))
                                }
                            } else {
                                // Agregar nuevo topping
                                if (pizzaSeleccion.toppings.length >= limiteToppings) {
                                    alert(`⚠️ Máximo ${limiteToppings} toppings para ${pizzaSeleccion.tamanio?.nombre || 'este tamaño'}`)
                                    return
                                }
                                setPizzaSeleccion(prev => ({
                                    ...prev,
                                    toppings: [...prev.toppings, { ...t, cantidad: 1 }]
                                }))
                            }
                        }}
                        className={`flex-1 flex items-center justify-between p-2 rounded-lg transition-all ${
                            selected ? 'bg-orange-50 border-orange-300' : 'hover:bg-gray-50'
                        }`}
                    >
                        <span className="font-medium">{t.nombre}</span>
                        <div className="flex items-center gap-2">
                            {selected && (
                                <span className="text-sm text-orange-600 font-bold">
                                    x{cantidad}
                                </span>
                            )}
                            <span className="text-sm text-gray-500">+${(t.precio * (selected?.cantidad || 1)).toFixed(2)}</span>
                        </div>
                    </button>
                    {selected && (
                        <div className="flex items-center gap-1">
                            {multiplicadores.map(m => (
                                <button
                                    key={m}
                                    onClick={() => {
                                        setPizzaSeleccion(prev => ({
                                            ...prev,
                                            toppings: prev.toppings.map(t2 =>
                                                t2.id === t.id
                                                    ? { ...t2, cantidad: m }
                                                    : t2
                                            )
                                        }))
                                    }}
                                    className={`w-7 h-7 rounded-full text-xs font-medium transition-all ${
                                        cantidad === m
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setPizzaSeleccion(prev => ({
                                        ...prev,
                                        toppings: prev.toppings.filter(t2 => t2.id !== t.id)
                                    }))
                                }}
                                className="w-7 h-7 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center text-xs"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            )
        })}
    </div>
</div>