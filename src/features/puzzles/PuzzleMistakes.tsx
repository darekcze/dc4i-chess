import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lightbulb, Eye, ArrowRight, MagnifyingGlass, ArrowCounterClockwise } from '@phosphor-icons/react'
import { Board } from '../../board/Board'
import { BoardLayout } from '../../board/BoardLayout'
import { Panel, Skeleton } from '../../ui/kit'
import { recordAttempt } from './puzzlesData'
import { usePuzzle } from './usePuzzle'
import { StatusBlock } from './PuzzleRated'
import { isGoodAlternative, mistakePuzzles, type MistakePuzzle } from './mistakes'

const words = {
  en: { due: 'Due', new: 'New', mastered: 'Mastered', complete: 'All exercises due now are complete.', early: 'No exercises are due now. You can practise early.', all: 'Practice all', allMode: 'Practising all exercises, including those not due yet.', scheduled: 'Practice due and new', method: 'Correct attempts schedule reviews after 1, 3, 7, 14 and 30 days. A mistake or hint resets progress. Extra successes on the same day do not advance it.' },
  pl: { due: 'Do powtórki', new: 'Nowe', mastered: 'Opanowane', complete: 'Wszystkie ćwiczenia na teraz są ukończone.', early: 'Nie ma teraz ćwiczeń do powtórki. Możesz ćwiczyć wcześniej.', all: 'Ćwicz wszystkie', allMode: 'Ćwiczysz wszystkie zadania, także te zaplanowane na później.', scheduled: 'Ćwicz zaległe i nowe', method: 'Poprawne próby planują powtórki po 1, 3, 7, 14 i 30 dniach. Błąd lub podpowiedź zeruje postęp. Kolejne sukcesy tego samego dnia go nie przyspieszają.' },
} as const

