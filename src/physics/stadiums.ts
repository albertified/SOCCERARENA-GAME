import { Stadium } from '../types/haxball';

export const CLASSIC_STADIUM: Stadium = {
  id: 'classic',
  name: 'Classic Stadium (3v3)',
  width: 1500,
  height: 820,
  pitchRect: {
    left: 200,
    top: 100,
    right: 1300,
    bottom: 720,
  },
  goalDepth: 90,
  goalWidth: 200,
  centerCircleRadius: 120,
  playerRadius: 16,
  ballRadius: 13,
  redSpawn: { x: 450, y: 410 },
  blueSpawn: { x: 1050, y: 410 },
  ballSpawn: { x: 750, y: 410 },
  redGoal: {
    p0: { x: 200, y: 310 },
    p1: { x: 200, y: 510 },
    team: 'red', // Left goal (Blue scores here)
  },
  blueGoal: {
    p0: { x: 1300, y: 310 },
    p1: { x: 1300, y: 510 },
    team: 'blue', // Right goal (Red scores here)
  },
  posts: [
    // Left Goal Posts
    { x: 200, y: 310, radius: 8, bounciness: 0.8, color: '#FFFFFF' },
    { x: 200, y: 510, radius: 8, bounciness: 0.8, color: '#FFFFFF' },
    { x: 110, y: 310, radius: 8, bounciness: 0.8, color: '#CCCCCC' },
    { x: 110, y: 510, radius: 8, bounciness: 0.8, color: '#CCCCCC' },
    // Right Goal Posts
    { x: 1300, y: 310, radius: 8, bounciness: 0.8, color: '#FFFFFF' },
    { x: 1300, y: 510, radius: 8, bounciness: 0.8, color: '#FFFFFF' },
    { x: 1390, y: 310, radius: 8, bounciness: 0.8, color: '#CCCCCC' },
    { x: 1390, y: 510, radius: 8, bounciness: 0.8, color: '#CCCCCC' },
  ],
  segments: [
    // Top border wall
    { p0: { x: 200, y: 100 }, p1: { x: 1300, y: 100 }, bounciness: 0.5, color: '#C7D2FE' },
    // Bottom border wall
    { p0: { x: 200, y: 720 }, p1: { x: 1300, y: 720 }, bounciness: 0.5, color: '#C7D2FE' },
    // Left wall top segment (above goal)
    { p0: { x: 200, y: 100 }, p1: { x: 200, y: 310 }, bounciness: 0.5, color: '#C7D2FE' },
    // Left wall bottom segment (below goal)
    { p0: { x: 200, y: 510 }, p1: { x: 200, y: 720 }, bounciness: 0.5, color: '#C7D2FE' },
    // Right wall top segment (above goal)
    { p0: { x: 1300, y: 100 }, p1: { x: 1300, y: 310 }, bounciness: 0.5, color: '#C7D2FE' },
    // Right wall bottom segment (below goal)
    { p0: { x: 1300, y: 510 }, p1: { x: 1300, y: 720 }, bounciness: 0.5, color: '#C7D2FE' },

    // Left Goal Net Back Wall
    { p0: { x: 110, y: 310 }, p1: { x: 110, y: 510 }, bounciness: 0.5, color: '#EF4444' },
    { p0: { x: 110, y: 310 }, p1: { x: 200, y: 310 }, bounciness: 0.5, color: '#EF4444' },
    { p0: { x: 110, y: 510 }, p1: { x: 200, y: 510 }, bounciness: 0.5, color: '#EF4444' },

    // Right Goal Net Back Wall
    { p0: { x: 1390, y: 310 }, p1: { x: 1390, y: 510 }, bounciness: 0.5, color: '#3B82F6' },
    { p0: { x: 1390, y: 310 }, p1: { x: 1300, y: 310 }, bounciness: 0.5, color: '#3B82F6' },
    { p0: { x: 1390, y: 510 }, p1: { x: 1300, y: 510 }, bounciness: 0.5, color: '#3B82F6' },
  ],
};

