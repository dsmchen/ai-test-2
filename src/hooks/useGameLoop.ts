import { useEffect, useRef } from 'react'
import { GameState, TowerType, Difficulty } from '../game/types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, ENEMIES_PER_WAVE, SPAWN_INTERVAL } from '../game/constants'
import {
  spawnEnemy,
  updateEnemies,
  updateTowers,
  updateProjectiles,
  checkWaveComplete,
  checkGameOver,
} from '../game/logic'
import { render } from '../game/renderer'
import { MutableRefObject } from 'react'

interface UseGameLoopOptions {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>
  gameRef: MutableRefObject<GameState>
  phase: string
  gameOverRef: MutableRefObject<'won' | 'lost' | null>
  waveRef: MutableRefObject<number>
  difficultyRef: MutableRefObject<Difficulty>
  gameSpeedRef: MutableRefObject<number>
  selectedTowerRef: MutableRefObject<TowerType>
  hoverPosRef: MutableRefObject<{ x: number; y: number } | null>
  placementValidRef: MutableRefObject<'money' | 'tower' | 'path' | null>
  selectedPlacedTowerIdRef: MutableRefObject<number | null>
}

export function useGameLoop({
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
}: UseGameLoopOptions) {
  const animationIdRef = useRef(0)

  useEffect(() => {
    if (phase !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    let cancelled = false

    render(ctx, gameRef.current, null, selectedTowerRef.current, null, null)

    const gameLoop = (timestamp: number) => {
      if (cancelled) return
      const game = gameRef.current

      if (game.lastTimestamp > 0) {
        game.deltaTime = Math.min(timestamp - game.lastTimestamp, 50)
      }
      game.lastTimestamp = timestamp
      game.gameSpeed = gameSpeedRef.current

      if (!gameOverRef.current && !game.paused) {
        if (game.enemiesSpawned < ENEMIES_PER_WAVE && timestamp - game.lastSpawn > SPAWN_INTERVAL / gameSpeedRef.current) {
          spawnEnemy(game, difficultyRef.current)
          game.lastSpawn = timestamp
        }

        updateEnemies(game, timestamp)
        updateTowers(game, timestamp)
        updateProjectiles(game)

        if (checkWaveComplete(game)) {
          gameOverRef.current = 'won'
        } else if (game.wave !== waveRef.current) {
          waveRef.current = game.wave
          game.waveStarted = false
        }

        if (checkGameOver(game)) {
          gameOverRef.current = 'lost'
        }
      }

      render(ctx, game, hoverPosRef.current, selectedTowerRef.current, placementValidRef.current, selectedPlacedTowerIdRef.current)
      animationIdRef.current = requestAnimationFrame(gameLoop)
    }

    animationIdRef.current = requestAnimationFrame(gameLoop)

    return () => {
      cancelled = true
      cancelAnimationFrame(animationIdRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])
}
