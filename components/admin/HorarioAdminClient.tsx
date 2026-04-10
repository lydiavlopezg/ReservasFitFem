'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './HorarioAdmin.module.css'

type Modalidad = { id: string; nombre: string }
type Clase = {
  id: string
  modalidad_id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  plazas_max: number
  monitora: string | null
  modalidades: { nombre: string } | null
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function HorarioAdminClient({ clases, modalidades }: { clases: Clase[]; modalidades: Modalidad[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  
  // Form fields
  const [fMod, setFMod] = useState('')
  const [fDia, setFDia] = useState('1')
  const [fInicio, setFInicio] = useState('')
  const [fFin, setFFin] = useState('')
  const [fPlazas, setFPlazas] = useState('15')
  const [fMonitora, setFMonitora] = useState('Ana')

  const [loading, setLoading] = useState(false)

  // Agrupar por día
  const grouped: Record<number, Clase[]> = {}
  DIAS.forEach((_, i) => grouped[i + 1] = [])
  clases.forEach(c => grouped[c.dia_semana].push(c))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('clases').insert({
      modalidad_id: fMod,
      dia_semana: parseInt(fDia),
      hora_inicio: fInicio,
      hora_fin: fFin,
      plazas_max: parseInt(fPlazas),
      monitora: fMonitora
    })

    if (!error) {
      setShowModal(false)
      // Reset form
      setFMod(''); setFInicio(''); setFFin('')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta clase base? Esto no afectará a las sesiones ya generadas en el calendario.')) return
    await supabase.from('clases').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Horario Base (Plantilla)</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva Clase</button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
        <span>ℹ️</span>
        <span>Este es el horario recurrente semanal. Las clases que añadas aquí se generarán automáticamente cada semana con 7 días de antelación.</span>
      </div>

      <div className={styles.grid}>
        {DIAS.map((diaA, index) => {
          const diaNum = index + 1
          const diaClases = grouped[diaNum]

          return (
            <div key={diaNum} className={styles.dayCol}>
              <div className={styles.dayHeader}>{diaA}</div>
              <div className={styles.dayBody}>
                {diaClases.length === 0 ? (
                  <p className={styles.empty}>Sin clases</p>
                ) : (
                  diaClases.map(c => (
                    <div key={c.id} className={styles.classCard}>
                      <div className={styles.classColor} />
                      <div className={styles.classContent}>
                        <div className={styles.className}>{c.modalidades?.nombre}</div>
                        <div className={styles.classTime}>{c.hora_inicio.substring(0,5)} - {c.hora_fin.substring(0,5)}</div>
                        <div className={styles.classMeta}>
                          {c.plazas_max} plzs · {c.monitora}
                        </div>
                      </div>
                      <button className={styles.delBtn} onClick={() => handleDelete(c.id)}>×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontSize: 'var(--font-xl)', color: 'var(--color-text)' }}>Nueva Clase Base</h2>
            </div>
            <div className="modal-body">
              <form id="claseForm" onSubmit={handleCreate} style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="label">Modalidad</label>
                  <select required className="input" value={fMod} onChange={e=>setFMod(e.target.value)}>
                    <option value="">Selecciona...</option>
                    {modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Día de la semana</label>
                  <select required className="input" value={fDia} onChange={e=>setFDia(e.target.value)}>
                    {DIAS.map((d, i) => <option key={i+1} value={i+1}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="label">Hora Inicio</label>
                    <input required type="time" className="input" value={fInicio} onChange={e=>setFInicio(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Hora Fin</label>
                    <input required type="time" className="input" value={fFin} onChange={e=>setFFin(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="label">Plazas Máximas</label>
                    <input required type="number" min="1" className="input" value={fPlazas} onChange={e=>setFPlazas(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Monitora</label>
                    <input className="input" value={fMonitora} onChange={e=>setFMonitora(e.target.value)} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancelar</button>
              <button form="claseForm" type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Clase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
