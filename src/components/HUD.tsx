import { TOTAL_WAVES } from '../game/constants'

interface HUDProps {
  money: number
  lives: number
  wave: number
}

function HUD({ money, lives, wave }: HUDProps) {
  return (
    <div className="flex gap-4 text-lg" aria-label="Game status">
      <span aria-label={`Money: ${money}`}><span aria-hidden="true">💰</span> {money}</span>
      <span aria-label={`Lives: ${lives}`}><span aria-hidden="true">❤️</span> {lives}</span>
      <span aria-label={`Wave ${wave} of ${TOTAL_WAVES}`}><span aria-hidden="true">🌊</span> Wave {wave}/{TOTAL_WAVES}</span>
    </div>
  )
}

export default HUD
