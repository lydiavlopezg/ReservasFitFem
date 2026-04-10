'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './onboarding.module.css'

type Modalidad = { id: string; nombre: string }

interface Props {
  userId: string
  packNumActividades: number
  modalidades: Modalidad[]
}

const ICONS: Record<string, string> = {
  'Zumba': '💃',
  'Pilates': '🧘',
  'Total Body': '🏋️',
  'Beat Training': '🥊',
  'Barre': '🩰',
  'Hipopresivos': '🫁',
  'TRX': '🪢',
}

export default function OnboardingClient({ userId, packNumActividades, modalidades }: Props) {
  console.log('OnboardingClient: Rendering', { userId, packNumActividades, modalidades })
  const router = useRouter()
  const supabase = createClient()
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('OnboardingClient: State', { selected, loading })

  function toggle(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= packNumActividades) return prev
      return [...prev, id]
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleConfirm() {
    if (selected.length !== packNumActividades) {
      setError(`Debes seleccionar exactamente ${packNumActividades} modalidade${packNumActividades > 1 ? 's' : ''}.`)
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, selectedModalidades: selected })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      router.push('/horario')
      router.refresh()
    } catch (err: any) {
      console.error('Onboarding Error:', err)
      setError('Error guardando preferencias: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Configuración de modalidades</h1>
      <p style={{ marginBottom: '1rem' }}>Elige las {packNumActividades} que vas a practicar:</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem' }}>
        {modalidades.map(m => (
          <button
            key={m.id}
            onClick={() => toggle(m.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '20px',
              border: '2px solid',
              borderColor: selected.includes(m.id) ? '#FF0080' : '#ddd',
              background: selected.includes(m.id) ? '#FFD6EC' : 'white',
              cursor: 'pointer'
            }}
          >
            {m.nombre}
          </button>
        ))}
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '10px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}

      <button
        onClick={handleConfirm}
        disabled={loading || selected.length !== packNumActividades}
        style={{
          width: '100%',
          padding: '12px',
          background: '#FF0080',
          color: 'white',
          borderRadius: '24px',
          fontWeight: 'bold',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: (loading || selected.length !== packNumActividades) ? 0.5 : 1
        }}
      >
        {loading ? 'Guardando...' : 'Confirmar y Entrar'}
      </button>

      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '10px',
          marginTop: '1rem',
          background: 'none',
          border: '1px solid #ddd',
          borderRadius: '24px',
          color: '#666',
          cursor: 'pointer'
        }}
      >
        Cerrar sesión / Volver al Login
      </button>
    </div>
  )
}
