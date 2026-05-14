import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://192.168.0.67:8000/api';
const TOKEN_KEY = 'jwt_access_token';


export const setToken = async (token) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error("Error setting token:", error);
  }
};


export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};


export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Error removing token:", error);
  }
};


export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Неверный логин или пароль');
  }

  return response.json();
};


export const register = async (data) => {
  const isFormData = data instanceof FormData;
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}/register/`, {
    method: 'POST',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = 'Ошибка регистрации';
    try {
      const errorData = await response.json();
      // Django DRF may return an array of errors per field
      if (errorData.username) errorMessage = `Логин: ${errorData.username[0]}`;
      else if (errorData.email) errorMessage = `Email: ${errorData.email[0]}`;
      else if (errorData.password) errorMessage = `Пароль: ${errorData.password[0]}`;
      else if (errorData.detail) errorMessage = errorData.detail;
    } catch (e) { }
    throw new Error(errorMessage);
  }

  return response.json();
};


export const getUserProfile = async () => {
  const token = await getToken();
  if (!token) throw new Error('Нет токена авторизации');

  const response = await fetch(`${API_BASE_URL}/profile/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = 'Ошибка получения профиля';
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
    } catch (e) { }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const updateUserProfile = async (data) => {
  const token = await getToken();
  if (!token) throw new Error('Нет токена авторизации');

  const isFormData = data instanceof FormData;
  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}/profile/`, {
    method: 'PATCH',
    headers,
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = 'Ошибка обновления профиля';
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
      else if (typeof errorData === 'object') {
        // Flatten first validation error if exists
        const firstKey = Object.keys(errorData)[0];
        errorMessage = `${firstKey}: ${errorData[firstKey][0]}`;
      }
    } catch (e) { }
    throw new Error(errorMessage);
  }

  return response.json();
};
