'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import BookingModal from './BookingModal'
import styles from './HorarioSemanal.module.css'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const ACTIVIDAD_COLORS: Record<string, string> = {
  'Zumba': '#FF0080',
  'Pilates': '#7C3AED',
  'Total Body': '#F59E0B',
  'Beat Training': '#10B981',
  'Barre': '#EC4899',
  'Hipopresivos': '#6B7FD4',
  'TRX': '#F97316',
}

type Sesion = {
  id: string
  fecha: string
  plazas_ocupadas: number
  cancelada: boolean
  clases: {
    id: string
    monitora: string | null
    hora_inicio: string
    hora_fin: string
    plazas_max: number
    dia_semana: number
    modalidades: { id: string; nombre: string }
  } | null
}

type Reserva = { sesion_id: string; estado: string }

interface Props {
  sesiones: Sesion[]
  misReservas: Reserva[]
  userId: string
  profile: {
    pack_id: string | null
    packs: { nombre: string; num_actividades: number; sesiones_semanales: number | null } | null
  } | null
  userModalidadIds: string[]
  config: Record<string, string>
}

export default function HorarioSemanal({ sesiones, misReservas, userId, profile, userModalidadIds, config }: Props) {
  const router = useRouter()
  const [selectedSesion, setSelectedSesion] = useState<Sesion | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [now] = useState(new Date())

  // Lunes de la semana ACTUAL (estricto)
  const lunesActual = useMemo(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    const res = new Date(d)
    res.setDate(d.getDate() + diff)
    res.setHours(0, 0, 0, 0)
    return res
  }, [])

  // Lunes de la semana que estamos VIENDO
  const lunes = useMemo(() => {
    const d = new Date(lunesActual)
    d.setDate(lunesActual.getDate() + (weekOffset * 7))
    return d
  }, [lunesActual, weekOffset])

  // ¿Está la semana siguiente bloqueada?
  const isNextWeekLocked = useMemo(() => {
    if (weekOffset === 0) return false
    
    const diaApertura = parseInt(config['dia_apertura_semana'] || '5') // 5 = Viernes
    const horaApertura = config['hora_apertura_semana'] || '18:00'
    const [h, m] = horaApertura.split(':').map(Number)
    
    // La apertura ocurre en la semana ANTERIOR a la que estamos viendo.
    // Si vemos weekOffset=1, la apertura fue en weekOffset=0.
    const openingDate = new Date(lunesActual)
    openingDate.setDate(lunesActual.getDate() + (diaApertura - 1))
    openingDate.setHours(h, m, 0, 0)
    
    return now < openingDate
  }, [weekOffset, config, lunesActual, now])

  const fechasSemana = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(lunes)
      d.setDate(lunes.getDate() + i)
      return d
    })
  }, [lunes])

  // Mapa por fecha
  const sesionesByFecha = useMemo(() => {
    const map: Record<string, Sesion[]> = {}
    sesiones.forEach(s => {
      const f = s.fecha
      if (!map[f]) map[f] = []
      map[f].push(s)
    })
    return map
  }, [sesiones])

  // Reservas del usuario como set
  const reservasBySessionId = useMemo(() => {
    const map: Record<string, string> = {}
    misReservas.forEach(r => { map[r.sesion_id] = r.estado })
    return map
  }, [misReservas])

  // Modalidades ya reservadas HOY por tipo
  const modalidadesReservadasPorFecha = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    sesiones.forEach(s => {
      if (!s.clases) return
      const modId = s.clases.modalidades?.id
      if (!modId) return
      if (reservasBySessionId[s.id] === 'confirmada') {
        if (!map[s.fecha]) map[s.fecha] = new Set()
        map[s.fecha].add(modId)
      }
    })
    return map
  }, [sesiones, reservasBySessionId])

  // Estado de una sesión para este usuario
  function getEstado(s: Sesion): 'disponible' | 'reservada' | 'espera' | 'no_pack' | 'no_repeticion' | 'completa' | 'semana_cerrada' | 'pasada' {
    if (!s.clases) return 'semana_cerrada'

    // REGLA: ¿La semana está cerrada?
    if (isNextWeekLocked) return 'semana_cerrada'

    // REGLA: ¿La clase ya ha pasado?
    const fechaClase = new Date(`${s.fecha}T${s.clases.hora_inicio}`)
    if (fechaClase < now) return 'pasada'

    const modId = s.clases.modalidades?.id

    // ¿Ya tiene reserva?
    if (reservasBySessionId[s.id] === 'confirmada') return 'reservada'
    if (reservasBySessionId[s.id] === 'espera') return 'espera'

    // Pack permite esta modalidad?
    const esIlimitado = profile?.packs?.num_actividades === 99
    if (!esIlimitado && !userModalidadIds.includes(modId)) return 'no_pack'

    // Regla de no repetición
    if (modalidadesReservadasPorFecha[s.fecha]?.has(modId)) return 'no_repeticion'

    // Completa / lista de espera
    const plazasLibres = s.clases.plazas_max - s.plazas_ocupadas
    if (plazasLibres <= 0) {
      return config['lista_espera_activa'] === 'true' ? 'espera' : 'completa'
    }

    return 'disponible'
  }

  const isPlus = profile?.packs?.num_actividades === 99
  const semanaLabel = `Semana del ${lunes.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`

  return (
    <div className={styles.container}>
      {/* Header Simplificado */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Horario de clases</h1>
          <p className={styles.packBadge}>
            🏋️ Pack: {profile?.packs?.nombre || 'Sin pack'}
          </p>
        </div>

        <div className={styles.weekNav}>
          <button 
            className={`${styles.navBtn} ${weekOffset === 0 ? styles.active : ''}`}
            onClick={() => setWeekOffset(0)}
          >
            Esta semana
          </button>
          <button 
            className={`${styles.navBtn} ${weekOffset === 1 ? styles.active : ''}`}
            onClick={() => setWeekOffset(1)}
          >
            Semana próxima
          </button>
        </div>
      </div>

      <div className={styles.currentWeekLabel}>
        {semanaLabel}
        {isNextWeekLocked && weekOffset === 1 && (
          <span className={styles.lockedWarning}> 🔒 Reservas aún no disponibles</span>
        )}
      </div>

      {/* Grid de días */}
      <div className={styles.grid}>
        {fechasSemana.map((fecha, idx) => {
          const yyyy = fecha.getFullYear()
          const mm = String(fecha.getMonth() + 1).padStart(2, '0')
          const dd = String(fecha.getDate()).padStart(2, '0')
          const fechaStr = `${yyyy}-${mm}-${dd}`
          
          const clasesDia = (sesionesByFecha[fechaStr] || []).sort((a, b) =>
            (a.clases?.hora_inicio || '').localeCompare(b.clases?.hora_inicio || '')
          )
          const esHoy = fecha.toDateString() === new Date().toDateString()

          return (
            <div key={fechaStr} className={`${styles.dayCol} ${esHoy ? styles.today : ''}`}>
              <div className={styles.dayHeader}>
                <span className={styles.dayName}>{DIAS[idx]}</span>
                {esHoy && <span className={styles.todayDot} />}
              </div>

              <div className={styles.clases}>
                {clasesDia.length === 0 ? (
                  <p className={styles.noClases}>Sin clases</p>
                ) : (
                  clasesDia.map(s => {
                    if (!s.clases) return null
                    const estado = getEstado(s)
                    const mod = s.clases.modalidades?.nombre || ''
                    const color = ACTIVIDAD_COLORS[mod] || '#FF0080'
                    const plazasLibres = s.clases.plazas_max - s.plazas_ocupadas

                    return (
                      <ClassCard
                        key={s.id}
                        sesion={s}
                        estado={estado}
                        color={color}
                        plazasLibres={plazasLibres}
                        onClick={() => {
                          if (estado === 'disponible' || estado === 'espera') setSelectedSesion(s)
                        }}
                      />
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className={styles.leyenda}>
        <span><span className={styles.dot} style={{ background: '#FF0080' }} />Disponible</span>
        <span><span className={styles.dot} style={{ background: '#22C55E' }} />Reservada</span>
        <span><span className={styles.dot} style={{ background: '#F59E0B' }} />Lista de espera</span>
        <span><span className={styles.dot} style={{ background: '#EF4444' }} />Completa</span>
        <span><span className={styles.dot} style={{ background: '#9CA3AF' }} />No disponible</span>
      </div>

      {/* Modal de reserva */}
      {selectedSesion && (
        <BookingModal
          sesion={selectedSesion}
          userId={userId}
          estado={getEstado(selectedSesion)}
          onClose={() => setSelectedSesion(null)}
          onSuccess={() => {
            setSelectedSesion(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function ClassCard({
  sesion, estado, color, plazasLibres, onClick
}: {
  sesion: Sesion
  estado: string
  color: string
  plazasLibres: number
  onClick: () => void
}) {
  const mod = sesion.clases?.modalidades?.nombre || ''
  const hora = sesion.clases?.hora_inicio?.substring(0, 5) || ''
  const horaFin = sesion.clases?.hora_fin?.substring(0, 5) || ''
  const plazasMax = sesion.clases?.plazas_max || 22

  const isDisabled = ['no_pack', 'no_repeticion', 'semana_cerrada', 'completa', 'pasada'].includes(estado)
  const isClickable = ['disponible', 'espera'].includes(estado)

  const stateClass: Record<string, string> = {
    disponible: styles.stateDisponible,
    reservada: styles.stateReservada,
    espera: styles.stateEspera,
    no_pack: styles.stateDisabled,
    no_repeticion: styles.stateDisabled,
    completa: styles.stateCompleta,
    semana_cerrada: styles.stateLocked,
    pasada: styles.stateDisabled,
  }

  const tooltip: Record<string, string> = {
    no_pack: 'Esta modalidad no está en tu pack',
    no_repeticion: 'Ya tienes reservada esta modalidad hoy',
    semana_cerrada: 'Reservas aún no disponibles',
    completa: 'Clase completa',
    pasada: 'Esta clase ya ha terminado',
  }

  return (
    <div
      className={`${styles.classCard} ${stateClass[estado] || ''} ${isClickable ? styles.clickable : ''}`}
      style={!isDisabled ? { '--card-color': color } as React.CSSProperties : {}}
      onClick={isClickable ? onClick : undefined}
      title={tooltip[estado] || ''}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && isClickable) onClick() }}
    >
      <div className={styles.cardAccent} style={!isDisabled ? { background: color } : {}} />
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{mod}</div>
        <div className={styles.cardTime}>⏰ {hora}–{horaFin}</div>
        <div className={styles.cardFooter}>
          <span className={styles.cardPlazas}>
            {estado === 'completa' || plazasLibres <= 0 ? (
              <span style={{ color: '#EF4444', fontWeight: 700 }}>COMPLETA</span>
            ) : (
              `${plazasLibres} plazas libres`
            )}
          </span>
          <span className={styles.cardBadge}>
            {estado === 'reservada' && '✓ Reservada'}
            {estado === 'espera' && '⏳ Espera'}
            {estado === 'semana_cerrada' && '🔒'}
            {estado === 'no_pack' && '🚫'}
            {estado === 'no_repeticion' && '⛔'}
          </span>
        </div>
      </div>
    </div>
  )
}