export const SMALL_STADIUM: Stadium = {
  id: 'small',
  name: 'Small Pitch (1v1 / 2v2)',
  width: 1200,
  height: 680,
  pitchRect: {
    left: 160,
    top: 80,
    right: 1040,
    bottom: 600,
  },
  goalDepth: 80,
  goalWidth: 170,
  centerCircleRadius: 100,
  playerRadius: 15,
  ballRadius: 11.5,
  redSpawn: { x: 380, y: 340 },
  blueSpawn: { x: 820, y: 340 },
  ballSpawn: { x: 600, y: 340 },
  redGoal: {
    p0: { x: 160, y: 255 },
    p1: { x: 160, y: 425 },
    team: 'red',
  },
  blueGoal: {
    p0: { x: 1040, y: 255 },
    p1: { x: 1040, y: 425 },
    team: 'blue',
  },
  posts: [
    { x: 160, y: 255, radius: 7, bounciness: 0.8, color: '#FFFFFF' },
    { x: 160, y: 425, radius: 7, bounciness: 0.8, color: '#FFFFFF' },
    { x: 80, y: 255, radius: 7, bounciness: 0.8, color: '#CCCCCC' },
    { x: 80, y: 425, radius: 7, bounciness: 0.8, color: '#CCCCCC' },
    { x: 1040, y: 255, radius: 7, bounciness: 0.8, color: '#FFFFFF' },
    { x: 1040, y: 425, radius: 7, bounciness: 0.8, color: '#FFFFFF' },
    { x: 1120, y: 255, radius: 7, bounciness: 0.8, color: '#CCCCCC' },
    { x: 1120, y: 425, radius: 7, bounciness: 0.8, color: '#CCCCCC' },
  ],
  segments: [
    { p0: { x: 160, y: 80 }, p1: { x: 1040, y: 80 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 160, y: 600 }, p1: { x: 1040, y: 600 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 160, y: 80 }, p1: { x: 160, y: 255 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 160, y: 425 }, p1: { x: 160, y: 600 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 1040, y: 80 }, p1: { x: 1040, y: 255 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 1040, y: 425 }, p1: { x: 1040, y: 600 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 80, y: 255 }, p1: { x: 80, y: 425 }, bounciness: 0.5, color: '#EF4444' },
    { p0: { x: 80, y: 255 }, p1: { x: 160, y: 255 }, bounciness: 0.5, color: '#EF4444' },
    { p0: { x: 80, y: 425 }, p1: { x: 160, y: 425 }, bounciness: 0.5, color: '#EF4444' },
    { p0: { x: 1120, y: 255 }, p1: { x: 1120, y: 425 }, bounciness: 0.5, color: '#3B82F6' },
    { p0: { x: 1120, y: 255 }, p1: { x: 1040, y: 255 }, bounciness: 0.5, color: '#3B82F6' },
    { p0: { x: 1120, y: 425 }, p1: { x: 1040, y: 425 }, bounciness: 0.5, color: '#3B82F6' },
  ],
};

export const BIG_STADIUM: Stadium = {
  id: 'big',
  name: 'Big Field (4v4 / 5v5)',
  width: 1800,
  height: 980,
  pitchRect: {
    left: 220,
    top: 120,
    right: 1580,
    bottom: 860,
  },
  goalDepth: 100,
  goalWidth: 250,
  centerCircleRadius: 150,
  playerRadius: 17,
  ballRadius: 14,
  redSpawn: { x: 550, y: 490 },
  blueSpawn: { x: 1250, y: 490 },
  ballSpawn: { x: 900, y: 490 },
  redGoal: {
    p0: { x: 220, y: 365 },
    p1: { x: 220, y: 615 },
    team: 'red',
  },
  blueGoal: {
    p0: { x: 1580, y: 365 },
    p1: { x: 1580, y: 615 },
    team: 'blue',
  },
  posts: [
    { x: 220, y: 365, radius: 9, bounciness: 0.8, color: '#FFFFFF' },
    { x: 220, y: 615, radius: 9, bounciness: 0.8, color: '#FFFFFF' },
    { x: 120, y: 365, radius: 9, bounciness: 0.8, color: '#CCCCCC' },
    { x: 120, y: 615, radius: 9, bounciness: 0.8, color: '#CCCCCC' },
    { x: 1580, y: 365, radius: 9, bounciness: 0.8, color: '#FFFFFF' },
    { x: 1580, y: 615, radius: 9, bounciness: 0.8, color: '#FFFFFF' },
    { x: 1680, y: 365, radius: 9, bounciness: 0.8, color: '#CCCCCC' },
    { x: 1680, y: 615, radius: 9, bounciness: 0.8, color: '#CCCCCC' },
  ],
  segments: [
    { p0: { x: 220, y: 120 }, p1: { x: 1580, y: 120 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 220, y: 860 }, p1: { x: 1580, y: 860 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 220, y: 120 }, p1: { x: 220, y: 365 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 220, y: 615 }, p1: { x: 220, y: 860 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 1580, y: 120 }, p1: { x: 1580, y: 365 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 1580, y: 615 }, p1: { x: 1580, y: 860 }, bounciness: 0.5, color: '#C7D2FE' },
    { p0: { x: 120, y: 365 }, p1: { x: 120, y: 615 }, bounciness: 0.5, color: '#EF4444' },
    { p0: { x: 120, y: 365 }, p1: { x: 220, y: 365 }, bounciness: 0.5, color: '#EF4444' },
    { p0: { x: 120, y: 615 }, p1: { x: 220, y: 615 }, bounciness: 0.5, color: '#EF4444' },
    { p0: { x: 1680, y: 365 }, p1: { x: 1680, y: 615 }, bounciness: 0.5, color: '#3B82F6' },
    { p0: { x: 1680, y: 365 }, p1: { x: 1580, y: 365 }, bounciness: 0.5, color: '#3B82F6' },
    { p0: { x: 1680, y: 615 }, p1: { x: 1580, y: 615 }, bounciness: 0.5, color: '#3B82F6' },
  ],
};

export const STADIUMS: Record<string, Stadium> = {
  classic: CLASSIC_STADIUM,
  small: SMALL_STADIUM,
  big: BIG_STADIUM,
};
