// React Native API service for users (/frontend API layer)

const API_BASE_URL = 'http://192.168.0.67:8000/api';

export const getUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // Backend standards rule: Successful responses must wrap data in a {"data": ...} object.
        return json.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const getUser = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
};
