'use client'

export default function Cart({ items, onRemoveItem, onUpdateQuantity, onClear }) {
    // Calcular el total del carrito
    const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)

    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">🛒</p>
                <p>El carrito está vacío</p>
                <p className="text-sm">Agrega productos desde la lista</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Lista de items en el carrito */}
            {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.nombre}</h4>
                        <p className="text-sm text-gray-500">${item.precio} c/u</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Botón restar */}
                        <button
                            onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            -
                        </button>
                        {/* Cantidad */}
                        <span className="w-8 text-center font-medium">{item.cantidad}</span>
                        {/* Botón sumar */}
                        <button
                            onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            +
                        </button>
                        {/* Botón eliminar */}
                        <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 ml-2 text-lg"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}

            {/* Total y acciones */}
            <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-orange-600">${total.toFixed(2)}</span>
                </div>
                <button
                    onClick={onClear}
                    className="w-full mt-4 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                    🗑️ Vaciar Carrito
                </button>
            </div>
        </div>
    )
}