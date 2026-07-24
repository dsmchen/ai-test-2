import { TowerType, EnemyType, Difficulty } from './types'

export const CELL_SIZE = 40
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

export const PATH = [
  { x: 0, y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 100 },
  { x: 600, y: 100 },
  { x: 600, y: 500 },
  { x: 800, y: 500 },
]

export const TOWER_STATS: Record<TowerType, { damage: number; range: number; fireRate: number; cost: number }> = {
  basic: { damage: 10, range: 100, fireRate: 1000, cost: 50 },
  sniper: { damage: 35, range: 180, fireRate: 2000, cost: 120 },
  splash: { damage: 15, range: 80, fireRate: 1500, cost: 75 },
  slow: { damage: 8, range: 100, fireRate: 800, cost: 60 },
}

export const UPGRADE_COST = [0, 40, 80]
export const UPGRADE_MULTIPLIER = [1, 1.5, 2]

export const ENEMY_STATS: Record<EnemyType, { health: number; speed: number; reward: number }> = {
  normal: { health: 80, speed: 0.8, reward: 15 },
  fast: { health: 50, speed: 1.5, reward: 20 },
  tank: { health: 200, speed: 0.5, reward: 30 },
  boss: { health: 500, speed: 0.3, reward: 100 },
}
export const ENEMIES_PER_WAVE_BASE = 10
export const SPAWN_INTERVAL_BASE = 1500

export function getEnemiesPerWave(wave: number): number {
  if (wave <= 4) return ENEMIES_PER_WAVE_BASE
  if (wave <= 8) return ENEMIES_PER_WAVE_BASE + 2
  return ENEMIES_PER_WAVE_BASE + 5
}

export function getSpawnInterval(wave: number): number {
  if (wave <= 4) return SPAWN_INTERVAL_BASE
  if (wave <= 8) return SPAWN_INTERVAL_BASE - 200
  return SPAWN_INTERVAL_BASE - 600
}

export function getWaveHealthMultiplier(wave: number): number {
  return 1 + (wave - 1) * 0.25
}

export function getBossHealthMultiplier(wave: number): number {
  if (wave < 10) return 1
  return 1.5
}

export function getWaveSpeedMultiplier(wave: number): number {
  if (wave <= 4) return 1
  if (wave <= 8) return 1.1
  return 1.25
}
export const STARTING_MONEY = 250
export const STARTING_LIVES = 20
export const TOTAL_WAVES = 12

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 0.7,
  medium: 1,
  hard: 1.5,
}

export const SPLASH_RADIUS = 50
export const SLOW_FACTOR = 0.5
export const SLOW_DURATION = 2500
export const PATH_CLEARANCE = 30
export const SELL_RATIO = 0.5

export const ENEMY_SIZES: Record<EnemyType, number> = {
  normal: 12,
  fast: 14,
  tank: 12,
  boss: 18,
}

export const HEALTH_BAR_WIDTH = 30
export const HEALTH_BAR_HEIGHT = 4
export const HEALTH_BAR_OFFSET_Y = 20
export const PROJECTILE_RADIUS = 3
export const PROJECTILE_HIT_DIST = 10

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: '#15803D',
  medium: '#A16207',
  hard: '#B91C1C',
}

export const TOWER_EMOJI: Record<TowerType, string> = {
  basic: '🎯',
  sniper: '🔭',
  splash: '💥',
  slow: '🐌',
}

export const TOWER_DESCRIPTIONS: Record<TowerType, string> = {
  basic: 'Balanced damage and range',
  sniper: 'High damage, long range, slow fire rate',
  splash: 'Area damage, medium range',
  slow: 'Reduces enemy movement speed',
}
