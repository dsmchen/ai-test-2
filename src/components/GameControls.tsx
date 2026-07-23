interface GameControlsProps {
  isPaused: boolean
  onTogglePause: () => void
  gameSpeed: number
  onCycleSpeed: () => void
}

function GameControls({ isPaused, onTogglePause, gameSpeed, onCycleSpeed }: GameControlsProps) {
  return (
    <div className="flex items-center gap-2 min-h-[36px]">
      <button
        onClick={onTogglePause}
        className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
      >
        {isPaused ? '▶ Resume' : '⏸ Pause'}
      </button>
      <button
        onClick={onCycleSpeed}
        className={`px-3 py-1 rounded text-sm text-white ${
          gameSpeed > 1 ? 'bg-gray-500 hover:bg-gray-400' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        {gameSpeed}x
      </button>
      <span className="relative group">
        <button
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          aria-label="Keyboard shortcuts"
        >
          ?
        </button>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus-within:block bg-gray-800 text-gray-300 text-xs rounded px-3 py-2 whitespace-nowrap z-20 border border-gray-600">
          <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">Space</kbd> pause/resume<br/>
          <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">&gt;</kbd> cycle speed<br/>
          <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">1-4</kbd> select tower<br/>
          <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">Esc</kbd> deselect<br/>
          <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">U</kbd> upgrade<br/>
          <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">S</kbd> sell
        </span>
      </span>
    </div>
  )
}

export default GameControls
