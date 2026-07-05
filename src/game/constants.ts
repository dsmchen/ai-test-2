import { TowerType, EnemyType } from './types'

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

export const RAINBOW = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']

export const TOWER_STATS: Record<TowerType, { damage: number; range: number; fireRate: number; cost: number }> = {
  basic: { damage: 10, range: 100, fireRate: 1000, cost: 50 },
  sniper: { damage: 50, range: 200, fireRate: 2000, cost: 100 },
  splash: { damage: 15, range: 80, fireRate: 1500, cost: 75 },
  slow: { damage: 5, range: 90, fireRate: 800, cost: 60 },
}

export const ENEMY_STATS: Record<EnemyType, { health: number; speed: number; reward: number }> = {
  normal: { health: 80, speed: 0.8, reward: 15 },
  fast: { health: 50, speed: 1.5, reward: 20 },
  tank: { health: 200, speed: 0.5, reward: 30 },
  boss: { health: 500, speed: 0.3, reward: 100 },
}
export const ENEMIES_PER_WAVE = 8
export const SPAWN_INTERVAL = 1500
export const STARTING_MONEY = 300
export const STARTING_LIVES = 30
export const TOTAL_WAVES = 3
