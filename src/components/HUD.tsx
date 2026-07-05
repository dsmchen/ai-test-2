interface HUDProps {
  money: number
  lives: number
  wave: number
}

function HUD({ money, lives, wave }: HUDProps) {
  return (
    <div className="flex gap-4 text-lg">
      <span>💰 {money}</span>
      <span>❤️ {lives}</span>
      <span>🌊 Wave {wave}/3</span>
    </div>
  )
}

export default HUD