/** Replays the positions where the user went wrong in their reviewed games. */
export default function PuzzleMistakes() {
  const { t, i18n } = useTranslation()
  const text = i18n.resolvedLanguage?.toLowerCase().startsWith('pl') ? words.pl : words.en
  const nav = useNavigate()
  const [list, setList] = useState<MistakePuzzle[] | null>(null)
  const [all, setAll] = useState<MistakePuzzle[] | null>(null)
  const [practiceAll, setPracticeAll] = useState(false)
  const [i, setI] = useState(0)
  const [key, setKey] = useState(0)
  const recorded = useRef<string | null>(null)

  useEffect(() => {
    void mistakePuzzles().then((items) => {
      setAll(items)
      const scheduled = items.filter((p) => p.schedule?.status === 'due' || p.schedule?.status === 'new')
      setList(scheduled.length ? scheduled : items)
      setPracticeAll(!scheduled.length)
    })
  }, [])

  // a fresh object per attempt: usePuzzle restarts when the puzzle changes
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the retry counter
  const puzzle = useMemo(() => (list?.[i] ? { ...list[i] } : null), [list, i, key])
  const pz = usePuzzle(puzzle, {
    // the stored answer is one engine move; another one about as strong is right too
    acceptAlternative: (fen, uci) => (puzzle ? isGoodAlternative(fen, uci, puzzle.moves[1]) : Promise.resolve(false)),
    onDone: (solved) => {
      if (!puzzle || recorded.current === puzzle.id + key) return
      recorded.current = puzzle.id + key
      void recordAttempt(puzzle, solved, 'mistakes', false).then(() => mistakePuzzles()).then(setAll)
    },
  })
  const orientation = pz.solverColor === 'w' ? 'white' : 'black'
  const done = pz.status === 'solved' || pz.status === 'failed'
  const counts = { due: 0, new: 0, mastered: 0 }
  for (const item of all ?? []) {
    const status = item.schedule?.status
    if (status === 'due' || status === 'new' || status === 'mastered') counts[status]++
  }
  const start = (items: MistakePuzzle[], allMode: boolean) => {
    setList(items)
    setI(0)
    setKey((k) => k + 1)
    setPracticeAll(allMode)
  }

  if (list && !list.length)
    return (
      <div className="mx-auto max-w-md p-6">
        <Panel className="space-y-3 p-5">
          <h1 className="text-[19px] font-extrabold">{t('puzzles.mistakes')}</h1>
          <p className="text-fg-2">{t('puzzles.mistakesEmpty')}</p>
          <Link to="/games" className="btn btn-primary">
            {t('nav.games')}
          </Link>
        </Panel>
      </div>
    )

  return (
    <BoardLayout
      board={
        puzzle ? (
          <Board
            key={`${puzzle.id}-${key}`}
            fen={pz.fen}
            orientation={orientation}
            lastMove={pz.lastMove}
            highlights={pz.highlights}
            movable={pz.status === 'playing' ? orientation : 'none'}
            onMove={pz.onMove}
          />
        ) : (
          <Skeleton className="aspect-square w-full" />
        )
      }
      side={
        <Panel className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line p-4">
            <h1 className="text-[17px] font-extrabold">{t('puzzles.mistakes')}</h1>
            {list && (
              <span className="tabular ml-auto text-[13px] font-semibold text-fg-3">
                {i + 1} / {list.length}
              </span>
            )}
          </div>
          {all && (
            <div className="space-y-2 border-b border-line px-4 py-3 text-sm" aria-live="polite">
              <p>{text.due}: {counts.due} · {text.new}: {counts.new} · {text.mastered}: {counts.mastered}</p>
              <p className="text-fg-2">{text.method}</p>
              {!counts.due && !counts.new && <p>{done && !practiceAll ? text.complete : text.early}</p>}
              {practiceAll && <p>{text.allMode}</p>}
              <div className="flex flex-wrap gap-2">
                <button className="btn min-h-[44px]" onClick={() => start(all, true)}>{text.all}</button>
                {practiceAll && (counts.due + counts.new > 0) && (
                  <button className="btn min-h-[44px]" onClick={() => start(all.filter((p) => p.schedule?.status === 'due' || p.schedule?.status === 'new'), false)}>{text.scheduled}</button>
                )}
              </div>
            </div>
          )}
          <div className="flex min-h-[132px] items-center gap-3 p-4">
            <StatusBlock status={pz.status} color={pz.solverColor} />
          </div>
          {puzzle && (
            <p className="px-4 pb-3 text-[14px] text-fg-2">
              {t('puzzles.mistakeContext', { opponent: puzzle.opponent, san: puzzle.san, quality: t(`review.q.${puzzle.quality}`).toLocaleLowerCase() })}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
            {done ? (
              <>
                {list && i + 1 < list.length && (
                  <button
                    className="btn btn-primary btn-lg col-span-2"
                    onClick={() => {
                      setI(i + 1)
                      setKey((k) => k + 1)
                    }}
                  >
                    {t('puzzles.next')} <ArrowRight size={20} weight="bold" />
                  </button>
                )}
                <button className="btn min-h-[44px]" onClick={() => setKey((k) => k + 1)}>
                  <ArrowCounterClockwise size={20} weight="bold" /> {t('puzzles.retry')}
                </button>
                <button className="btn min-h-[44px]" onClick={() => puzzle && nav(`/review/${puzzle.gameId}`)}>
                  <MagnifyingGlass size={20} weight="bold" /> {t('puzzles.seeGame')}
                </button>
              </>
            ) : (
              <>
                <button className="btn min-h-[44px]" onClick={pz.hint} disabled={pz.status !== 'playing'}>
                  <Lightbulb size={20} weight="bold" /> {t('puzzles.hint')}
                </button>
                <button className="btn min-h-[44px]" onClick={pz.showSolution} disabled={pz.status === 'loading'}>
                  <Eye size={20} weight="bold" /> {t('puzzles.solution')}
                </button>
              </>
            )}
          </div>
        </Panel>
      }
    />
  )
}
