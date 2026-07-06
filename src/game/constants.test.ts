import { describe, it, expect } from 'vitest'
import {
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PATH,
  TOWER_STATS,
  ENEMY_STATS,
  ENEMIES_PER_WAVE,
  SPAWN_INTERVAL,
  STARTING_MONEY,
  STARTING_LIVES,
  TOTAL_WAVES,
  RAINBOW,
} from './constants'

describe('constants', () => {
  it('canvas dimensions are positive', () => {
    expect(CANVAS_WIDTH).toBeGreaterThan(0)
    expect(CANVAS_HEIGHT).toBeGreaterThan(0)
  })

  it('cell size is positive', () => {
    expect(CELL_SIZE).toBeGreaterThan(0)
  })

  it('path has at least 2 points', () => {
    expect(PATH.length).toBeGreaterThanOrEqual(2)
  })

  it('all path points have x and y', () => {
    for (const point of PATH) {
      expect(typeof point.x).toBe('number')
      expect(typeof point.y).toBe('number')
    }
  })

  it('tower stats cover all tower types', () => {
    const types = ['basic', 'sniper', 'splash', 'slow'] as const
    for (const type of types) {
      expect(TOWER_STATS[type]).toBeDefined()
      expect(TOWER_STATS[type].damage).toBeGreaterThan(0)
      expect(TOWER_STATS[type].range).toBeGreaterThan(0)
      expect(TOWER_STATS[type].fireRate).toBeGreaterThan(0)
      expect(TOWER_STATS[type].cost).toBeGreaterThan(0)
    }
  })

  it('enemy stats cover all enemy types', () => {
    const types = ['normal', 'fast', 'tank', 'boss'] as const
    for (const type of types) {
      expect(ENEMY_STATS[type]).toBeDefined()
      expect(ENEMY_STATS[type].health).toBeGreaterThan(0)
      expect(ENEMY_STATS[type].speed).toBeGreaterThan(0)
      expect(ENEMY_STATS[type].reward).toBeGreaterThan(0)
    }
  })

  it('boss has more health than normal', () => {
    expect(ENEMY_STATS.boss.health).toBeGreaterThan(ENEMY_STATS.normal.health)
  })

  it('fast enemy is faster than normal', () => {
    expect(ENEMY_STATS.fast.speed).toBeGreaterThan(ENEMY_STATS.normal.speed)
  })

  it('tank has more health than normal', () => {
    expect(ENEMY_STATS.tank.health).toBeGreaterThan(ENEMY_STATS.normal.health)
  })

  it('game config values are positive', () => {
    expect(ENEMIES_PER_WAVE).toBeGreaterThan(0)
    expect(SPAWN_INTERVAL).toBeGreaterThan(0)
    expect(STARTING_MONEY).toBeGreaterThan(0)
    expect(STARTING_LIVES).toBeGreaterThan(0)
    expect(TOTAL_WAVES).toBeGreaterThan(0)
  })

  it('rainbow has 7 colors', () => {
    expect(RAINBOW).toHaveLength(7)
  })
})
