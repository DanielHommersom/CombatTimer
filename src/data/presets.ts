export interface PresetCategory {
  id: string;
  label: string;
  presets: Preset[];
}

export interface Preset {
  id: string;
  name: string;
  rounds: number;
  roundTime: string;
  rest: string;
  warmUp: string;
  coolDown: string;
  color: string;
  description: string;
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: 'boxing',
    label: 'Boxing',
    presets: [
      {
        id: 'boxing-beginner',
        name: 'Boxing Beginner',
        rounds: 3,
        roundTime: '2:00',
        rest: '1:00',
        warmUp: '3:00',
        coolDown: '2:00',
        color: '#ff453a',
        description: 'Perfect for first lessons',
      },
      {
        id: 'boxing-amateur',
        name: 'Boxing Amateur',
        rounds: 6,
        roundTime: '3:00',
        rest: '1:00',
        warmUp: '3:00',
        coolDown: '2:00',
        color: '#ff453a',
        description: 'Recreational training',
      },
      {
        id: 'boxing-pro',
        name: 'Boxing Pro',
        rounds: 12,
        roundTime: '3:00',
        rest: '1:00',
        warmUp: '5:00',
        coolDown: '3:00',
        color: '#ff453a',
        description: 'Competition standard',
      },
    ],
  },
  {
    id: 'combat',
    label: 'Combat Sports',
    presets: [
      {
        id: 'mma-amateur',
        name: 'MMA Amateur',
        rounds: 3,
        roundTime: '5:00',
        rest: '1:00',
        warmUp: '5:00',
        coolDown: '3:00',
        color: '#bf5af2',
        description: 'UFC amateur ruleset',
      },
      {
        id: 'mma-pro',
        name: 'MMA Pro',
        rounds: 3,
        roundTime: '5:00',
        rest: '1:00',
        warmUp: '5:00',
        coolDown: '3:00',
        color: '#bf5af2',
        description: 'UFC pro ruleset',
      },
      {
        id: 'bjj-rolling',
        name: 'BJJ Rolling',
        rounds: 5,
        roundTime: '6:00',
        rest: '1:00',
        warmUp: '5:00',
        coolDown: '2:00',
        color: '#0a84ff',
        description: 'Sparring on the mat',
      },
      {
        id: 'wrestling-drill',
        name: 'Wrestling Drill',
        rounds: 6,
        roundTime: '2:00',
        rest: '0:30',
        warmUp: '3:00',
        coolDown: '2:00',
        color: '#ff9f0a',
        description: 'Intensive drill work',
      },
      {
        id: 'kickboxing',
        name: 'Kickboxing',
        rounds: 5,
        roundTime: '3:00',
        rest: '1:00',
        warmUp: '3:00',
        coolDown: '2:00',
        color: '#ff453a',
        description: 'Standard K-1 format',
      },
      {
        id: 'muay-thai',
        name: 'Muay Thai',
        rounds: 5,
        roundTime: '3:00',
        rest: '2:00',
        warmUp: '5:00',
        coolDown: '3:00',
        color: '#ff9f0a',
        description: 'Thai ruleset',
      },
    ],
  },
  {
    id: 'conditioning',
    label: 'Conditioning',
    presets: [
      {
        id: 'heavy-bag',
        name: 'Heavy Bag',
        rounds: 6,
        roundTime: '3:00',
        rest: '1:00',
        warmUp: '3:00',
        coolDown: '2:00',
        color: '#34c759',
        description: 'Bag work training',
      },
      {
        id: 'speed-bag',
        name: 'Speed Bag',
        rounds: 8,
        roundTime: '1:30',
        rest: '0:30',
        warmUp: '2:00',
        coolDown: '1:00',
        color: '#34c759',
        description: 'Speed and rhythm',
      },
      {
        id: 'tabata-combat',
        name: 'Tabata Combat',
        rounds: 8,
        roundTime: '0:20',
        rest: '0:10',
        warmUp: '2:00',
        coolDown: '2:00',
        color: '#ffd60a',
        description: 'HIIT for fighters',
      },
      {
        id: 'endurance',
        name: 'Endurance',
        rounds: 5,
        roundTime: '5:00',
        rest: '1:00',
        warmUp: '5:00',
        coolDown: '3:00',
        color: '#0a84ff',
        description: 'Build stamina',
      },
    ],
  },
];
