import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://192.168.0.67:8000/api';
const TOKEN_KEY = 'jwt_access_token';
const REFRESH_TOKEN_KEY = 'jwt_refresh_token';

export const setRefreshToken = async (token) => {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Error setting refresh token:", error);
  }
};

export const getRefreshToken = async () => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

export const removeRefreshToken = async () => {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error removing refresh token:", error);
  }
};

export const fetchWithAuth = async (url, options = {}) => {
  let token = await getToken();
  
  if (!options.headers) {
    options.headers = {};
  }
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, options);

  if (response.status === 401 && token) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          await setToken(data.access);
          options.headers['Authorization'] = `Bearer ${data.access}`;
          response = await fetch(url, options);
        } else {
          await removeToken();
          await removeRefreshToken();
        }
      } catch (e) {
        console.error("Token refresh error", e);
      }
    }
  }

  return response;
};


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

  const data = await response.json();
  if (data.refresh) {
    await setRefreshToken(data.refresh);
  }
  return data;
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

  const response = await fetchWithAuth(`${API_BASE_URL}/profile/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
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
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/profile/`, {
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

export const changePassword = async (oldPassword, newPassword) => {
  const token = await getToken();
  if (!token) throw new Error('Нет токена авторизации');

  const response = await fetchWithAuth(`${API_BASE_URL}/change-password/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });

  if (!response.ok) {
    let errorMessage = 'Помилка зміни пароля';
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
      else if (errorData.old_password) errorMessage = errorData.old_password[0];
      else if (errorData.new_password) errorMessage = errorData.new_password[0];
      else if (typeof errorData === 'object' && !Array.isArray(errorData)) {
         const firstKey = Object.keys(errorData)[0];
         if(Array.isArray(errorData[firstKey])) {
             errorMessage = errorData[firstKey][0];
         }
      }
    } catch (e) { }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const requestPasswordReset = async (email) => {
  const response = await fetch(`${API_BASE_URL}/password-reset/request/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    let errorMessage = 'Помилка скидання пароля';
    try {
      const errorData = await response.json();
      if (errorData.error) errorMessage = errorData.error;
      else if (errorData.detail) errorMessage = errorData.detail;
    } catch (e) {}
    throw new Error(errorMessage);
  }

  return response.json();
};

export const confirmPasswordReset = async (email, pinCode, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/password-reset/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin_code: pinCode, new_password: newPassword }),
  });

  if (!response.ok) {
    let errorMessage = 'Помилка зміни пароля';
    try {
      const errorData = await response.json();
      if (errorData.error) errorMessage = errorData.error;
      else if (errorData.detail) errorMessage = errorData.detail;
      else if (errorData.new_password) errorMessage = errorData.new_password[0];
      else if (errorData.pin_code) errorMessage = errorData.pin_code[0];
    } catch (e) {}
    throw new Error(errorMessage);
  }

  return response.json();
};
