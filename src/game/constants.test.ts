import { describe, it, expect } from 'vitest'
import {
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PATH,
  TOWER_STATS,
  ENEMY_STATS,
  ENEMIES_PER_WAVE_BASE,
  STARTING_MONEY,
  STARTING_LIVES,
  TOTAL_WAVES,
  UPGRADE_COST,
  UPGRADE_MULTIPLIER,
  DIFFICULTY_MULTIPLIER,
  getEnemiesPerWave,
  getSpawnInterval,
  getWaveHealthMultiplier,
  getBossHealthMultiplier,
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
    expect(ENEMIES_PER_WAVE_BASE).toBeGreaterThan(0)
    expect(getSpawnInterval(1)).toBeGreaterThan(0)
    expect(STARTING_MONEY).toBeGreaterThan(0)
    expect(STARTING_LIVES).toBeGreaterThan(0)
    expect(TOTAL_WAVES).toBeGreaterThan(0)
  })

  it('wave scaling functions work correctly', () => {
    expect(getEnemiesPerWave(1)).toBe(10)
    expect(getEnemiesPerWave(6)).toBe(12)
    expect(getEnemiesPerWave(10)).toBe(15)
    expect(getSpawnInterval(1)).toBe(1500)
    expect(getSpawnInterval(6)).toBe(1300)
    expect(getSpawnInterval(10)).toBe(900)
    expect(getWaveHealthMultiplier(1)).toBe(1)
    expect(getWaveHealthMultiplier(12)).toBeCloseTo(3.75)
    expect(getBossHealthMultiplier(9)).toBe(1)
    expect(getBossHealthMultiplier(10)).toBe(1.5)
    expect(getBossHealthMultiplier(12)).toBe(1.5)
  })

  it('upgrade costs have 3 entries', () => {
    expect(UPGRADE_COST).toHaveLength(3)
    expect(UPGRADE_COST[0]).toBe(0)
    expect(UPGRADE_COST[1]).toBeGreaterThan(0)
    expect(UPGRADE_COST[2]).toBeGreaterThan(UPGRADE_COST[1])
  })

  it('upgrade multipliers increase per level', () => {
    expect(UPGRADE_MULTIPLIER).toHaveLength(3)
    expect(UPGRADE_MULTIPLIER[0]).toBe(1)
    expect(UPGRADE_MULTIPLIER[2]).toBeGreaterThan(UPGRADE_MULTIPLIER[1])
  })

  it('difficulty multipliers scale correctly', () => {
    expect(DIFFICULTY_MULTIPLIER.easy).toBeLessThan(DIFFICULTY_MULTIPLIER.medium)
    expect(DIFFICULTY_MULTIPLIER.medium).toBeLessThan(DIFFICULTY_MULTIPLIER.hard)
    expect(DIFFICULTY_MULTIPLIER.medium).toBe(1)
  })
})
