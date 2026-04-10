'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './MisReservasClient.module.css'

type Reserva = {
  id: string
  estado: string
  created_at: string
  cancelada_at: string | null
  sesiones: {
    id: string
    fecha: string
    cancelada: boolean
    clases: {
      hora_inicio: string
      hora_fin: string
      plazas_max: number
      modalidades: { nombre: string }
    } | null
  } | null
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

export default function MisReservasClient({
  reservas, horasCancelacion, userId
}: { reservas: Reserva[]; horasCancelacion: number; userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'futuras' | 'historial'>('futuras')
  const [cancelling, setCancelling] = useState<string | null>(null)

  const ahora = new Date()
  const futuras = reservas.filter(r => {
    if (!r.sesiones?.fecha) return false
    const fecha = new Date(r.sesiones.fecha + 'T00:00:00')
    return fecha >= ahora && r.estado !== 'cancelada'
  })
  const historial = reservas.filter(r => {
    if (!r.sesiones?.fecha) return false
    const fecha = new Date(r.sesiones.fecha + 'T00:00:00')
    return fecha < ahora || r.estado === 'cancelada'
  })

  function puedeCancelar(r: Reserva): boolean {
    if (!r.sesiones?.fecha || !r.sesiones?.clases) return false
    if (r.estado !== 'confirmada') return false
    const inicioClase = new Date(r.sesiones.fecha + 'T' + r.sesiones.clases.hora_inicio)
    const diffHoras = (inicioClase.getTime() - Date.now()) / 3600000
    return diffHoras >= horasCancelacion
  }

  async function handleCancelar(reservaId: string) {
    setCancelling(reservaId)
    await supabase.from('reservas').update({
      estado: 'cancelada',
      cancelada_at: new Date().toISOString()
    }).eq('id', reservaId)
    setCancelling(null)
    router.refresh()
  }

  function formatFecha(fecha: string) {
    const d = new Date(fecha + 'T00:00:00')
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
  }

  const lista = tab === 'futuras' ? futuras : historial

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mis Reservas</h1>

      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button className={`tab ${tab === 'futuras' ? 'active' : ''}`} onClick={() => setTab('futuras')}>
          Próximas ({futuras.length})
        </button>
        <button className={`tab ${tab === 'historial' ? 'active' : ''}`} onClick={() => setTab('historial')}>
          Historial ({historial.length})
        </button>
      </div>

      {lista.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>{tab === 'futuras' ? '📅' : '📋'}</p>
          <p className={styles.emptyText}>
            {tab === 'futuras' ? 'No tienes reservas próximas' : 'Sin historial de reservas'}
          </p>
          {tab === 'futuras' && (
            <a href="/horario" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              Ver horario
            </a>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {lista.map(r => {
            if (!r.sesiones?.clases) return null
            const mod = r.sesiones.clases.modalidades?.nombre || ''
            const hora = r.sesiones.clases.hora_inicio.substring(0, 5)
            const horaFin = r.sesiones.clases.hora_fin.substring(0, 5)
            const cancelable = puedeCancelar(r)

            const estadoBadge: Record<string, string> = {
              confirmada: 'badge-success',
              espera: 'badge-warning',
              cancelada: 'badge-muted',
              completada: 'badge-secondary',
              cancelacion_tardia: 'badge-error',
            }

            const estadoLabel: Record<string, string> = {
              confirmada: '✓ Confirmada',
              espera: '⏳ En espera',
              cancelada: '✕ Cancelada',
              completada: '★ Completada',
              cancelacion_tardia: '⚠ Cancelación tardía',
            }

            return (
              <div key={r.id} className={styles.item}>
                <div className={styles.itemLeft}>
                  <div className={styles.fechaBox}>
                    <span className={styles.fechaDia}>
                      {new Date(r.sesiones.fecha + 'T00:00:00').getDate()}
                    </span>
                    <span className={styles.fechaMes}>
                      {MESES[new Date(r.sesiones.fecha + 'T00:00:00').getMonth()]}
                    </span>
                  </div>
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemName}>{mod}</div>
                  <div className={styles.itemTime}>⏰ {hora}–{horaFin}</div>
                </div>
                <div className={styles.itemRight}>
                  <span className={`badge ${estadoBadge[r.estado] || 'badge-muted'}`}>
                    {estadoLabel[r.estado] || r.estado}
                  </span>
                  {cancelable && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-error)', fontSize: 'var(--font-xs)' }}
                      onClick={() => handleCancelar(r.id)}
                      disabled={cancelling === r.id}
                    >
                      {cancelling === r.id ? <span className="spinner spinner-dark" style={{ width: 14, height: 14 }} /> : 'Cancelar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
