export interface Workout {
  id: string;
  name: string;
  warmUp: string;    // "2:00", optional — "0:00" means none
  rounds: number;
  roundTime: string; // "3:00"
  rest: string;      // "1:00"
  coolDown: string;  // "2:00", optional — "0:00" means none
  color: string;
  createdAt: number;
}
