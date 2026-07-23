import { useEffect, useRef, useState, useCallback } from 'react'
import { Tower, TowerType, Difficulty } from '../game/types'
import { CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_MONEY, STARTING_LIVES } from '../game/constants'
import {
  createInitialState,
  placeTower,
  canPlaceTower,
  upgradeTower,
  sellTower,
} from '../game/logic'
import { useGameLoop } from '../hooks/useGameLoop'
import HUD from './HUD'
import TowerSelector from './TowerSelector'
import GameSetup from './GameSetup'
import GameControls from './GameControls'
import TowerInfo from './TowerInfo'
import GameOverOverlay from './GameOverOverlay'

interface Toast {
  message: string
  type: 'error' | 'success'
}

const TOAST_MESSAGES: Record<string, string> = {
  money: 'Not enough money',
  tower: 'Too close to another tower',
  path: 'Too close to the path',
}

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'setup' | 'playing'>('setup')
  const [money, setMoney] = useState(STARTING_MONEY)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [wave, setWave] = useState(1)
  const [selectedTower, setSelectedTower] = useState<TowerType>('basic')
  const [selectedPlacedTower, setSelectedPlacedTower] = useState<Tower | null>(null)
  const [gameOver, setGameOver] = useState<'won' | 'lost' | null>(null)
  const [waveStarted, setWaveStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [placementValid, setPlacementValid] = useState<'money' | 'tower' | 'path' | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [gameSpeed, setGameSpeed] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null)
  const placementValidRef = useRef<'money' | 'tower' | 'path' | null>(null)
  const gameOverRef = useRef(gameOver)
  const waveRef = useRef(wave)
  const difficultyRef = useRef(difficulty)
  const selectedTowerRef = useRef(selectedTower)
  const gameSpeedRef = useRef(gameSpeed)
  const moneyRef = useRef(money)
  const livesRef = useRef(lives)
  const phaseRef = useRef(phase)
  const selectedPlacedTowerIdRef = useRef<number | null>(null)

  const gameRef = useRef(createInitialState())

  useEffect(() => { gameOverRef.current = gameOver }, [gameOver])
  useEffect(() => { waveRef.current = wave }, [wave])
  useEffect(() => { difficultyRef.current = difficulty }, [difficulty])
  useEffect(() => { selectedTowerRef.current = selectedTower }, [selectedTower])
  useEffect(() => { gameSpeedRef.current = gameSpeed }, [gameSpeed])
  useEffect(() => { moneyRef.current = money }, [money])
  useEffect(() => { livesRef.current = lives }, [lives])
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { selectedPlacedTowerIdRef.current = selectedPlacedTower?.id ?? null }, [selectedPlacedTower])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== 'playing') return
    const game = gameRef.current
    if (game.money !== money) setMoney(game.money)
    if (game.lives !== lives) setLives(game.lives)
    if (game.wave !== wave) setWave(game.wave)
    if (gameOverRef.current !== gameOver) setGameOver(gameOverRef.current)
    if (!game.waveStarted && waveStarted) setWaveStarted(false)
  })

  const startGame = () => {
    gameRef.current = createInitialState()
    setMoney(STARTING_MONEY)
    setLives(STARTING_LIVES)
    setWave(1)
    setWaveStarted(false)
    setGameOver(null)
    setSelectedPlacedTower(null)
    setGameSpeed(1)
    setIsPaused(false)
    setPhase('playing')
  }

  const startWave = () => {
    const game = gameRef.current
    if (game.waveStarted || gameOver) return
    game.waveStarted = true
    setWaveStarted(true)
  }

  const showToast = useCallback((message: string, type: 'error' | 'success') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ message, type })
    toastTimeout.current = setTimeout(() => setToast(null), 1500)
  }, [])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const game = gameRef.current
    const clickedTower = game.towers.find(t => {
      const dx = t.x - x
      const dy = t.y - y
      return Math.sqrt(dx * dx + dy * dy) < CELL_SIZE / 2
    })

    if (clickedTower) {
      setSelectedPlacedTower(clickedTower)
      return
    }

    setSelectedPlacedTower(null)
    const gridX = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    const gridY = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2

    if (placeTower(game, gridX, gridY, selectedTower)) {
      setMoney(game.money)
      showToast('Tower placed!', 'success')
    } else {
      const reason = canPlaceTower(game, gridX, gridY, selectedTower)
      if (reason) {
        showToast(TOAST_MESSAGES[reason], 'error')
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const gridX = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    const gridY = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    const pos = { x: gridX, y: gridY }
    const valid = gameOver ? null : canPlaceTower(gameRef.current, gridX, gridY, selectedTower)
    setHoverPos(pos)
    setPlacementValid(valid)
    hoverPosRef.current = pos
    placementValidRef.current = valid
  }

  const handleMouseLeave = () => {
    setHoverPos(null)
    setPlacementValid(null)
    hoverPosRef.current = null
    placementValidRef.current = null
  }

  const handleUpgrade = useCallback(() => {
    if (!selectedPlacedTower) return
    const game = gameRef.current
    if (upgradeTower(game, selectedPlacedTower.id)) {
      setMoney(game.money)
      setSelectedPlacedTower({ ...selectedPlacedTower, level: selectedPlacedTower.level + 1 })
    }
  }, [selectedPlacedTower])

  const handleSell = useCallback(() => {
    if (!selectedPlacedTower) return
    const game = gameRef.current
    if (sellTower(game, selectedPlacedTower.id)) {
      setMoney(game.money)
      setSelectedPlacedTower(null)
    }
  }, [selectedPlacedTower])

  const togglePause = useCallback(() => {
    const game = gameRef.current
    game.paused = !game.paused
    setIsPaused(game.paused)
  }, [])

  const cycleSpeed = useCallback(() => {
    setGameSpeed(prev => prev === 1 ? 2 : prev === 2 ? 3 : 1)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePause()
          break
        case '>':
        case '.':
          cycleSpeed()
          break
        case '1':
          setSelectedTower('basic')
          break
        case '2':
          setSelectedTower('sniper')
          break
        case '3':
          setSelectedTower('splash')
          break
        case '4':
          setSelectedTower('slow')
          break
        case 'Escape':
          setSelectedPlacedTower(null)
          break
        case 'u':
        case 'U':
          handleUpgrade()
          break
        case 's':
        case 'S':
          handleSell()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameOver, togglePause, cycleSpeed, handleUpgrade, handleSell])

  const resetGame = () => {
    gameRef.current = createInitialState()
    setMoney(STARTING_MONEY)
    setLives(STARTING_LIVES)
    setWave(1)
    setWaveStarted(false)
    setGameOver(null)
    setSelectedPlacedTower(null)
    setGameSpeed(1)
    setIsPaused(false)
    setPhase('setup')
  }

  useGameLoop({
    canvasRef,
    gameRef,
    phase,
    gameOverRef,
    waveRef,
    difficultyRef,
    gameSpeedRef,
    selectedTowerRef,
    hoverPosRef,
    placementValidRef,
    selectedPlacedTowerIdRef,
  })

  const cursorClass = gameOver
    ? 'cursor-default'
    : hoverPos
      ? placementValid === null
        ? 'cursor-pointer'
        : 'cursor-not-allowed'
      : 'cursor-crosshair'

  if (phase === 'setup') {
    return (
      <GameSetup
        difficulty={difficulty}
        onSelectDifficulty={setDifficulty}
        onStartGame={startGame}
      />
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="sr-only" role="status" aria-live="polite">
        {gameOver === 'won' && 'You won the game!'}
        {gameOver === 'lost' && 'Game over. You lost.'}
        {!gameOver && waveStarted && `Wave ${wave} in progress`}
        {!gameOver && !waveStarted && `Ready to start wave ${wave}`}
      </div>
      <HUD money={money} lives={lives} wave={wave} />
      {!gameOver && (
        <TowerSelector selected={selectedTower} onSelect={setSelectedTower} money={money} />
      )}

      {!waveStarted && !gameOver && (
        <div
          className="p-[2px] rounded-[5px]"
          style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
        >
          <button
            onClick={startWave}
            className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-[5px]"
          >
            Start Wave {wave}
          </button>
        </div>
      )}

      {waveStarted && !gameOver && (
        <GameControls
          isPaused={isPaused}
          onTogglePause={togglePause}
          gameSpeed={gameSpeed}
          onCycleSpeed={cycleSpeed}
        />
      )}

      <div
        className="relative p-[3px] rounded-[5px]"
        style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: '#1a1a2e' }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label="Game board"
          className={`rounded-[5px] block ${cursorClass}`}
        />

        {gameOver && (
          <GameOverOverlay result={gameOver} onPlayAgain={resetGame} />
        )}
      </div>

      {toast && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 bottom-4 px-4 py-2 rounded text-sm text-white z-10 animate-slide-up ${
            toast.type === 'error' ? 'bg-red-700' : 'bg-green-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {selectedPlacedTower && !gameOver && (
        <TowerInfo
          tower={selectedPlacedTower}
          money={money}
          onUpgrade={handleUpgrade}
          onSell={handleSell}
        />
      )}
    </div>
  )
}

export default Game
