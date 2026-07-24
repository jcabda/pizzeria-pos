export const CURRENCY = {
    code: 'COP',
    symbol: '$',
    locale: 'es-CO',
    decimalPlaces: 0,
    thousandsSeparator: '.',
    decimalSeparator: ',',
}

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

export function formatNumber(amount) {
    if (!amount && amount !== 0) return '0'
    
    return new Intl.NumberFormat(CURRENCY.locale, {
        minimumFractionDigits: CURRENCY.decimalPlaces,
        maximumFractionDigits: CURRENCY.decimalPlaces,
    }).format(amount)
}

export function parsePrice(value) {
    if (typeof value === 'number') return value
    if (!value) return 0
    
    const clean = String(value)
        .replace(/[$.]/g, '')
        .replace(/,/g, '.')
        .trim()
    
    return parseFloat(clean) || 0
}