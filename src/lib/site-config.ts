/**
 * Datos de contacto y marca en un solo lugar.
 *
 * Antes vivían duplicados y CONTRADICTORIOS en tres archivos:
 *   - app/page.tsx        → +506 2222-3333 · pedidos@tastyfood.cr · 7:00-16:00
 *   - components/Layout.tsx → (123) 456-7890 · info@tastyfood.com · 11:00-22:00
 *   - texto suelto en el footer
 *
 * Se tomaron como buenos los de page.tsx por ser los más completos.
 * REVISAR: el teléfono tiene prefijo +506 (Costa Rica) y el dominio es .cr,
 * pero la dirección es ULEAM, Manta (Ecuador). Corregir aquí y se propaga
 * a todas las pantallas.
 */
export const SITE = {
  name: 'TastyFood',
  tagline: 'Sabores de Manabí, servidos desde el futuro',
  since: 2010,
  phone: '+506 2222-3333',
  email: 'pedidos@tastyfood.cr',
  address: 'ULEAM, Manta',
  hours: [{ days: 'Lunes a Viernes', time: '7:00 - 16:00' }],
  social: {
    facebook: '#',
    instagram: '#',
    twitter: '#',
  },
} as const;
