import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createInitialState,
  spawnEnemy,
  placeTower,
  updateEnemies,
  updateTowers,
  updateProjectiles,
  checkWaveComplete,
  checkGameOver,
} from './logic'
import { ENEMIES_PER_WAVE, TOWER_STATS, CELL_SIZE, STARTING_MONEY, STARTING_LIVES, PATH } from './constants'
import { GameState } from './types'

function makeGame(overrides?: Partial<GameState>): GameState {
  const game = createInitialState()
  Object.assign(game, overrides)
  return game
}

function makeEnemy(overrides?: { id?: number; x?: number; y?: number; health?: number; pathIndex?: number; speed?: number; reward?: number; type?: 'normal' | 'fast' | 'tank' | 'boss' }) {
  return {
    id: overrides?.id ?? 1,
    type: overrides?.type ?? 'normal',
    x: overrides?.x ?? PATH[0].x,
    y: overrides?.y ?? PATH[0].y,
    health: overrides?.health ?? 80,
    maxHealth: overrides?.health ?? 80,
    speed: overrides?.speed ?? 0.8,
    pathIndex: overrides?.pathIndex ?? 0,
    reward: overrides?.reward ?? 15,
  }
}

function makeTower(overrides?: { id?: number; type?: 'basic' | 'sniper' | 'splash' | 'slow'; x?: number; y?: number; level?: number; lastFired?: number }) {
  return {
    id: overrides?.id ?? 1,
    type: overrides?.type ?? 'basic',
    x: overrides?.x ?? 100,
    y: overrides?.y ?? 100,
    level: overrides?.level ?? 1,
    lastFired: overrides?.lastFired ?? 0,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createInitialState', () => {
  it('returns correct default values', () => {
    const game = createInitialState()
    expect(game.towers).toEqual([])
    expect(game.enemies).toEqual([])
    expect(game.projectiles).toEqual([])
    expect(game.money).toBe(STARTING_MONEY)
    expect(game.lives).toBe(STARTING_LIVES)
    expect(game.wave).toBe(1)
    expect(game.enemiesSpawned).toBe(0)
    expect(game.waveStarted).toBe(false)
  })
})

describe('spawnEnemy', () => {
  it('does nothing if wave has not started', () => {
    const game = makeGame()
    spawnEnemy(game)
    expect(game.enemies).toHaveLength(0)
  })

  it('does nothing if all enemies already spawned', () => {
    const game = makeGame({ waveStarted: true, enemiesSpawned: ENEMIES_PER_WAVE })
    spawnEnemy(game)
    expect(game.enemies).toHaveLength(0)
  })

  it('spawns an enemy at the path start', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = makeGame({ waveStarted: true })
    spawnEnemy(game)
    expect(game.enemies).toHaveLength(1)
    expect(game.enemies[0].x).toBe(PATH[0].x)
    expect(game.enemies[0].y).toBe(PATH[0].y)
    expect(game.enemies[0].type).toBe('normal')
    expect(game.enemiesSpawned).toBe(1)
  })

  it('spawns enemies with valid stats', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = makeGame({ waveStarted: true })
    spawnEnemy(game)
    const enemy = game.enemies[0]
    expect(enemy.health).toBeGreaterThan(0)
    expect(enemy.maxHealth).toBe(enemy.health)
    expect(enemy.speed).toBeGreaterThan(0)
    expect(enemy.reward).toBeGreaterThan(0)
  })

  it('selects enemy type based on Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const game = makeGame({ waveStarted: true })
    spawnEnemy(game)
    expect(game.enemies[0].type).toBe('tank')
  })

  it('spawns boss on wave 3 when last enemy', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const game = makeGame({ waveStarted: true, wave: 3, enemiesSpawned: ENEMIES_PER_WAVE - 1 })
    spawnEnemy(game)
    expect(game.enemies[0].type).toBe('boss')
  })

  it('does not spawn boss on wave 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const game = makeGame({ waveStarted: true, wave: 1, enemiesSpawned: ENEMIES_PER_WAVE - 1 })
    spawnEnemy(game)
    expect(game.enemies[0].type).not.toBe('boss')
  })
})

describe('placeTower', () => {
  it('places a tower and deducts cost', () => {
    const game = makeGame({ money: 200 })
    const placed = placeTower(game, 100, 100, 'basic')
    expect(placed).toBe(true)
    expect(game.towers).toHaveLength(1)
    expect(game.towers[0].type).toBe('basic')
    expect(game.money).toBe(200 - TOWER_STATS.basic.cost)
  })

  it('returns false when not enough money', () => {
    const game = makeGame({ money: 0 })
    const placed = placeTower(game, 100, 100, 'basic')
    expect(placed).toBe(false)
    expect(game.towers).toHaveLength(0)
  })

  it('succeeds when money equals cost exactly', () => {
    const game = makeGame({ money: TOWER_STATS.basic.cost })
    const placed = placeTower(game, 100, 100, 'basic')
    expect(placed).toBe(true)
    expect(game.money).toBe(0)
  })

  it('returns false when tower is too close to another', () => {
    const game = makeGame({ money: 500 })
    placeTower(game, 100, 100, 'basic')
    const placed = placeTower(game, 100 + CELL_SIZE - 1, 100, 'basic')
    expect(placed).toBe(false)
    expect(game.towers).toHaveLength(1)
  })

  it('allows placement at exactly CELL_SIZE distance', () => {
    const game = makeGame({ money: 500 })
    placeTower(game, 100, 100, 'basic')
    const placed = placeTower(game, 100 + CELL_SIZE, 100, 'basic')
    expect(placed).toBe(true)
    expect(game.towers).toHaveLength(2)
  })

  it('allows placement when towers are far enough apart', () => {
    const game = makeGame({ money: 500 })
    placeTower(game, 100, 100, 'basic')
    const placed = placeTower(game, 500, 500, 'basic')
    expect(placed).toBe(true)
    expect(game.towers).toHaveLength(2)
  })
})

