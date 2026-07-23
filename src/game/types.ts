export type TowerType = 'basic' | 'sniper' | 'splash' | 'slow'
export type EnemyType = 'normal' | 'fast' | 'tank' | 'boss'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Tower {
  id: number
  type: TowerType
  x: number
  y: number
  level: number
  lastFired: number
}

export interface Enemy {
  id: number
  type: EnemyType
  x: number
  y: number
  health: number
  maxHealth: number
  speed: number
  pathIndex: number
  reward: number
  slowUntil: number
}

export interface Projectile {
  id: number
  x: number
  y: number
  targetId: number
  damage: number
  speed: number
  splashRadius?: number
  slowFactor?: number
  towerType: TowerType
}

export interface GameState {
  towers: Tower[]
  enemies: Enemy[]
  projectiles: Projectile[]
  money: number
  lives: number
  wave: number
  lastSpawn: number
  enemiesSpawned: number
  waveStarted: boolean
  lastTimestamp: number
  deltaTime: number
  gameSpeed: number
  paused: boolean
}
