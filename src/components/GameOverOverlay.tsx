import { useEffect, useRef } from 'react'

interface GameOverOverlayProps {
  result: 'won' | 'lost'
  onPlayAgain: () => void
}

function GameOverOverlay({ result, onPlayAgain }: GameOverOverlayProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    buttonRef.current?.focus()
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={result === 'won' ? 'You won the game' : 'Game over'}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 rounded-[5px] animate-fade-in"
    >
      <div className="text-center animate-slide-up">
        <p className={`text-3xl font-bold mb-4 ${result === 'won' ? 'text-green-300' : 'text-red-300'}`}>
          {result === 'won' ? 'You Won!' : 'Game Over'}
        </p>
        <div
          className="p-[2px] rounded-[5px] inline-block"
          style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
        >
          <button ref={buttonRef} onClick={onPlayAgain} className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-[5px]">
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOverOverlay
