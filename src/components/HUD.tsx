import { TOTAL_WAVES } from '../game/constants'

interface HUDProps {
  money: number
  lives: number
  wave: number
}

function HUD({ money, lives, wave }: HUDProps) {
  return (
    <div className="flex gap-4 text-lg" aria-label="Game status">
      <span>💰 {money}</span>
      <span>❤️ {lives}</span>
      <span>🌊 Wave {wave}/{TOTAL_WAVES}</span>
    </div>
  )
}

export default HUD
