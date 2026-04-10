import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fit&Fem Studio · Reservas',
  description: 'Reserva tus clases en Fit&Fem Studio, Ocaña',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
