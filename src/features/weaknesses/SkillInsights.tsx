import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { db } from '../../db/db'
import { useSettings } from '../../settings'
import { Panel, SkeletonText } from '../../ui/kit'
import { buildSkillInsights, MIN_GAMES, MIN_MOVES, type Sample } from './skillInsights/skillInsights'

export default function SkillInsights() {
  const lang = useSettings((s) => s.lang)
  const pl = String(lang) === 'pl'
  const { t } = useTranslation()
  const games = useLiveQuery(() => db.games.toArray(), [])
  const insights = useMemo(() => games ? buildSkillInsights(games, Date.now()) : undefined, [games])
  const number = (n: number) => new Intl.NumberFormat(pl ? 'pl' : 'en', { maximumFractionDigits: 1 }).format(n)
  const evidence = (s: Sample) => pl
    ? `${s.games} partii · ${s.moves} ocenionych ruchów · ${s.mistakes} błędów`
    : `${s.games} games · ${s.moves} evaluated moves · ${s.mistakes} mistakes`
  const rate = (s: Sample) => s.per100 === null ? (pl ? 'Za mało danych' : 'Not enough data') : `${number(s.per100)} / 100`
  return <section aria-labelledby="skill-insights-title" className="space-y-3">
    <div>
      <h2 id="skill-insights-title" className="text-[22px] font-extrabold">{pl ? 'Twoja forma szachowa' : 'Your chess performance'}</h2>
      <p className="text-sm text-fg-2">{pl ? 'Ostatnie 30 dni, na podstawie zakończonych partii z analizą silnika.' : 'Last 30 days, based on completed games with engine reviews.'}</p>
    </div>
    {!insights ? <Panel className="p-4"><SkeletonText width="60%" /></Panel> : <>
      <div className="grid gap-3 sm:grid-cols-2">
        {([ [pl ? 'Ostatnie 30 dni' : 'Last 30 days', insights.recent], [pl ? 'Poprzednie 30 dni' : 'Previous 30 days', insights.previous] ] as const).map(([label, s]) => <Panel key={label} className="p-4">
          <h3 className="font-bold">{label}</h3>
          <p className="mt-2 text-xl font-extrabold">{rate(s)}</p>
          <p className="text-sm text-fg-2">{pl ? 'błędów na 100 ruchów' : 'mistakes per 100 moves'}</p>
          <p className="mt-2 text-sm text-fg-2">{evidence(s)}</p>
        </Panel>)}
      </div>
      <Panel className="space-y-3 p-4">
        <p className="font-semibold">{insights.trend === null ? (pl ? 'Porównanie pojawi się po zebraniu wystarczającej liczby danych w obu okresach.' : 'A comparison appears when both periods have enough data.') : insights.trend === 0 ? (pl ? 'Wskaźnik błędów nie zmienił się.' : 'The mistake rate is unchanged.') : (pl ? `Zmiana: ${insights.trend > 0 ? '+' : '−'}${number(Math.abs(insights.trend))} błędów na 100 ruchów.` : `Change: ${insights.trend > 0 ? '+' : '−'}${number(Math.abs(insights.trend))} mistakes per 100 moves.`)}</p>
        <p className="text-sm text-fg-2">{pl ? `Każdy wskaźnik wymaga co najmniej ${MIN_GAMES} partii i ${MIN_MOVES} ocenionych ruchów. Błędy obejmują mistake, miss i blunder; ruchy książkowe i wymuszone są pomijane. Okresy to kolejne 30 × 24 godziny.` : `Each rate requires at least ${MIN_GAMES} games and ${MIN_MOVES} evaluated moves. Mistakes include mistake, miss and blunder; book and forced moves are excluded. Periods are consecutive 30 × 24-hour windows.`}</p>
      </Panel>
      <div className="grid gap-3 md:grid-cols-2">
        <Panel className="space-y-3 p-4">
          <h3 className="font-extrabold">{pl ? 'Kolor i wyniki' : 'Colour and results'}</h3>
          {([ [pl ? 'Białe' : 'White', insights.colors.white], [pl ? 'Czarne' : 'Black', insights.colors.black] ] as const).map(([label, s]) => <div key={label}>
            <p className="font-bold">{label}: {rate(s)}</p><p className="text-sm text-fg-2">{evidence(s)}</p>
            <p className="text-sm text-fg-2">{pl ? `Wygrane ${s.wins} · remisy ${s.draws} · przegrane ${s.losses}` : `Wins ${s.wins} · draws ${s.draws} · losses ${s.losses}`}</p>
          </div>)}
        </Panel>
        <Panel className="space-y-3 p-4">
          <h3 className="font-extrabold">{pl ? 'Rodziny debiutów' : 'Opening families'}</h3>
          {insights.openings.length ? <ul className="space-y-3">{insights.openings.map((s) => <li key={s.name}><p className="break-words font-bold">{s.name}: {rate(s)}</p><p className="text-sm text-fg-2">{evidence(s)}</p></li>)}</ul> : <p className="text-sm text-fg-2">{pl ? 'Żadna rodzina debiutów nie ma jeszcze wystarczającej próby.' : 'No opening family has a sufficient sample yet.'}</p>}
          <p className="text-xs text-fg-3">{pl ? 'Wskaźnik obejmuje całą partię, nie tylko debiut.' : 'Rates cover the whole game, not only the opening.'}</p>
        </Panel>
      </div>
      <Panel className="space-y-3 p-4">
        <h3 className="font-extrabold">{pl ? 'Co ćwiczyć' : 'What to practise'}</h3>
        {insights.topTheme ? <p>{pl ? `Najczęstszy rozpoznany motyw: ${t(`themes.${insights.topTheme.theme}`, insights.topTheme.theme)} (${insights.topTheme.count} błędów). Przejrzyj te pozycje i poszukaj podobnych zadań.` : `Most frequent identified theme: ${t(`themes.${insights.topTheme.theme}`, insights.topTheme.theme)} (${insights.topTheme.count} mistakes). Review those positions and practise similar puzzles.`}</p> : <p>{pl ? 'Zagraj i przeanalizuj więcej partii, aby uzyskać wskazówki oparte na powtarzających się błędach.' : 'Play and review more games to reveal recurring patterns for practice.'}</p>}
        <div className="flex flex-wrap gap-2"><Link className="btn btn-primary" to="/puzzles/mistakes">{pl ? 'Ćwicz własne błędy' : 'Practise your mistakes'}</Link><Link className="btn" to="/lessons">{pl ? 'Lekcje' : 'Lessons'}</Link><Link className="btn" to="/training">{pl ? 'Plan treningowy' : 'Training plan'}</Link></div>
      </Panel>
    </>}
  </section>
}
