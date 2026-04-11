'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './BookingModal.module.css'

type Sesion = {
  id: string
  fecha: string
  plazas_ocupadas: number
  clases: {
    hora_inicio: string
    hora_fin: string
    plazas_max: number
    monitora: string | null
    modalidades: { id: string; nombre: string }
  } | null
}

interface Props {
  sesion: Sesion
  userId: string
  estado: string
  onClose: () => void
  onSuccess: () => void
}

const DIAS_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

export default function BookingModal({ sesion, userId, estado, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!sesion.clases) return null

  const fechaObj = new Date(sesion.fecha + 'T00:00:00')
  const fechaLabel = `${DIAS_ES[fechaObj.getDay()]} ${fechaObj.getDate()} de ${MESES_ES[fechaObj.getMonth()]}`
  const hora = sesion.clases.hora_inicio.substring(0, 5)
  const horaFin = sesion.clases.hora_fin.substring(0, 5)
  const mod = sesion.clases.modalidades?.nombre || ''
  const plazasLibres = sesion.clases.plazas_max - sesion.plazas_ocupadas
  const esEspera = estado === 'espera' || plazasLibres <= 0

  async function handleReserva() {
    setError('')
    setLoading(true)

    const { error: err } = await supabase.from('reservas').insert({
      user_id: userId,
      sesion_id: sesion.id,
      estado: esEspera ? 'espera' : 'confirmada',
    })

    if (err) {
      if (err.code === '23505') {
        setError('Ya tienes una reserva para esta clase.')
      } else {
        setError('Error al realizar la reserva. Inténtalo de nuevo.')
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(onSuccess, 1500)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className={styles.modalBadge}>{mod}</div>
          <h2 className={styles.modalTitle}>
            {esEspera ? 'Apuntarse a lista de espera' : 'Confirmar reserva'}
          </h2>
        </div>

        <div className="modal-body">
          {success ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>✅</div>
              <h3>{esEspera ? '¡Apuntada a la lista!' : '¡Reserva confirmada!'}</h3>
              <p>{esEspera ? 'Te avisaremos si se libera una plaza.' : 'Te hemos enviado un email de confirmación.'}</p>
            </div>
          ) : (
            <>
              <div className={styles.info}>
                <div className={styles.infoRow}>
                  <span className={styles.infoIcon}>📅</span>
                  <div>
                    <p className={styles.infoLabel}>Día</p>
                    <p className={styles.infoValue} style={{ textTransform: 'capitalize' }}>{fechaLabel}</p>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoIcon}>⏰</span>
                  <div>
                    <p className={styles.infoLabel}>Horario</p>
                    <p className={styles.infoValue}>{hora} – {horaFin}</p>
                  </div>
                </div>
                {sesion.clases.monitora && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoIcon}>👩‍🏫</span>
                    <div>
                      <p className={styles.infoLabel}>Monitora</p>
                      <p className={styles.infoValue}>{sesion.clases.monitora}</p>
                    </div>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.infoIcon}>🪑</span>
                  <div>
                    <p className={styles.infoLabel}>Plazas disponibles</p>
                    <p className={styles.infoValue}>
                      {plazasLibres <= 0 ? (
                        <span style={{ color: '#EF4444' }}>Lista de espera</span>
                      ) : `${plazasLibres} plazas libres`}
                    </p>
                  </div>
                </div>
              </div>

              {esEspera && (
                <div className="alert alert-warning" style={{ marginTop: 'var(--space-4)' }}>
                  <span>⚠️</span>
                  <span>La clase está llena. Te apuntarás a la lista de espera. Recibirás un aviso si se libera una plaza.</span>
                </div>
              )}

              {error && (
                <div className="alert alert-error" style={{ marginTop: 'var(--space-4)' }}>
                  <span>⚠</span><span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {!success && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleReserva}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Reservando...' : esEspera ? 'Apuntarme a espera' : 'Confirmar reserva'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
