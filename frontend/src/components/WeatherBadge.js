import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WeatherBadge({ latitude, longitude, startTime }) {
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchWeather = async () => {
      try {
        const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
        if (!apiKey) return;

        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=ru`);
        if (!response.ok) return;

        const data = await response.json();
        
        if (data && data.list && data.list.length > 0) {
          const now = new Date().getTime();
          const matchTime = startTime ? new Date(startTime).getTime() : now;

          if (matchTime <= now) {
            // Match is in the past or playing now
            setWeatherData(data.list[0]);
          } else {
            // Find closest forecast
            let closest = data.list[0];
            let minDiff = Math.abs((closest.dt * 1000) - matchTime);

            for (let i = 1; i < data.list.length; i++) {
              const itemTime = data.list[i].dt * 1000;
              const diff = Math.abs(itemTime - matchTime);
              if (diff < minDiff) {
                minDiff = diff;
                closest = data.list[i];
              }
            }
            setWeatherData(closest);
          }
        }
      } catch (error) {
        console.log('Error fetching weather:', error);
      }
    };

    fetchWeather();
  }, [latitude, longitude, startTime]);

  if (!weatherData) return null;

  const temp = Math.round(weatherData.main.temp);
  const condition = weatherData.weather && weatherData.weather.length > 0 ? weatherData.weather[0].main : '';

  let icon = '☁️';
  if (condition === 'Clear') icon = '☀️';
  else if (condition === 'Clouds') icon = '☁️';
  else if (condition === 'Rain' || condition === 'Drizzle') icon = '🌧';
  else if (condition === 'Thunderstorm') icon = '⛈';
  else if (condition === 'Snow') icon = '❄️';

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{temp > 0 ? `+${temp}` : temp}°C {icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF', // matches primary color
  }
});
