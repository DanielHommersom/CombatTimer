import React from 'react';
import LogoSvg from '../../assets/logo.svg';

interface Props {
  width:  number;
  height: number;
}

export function CombatTimerLogo({ width, height }: Props) {
  return <LogoSvg width={width} height={height} />;
}
