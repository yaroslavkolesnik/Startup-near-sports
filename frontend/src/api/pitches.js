import { getToken, fetchWithAuth } from './auth';

const API_BASE_URL = 'http://192.168.0.67:8000/api';

export const getPitches = async (sportType, searchQuery = '', surfaceType = null, isPaid = null, page = 1, noPage = false) => {
    try {
        let url = `${API_BASE_URL}/pitches/`;
        let queryParams = [];
        if (sportType && sportType !== 'ALL') queryParams.push(`sport_type=${sportType}`);
        if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
        if (surfaceType) queryParams.push(`surface_type=${encodeURIComponent(surfaceType)}`);
        if (isPaid !== null && isPaid !== undefined) queryParams.push(`is_paid=${isPaid}`);
        if (noPage) {
            queryParams.push('no_page=true');
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
        console.error("Error fetching pitches:", error);
        throw error;
    }
};

export const getPitch = async (id) => {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/pitches/${id}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.error("Error fetching pitch:", error);
        throw error;
    }
};

export const createPitch = async (pitchData, photos) => {
    try {
        // Round coordinates to 6 decimal places for DRF validation
        const formattedPitchData = { ...pitchData };
        if (formattedPitchData.latitude != null) {
            formattedPitchData.latitude = Number(formattedPitchData.latitude).toFixed(6);
        }
        if (formattedPitchData.longitude != null) {
            formattedPitchData.longitude = Number(formattedPitchData.longitude).toFixed(6);
        }

        let options = { method: 'POST', headers: {} };
        const token = await getToken();
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (photos && photos.length > 0) {
            const formData = new FormData();
            for (let key in formattedPitchData) {
                formData.append(key, String(formattedPitchData[key]));
            }
            photos.forEach((photoUri, index) => {
                formData.append('photos', {
                    uri: photoUri,
                    name: `photo_${index}.jpg`,
                    type: 'image/jpeg'
                });
            });
            options.body = formData;
        } else {
            options.body = JSON.stringify(formattedPitchData);
            options.headers['Content-Type'] = 'application/json';
        }

        const response = await fetchWithAuth(`${API_BASE_URL}/pitches/`, options);
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            throw new Error(JSON.stringify(errorData));
        }
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.error("Error creating pitch:", error);
        throw error;
    }
};

export const getMyPitches = async (sportType, searchQuery = '', surfaceType = null, isPaid = null, page = 1, noPage = false) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("No auth token");

        let url = `${API_BASE_URL}/pitches/my/`;
        let queryParams = [];
        if (sportType && sportType !== 'ALL') queryParams.push(`sport_type=${sportType}`);
        if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
        if (surfaceType) queryParams.push(`surface_type=${encodeURIComponent(surfaceType)}`);
        if (isPaid !== null && isPaid !== undefined) queryParams.push(`is_paid=${isPaid}`);
        if (noPage) {
            queryParams.push('no_page=true');
        } else if (page > 1) {
            queryParams.push(`page=${page}`);
        }
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

        const response = await fetchWithAuth(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.error("Error fetching my pitches:", error);
        throw error;
    }
};

export const updatePitch = async (id, pitchData, photos) => {
    try {
        const formattedPitchData = { ...pitchData };
        if (formattedPitchData.latitude != null) {
            formattedPitchData.latitude = Number(formattedPitchData.latitude).toFixed(6);
        }
        if (formattedPitchData.longitude != null) {
            formattedPitchData.longitude = Number(formattedPitchData.longitude).toFixed(6);
        }

        let options = { method: 'PATCH', headers: {} };
        const token = await getToken();
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (photos && photos.length > 0) {
            const formData = new FormData();
            for (let key in formattedPitchData) {
                formData.append(key, String(formattedPitchData[key]));
            }
            photos.forEach((photoUri, index) => {
                // If the URI is a local file (e.g. from ImagePicker), we add it as a file.
                // Otherwise, it might be an existing URL, which DRF might not handle directly as a File,
                // but we will pass it anyway according to the simple logic requested.
                formData.append('photos', {
                    uri: photoUri,
                    name: `photo_${index}.jpg`,
                    type: 'image/jpeg'
                });
            });
            options.body = formData;
        } else {
            options.body = JSON.stringify(formattedPitchData);
            options.headers['Content-Type'] = 'application/json';
        }

        const response = await fetchWithAuth(`${API_BASE_URL}/pitches/${id}/`, options);
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            throw new Error(JSON.stringify(errorData));
        }
        const json = await response.json();
        return json.data || json;
    } catch (error) {
        console.error("Error updating pitch:", error);
        throw error;
    }
};

export const deletePitch = async (id) => {
    try {
        const token = await getToken();
        if (!token) throw new Error("No auth token");

        const response = await fetchWithAuth(`${API_BASE_URL}/pitches/${id}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            throw new Error(JSON.stringify(errorData));
        }
        
        return true;
    } catch (error) {
        console.error("Error deleting pitch:", error);
        throw error;
    }
};
