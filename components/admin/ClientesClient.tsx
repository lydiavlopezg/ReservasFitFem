'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './Clientes.module.css'

type Cliente = {
  id: string
  email: string
  nombre: string
  apellidos: string
  dni_numerico: string
  activo: boolean
  packs: { nombre: string; num_actividades: number } | null
}

type Pack = { id: string; nombre: string; num_actividades: number }
type Modalidad = { id: string; nombre: string }

export default function ClientesClient({ clientes, packs, modalidades }: { clientes: Cliente[]; packs: Pack[]; modalidades: Modalidad[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  
  // Form estado
  const [fNombre, setFNombre] = useState('')
  const [fApellidos, setFApellidos] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fDni, setFDni] = useState('')
  const [fPack, setFPack] = useState('')
  const [fMods, setFMods] = useState<string[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = clientes.filter(c => 
    `${c.nombre} ${c.apellidos} ${c.email} ${c.dni_numerico}`.toLowerCase().includes(search.toLowerCase())
  )

  const selectedPack = packs.find(p => p.id === fPack)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (fDni.length !== 8 || isNaN(Number(fDni))) {
      setError('El DNI debe tener 8 dígitos numéricos (sin letra)'); return
    }
    setError('')
    setLoading(true)

    // Llamada a Server Action para usar Service Role / Admin Client
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fEmail, password: fDni,
        user_metadata: {
          nombre: fNombre, apellidos: fApellidos, dni_numerico: fDni,
          pack_id: fPack, rol: 'cliente'
        },
        modalidades: fMods
      })
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Error al crear usuario')
      setLoading(false)
      return
    }

    setLoading(false)
    setShowModal(false)
    router.refresh()
  }

  function renderModal() {
    if (!showModal) return null
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
        <div className="modal">
          <div className="modal-header">
            <h2 style={{ fontSize: 'var(--font-xl)', color: 'var(--color-text)' }}>Nuevo Cliente</h2>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
            
            <form id="createForm" onSubmit={handleCreate} style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group"><label className="label">Nombre</label><input required className="input" value={fNombre} onChange={e=>setFNombre(e.target.value)} /></div>
                <div className="form-group"><label className="label">Apellidos</label><input required className="input" value={fApellidos} onChange={e=>setFApellidos(e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="label">Email</label><input required type="email" className="input" value={fEmail} onChange={e=>setFEmail(e.target.value)} /></div>
              <div className="form-group">
                <label className="label">DNI Numérico (Contraseña)</label>
                <input required className="input" minLength={8} maxLength={8} pattern="\d{8}" value={fDni} onChange={e=>setFDni(e.target.value)} placeholder="Ej: 12345678" />
              </div>
              <div className="form-group">
                <label className="label">Pack</label>
                <select required className="input" value={fPack} onChange={e=>{setFPack(e.target.value); setFMods([])}}>
                  <option value="">Selecciona pack...</option>
                  {packs.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              {selectedPack && (
                <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
                  <label className="label">
                    Modalidades {selectedPack.num_actividades < 99 ? `(${fMods.length} de ${selectedPack.num_actividades} seleccionadas)` : '(Ilimitadas)'}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {modalidades.map(m => {
                      const isSelected = fMods.includes(m.id)
                      const isDisabled = !isSelected && selectedPack.num_actividades < 99 && fMods.length >= selectedPack.num_actividades
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) setFMods(prev => prev.filter(id => id !== m.id))
                            else if (!isDisabled) setFMods(prev => [...prev, m.id])
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--color-primary)' : '#ddd',
                            background: isSelected ? 'var(--color-primary-light)' : 'white',
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            fontSize: 'var(--font-xs)',
                            fontWeight: isSelected ? 600 : 400
                          }}
                        >
                          {m.nombre}
                        </button>
                      )
                    })}
                  </div>
                  {selectedPack.num_actividades < 99 && fMods.length !== selectedPack.num_actividades && (
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-error)', marginTop: '8px' }}>
                      Debes seleccionar exactamente {selectedPack.num_actividades} modalidades.
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button 
              form="createForm" 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || (selectedPack && selectedPack.num_actividades < 99 && fMods.length !== selectedPack.num_actividades)}
            >
              {loading ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Cliente</button>
      </div>

      <div className={styles.toolbar}>
        <input 
          type="text" 
          className="input" 
          placeholder="Buscar por nombre, apellidos, email o DNI..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>DNI</th>
              <th>Pack</th>
              <th>Estado</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>No se encontraron clientes</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nombre} {c.apellidos}</td>
                <td>{c.email}</td>
                <td>{c.dni_numerico}</td>
                <td>{c.packs?.nombre || <span className="text-muted">Sin pack</span>}</td>
                <td>
                  <span className={`badge ${c.activo ? 'badge-success' : 'badge-error'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderModal()}
    </div>
  )
}
