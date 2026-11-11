import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { CheckCircle, Fire, Medal, ShareNetwork } from '@phosphor-icons/react'
import { db } from '../../db/db'
import { useSettings } from '../../settings'
import { PageHeader, Panel, toast } from '../../ui/kit'
import { calculateProgress } from './progress'
import { challengeLabels } from './labels'

export default function Challenges() {
  const lang = useSettings((s) => s.lang)
  const l = challengeLabels(lang)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = window.setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [])
  const history = useLiveQuery(async () => ({ attempts: await db.puzzleAttempts.toArray(), games: await db.games.toArray() }), [])
  if (!history) return <div className="mx-auto max-w-4xl pb-8"><PageHeader title={l.title} /><p className="px-4" role="status">{l.loading}</p></div>
  const progress = calculateProgress(history.attempts, history.games, new Date(Math.max(now.getTime(), Date.now())))
  const { today, week, streak, longestStreak, totals } = progress
  const badges = [
    { label: l.firstPuzzle, earned: totals.puzzles >= 1 },
    { label: l.puzzle25, earned: totals.puzzles >= 25 },
    { label: l.mistakes2, earned: totals.mistakes >= 2 },
    { label: l.firstGame, earned: totals.games >= 1 },
    { label: l.games10, earned: totals.games >= 10 },
    { label: l.streak3, earned: longestStreak >= 3 },
    { label: l.streak7, earned: longestStreak >= 7 },
  ].filter((badge) => badge.earned)
  const weekly = week.reduce((sum, day) => sum + day.completed, 0)
  const missions = [
    { label: l.puzzles, count: today.puzzles, goal: 5, to: '/puzzles/rated', action: l.practice },
    { label: l.mistakes, count: today.mistakes, goal: 2, to: '/puzzles/mistakes', action: l.practice },
    { label: l.game, count: today.games, goal: 1, to: '/play', action: l.play },
  ]
  async function share() {
    const text = l.shareText.replace('{missions}', String(today.completed)).replace('{weekly}', String(weekly)).replace('{streak}', String(streak)).replace('{badges}', String(badges.length))
    try {
      if (Capacitor.isNativePlatform()) await Share.share({ title: l.title, text, dialogTitle: l.share })
      else if (navigator.share) await navigator.share({ title: l.title, text })
      else toast(l.shareUnavailable, 'info')
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) toast(l.shareFailed, 'error')
    }
  }
  return (
    <div className="mx-auto max-w-4xl pb-8">
      <PageHeader title={l.title} />
      <div className="grid gap-4 px-4 lg:px-6">
        <p className="text-fg-2">{l.subtitle}</p>
        <Panel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-extrabold">{l.today}</h2><p className="text-fg-2">{today.completed}/3 {l.completed}</p></div>
            <div className="flex items-center gap-2 font-bold text-accent"><Fire size={24} weight="fill" aria-hidden="true" />{streak} {l.streak}</div>
          </div>
          <p className="mt-2 text-sm text-fg-2">{l.streakHelp}</p>
          <ul className="mt-4 grid gap-3">
            {missions.map((m) => <li key={m.to} className="rounded-xl bg-panel-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{m.label}</span><span className="tabular font-bold">{Math.min(m.count, m.goal)}/{m.goal} {m.count >= m.goal && <CheckCircle size={20} weight="fill" className="inline text-accent" aria-label={l.completed} />}</span></div>
              <progress className="mt-2 w-full accent-[var(--accent)]" value={Math.min(m.count, m.goal)} max={m.goal} aria-label={m.label} />
              <Link className="btn mt-3" to={m.to}>{m.action}</Link>
            </li>)}
          </ul>
        </Panel>
        <Panel className="p-5"><h2 className="text-xl font-extrabold">{l.week}</h2><p className="mt-1 text-fg-2">{weekly}/21 {l.weekly}</p>
          <ol className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">{week.map((day) => {
            const date = new Date(`${day.key}T12:00:00`)
            return <li key={day.key} className="min-w-0 rounded-lg bg-panel-2 px-1 py-3 text-center" aria-label={`${date.toLocaleDateString(lang, { dateStyle: 'full' })}: ${day.completed}/3, ${day.active ? l.active : l.quiet}`}><span className="block text-xs text-fg-2">{date.toLocaleDateString(lang, { weekday: 'short' })}</span><span className="block font-bold">{date.getDate()}</span><span className="block text-sm">{day.completed}/3</span></li>
          })}</ol>
        </Panel>
        <Panel className="p-5"><h2 className="text-xl font-extrabold">{l.badges}</h2>{badges.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{badges.map((badge) => <li key={badge.label} className="flex items-center gap-3 rounded-lg bg-panel-2 p-3 font-semibold"><Medal size={28} className="shrink-0 text-accent" weight="duotone" aria-hidden="true" />{badge.label}</li>)}</ul> : <p className="mt-2 text-fg-2">{l.noBadges}</p>}</Panel>
        <p className="text-sm text-fg-2">{l.privacy}</p>
        <div><button type="button" className="btn" onClick={() => void share()}><ShareNetwork size={20} /> {l.share}</button></div>
      </div>
    </div>
  )
}
