'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfiguracionClient({ config }: { config: Record<string, string> }) {
  const router = useRouter()
  const supabase = createClient()
  const [diaApertura, setDiaApertura] = useState(config['dia_apertura_semana'] || '7')
  const [horaApertura, setHoraApertura] = useState(config['hora_apertura_semana'] || '18:00')
  const [cancelacion, setCancelacion] = useState(config['horas_cancelacion'] || '5')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg({ text: '', type: '' })

    const updates = [
      { clave: 'dia_apertura_semana', valor: diaApertura },
      { clave: 'hora_apertura_semana', valor: horaApertura },
      { clave: 'horas_cancelacion', valor: cancelacion }
    ]

    const { error } = await supabase.from('config').upsert(updates)

    if (error) {
      setMsg({ text: 'Error al guardar la configuración.', type: 'error' })
    } else {
      setMsg({ text: 'Configuración guardada correctamente.', type: 'success' })
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>Configuración Global</h1>

      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        {msg.text && (
          <div className={`alert alert-${msg.type}`} style={{ marginBottom: 'var(--space-6)' }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="form-group">
            <label className="label">Apertura de la semana anterior</label>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              ¿Qué día de la semana anterior se abren todas las plazas de la semana siguiente?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <select className="input" value={diaApertura} onChange={e=>setDiaApertura(e.target.value)} style={{ flex: 1 }}>
                <option value="1">Lunes previo</option>
                <option value="2">Martes previo</option>
                <option value="3">Miércoles previo</option>
                <option value="4">Jueves previo</option>
                <option value="5">Viernes previo</option>
                <option value="6">Sábado previo</option>
                <option value="7">Domingo previo</option>
              </select>
              <input required type="time" className="input" value={horaApertura} onChange={e=>setHoraApertura(e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Límite de cancelación (Horas previas)</label>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              Cuánto tiempo antes de la clase se permite a los clientes cancelar por sí mismos. (Por defecto 5h)
            </p>
            <input required type="number" min="0" className="input" value={cancelacion} onChange={e=>setCancelacion(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 'var(--space-2)' }}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>

      <div className="alert alert-warning" style={{ marginTop: 'var(--space-6)' }}>
        <span>⚡</span>
        <span>Estos cambios afectan al motor de reglas del backend inmediatamente.</span>
      </div>
    </div>
  )
}