describe('updateEnemies', () => {
  it('moves enemies toward the next path point', () => {
    const game = makeGame({
      enemies: [makeEnemy({ x: PATH[0].x, y: PATH[0].y, pathIndex: 0, speed: 0.8 })],
    })
    updateEnemies(game)
    expect(game.enemies[0].x).toBeGreaterThan(PATH[0].x)
  })

  it('increments pathIndex when enemy is close enough to next point', () => {
    const game = makeGame({
      enemies: [makeEnemy({ x: PATH[1].x - 1, y: PATH[1].y, pathIndex: 0, speed: 0.8 })],
    })
    updateEnemies(game)
    expect(game.enemies[0].pathIndex).toBe(1)
  })

  it('reduces lives and removes enemy when reaching the end', () => {
    const lastIdx = PATH.length - 1
    const game = makeGame({
      enemies: [makeEnemy({ x: PATH[lastIdx].x, y: PATH[lastIdx].y, pathIndex: lastIdx })],
    })
    updateEnemies(game)
    expect(game.lives).toBe(STARTING_LIVES - 1)
    expect(game.enemies).toHaveLength(0)
  })

  it('moves multiple enemies independently', () => {
    const game = makeGame({
      enemies: [
        makeEnemy({ id: 1, x: PATH[0].x, y: PATH[0].y, pathIndex: 0, speed: 0.8 }),
        makeEnemy({ id: 2, x: PATH[0].x, y: PATH[0].y, pathIndex: 0, speed: 1.5 }),
      ],
    })
    updateEnemies(game)
    expect(game.enemies).toHaveLength(2)
    const e1 = game.enemies.find(e => e.id === 1)!
    const e2 = game.enemies.find(e => e.id === 2)!
    expect(e2.x - PATH[0].x).toBeGreaterThan(e1.x - PATH[0].x)
  })

  it('multiple enemies reaching end reduces lives for each', () => {
    const lastIdx = PATH.length - 1
    const game = makeGame({
      enemies: [
        makeEnemy({ id: 1, x: PATH[lastIdx].x, y: PATH[lastIdx].y, pathIndex: lastIdx }),
        makeEnemy({ id: 2, x: PATH[lastIdx].x, y: PATH[lastIdx].y, pathIndex: lastIdx }),
      ],
    })
    updateEnemies(game)
    expect(game.lives).toBe(STARTING_LIVES - 2)
    expect(game.enemies).toHaveLength(0)
  })
})

