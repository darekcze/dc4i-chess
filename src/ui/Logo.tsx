import icon from '/icon.svg'

export function Logo({ size = 32 }: { size?: number }) {
  return <img src={icon} width={size} height={size} alt="" aria-hidden className="shrink-0" />
}
