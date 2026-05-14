// React Native API service for matches
import { getToken } from './auth';

const API_BASE_URL = 'http://192.168.0.67:8000/api';

export const getMatches = async (sportType, searchQuery = '', isPaid = null) => {
    try {
        let url = `${API_BASE_URL}/matches/`;
        let queryParams = [];
        if (sportType && sportType !== 'ALL') queryParams.push(`sport_type=${sportType}`);
        if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
        if (isPaid !== null && isPaid !== undefined) queryParams.push(`is_paid=${isPaid}`);
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json.data;
    } catch (error) {
        console.error("Error fetching matches:", error);
        throw error;
    }
};

export const getMatch = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/matches/${id}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.error("Error fetching match:", error);
        throw error;
    }
};

export const createMatch = async (matchData) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetch(`${API_BASE_URL}/matches/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(matchData),
        });
        const json = await response.json();
        
        if (!response.ok) {
            throw new Error(json.error || json.message || JSON.stringify(json) || `HTTP error! status: ${response.status}`);
        }
        return json.data || json;
    } catch (error) {
        console.error("Error creating match:", error);
        throw error;
    }
};

export const joinMatch = async (matchId) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetch(`${API_BASE_URL}/matches/${matchId}/join/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.error || json.message || `HTTP error! status: ${response.status}`);
        }
        return json;
    } catch (error) {
        console.error("Error joining match:", error);
        throw error;
    }
};

export const leaveMatch = async (matchId) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetch(`${API_BASE_URL}/matches/${matchId}/leave/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.error || json.message || `HTTP error! status: ${response.status}`);
        }
        return json;
    } catch (error) {
        console.error("Error leaving match:", error);
        throw error;
    }
};

export const deleteMatch = async (matchId) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetch(`${API_BASE_URL}/matches/${matchId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });
        
        // DELETE frequently returns 204 No Content, check response.ok 
        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const json = await response.json();
                errorMsg = json.error || json.message || JSON.stringify(json) || errorMsg;
            } catch (e) {
                // Not JSON, fallback to standard message
            }
            throw new Error(errorMsg);
        }
        return true;
    } catch (error) {
        console.error("Error deleting match:", error);
        throw error;
    }
};

export const updateMatch = async (matchId, matchData) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetch(`${API_BASE_URL}/matches/${matchId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(matchData),
        });
        
        const json = await response.json();
        
        if (!response.ok) {
            throw new Error(json.error || json.message || JSON.stringify(json) || `HTTP error! status: ${response.status}`);
        }
        return json.data || json;
    } catch (error) {
        console.error("Error updating match:", error);
        throw error;
    }
};

export const getMyMatches = async (sportType, searchQuery = '', isPaid = null) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        let url = `${API_BASE_URL}/matches/my_matches/`;
        let queryParams = [];
        if (sportType && sportType !== 'ALL') queryParams.push(`sport_type=${sportType}`);
        if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
        if (isPaid !== null && isPaid !== undefined) queryParams.push(`is_paid=${isPaid}`);
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.error("Error fetching my matches:", error);
        throw error;
    }
};
