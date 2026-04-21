export interface BellSound {
  id:          string;
  label:       string;
  //file:        any;
  description: string;
}

export const BELL_SOUNDS: BellSound[] = [
  {
    id:          'boxing-bell',
    label:       'Boxing bell',
    //file:        require('../../assets/sounds/boxing-bell.mp3'),
    description: 'Classic ring bell',
  },
  {
    id:          'electronic',
    label:       'Electronic',
    //file:        require('../../assets/sounds/electronic-bell.mp3'),
    description: 'Modern buzzer',
  },
  {
    id:          'whistle',
    label:       'Whistle',
    //file:        require('../../assets/sounds/whistle.mp3'),
    description: 'Referee whistle',
  },
];
