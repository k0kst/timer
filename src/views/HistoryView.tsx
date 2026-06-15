import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { BarChart, GroupedBarChart, ScatterPlot } from '../components/Charts'
import { formatHMS, formatDuration } from '../utils/time'
import {
  completedRows,
  taskGroups,
  todaySummary,
  lastNDays,
  focusHoursPerDay,
  bankFlowPerDay,
  accuracyPoints,
  rowsToCsv,
} from '../state/analytics'

type SortKey = 'date' | 'title' | 'estimatedMins' | 'actualMins' | 'bountyMins'

export function HistoryView() {
  const { state } = useStore()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [asc, setAsc] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const summary = useMemo(() => todaySummary(state), [state])
  const groups = useMemo(() => taskGroups(state), [state])
  const days = useMemo(() => lastNDays(7), [])
  const focus = useMemo(() => focusHoursPerDay(state, days), [state, days])
  const flow = useMemo(() => bankFlowPerDay(state, days), [state, days])
  const scatter = useMemo(() => accuracyPoints(state), [state])

  const rows = useMemo(() => {
    let r = completedRows(state)
    if (from) r = r.filter((x) => new Date(x.completedAt) >= new Date(from))
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      r = r.filter((x) => new Date(x.completedAt) <= end)
    }
    const dir = asc ? 1 : -1
    r = [...r].sort((a, b) => {
      if (sortKey === 'date') return dir * (+new Date(a.completedAt) - +new Date(b.completedAt))
      if (sortKey === 'title') return dir * a.title.localeCompare(b.title)
      return dir * (a[sortKey] - b[sortKey])
    })
    return r
  }, [state, from, to, sortKey, asc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v)
    else {
      setSortKey(key)
      setAsc(false)
    }
  }

  const exportCsv = () => {
    const blob = new Blob([rowsToCsv(rows)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bountytimer-history-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const arrow = (key: SortKey) => (sortKey === key ? (asc ? ' ▲' : ' ▼') : '')

  return (
    <>
      <h1 className="view-title">History</h1>

      {/* Daily summary (PRD §4.4.1) */}
      <div className="section-label">Today</div>
      <div className="summary-grid">
        <div className="card stat">
          <div className="stat-num">{summary.tasksCompleted}</div>
          <div className="stat-label">tasks done</div>
        </div>
        <div className="card stat">
          <div className="stat-num">{formatHMS(summary.focusSeconds)}</div>
          <div className="stat-label">focus time</div>
        </div>
        <div className="card stat">
          <div className="stat-num">
            <span style={{ color: 'var(--green)' }}>{summary.earnedMins}</span> /{' '}
            <span style={{ color: 'var(--amber)' }}>{summary.spentMins}</span>
          </div>
          <div className="stat-label">earned / spent (min)</div>
        </div>
        <div className="card stat">
          <div className="stat-num">
            {summary.estimateAccuracyPct === null ? '—' : `±${summary.estimateAccuracyPct}%`}
          </div>
          <div className="stat-label">est. deviation</div>
        </div>
      </div>

      {/* Trend charts (PRD §4.4.3) */}
      <div className="section-label">Focus hours — last 7 days</div>
      <div className="card">
        <BarChart labels={days.map((d) => d.label)} values={focus} unit="h" />
      </div>

      <div className="section-label">Break time earned vs spent — last 7 days</div>
      <div className="card">
        <GroupedBarChart
          labels={days.map((d) => d.label)}
          seriesA={flow.earned}
          seriesB={flow.spent}
          nameA="Earned"
          nameB="Spent"
        />
      </div>

      <div className="section-label">Estimation accuracy</div>
      <div className="card" style={{ textAlign: 'center' }}>
        <ScatterPlot points={scatter} />
        <div className="hint" style={{ marginTop: 8 }}>
          Dots above the line took longer than estimated; below, faster.
        </div>
      </div>

      {/* Repeating tasks grouped by title (PRD §4.4.2) */}
      <div className="section-label">Grouped by task</div>
      <div className="card">
        {groups.length === 0 ? (
          <div className="hint" style={{ padding: '8px 0' }}>No completed tasks yet.</div>
        ) : (
          groups.map((g) => (
            <div className="group" key={g.key}>
              <button
                className="group-head"
                onClick={() => setOpenGroup((k) => (k === g.key ? null : g.key))}
              >
                <span className="group-arrow">{openGroup === g.key ? '▾' : '▸'}</span>
                <span className="group-title" title={g.title}>{g.title}</span>
                <span className="pill">×{g.count}</span>
                <span className="spacer" />
                <span className="hint">{formatDuration(g.totalActualMins)} total</span>
              </button>
              {openGroup === g.key && (
                <div className="group-body">
                  <div className="hint" style={{ marginBottom: 6 }}>
                    Avg {formatDuration(g.avgActualMins)} per run · 🎁{' '}
                    {formatDuration(g.totalBountyMins)} earned
                    {g.avgDeviationPct !== null ? ` · ±${g.avgDeviationPct}% vs estimate` : ''}
                  </div>
                  {g.rows.map((r) => (
                    <div className="group-instance" key={r.id}>
                      <span>{new Date(r.completedAt).toLocaleString()}</span>
                      <span className="hint">
                        {formatDuration(r.actualMins)} · 🎁 {formatDuration(r.bountyMins)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Task history log (PRD §4.4.2) */}
      <div className="section-label">Task log</div>
      <div className="card">
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <label className="hint">
            From{' '}
            <input className="input" type="date" value={from} style={{ width: 150, minHeight: 36 }} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="hint">
            To{' '}
            <input className="input" type="date" value={to} style={{ width: 150, minHeight: 36 }} onChange={(e) => setTo(e.target.value)} />
          </label>
          <div className="spacer" />
          <button className="btn small" onClick={exportCsv} disabled={rows.length === 0}>
            ⬇ Export CSV
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="hint" style={{ padding: '8px 0' }}>No completed tasks in this range.</div>
        ) : (
          <div className="log-table">
            <div className="log-row log-head">
              <button onClick={() => toggleSort('date')}>Date{arrow('date')}</button>
              <button onClick={() => toggleSort('title')}>Title{arrow('title')}</button>
              <button onClick={() => toggleSort('estimatedMins')}>Est{arrow('estimatedMins')}</button>
              <button onClick={() => toggleSort('actualMins')}>Actual{arrow('actualMins')}</button>
              <button onClick={() => toggleSort('bountyMins')}>Bounty{arrow('bountyMins')}</button>
            </div>
            {rows.map((r) => (
              <div className="log-row" key={r.id}>
                <span>{new Date(r.completedAt).toLocaleString()}</span>
                <span className="log-title" title={r.title}>{r.title}</span>
                <span>{formatDuration(r.estimatedMins)}</span>
                <span>{formatDuration(r.actualMins)}</span>
                <span style={{ color: 'var(--teal)' }}>{formatDuration(r.bountyMins)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
