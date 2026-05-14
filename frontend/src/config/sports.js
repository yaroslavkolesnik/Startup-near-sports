import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SPORTS = {
  FOOTBALL: { label: 'Футбол', icon: 'soccer' },
  BASKETBALL: { label: 'Баскетбол', icon: 'basketball' },
  PING_PONG: { label: 'Пинг-понг', icon: 'table-tennis' },
  VOLLEYBALL: { label: 'Волейбол', icon: 'volleyball' },
  TENNIS: { label: 'Большой теннис', icon: 'tennis' },
  WORKOUT: { label: 'Воркаут', icon: 'arm-flex' },
  RUNNING: { label: 'Бег', icon: 'run' },
  CYCLING: { label: 'Велоспорт', icon: 'bike' },
  YOGA: { label: 'Йога', icon: 'yoga' },
  PADEL: { label: 'Падел-теннис', icon: 'tennis' },
  CHESS: { label: 'Шахматы', icon: 'chess-knight' },
  CHECKERS: { label: 'Шашки', icon: 'checkerboard' },
  BOXING: { label: 'Бокс', icon: 'boxing-glove' },
  SWIMMING: { label: 'Плавание', icon: 'swim' },
  GYM: { label: 'Тренажерный зал', icon: 'weight-lifter' },
};

export const PITCH_SPORTS = {
  ...SPORTS,
  MULTI: { label: 'Мультиспорт', icon: 'apps' }
};

export const SPORT_KEYS = Object.keys(SPORTS);
export const PITCH_SPORT_KEYS = Object.keys(PITCH_SPORTS);

export const getSportName = (sport) => {
  return PITCH_SPORTS[sport]?.label || sport;
};

export const getSportIconName = (sport) => {
  return PITCH_SPORTS[sport]?.icon || 'help-circle';
};

export const SportIcon = ({ sport, size = 20, color = '#000', style }) => {
  return (
    <MaterialCommunityIcons 
      name={getSportIconName(sport)} 
      size={size} 
      color={color} 
      style={style} 
    />
  );
};