describe('updateTowers', () => {
  it('creates a projectile when enemy is in range', () => {
    const game = makeGame({
      towers: [makeTower()],
      enemies: [makeEnemy({ id: 2, x: 150, y: 100 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles).toHaveLength(1)
    expect(game.projectiles[0].targetId).toBe(2)
  })

  it('does not fire if cooldown has not elapsed', () => {
    const game = makeGame({
      towers: [makeTower({ lastFired: 1000 })],
      enemies: [makeEnemy({ id: 2, x: 150, y: 100 })],
    })
    updateTowers(game, 1500)
    expect(game.projectiles).toHaveLength(0)
  })

  it('does not fire at out-of-range enemies', () => {
    const game = makeGame({
      towers: [makeTower()],
      enemies: [makeEnemy({ id: 2, x: 500, y: 500 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles).toHaveLength(0)
  })

  it('multiple towers fire independently', () => {
    const game = makeGame({
      towers: [makeTower({ id: 1, x: 100 }), makeTower({ id: 2, x: 400 })],
      enemies: [makeEnemy({ id: 3, x: 150, y: 100 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles).toHaveLength(1)
    expect(game.projectiles[0].targetId).toBe(3)
  })

  it('tower targets closest enemy in range', () => {
    const game = makeGame({
      towers: [makeTower()],
      enemies: [
        makeEnemy({ id: 2, x: 150, y: 100 }),
        makeEnemy({ id: 3, x: 170, y: 100 }),
      ],
    })
    updateTowers(game, 2000)
    expect(game.projectiles).toHaveLength(1)
    expect(game.projectiles[0].targetId).toBe(2)
  })

  it('does not fire with no enemies', () => {
    const game = makeGame({
      towers: [makeTower()],
    })
    updateTowers(game, 2000)
    expect(game.projectiles).toHaveLength(0)
  })
})

describe('updateProjectiles', () => {
  it('deals damage when projectile reaches target', () => {
    const game = makeGame({
      enemies: [makeEnemy({ id: 2, x: 100, y: 100, health: 80 })],
      projectiles: [{ id: 3, x: 105, y: 100, targetId: 2, damage: 10, speed: 5 }],
    })
    updateProjectiles(game)
    expect(game.enemies[0].health).toBe(70)
  })

  it('removes projectile after hitting', () => {
    const game = makeGame({
      enemies: [makeEnemy({ id: 2, x: 100, y: 100 })],
      projectiles: [{ id: 3, x: 105, y: 100, targetId: 2, damage: 10, speed: 5 }],
    })
    updateProjectiles(game)
    expect(game.projectiles).toHaveLength(0)
  })

  it('awards money when enemy is killed', () => {
    const game = makeGame({
      money: 100,
      enemies: [makeEnemy({ id: 2, x: 100, y: 100, health: 5, reward: 15 })],
      projectiles: [{ id: 3, x: 105, y: 100, targetId: 2, damage: 10, speed: 5 }],
    })
    updateProjectiles(game)
    expect(game.money).toBe(115)
    expect(game.enemies[0].health).toBeLessThanOrEqual(0)
  })

  it('moves projectile toward target on both axes', () => {
    const game = makeGame({
      enemies: [makeEnemy({ id: 2, x: 200, y: 200 })],
      projectiles: [{ id: 3, x: 100, y: 100, targetId: 2, damage: 10, speed: 5 }],
    })
    updateProjectiles(game)
    expect(game.projectiles[0].x).toBeGreaterThan(100)
    expect(game.projectiles[0].y).toBeGreaterThan(100)
  })

  it('removes projectile when target is dead', () => {
    const game = makeGame({
      projectiles: [{ id: 3, x: 100, y: 100, targetId: 999, damage: 10, speed: 5 }],
    })
    updateProjectiles(game)
    expect(game.projectiles).toHaveLength(0)
  })

  it('multiple projectiles hit independently', () => {
    const game = makeGame({
      enemies: [
        makeEnemy({ id: 2, x: 100, y: 100, health: 80 }),
        makeEnemy({ id: 3, x: 200, y: 200, health: 80 }),
      ],
      projectiles: [
        { id: 4, x: 105, y: 100, targetId: 2, damage: 10, speed: 5 },
        { id: 5, x: 205, y: 200, targetId: 3, damage: 10, speed: 5 },
      ],
    })
    updateProjectiles(game)
    expect(game.enemies.find(e => e.id === 2)!.health).toBe(70)
    expect(game.enemies.find(e => e.id === 3)!.health).toBe(70)
  })
})

describe('checkWaveComplete', () => {
  it('returns false if enemies still alive', () => {
    const game = makeGame({
      enemiesSpawned: ENEMIES_PER_WAVE,
      enemies: [makeEnemy({ health: 10 })],
    })
    expect(checkWaveComplete(game)).toBe(false)
  })

  it('returns false if not all enemies spawned yet', () => {
    const game = makeGame({ enemiesSpawned: 5 })
    expect(checkWaveComplete(game)).toBe(false)
  })

  it('does not advance wave when enemies are still alive', () => {
    const game = makeGame({
      enemiesSpawned: ENEMIES_PER_WAVE,
      enemies: [makeEnemy({ health: 10 })],
    })
    expect(checkWaveComplete(game)).toBe(false)
    expect(game.wave).toBe(1)
  })

  it('advances to wave 2 when wave 1 is complete', () => {
    const game = makeGame({
      enemiesSpawned: ENEMIES_PER_WAVE,
      waveStarted: true,
    })
    expect(checkWaveComplete(game)).toBe(false)
    expect(game.wave).toBe(2)
    expect(game.enemiesSpawned).toBe(0)
    expect(game.waveStarted).toBe(false)
  })

  it('advances to wave 3 when wave 2 is complete', () => {
    const game = makeGame({
      enemiesSpawned: ENEMIES_PER_WAVE,
      wave: 2,
      waveStarted: true,
    })
    expect(checkWaveComplete(game)).toBe(false)
    expect(game.wave).toBe(3)
    expect(game.enemiesSpawned).toBe(0)
  })

  it('returns true when wave 3 is complete', () => {
    const game = makeGame({
      enemiesSpawned: ENEMIES_PER_WAVE,
      wave: 3,
      waveStarted: true,
    })
    expect(checkWaveComplete(game)).toBe(true)
    expect(game.wave).toBe(3)
  })
})

describe('checkGameOver', () => {
  it('returns false when lives are positive', () => {
    expect(checkGameOver(makeGame({ lives: 1 }))).toBe(false)
  })

  it('returns true when lives are zero', () => {
    expect(checkGameOver(makeGame({ lives: 0 }))).toBe(true)
  })

  it('returns true when lives are negative', () => {
    expect(checkGameOver(makeGame({ lives: -5 }))).toBe(true)
  })
})
