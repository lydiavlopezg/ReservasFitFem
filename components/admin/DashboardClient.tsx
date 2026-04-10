'use client'

import { useState, useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts'
import styles from './Dashboard.module.css'

interface Sesion {
  id: string
  fecha: string
  ocupadas: number
  max: number
  modalidad: string
  hora: string
}

interface Reserva {
  id: string
  fecha: string
  estado: string
  sesion_id: string
  fecha_nacimiento: string | null
}

interface Props {
  usuariosTotales: number
  sesiones: Sesion[]
  reservas: Reserva[]
}

const COLORS = ['#FF0080', '#7C3AED', '#F59E0B', '#10B981', '#EC4899', '#6B7FD4', '#F97316']

export default function DashboardClient({ usuariosTotales, sesiones, reservas }: Props) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [tab, setTab] = useState<'general' | 'ocupacion' | 'edad' | 'cancelaciones'>('general')

  // --- FILTRADO ---
  const filteredSesiones = useMemo(() => {
    return sesiones.filter(s => {
      const d = new Date(s.fecha)
      return d.getFullYear() === year && (d.getMonth() + 1) === month
    })
  }, [sesiones, year, month])

  const filteredReservas = useMemo(() => {
    return reservas.filter(r => {
      const d = new Date(r.fecha)
      return d.getFullYear() === year && (d.getMonth() + 1) === month
    })
  }, [reservas, year, month])
  // --- CÁLCULOS KPI ---
  const stats = useMemo(() => {
    // 1. Total Asistencias (Suma de plazas ocupadas en todas las sesiones del mes)
    const totalAsistencias = filteredSesiones.reduce((acc, s) => acc + s.ocupadas, 0)
    
    // 2. Sesiones totales en el periodo
    const totalSesiones = filteredSesiones.length

    // 3. Cancelaciones Totales
    const cancTotal = filteredReservas.filter(r => r.estado === 'cancelada').length

    // 4. Edad Media
    const conEdad = filteredReservas.filter(r => r.fecha_nacimiento)
    const hoy = new Date()
    const sumaEdades = conEdad.reduce((acc, r) => {
      const naci = new Date(r.fecha_nacimiento!)
      let edad = hoy.getFullYear() - naci.getFullYear()
      if (hoy.getMonth() < naci.getMonth() || (hoy.getMonth() === naci.getMonth() && hoy.getDate() < naci.getDate())) edad--
      return acc + edad
    }, 0)
    const edadMedia = conEdad.length > 0 ? sumaEdades / conEdad.length : 0

    return {
      totalAsistencias,
      totalSesiones,
      cancTotal,
      edadMedia: edadMedia.toFixed(1),
      confirmadas: filteredReservas.filter(r => r.estado === 'confirmada').length,
      espera: filteredReservas.filter(r => r.estado === 'espera').length
    }
  }, [filteredSesiones, filteredReservas])

  // --- DATOS GRÁFICOS ---
  const dataAsistencia = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSesiones.forEach(s => {
      if (!map[s.modalidad]) map[s.modalidad] = 0
      map[s.modalidad] += s.ocupadas
    })
    return Object.entries(map).map(([name, val]) => ({
      name,
      val: val
    })).sort((a,b) => b.val - a.val)
  }, [filteredSesiones])

  const dataFranjas = useMemo(() => {
    let mO = 0, tO = 0
    filteredSesiones.forEach(s => {
      const [h] = s.hora.split(':').map(Number)
      if (h < 14) mO += s.ocupadas
      else tO += s.ocupadas
    })
    return [
      { name: 'Mañana', val: mO },
      { name: 'Tarde', val: tO }
    ]
  }, [filteredSesiones])

  const dataEdadMod = useMemo(() => {
    const map: Record<string, number[]> = {}
    const hoy = new Date()
    filteredReservas.forEach(r => {
      if (!r.fecha_nacimiento) return
      const s = sesiones.find(s => s.id === r.sesion_id)
      if (!s) return
      const naci = new Date(r.fecha_nacimiento)
      let edad = hoy.getFullYear() - naci.getFullYear()
      if (hoy.getMonth() < naci.getMonth() || (hoy.getMonth() === naci.getMonth() && hoy.getDate() < naci.getDate())) edad--
      
      if (!map[s.modalidad]) map[s.modalidad] = []
      map[s.modalidad].push(edad)
    })
    return Object.entries(map).map(([name, edades]) => ({
      name,
      val: parseFloat((edades.reduce((a,b)=>a+b,0) / edades.length).toFixed(1))
    }))
  }, [filteredReservas, sesiones])

  // --- EXPORTAR CSV ---
  const exportCSV = () => {
    const headers = ['ID Reserva', 'Fecha', 'Estado', 'Fecha Nacimiento Usuario']
    const rows = filteredReservas.map(r => [
      r.id, 
      new Date(r.fecha).toLocaleString(), 
      r.estado, 
      r.fecha_nacimiento || 'N/A'
    ])
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `reporte_fitfem_${year}_${month}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Analítica Fit&Fem</h1>
          <p className={styles.subtitle}>Análisis de rendimiento y comportamiento de clientas</p>
        </div>
        <div className={styles.actions}>
          <select className="input" value={month} onChange={e=>setMonth(Number(e.target.value))} style={{ width: 140 }}>
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
              <option key={i} value={i+1}>{m}</option>
            ))}
          </select>
          <select className="input" value={year} onChange={e=>setYear(Number(e.target.value))} style={{ width: 100 }}>
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
          <button className="btn btn-primary" onClick={exportCSV}>📥 Exportar CSV</button>
        </div>
      </header>

      {/* KPIs Rápidos */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Asistencias Totales</p>
          <p className={styles.statValue}>{stats.totalAsistencias}</p>
          <p className={styles.statSub}>{stats.totalSesiones} clases impartidas</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Cancelaciones Mes</p>
          <p className={styles.statValue} style={{ color: stats.cancTotal > 50 ? 'var(--color-error)' : 'inherit' }}>
            {stats.cancTotal}
          </p>
          <p className={styles.statSub}>Reservas anuladas</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Edad Media</p>
          <p className={styles.statValue}>{stats.edadMedia}</p>
          <p className={styles.statSub}>años</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Reservas Confirmadas</p>
          <p className={styles.statValue}>{stats.confirmadas}</p>
          <p className={styles.statSub}>para este periodo</p>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button className={tab === 'general' ? styles.tabActive : ''} onClick={()=>setTab('general')}>General</button>
        <button className={tab === 'ocupacion' ? styles.tabActive : ''} onClick={()=>setTab('ocupacion')}>Volumen por Modalidad</button>
        <button className={tab === 'edad' ? styles.tabActive : ''} onClick={()=>setTab('edad')}>Perfil Edad</button>
      </div>

      <div className={styles.cardsGrid}>
        {tab === 'general' && (
          <>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Total Asistencias por Modalidad</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataAsistencia.slice(0, 5)}>
                    <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="val" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Asistencias (Mañana vs Tarde)</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dataFranjas} dataKey="val" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {dataFranjas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab === 'ocupacion' && (
          <div className={styles.card} style={{ gridColumn: 'span 2' }}>
            <h3 className={styles.cardTitle}>Ranking de Actividades por Asistencias Totales</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Modalidad</th>
                  <th>Total Alumnas</th>
                  <th>Peso Visual</th>
                </tr>
              </thead>
              <tbody>
                {dataAsistencia.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.val} asistencias</td>
                    <td>
                      <div className={styles.barWrap} style={{ width: 100 }}>
                        <div className={styles.barFill} style={{ width: `${(d.val/Math.max(stats.totalAsistencias, 1))*100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'edad' && (
          <div className={styles.card} style={{ gridColumn: 'span 2' }}>
            <h3 className={styles.cardTitle}>Edad Promedio por Modalidad</h3>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataEdadMod} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8f8f8' }} />
                  <Bar dataKey="val" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className={styles.cardNote}>* Basado en las clientas con fecha de nacimiento configurada.</p>
          </div>
        )}
      </div>

      <div className="alert alert-warning" style={{ marginTop: 'var(--space-6)' }}>
        <span>⚠️</span>
        <span>Recuerda que la **tasa de cancelación** óptima debería estar por debajo del 12% para rentabilizar el horario.</span>
      </div>
    </div>
  )
}
