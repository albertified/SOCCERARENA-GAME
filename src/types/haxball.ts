export type Team = 'red' | 'blue' | 'spec';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Disc {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  invMass: number; // 0 for immovable / infinite mass
  damping: number;
  bounciness: number;
  color?: string;
  spin?: number;
}

export interface PlayerDisc extends Disc {
  id: string;
  name: string;
  team: Team;
  kicking: boolean;
  kickPower?: number;
  kickLocked?: boolean;
  avatar?: string;
  number?: number;
  currentInput?: PlayerInput;
}

export interface Segment {
  p0: Vector2D;
  p1: Vector2D;
  bounciness: number;
  color?: string;
  isGoalLine?: boolean;
  goalTeam?: 'red' | 'blue'; // Which team gets a point if ball crosses towards this goal
}

export interface CirclePost {
  x: number;
  y: number;
  radius: number;
  bounciness: number;
  color?: string;
}

export interface GoalArea {
  p0: Vector2D;
  p1: Vector2D;
  team: 'red' | 'blue'; // Left goal belongs to Red's side (Blue scores in it) or vice versa
}

export interface Stadium {
  id: string;
  name: string;
  width: number;
  height: number;
  pitchRect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  goalDepth: number;
  goalWidth: number; // top to bottom
  centerCircleRadius: number;
  playerRadius: number;
  ballRadius: number;
  segments: Segment[];
  posts: CirclePost[];
  redSpawn: Vector2D;
  blueSpawn: Vector2D;
  ballSpawn: Vector2D;
  redGoal: GoalArea;
  blueGoal: GoalArea;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
  kickPower?: number;
  curveLeft?: boolean;
  curveRight?: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  team: Team;
  isHost: boolean;
  avatar: string;
  ping: number;
  stats: {
    goals: number;
    assists: number;
    shots: number;
    touches: number;
  };
}

export interface GameSnapshot {
  tick: number;
  ball: Disc;
  players: Record<string, PlayerDisc>;
  score: {
    red: number;
    blue: number;
  };
  timeRemaining: number; // in seconds
  gameState: 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'GOAL_SCORED' | 'GAME_OVER';
  scoringTeam?: Team;
  lastTouchPlayerId?: string;
  possession: {
    red: number;
    blue: number;
  };
}

export interface RoomSettings {
  name: string;
  password?: string;
  maxPlayers: number;
  scoreLimit: number; // 0 for infinite
  timeLimit: number; // in minutes (e.g. 3, 5, 7)
  stadiumId: string;
  isPublic: boolean;
}

export interface RoomInfo {
  id: string;
  settings: RoomSettings;
  playerCount: number;
  hostName: string;
  isPlaying: boolean;
  score: {
    red: number;
    blue: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  senderTeam?: Team;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface MatchStatsSummary {
  mvpName: string;
  redGoals: number;
  blueGoals: number;
  redPossessionPct: number;
  bluePossessionPct: number;
  players: Array<{
    name: string;
    team: Team;
    goals: number;
    assists: number;
    shots: number;
    touches: number;
  }>;
}
