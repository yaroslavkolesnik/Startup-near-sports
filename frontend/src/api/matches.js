// React Native API service for matches
import { getToken, fetchWithAuth } from './auth';

const API_BASE_URL = 'http://192.168.0.67:8000/api';

export const getMatches = async (sportType, searchQuery = '', isPaid = null, page = 1, pitchId = null, noPage = false) => {
    try {
        let url = `${API_BASE_URL}/matches/`;
        let queryParams = [];
        if (sportType && sportType !== 'ALL') queryParams.push(`sport_type=${sportType}`);
        if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
        if (isPaid !== null && isPaid !== undefined) queryParams.push(`is_paid=${isPaid}`);
        if (pitchId) queryParams.push(`pitch_id=${pitchId}`);
        if (noPage) {
            queryParams.push(`no_page=true`);
        } else if (page > 1) {
            queryParams.push(`page=${page}`);
        }
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
        
        const response = await fetchWithAuth(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.log("Error fetching matches:", error);
        throw error;
    }
};

export const getMatch = async (id) => {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${id}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.log("Error fetching match:", error);
        throw error;
    }
};

export const createMatch = async (matchData) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/`, {
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
        console.log("Error creating match:", error);
        throw error;
    }
};

export const joinMatch = async (matchId) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/join/`, {
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
        console.log("Error joining match:", error);
        throw error;
    }
};

export const leaveMatch = async (matchId) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/leave/`, {
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
        console.log("Error leaving match:", error);
        throw error;
    }
};

export const deleteMatch = async (matchId) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/`, {
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
        console.log("Error deleting match:", error);
        throw error;
    }
};

export const updateMatch = async (matchId, matchData) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/`, {
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
        console.log("Error updating match:", error);
        throw error;
    }
};

export const getMyMatches = async (sportType, searchQuery = '', isPaid = null, page = 1) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        let url = `${API_BASE_URL}/matches/my_matches/`;
        let queryParams = [];
        if (sportType && sportType !== 'ALL') queryParams.push(`sport_type=${sportType}`);
        if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
        if (isPaid !== null && isPaid !== undefined) queryParams.push(`is_paid=${isPaid}`);
        if (page > 1) queryParams.push(`page=${page}`);
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

        const response = await fetchWithAuth(url, {
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
        console.log("Error fetching my matches:", error);
        throw error;
    }
};

export const getMatchMessages = async (matchId) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/messages/`, {
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
        console.log("Error fetching messages:", error);
        throw error;
    }
};

export const sendMatchMessage = async (matchId, text, replyTo = null) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const payload = { text };
        if (replyTo) {
            payload.reply_to = replyTo;
        }

        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/messages/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });
        
        const json = await response.json();
        
        if (!response.ok) {
            throw new Error(json.error || json.message || `HTTP error! status: ${response.status}`);
        }
        return json;
    } catch (error) {
        console.log("Error sending message:", error);
        throw error;
    }
};

export const createRematch = async (matchId, targetStartTime) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/rematch/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ target_start_time: targetStartTime }),
        });
        
        const json = await response.json();
        
        if (!response.ok) {
            throw new Error(json.error || json.message || `HTTP error! status: ${response.status}`);
        }
        return json;
    } catch (error) {
        console.log("Error creating rematch:", error);
        throw error;
    }
};

export const updateMatchMessage = async (matchId, messageId, text) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/messages/${messageId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text }),
        });
        
        const json = await response.json();
        
        if (!response.ok) {
            throw new Error(json.error || json.message || `HTTP error! status: ${response.status}`);
        }
        return json;
    } catch (error) {
        console.log("Error updating message:", error);
        throw error;
    }
};

export const deleteMatchMessage = async (matchId, messageId) => {
    try {
        const token = await getToken();
        if (!token) throw new Error('Нет токена авторизации');
        
        const response = await fetchWithAuth(`${API_BASE_URL}/matches/${matchId}/messages/${messageId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });
        
        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const json = await response.json();
                errorMsg = json.error || json.message || errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }
        return true;
    } catch (error) {
        console.log("Error deleting message:", error);
        throw error;
    }
};
