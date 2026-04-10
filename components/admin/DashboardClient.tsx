'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import styles from './Dashboard.module.css'

interface Props {
  stats: { usuariosTotales: number; ocupacionMediaGlobal: number; sesionesTotales: number }
  aforoData: { name: string; ocupacion: number }[]
}

export default function DashboardClient({ stats, aforoData }: Props) {
  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Clientes Registrados</div>
          <div className={styles.statValue}>{stats.usuariosTotales}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ocupación Media Global</div>
          <div className={styles.statValue}>{stats.ocupacionMediaGlobal}%</div>
          <div className={styles.statSparkline}>
            <div className={styles.barWrap}><div className={styles.barFill} style={{ width: `${stats.ocupacionMediaGlobal}%` }} /></div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Sesiones Programadas</div>
          <div className={styles.statValue}>{stats.sesionesTotales}</div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Ocupación Media por Modalidad (%)</h2>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aforoData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: 'var(--color-surface-hover)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
              />
              <Bar dataKey="ocupacion" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginTop: 'var(--space-6)' }}>
        <span>📊</span>
        <span>A medida que los clientes realicen más reservas, se habilitarán los filtros por fecha extendidos.</span>
      </div>
    </div>
  )
}
