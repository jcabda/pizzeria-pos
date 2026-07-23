

// Configuración de moneda
export const CURRENCY = {
    code: 'COP',
    symbol: '$',
    locale: 'es-CO',
    decimalPlaces: 0,
    thousandsSeparator: '.',
    decimalSeparator: ',',
}

// Formatear precio a COP
export function formatPrice(amount) {
    if (!amount && amount !== 0) return '$0'
    
    const formatter = new Intl.NumberFormat(CURRENCY.locale, {
        style: 'currency',
        currency: CURRENCY.code,
        minimumFractionDigits: CURRENCY.decimalPlaces,
        maximumFractionDigits: CURRENCY.decimalPlaces,
    })
    
    return formatter.format(amount)
}

// Formatear sin símbolo de moneda (para cálculos)
export function formatNumber(amount) {
    if (!amount && amount !== 0) return '0'
    
    return new Intl.NumberFormat(CURRENCY.locale, {
        minimumFractionDigits: CURRENCY.decimalPlaces,
        maximumFractionDigits: CURRENCY.decimalPlaces,
    }).format(amount)
}

// Parsear un string con formato COP a número
export function parsePrice(value) {
    if (typeof value === 'number') return value
    if (!value) return 0
    
    // Limpiar el string
    const clean = String(value)
        .replace(/[$.]/g, '')  // Eliminar $ y .
        .replace(/,/g, '.')     // Convertir , a .
        .trim()
    
    return parseFloat(clean) || 0
}

// Obtener precio base de un producto en COP
export function getPriceInCOP(usdPrice) {
    // Si el precio está en USD, convertir a COP
    // Por ahora asumimos que todos los precios están en COP
    return usdPrice
}