import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowsClockwise, CaretRight, CheckCircle, Target, TrendDown, TrendUp } from '@phosphor-icons/react'
import { PageHeader, Panel, SkeletonText } from '../../ui/kit'
import { db, kvGet, kvSet } from '../../db/db'
import { fmtDecimal } from '../../i18n/format'
import { useSettings } from '../../settings'
import { coachPlan, coachPuzzleProgress } from './coach'
import { PHASES, TREND_GAMES, buildPlan, buildProfile, dayKey, dayProgress, planIsCurrent, weekStart, type PlanDay, type Profile, type WeeklyPlan } from './profile'

/** Below this many reviewed games the profile is mostly noise. */
const MIN_GAMES = 3
const PLAN_KEY = 'weeklyPlan'

export default function Training() {
  const { t } = useTranslation()
  const games = useLiveQuery(() => db.games.filter((g) => !g.deleted && !!g.review && !!g.userColor).toArray(), [])
  const profile = useMemo(() => (games ? buildProfile(games) : undefined), [games])
  const ready = !!profile && profile.games >= MIN_GAMES

  // the stored plan, live (a sync pull or another tab may write it) and only while it is this week's;
  // a new one is made once the profile can back it
  const stored = useLiveQuery(() => kvGet<WeeklyPlan | null>(PLAN_KEY, null), [])
  const plan = stored === undefined ? undefined : planIsCurrent(stored, new Date()) ? stored : null
  const makePlan = (p: Profile) => void kvSet(PLAN_KEY, buildPlan(p, new Date(), p.mistakes.length > 0))
  useEffect(() => {
    if (plan === null && profile && profile.games >= MIN_GAMES) void kvSet(PLAN_KEY, buildPlan(profile, new Date(), profile.mistakes.length > 0))
  }, [plan, profile])

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <PageHeader title={t('training.title')} />
      <div className="grid gap-4 px-4 lg:px-6">
        <DailyCoach />
        {!profile ? (
          <Panel className="space-y-3 p-4">
            <SkeletonText width="60%" />
            <SkeletonText width="80%" />
          </Panel>
        ) : !ready ? (
          <Panel className="flex flex-col items-start gap-3 p-5">
            <Target size={36} weight="duotone" className="text-accent" />
            <p className="text-fg-2">{t('training.empty', { count: MIN_GAMES })}</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/games" className="btn btn-primary">
                {t('training.toGames')}
              </Link>
              <Link to="/import" className="btn">
                {t('training.toImport')}
              </Link>
            </div>
          </Panel>
        ) : (
          <>
            <p className="text-fg-2">{t('training.basedOn', { count: profile.games, moves: profile.moves })}</p>
            <Weaknesses profile={profile} />
            {plan && <Plan plan={plan} onRedo={() => makePlan(profile)} />}
            <div className="grid gap-4 lg:grid-cols-2">
              <Phases profile={profile} />
              <Openings profile={profile} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Weaknesses({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  const lang = useSettings((s) => s.lang)
  const date = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' })
  return (
    <section>
      <h2 className="mb-2 text-[18px] font-extrabold">{t('training.weakTitle')}</h2>
      {profile.weaknesses.length === 0 ? (
        <Panel className="p-4 text-fg-2">{t('training.noThemes')}</Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {profile.weaknesses.map((w, i) => (
            <Panel key={w.theme} className="flex flex-col gap-2 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[17px] font-extrabold">
                  {i + 1}. {t(`themes.${w.theme}`, w.theme)}
                </span>
                <span className="tabular shrink-0 text-[13px] text-fg-3">{t('training.times', { count: w.count })}</span>
              </div>
              <ul className="space-y-1 text-[14px]">
                {w.examples.map((m) => (
                  <li key={`${m.gameId}:${m.ply}`}>
                    <Link to={`/review/${m.gameId}?ply=${m.ply}`} className="text-fg-2 underline-offset-2 hover:text-fg hover:underline">
                      {t('training.example', { date: date.format(m.date) })}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={`/puzzles/rated?theme=${w.theme}`} className="btn mt-auto">
                {t('training.train')}
              </Link>
            </Panel>
          ))}
        </div>
      )}
      {profile.trend && profile.trend.recent.per100 !== profile.trend.before.per100 && <Trend {...profile.trend} />}
    </section>
  )
}

function Trend({ recent, before }: NonNullable<Profile['trend']>) {
  const { t } = useTranslation()
  const better = recent.per100 < before.per100
  const Icon = better ? TrendDown : TrendUp
  return (
    <p className={`mt-3 flex items-center gap-2 text-[14px] ${better ? 'text-accent' : 'text-danger'}`}>
      <Icon size={20} weight="bold" className="shrink-0" />
      {t(better ? 'training.trendBetter' : 'training.trendWorse', { games: TREND_GAMES, recent: fmtDecimal(recent.per100), before: fmtDecimal(before.per100) })}
    </p>
  )
}

function Plan({ plan, onRedo }: { plan: WeeklyPlan; onRedo: () => void }) {
  const { t } = useTranslation()
  const lang = useSettings((s) => s.lang)
  const start = weekStart(new Date()).getTime()
  const attempts = useLiveQuery(() => db.puzzleAttempts.where('date').aboveOrEqual(start).toArray(), [start])
  const today = dayKey(new Date())
  const weekday = new Intl.DateTimeFormat(lang, { weekday: 'long' })
  const label = (d: PlanDay) => (d.theme === 'mistakes' ? t('training.mistakesDay') : t(`themes.${d.theme}`, d.theme))
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[18px] font-extrabold">{t('training.planTitle')}</h2>
        <button className="btn btn-ghost min-h-9 px-2 text-[14px]" onClick={onRedo}>
          <ArrowsClockwise size={18} weight="bold" /> {t('training.regenerate')}
        </button>
      </div>
      <Panel className="divide-y divide-line overflow-hidden">
        {plan.days.map((d) => {
          const done = Math.min(d.count, dayProgress(d, (attempts ?? []).filter((a) => !a.deleted)))
          const isToday = d.day === today
          const [y, m, day] = d.day.split('-').map(Number)
          return (
            <Link
              key={d.day}
              to={d.theme === 'mistakes' ? '/puzzles/mistakes' : `/puzzles/rated?theme=${d.theme}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-raise ${isToday ? 'bg-raise' : ''}`}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className="w-24 shrink-0 text-[13px] font-semibold capitalize text-fg-3">
                {isToday ? t('training.today') : weekday.format(new Date(y, m - 1, day))}
              </span>
              <span className="min-w-0 flex-1 truncate font-bold">{label(d)}</span>
              {done >= d.count ? (
                <CheckCircle size={22} weight="fill" className="shrink-0 text-accent" aria-label={t('training.dayDone')} />
              ) : (
                <span className="tabular shrink-0 text-[13px] text-fg-3">{t('training.progress', { done, count: d.count })}</span>
              )}
              <CaretRight size={18} className="shrink-0 text-fg-3" />
            </Link>
          )
        })}
      </Panel>
    </section>
  )
}

function Phases({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  const max = Math.max(1, ...PHASES.map((p) => profile.byPhase[p].per100))
  return (
    <Panel className="p-4">
      <h2 className="mb-1 font-extrabold">{t('training.phaseTitle')}</h2>
      <p className="mb-3 text-[13px] text-fg-3">{t('training.per100')}</p>
      <div className="space-y-2.5">
        {PHASES.map((p) => {
          const r = profile.byPhase[p]
          return (
            <div key={p}>
              <div className="flex justify-between text-[14px]">
                <span className="font-semibold">{t(`themes.${p}`)}</span>
                <span className="tabular text-fg-2">{r.moves ? fmtDecimal(r.per100) : '–'}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel-2">
                <div className="h-full origin-left rounded-full bg-accent" style={{ transform: `scaleX(${r.per100 / max})` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function Openings({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  return (
    <Panel className="p-4">
      <h2 className="mb-1 font-extrabold">{t('training.openingTitle')}</h2>
      <p className="mb-3 text-[13px] text-fg-3">{t('training.per100')}</p>
      {profile.byOpening.length === 0 ? (
        <p className="text-[14px] text-fg-2">{t('training.noOpenings')}</p>
      ) : (
        <ul className="divide-y divide-line text-[14px]">
          {profile.byOpening.slice(0, 5).map((o) => (
            <li key={o.name} className="flex items-baseline gap-2 py-2">
              <span className="min-w-0 flex-1 truncate font-semibold">{o.name}</span>
              <span className="tabular shrink-0 text-[12px] text-fg-3">{t('training.games', { count: o.games })}</span>
              <span className="tabular w-10 shrink-0 text-right text-fg-2">{fmtDecimal(o.per100)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

/** A local, transparent coaching routine based on reviewed completed Chess.com imports. */
function DailyCoach() {
  const lang = useSettings((s) => s.lang)
  const pl = String(lang) === 'pl'
  const { t } = useTranslation()
  const today = dayKey(new Date())
  const games = useLiveQuery(() => db.games.filter((g) => !g.deleted && g.source === 'chesscom' && g.result !== '*' && !!g.review && !!g.userColor).toArray(), [])
  const progress = useLiveQuery(() => kvGet<Record<string, boolean>>(`coach:${today}`, {}), [today])
  const attempts = useLiveQuery(() => db.puzzleAttempts.toArray(), [])
  const profile = useMemo(() => games ? buildProfile(games) : undefined, [games])
  const plan = profile ? coachPlan(profile) : null
  const done = (key: string, value: boolean) => void kvSet(`coach:${today}`, { ...progress, [key]: value })
  return <section aria-labelledby="daily-coach-title">
    <Panel className="grid gap-3 p-5">
      <h2 id="daily-coach-title" className="text-[20px] font-extrabold">{pl ? 'Trener na dziś' : 'Your daily coach'}</h2>
      <p className="text-sm text-fg-2">{pl ? 'Plan powstaje lokalnie z przeanalizowanych, zakończonych partii Chess.com. To reguły treningowe, nie model AI.' : 'A local rules-based plan from your reviewed, completed Chess.com games. No AI model is used.'}</p>
      {!profile ? <SkeletonText width="60%" /> : profile.games === 0 ? <>
        <p>{pl ? 'Zaimportuj zakończone partie, a następnie uruchom ich analizę i wskaż swój kolor.' : 'Import completed games, then review them and identify your colour.'}</p>
        <div className="flex flex-wrap gap-2"><Link className="btn btn-primary" to="/import">{pl ? 'Importuj partie' : 'Import games'}</Link><Link className="btn" to="/games">{pl ? 'Moje partie' : 'My games'}</Link></div>
      </> : <>
        <p className="text-sm text-fg-2">{pl ? `Przeanalizowane partie: ${profile.games}.` : `Reviewed games: ${profile.games}.`} {plan?.theme ? (pl ? `Najczęstszy motyw: ${t(`themes.${plan.theme}`, plan.theme)} (${plan.count}).` : `Top theme: ${t(`themes.${plan.theme}`, plan.theme)} (${plan.count}).`) : (pl ? 'Nie wykryto jeszcze motywu taktycznego.' : 'No tactical theme detected yet.')}</p>
        <ol className="grid gap-3 list-decimal pl-5">
          <li><p>{pl ? 'Obejrzyj pozycję i przed odczytaniem analizy znajdź ruch przeciwnika oraz własną odpowiedź.' : "Study the position and find the opponent's threat and your reply before reading the analysis."}</p>
            {plan?.example ? <Link className="btn mt-2" to={`/review/${plan.example.gameId}?ply=${plan.example.ply}`}>{pl ? 'Otwórz pozycję z partii' : 'Open position in review'}</Link> : <Link className="btn mt-2" to="/games">{pl ? 'Przejrzyj partie' : 'Review games'}</Link>}
            <label className="mt-2 flex gap-2"><input type="checkbox" checked={!!progress?.review} onChange={(e) => done('review', e.target.checked)} />{pl ? 'Samodzielnie przeanalizowano' : 'I studied the position'}</label>
          </li>
          <li><p>{pl ? 'Rozwiąż trzy zadania z tego motywu. Po błędzie wróć i spróbuj ponownie.' : 'Solve three puzzles on this theme. After a mistake, return and try again.'}</p>
            {plan?.theme ? <><Link className="btn mt-2" to={`/puzzles/rated?theme=${plan.theme}`}>{pl ? 'Ćwicz motyw' : 'Practise theme'}</Link><p aria-live="polite" className="mt-1 text-sm">{pl ? 'Rozwiązane dziś' : 'Solved today'}: {Math.min(3, coachPuzzleProgress(plan.theme, today, attempts ?? []))}/3</p></> : <Link className="btn mt-2" to="/puzzles">{pl ? 'Otwórz zadania' : 'Open puzzles'}</Link>}
          </li>
          <li><p>{pl ? 'Utrwal zasadę na lekcji, a następnie zapisz w pamięci, co sprawdzisz przed kolejnym ruchem.' : 'Reinforce the idea in a lesson, then decide what to check before your next move.'}</p><Link className="btn mt-2" to={`/lessons/${plan?.lesson ?? 'hanging-pieces'}`}>{pl ? 'Otwórz lekcję' : 'Open lesson'}</Link>
            <label className="mt-2 flex gap-2"><input type="checkbox" checked={!!progress?.lesson} onChange={(e) => done('lesson', e.target.checked)} />{pl ? 'Lekcja i refleksja ukończone' : 'Lesson and reflection complete'}</label>
          </li>
        </ol>
        <p className="text-xs text-fg-3">{pl ? 'Pola zaznaczasz samodzielnie. Wyniki zadań są liczone automatycznie i zapisywane na urządzeniu.' : 'You check the boxes yourself. Puzzle results are counted automatically and saved on this device.'}</p>
      </>}
    </Panel>
  </section>
}
