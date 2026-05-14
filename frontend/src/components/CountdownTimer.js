import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CountdownTimer({ targetTime }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!targetTime) return;

    const targetDate = new Date(targetTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setIsPlaying(true);
        setTimeLeft(0);
      } else {
        setIsPlaying(false);
        setTimeLeft(Math.floor(diff / 1000));
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  if (isPlaying) {
    return (
      <View style={styles.playingNowBadge}>
        <Text style={styles.playingNowText}>{t('playing_now')}</Text>
      </View>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <View style={styles.startingSoonBadge}>
      <Text style={styles.startingSoonText}>
        {t('starts_in')} {minutes}:{seconds < 10 ? '0' : ''}{seconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  playingNowBadge: {
    backgroundColor: '#FF3B30',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  playingNowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  startingSoonBadge: {
    backgroundColor: '#FF9500', // iOS orange
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  startingSoonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
