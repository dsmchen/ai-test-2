import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createInitialState,
  spawnEnemy,
  placeTower,
  upgradeTower,
  sellTower,
  getTowerStats,
  updateEnemies,
  updateTowers,
  updateProjectiles,
  checkWaveComplete,
  checkGameOver,
} from './logic'
import { ENEMIES_PER_WAVE, TOWER_STATS, CELL_SIZE, STARTING_MONEY, STARTING_LIVES, PATH, UPGRADE_COST, UPGRADE_MULTIPLIER, DIFFICULTY_MULTIPLIER, ENEMY_STATS, SPLASH_RADIUS, SLOW_FACTOR, SLOW_DURATION, PATH_CLEARANCE, SELL_RATIO, TOTAL_WAVES } from './constants'
import { GameState } from './types'

function makeGame(overrides?: Partial<GameState>): GameState {
  const game = createInitialState()
  Object.assign(game, overrides)
  return game
}

function makeEnemy(overrides?: { id?: number; x?: number; y?: number; health?: number; pathIndex?: number; speed?: number; reward?: number; type?: 'normal' | 'fast' | 'tank' | 'boss'; slowUntil?: number }) {
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
    slowUntil: overrides?.slowUntil ?? 0,
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

  it('spawns boss on last wave when last enemy', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const game = makeGame({ waveStarted: true, wave: TOTAL_WAVES, enemiesSpawned: ENEMIES_PER_WAVE - 1 })
    spawnEnemy(game)
    expect(game.enemies[0].type).toBe('boss')
  })

  it('does not spawn boss on wave 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const game = makeGame({ waveStarted: true, wave: 1, enemiesSpawned: ENEMIES_PER_WAVE - 1 })
    spawnEnemy(game)
    expect(game.enemies[0].type).not.toBe('boss')
  })

  it('defaults to medium difficulty', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = makeGame({ waveStarted: true })
    spawnEnemy(game)
    expect(game.enemies[0].health).toBe(ENEMY_STATS.normal.health)
    expect(game.enemies[0].speed).toBe(ENEMY_STATS.normal.speed)
    expect(game.enemies[0].reward).toBe(ENEMY_STATS.normal.reward)
  })

  it('scales stats on easy difficulty', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = makeGame({ waveStarted: true })
    spawnEnemy(game, 'easy')
    const mult = DIFFICULTY_MULTIPLIER.easy
    expect(game.enemies[0].health).toBe(ENEMY_STATS.normal.health * mult)
    expect(game.enemies[0].speed).toBe(ENEMY_STATS.normal.speed * mult)
    expect(game.enemies[0].reward).toBe(Math.round(ENEMY_STATS.normal.reward * mult))
  })

  it('scales stats on hard difficulty', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = makeGame({ waveStarted: true })
    spawnEnemy(game, 'hard')
    const mult = DIFFICULTY_MULTIPLIER.hard
    expect(game.enemies[0].health).toBe(ENEMY_STATS.normal.health * mult)
    expect(game.enemies[0].speed).toBe(ENEMY_STATS.normal.speed * mult)
    expect(game.enemies[0].reward).toBe(Math.round(ENEMY_STATS.normal.reward * mult))
  })

  it('maxHealth matches health after scaling', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = makeGame({ waveStarted: true })
    spawnEnemy(game, 'hard')
    expect(game.enemies[0].maxHealth).toBe(game.enemies[0].health)
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
      deltaTime: 16.67,
      enemies: [makeEnemy({ x: PATH[0].x, y: PATH[0].y, pathIndex: 0, speed: 0.8 })],
    })
    updateEnemies(game, 0)
    expect(game.enemies[0].x).toBeGreaterThan(PATH[0].x)
  })

  it('increments pathIndex when enemy is close enough to next point', () => {
    const game = makeGame({
      deltaTime: 16.67,
      enemies: [makeEnemy({ x: PATH[1].x - 0.5, y: PATH[1].y, pathIndex: 0, speed: 0.8 })],
    })
    updateEnemies(game, 0)
    expect(game.enemies[0].pathIndex).toBe(1)
  })

  it('reduces lives and removes enemy when reaching the end', () => {
    const lastIdx = PATH.length - 1
    const game = makeGame({
      enemies: [makeEnemy({ x: PATH[lastIdx].x, y: PATH[lastIdx].y, pathIndex: lastIdx })],
    })
    updateEnemies(game, 0)
    expect(game.lives).toBe(STARTING_LIVES - 1)
    expect(game.enemies).toHaveLength(0)
  })

  it('moves multiple enemies independently', () => {
    const game = makeGame({
      deltaTime: 16.67,
      enemies: [
        makeEnemy({ id: 1, x: PATH[0].x, y: PATH[0].y, pathIndex: 0, speed: 0.8 }),
        makeEnemy({ id: 2, x: PATH[0].x, y: PATH[0].y, pathIndex: 0, speed: 1.5 }),
      ],
    })
    updateEnemies(game, 0)
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
    updateEnemies(game, 0)
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
      deltaTime: 16.67,
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

  it('advances to next wave when wave is complete', () => {
    const game = makeGame({
      enemiesSpawned: ENEMIES_PER_WAVE,
      wave: 2,
      waveStarted: true,
    })
    expect(checkWaveComplete(game)).toBe(false)
    expect(game.wave).toBe(3)
    expect(game.enemiesSpawned).toBe(0)
  })

  it('returns true when last wave is complete', () => {
    const game = makeGame({
      enemiesSpawned: ENEMIES_PER_WAVE,
      wave: TOTAL_WAVES,
      waveStarted: true,
    })
    expect(checkWaveComplete(game)).toBe(true)
    expect(game.wave).toBe(TOTAL_WAVES)
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

describe('getTowerStats', () => {
  it('returns base stats at level 1', () => {
    const stats = getTowerStats(makeTower({ type: 'basic', level: 1 }))
    expect(stats.damage).toBe(TOWER_STATS.basic.damage)
    expect(stats.range).toBe(TOWER_STATS.basic.range)
    expect(stats.fireRate).toBe(TOWER_STATS.basic.fireRate)
  })

  it('scales damage and range by multiplier at level 2', () => {
    const stats = getTowerStats(makeTower({ type: 'basic', level: 2 }))
    expect(stats.damage).toBe(TOWER_STATS.basic.damage * UPGRADE_MULTIPLIER[1])
    expect(stats.range).toBe(TOWER_STATS.basic.range * UPGRADE_MULTIPLIER[1])
  })

  it('reduces fireRate at higher levels', () => {
    const lvl1 = getTowerStats(makeTower({ level: 1 }))
    const lvl3 = getTowerStats(makeTower({ level: 3 }))
    expect(lvl3.fireRate).toBeLessThan(lvl1.fireRate)
  })

  it('doubles stats at max level', () => {
    const stats = getTowerStats(makeTower({ type: 'sniper', level: 3 }))
    expect(stats.damage).toBe(TOWER_STATS.sniper.damage * 2)
    expect(stats.range).toBe(TOWER_STATS.sniper.range * 2)
    expect(stats.fireRate).toBe(TOWER_STATS.sniper.fireRate / 2)
  })
})

describe('upgradeTower', () => {
  it('upgrades tower from level 1 to 2', () => {
    const game = makeGame({ money: 100, towers: [makeTower({ id: 1, level: 1 })] })
    expect(upgradeTower(game, 1)).toBe(true)
    expect(game.towers[0].level).toBe(2)
    expect(game.money).toBe(100 - UPGRADE_COST[1])
  })

  it('upgrades tower from level 2 to 3', () => {
    const game = makeGame({ money: 100, towers: [makeTower({ id: 1, level: 2 })] })
    expect(upgradeTower(game, 1)).toBe(true)
    expect(game.towers[0].level).toBe(3)
    expect(game.money).toBe(100 - UPGRADE_COST[2])
  })

  it('returns false when already max level', () => {
    const game = makeGame({ money: 200, towers: [makeTower({ id: 1, level: 3 })] })
    expect(upgradeTower(game, 1)).toBe(false)
    expect(game.towers[0].level).toBe(3)
  })

  it('returns false when not enough money', () => {
    const game = makeGame({ money: 0, towers: [makeTower({ id: 1, level: 1 })] })
    expect(upgradeTower(game, 1)).toBe(false)
    expect(game.towers[0].level).toBe(1)
  })

  it('returns false for non-existent tower', () => {
    const game = makeGame({ money: 100 })
    expect(upgradeTower(game, 999)).toBe(false)
  })
})

describe('updateTowers with upgrades', () => {
  it('upgraded tower deals more damage', () => {
    const game = makeGame({
      towers: [makeTower({ level: 3 })],
      enemies: [makeEnemy({ id: 2, x: 150, y: 100, health: 200 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles).toHaveLength(1)
    expect(game.projectiles[0].damage).toBe(TOWER_STATS.basic.damage * UPGRADE_MULTIPLIER[2])
  })

  it('upgraded tower has larger range', () => {
    const game = makeGame({
      towers: [makeTower({ level: 3 })],
      enemies: [makeEnemy({ id: 2, x: 100 + TOWER_STATS.basic.range + 50, y: 100 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles).toHaveLength(1)
  })
})

describe('splash tower AoE damage', () => {
  it('splash projectile has splashRadius set', () => {
    const game = makeGame({
      towers: [makeTower({ type: 'splash' })],
      enemies: [makeEnemy({ id: 2, x: 150, y: 100 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles[0].splashRadius).toBe(SPLASH_RADIUS)
  })

  it('non-splash projectile has no splashRadius', () => {
    const game = makeGame({
      towers: [makeTower({ type: 'basic' })],
      enemies: [makeEnemy({ id: 2, x: 150, y: 100 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles[0].splashRadius).toBeUndefined()
  })

  it('splash damage hits multiple enemies in radius', () => {
    const game = makeGame({
      enemies: [
        makeEnemy({ id: 2, x: 100, y: 100, health: 80 }),
        makeEnemy({ id: 3, x: 120, y: 100, health: 80 }),
      ],
      projectiles: [{ id: 4, x: 105, y: 100, targetId: 2, damage: 10, speed: 5, splashRadius: SPLASH_RADIUS }],
    })
    updateProjectiles(game)
    expect(game.enemies.find(e => e.id === 2)!.health).toBe(70)
    expect(game.enemies.find(e => e.id === 3)!.health).toBe(70)
  })

  it('splash damage does not hit enemies outside radius', () => {
    const game = makeGame({
      enemies: [
        makeEnemy({ id: 2, x: 100, y: 100, health: 80 }),
        makeEnemy({ id: 3, x: 200, y: 200, health: 80 }),
      ],
      projectiles: [{ id: 4, x: 105, y: 100, targetId: 2, damage: 10, speed: 5, splashRadius: SPLASH_RADIUS }],
    })
    updateProjectiles(game)
    expect(game.enemies.find(e => e.id === 2)!.health).toBe(70)
    expect(game.enemies.find(e => e.id === 3)!.health).toBe(80)
  })
})

describe('slow tower speed reduction', () => {
  it('slow projectile has slowFactor set', () => {
    const game = makeGame({
      towers: [makeTower({ type: 'slow' })],
      enemies: [makeEnemy({ id: 2, x: 150, y: 100 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles[0].slowFactor).toBe(SLOW_FACTOR)
  })

  it('non-slow projectile has no slowFactor', () => {
    const game = makeGame({
      towers: [makeTower({ type: 'basic' })],
      enemies: [makeEnemy({ id: 2, x: 150, y: 100 })],
    })
    updateTowers(game, 2000)
    expect(game.projectiles[0].slowFactor).toBeUndefined()
  })

  it('slow debuff is applied on hit', () => {
    const game = makeGame({
      lastTimestamp: 1000,
      enemies: [makeEnemy({ id: 2, x: 100, y: 100, health: 80 })],
      projectiles: [{ id: 3, x: 105, y: 100, targetId: 2, damage: 5, speed: 5, slowFactor: SLOW_FACTOR }],
    })
    updateProjectiles(game)
    expect(game.enemies[0].slowUntil).toBe(1000 + SLOW_DURATION)
  })

  it('enemy speed is reduced while debuff is active', () => {
    const game = makeGame({
      deltaTime: 16.67,
      lastTimestamp: 1000,
      enemies: [makeEnemy({ id: 1, x: PATH[0].x, y: PATH[0].y, pathIndex: 0, speed: 1, slowUntil: 3000 })],
    })
    updateEnemies(game, 2000)
    expect(game.enemies[0].x).toBeGreaterThan(PATH[0].x)
    const expectedDist = 1 * SLOW_FACTOR * 0.06 * 16.67
    expect(game.enemies[0].x - PATH[0].x).toBeLessThanOrEqual(expectedDist + 0.1)
  })

  it('enemy speed returns to normal after debuff expires', () => {
    const game = makeGame({
      deltaTime: 16.67,
      enemies: [makeEnemy({ id: 1, x: PATH[0].x, y: PATH[0].y, pathIndex: 0, speed: 1, slowUntil: 500 })],
    })
    updateEnemies(game, 1000)
    const expectedDist = 1 * 0.06 * 16.67
    expect(game.enemies[0].x - PATH[0].x).toBeGreaterThan(expectedDist - 0.1)
  })
})

describe('path collision check', () => {
  it('rejects placement on the path', () => {
    const game = makeGame({ money: 200 })
    const pathPoint = PATH[1]
    const placed = placeTower(game, pathPoint.x, pathPoint.y, 'basic')
    expect(placed).toBe(false)
    expect(game.towers).toHaveLength(0)
  })

  it('allows placement far from the path', () => {
    const game = makeGame({ money: 200 })
    const placed = placeTower(game, 400, 300, 'basic')
    expect(placed).toBe(true)
    expect(game.towers).toHaveLength(1)
  })

  it('rejects placement within PATH_CLEARANCE of path', () => {
    const game = makeGame({ money: 200 })
    const pathPoint = PATH[1]
    const placed = placeTower(game, pathPoint.x + PATH_CLEARANCE - 5, pathPoint.y, 'basic')
    expect(placed).toBe(false)
    expect(game.towers).toHaveLength(0)
  })
})

describe('sellTower', () => {
  it('sells tower and returns 50% of base cost', () => {
    const game = makeGame({ money: 100, towers: [makeTower({ id: 1, type: 'basic', level: 1 })] })
    const result = sellTower(game, 1)
    expect(result).toBe(true)
    expect(game.towers).toHaveLength(0)
    expect(game.money).toBe(100 + Math.round(TOWER_STATS.basic.cost * SELL_RATIO))
  })

  it('sells upgraded tower and returns 50% of total investment', () => {
    const game = makeGame({ money: 100, towers: [makeTower({ id: 1, type: 'basic', level: 2 })] })
    const result = sellTower(game, 1)
    expect(result).toBe(true)
    expect(game.towers).toHaveLength(0)
    const totalInvestment = TOWER_STATS.basic.cost + UPGRADE_COST[1]
    expect(game.money).toBe(100 + Math.round(totalInvestment * SELL_RATIO))
  })

  it('returns false for non-existent tower', () => {
    const game = makeGame({ money: 100 })
    const result = sellTower(game, 999)
    expect(result).toBe(false)
  })
})
