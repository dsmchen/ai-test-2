import { useEffect, useRef, useState } from 'react'
import { TowerType } from '../game/types'
import { CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_MONEY, STARTING_LIVES } from '../game/constants'
import {
  createInitialState,
  spawnEnemy,
  placeTower,
  updateEnemies,
  updateTowers,
  updateProjectiles,
  checkWaveComplete,
  checkGameOver,
} from '../game/logic'
import { render } from '../game/renderer'
import HUD from './HUD'
import TowerSelector from './TowerSelector'

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [money, setMoney] = useState(STARTING_MONEY)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [wave, setWave] = useState(1)
  const [selectedTower, setSelectedTower] = useState<TowerType>('basic')
  const [gameOver, setGameOver] = useState<'won' | 'lost' | null>(null)
  const [waveStarted, setWaveStarted] = useState(false)

  const gameRef = useRef(createInitialState())

  const startWave = () => {
    const game = gameRef.current
    if (game.waveStarted || gameOver) return
    game.waveStarted = true
    setWaveStarted(true)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const gridX = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    const gridY = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2

    const game = gameRef.current
    if (placeTower(game, gridX, gridY, selectedTower)) {
      setMoney(game.money)
    }
  }

  const resetGame = () => {
    gameRef.current = createInitialState()
    setMoney(STARTING_MONEY)
    setLives(STARTING_LIVES)
    setWave(1)
    setWaveStarted(false)
    setGameOver(null)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = (timestamp: number) => {
      const game = gameRef.current

      if (!gameOver) {
        if (game.enemiesSpawned < 8 && timestamp - game.lastSpawn > 1500) {
          spawnEnemy(game)
          game.lastSpawn = timestamp
        }

        updateEnemies(game)
        updateTowers(game, timestamp)
        updateProjectiles(game)

        if (checkWaveComplete(game)) {
          setGameOver('won')
        } else if (game.wave !== wave) {
          setWave(game.wave)
          setWaveStarted(false)
        }

        if (checkGameOver(game)) {
          setGameOver('lost')
        }

        setMoney(game.money)
        setLives(game.lives)
      }

      render(ctx, game)
      game.animationId = requestAnimationFrame(gameLoop)
    }

    gameRef.current.animationId = requestAnimationFrame(gameLoop)

    const animationId = gameRef.current.animationId
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [gameOver, wave])

  return (
    <div className="flex flex-col items-center gap-4">
      <HUD money={money} lives={lives} wave={wave} />
      <TowerSelector selected={selectedTower} onSelect={setSelectedTower} />

      {!waveStarted && !gameOver && (
        <button onClick={startWave} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">
          Start Wave {wave}
        </button>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="border border-gray-600 cursor-crosshair"
      />

      {gameOver && (
        <div className="text-center">
          <p className={`text-2xl mb-2 ${gameOver === 'won' ? 'text-green-400' : 'text-red-400'}`}>
            {gameOver === 'won' ? 'You Won!' : 'Game Over'}
          </p>
          <button onClick={resetGame} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default Game
