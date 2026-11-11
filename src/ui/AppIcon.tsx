import {
  House, Horse, PuzzlePiece, Books, BookOpen, MagnifyingGlass, FolderOpen,
  TrayArrowDown, ChartBar, Gear, Lightning, CalendarBlank, Trophy,
} from '@phosphor-icons/react'

/** A consistent, accessible decorative icon set; link text supplies its name. */
const ICONS = {
  home: House, play: Horse, puzzles: PuzzlePiece, learn: Books, openings: BookOpen,
  analysis: MagnifyingGlass, games: FolderOpen, import: TrayArrowDown, profile: ChartBar,
  settings: Gear, rush: Lightning, daily: CalendarBlank, trophy: Trophy,
} as const

export type AppIconName = keyof typeof ICONS

export function AppIcon({ name, size = 24, className = '' }: { name: AppIconName; size?: number; className?: string }) {
  const Icon = ICONS[name]
  return <Icon size={size} weight="duotone" aria-hidden="true" className={`shrink-0 ${className}`} />
}
