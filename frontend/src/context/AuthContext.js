import React, { createContext, useState, useEffect } from 'react';
import { login, register, getToken, setToken, removeToken, getUserProfile, updateUserProfile } from '../api/auth';
import { Alert } from 'react-native';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      try {
        token = await getToken();
      } catch (e) {
        console.error("Restore token failed", e);
      }
      if (token) {
        try {
          const profileData = await getUserProfile();
          setUser(profileData.data);
          setUserToken(token);
          
          registerForPushNotificationsAsync().then(async (pushToken) => {
            if (pushToken && profileData.data.expo_push_token !== pushToken) {
              try {
                const updatedProfile = await updateUserProfile({ expo_push_token: pushToken });
                if (updatedProfile && updatedProfile.data) {
                  setUser(updatedProfile.data);
                }
              } catch (e) {
                console.log('Error updating push token:', e);
              }
            }
          }).catch(console.error);
        } catch (e) {
          const errMsg = e.message ? e.message.toLowerCase() : '';
          const isAuthError = errMsg.includes('401') || errMsg.includes('token not valid') || errMsg.includes('invalid token') || errMsg.includes('unauthorized');
          
          if (!isAuthError) {
            console.error("Failed to fetch profile", e);
          }
          
          await removeToken();
          setUserToken(null);
          setUser(null);
        }
      } else {
        setUserToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const signIn = async (username, password) => {
    setIsLoading(true);
    try {
      const data = await login(username, password);
      // DRF Simple JWT returns access and refresh
      if (data.access) {
        await setToken(data.access);
        setUserToken(data.access);
        const profileData = await getUserProfile();
        setUser(profileData.data);
        
        registerForPushNotificationsAsync().then(async (pushToken) => {
          if (pushToken && profileData.data.expo_push_token !== pushToken) {
            try {
              const updatedProfile = await updateUserProfile({ expo_push_token: pushToken });
              if (updatedProfile && updatedProfile.data) {
                setUser(updatedProfile.data);
              }
            } catch (e) {
              console.log('Error updating push token:', e);
            }
          }
        }).catch(console.error);
      } else {
        throw new Error('Токен не получен сервером');
      }
    } catch (error) {
      Alert.alert('Ошибка авторизации', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username, email, password, sportSkills, preferredSports, avatarUri = null) => {
    setIsLoading(true);
    try {
      let registerData;
      if (avatarUri) {
        registerData = new FormData();
        registerData.append('username', username);
        registerData.append('email', email);
        registerData.append('password', password);
        registerData.append('sport_skills', JSON.stringify(sportSkills));
        registerData.append('preferred_sports', preferredSports);
        
        const filename = avatarUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        registerData.append('avatar', { uri: avatarUri, name: filename, type });
      } else {
        registerData = { username, email, password, sport_skills: sportSkills, preferred_sports: preferredSports };
      }

      // 1. Create account
      await register(registerData);
      
      // 2. If successful, automatically log in
      const data = await login(username, password);
      if (data.access) {
        await setToken(data.access);
        setUserToken(data.access);
        const profileData = await getUserProfile();
        setUser(profileData.data);
        
        registerForPushNotificationsAsync().then(async (pushToken) => {
          if (pushToken && profileData.data.expo_push_token !== pushToken) {
            try {
              const updatedProfile = await updateUserProfile({ expo_push_token: pushToken });
              if (updatedProfile && updatedProfile.data) {
                setUser(updatedProfile.data);
              }
            } catch (e) {
              console.log('Error updating push token:', e);
            }
          }
        }).catch(console.error);
      }
    } catch (error) {
      Alert.alert('Ошибка регистрации', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await removeToken();
      setUserToken(null);
      setUser(null);
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data) => {
    setIsLoading(true);
    try {
      const response = await updateUserProfile(data);
      if (response && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      Alert.alert('Ошибка', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userToken, isLoading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
