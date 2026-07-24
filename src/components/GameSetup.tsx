import { Difficulty } from '../game/types'

interface GameSetupProps {
  difficulty: Difficulty
  onSelectDifficulty: (d: Difficulty) => void
  onStartGame: () => void
}

const DIFFICULTIES: { key: Difficulty; color: string; label: string; desc: string }[] = [
  { key: 'easy', color: '#166534', label: 'Easy', desc: '0.7x stats' },
  { key: 'medium', color: '#92400e', label: 'Medium', desc: '1x stats' },
  { key: 'hard', color: '#991b1b', label: 'Hard', desc: '1.5x stats' },
]

function GameSetup({ difficulty, onSelectDifficulty, onStartGame }: GameSetupProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="flex flex-col items-center gap-4">
        <span className="text-gray-300">Select Difficulty</span>
        <div className="flex items-center gap-3">
          {DIFFICULTIES.map(({ key, color, label, desc }) => (
            <button
              key={key}
              onClick={() => onSelectDifficulty(key)}
              aria-pressed={difficulty === key}
              style={{
                backgroundColor: difficulty === key ? color : '#374151',
                color: '#fff',
              }}
              className="px-6 py-3 rounded-lg capitalize hover:opacity-80 flex flex-col items-center min-w-[100px]"
            >
              <span className="font-semibold">{label}</span>
              <span className="text-xs text-gray-300">{desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div
        className="p-[2px] rounded-[5px]"
        style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
      >
        <button
          onClick={onStartGame}
          className="px-8 py-3 bg-gray-800 text-white hover:bg-gray-700 rounded-[5px] text-lg font-semibold"
        >
          Start Game
        </button>
      </div>
    </div>
  )
}

export default GameSetup
