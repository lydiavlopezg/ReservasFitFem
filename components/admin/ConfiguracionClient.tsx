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
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoadingConfig(true)
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
    setLoadingConfig(false)
  }

  async function handleSessionAction(action: string) {
    console.log('Iniciando acción de sesión:', action);
    setLoadingSessions(true)
    setMsg({ text: '', type: '' })
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      console.log('Respuesta de API recibida:', res.status);
      const data = await res.json()
      console.log('Datos de API:', data);

      if (data.success) {
        setMsg({ 
          text: action === 'generate' 
            ? `¡Listo! Se ha generado la semana del ${data.period}. (${data.count} sesiones nuevas)` 
            : 'Sesiones futuras limpiadas correctamente.', 
          type: 'success' 
        })
        router.refresh()
      } else {
        throw new Error(data.error || 'Ocurrió un error en el servidor')
      }
    } catch (err: any) {
      console.error('Error capturado en frontend:', err);
      setMsg({ text: 'Error: ' + err.message, type: 'error' })
      alert('Error en la operación: ' + err.message);
    } finally {
      setLoadingSessions(false)
    }
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

          <button type="submit" className="btn btn-primary" disabled={loadingConfig} style={{ marginTop: 'var(--space-2)' }}>
            {loadingConfig ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>

      <div className="alert alert-warning" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <span>⚡</span>
        <span>Estos cambios afectan al motor de reglas del backend inmediatamente.</span>
      </div>

      <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Mantenimiento del Horario</h2>
      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
          Usa estas herramientas para poblar el calendario con las clases del horario maestro o limpiar sesiones futuras.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => handleSessionAction('generate')}
              disabled={loadingSessions}
              style={{ flex: 1 }}
            >
              {loadingSessions ? 'Generando...' : '📅 Generar 1 semana más'}
            </button>
            <button 
              className="btn btn-ghost" 
              onClick={() => {
                if(confirm('¿Estás segura? Se borrarán todas las sesiones futuras que no tengan reservas registradas.')) {
                  handleSessionAction('delete_future')
                }
              }}
              disabled={loadingSessions}
              style={{ color: 'var(--color-error)' }}
            >
              🗑️ Limpiar sesiones futuras
            </button>
          </div>
          <p style={{ fontSize: 'var(--font-xs)', fontStyle: 'italic' }}>
            * Generar sesiones no duplicará las que ya existan.
          </p>
        </div>
      </div>
    </div>
  )
}
