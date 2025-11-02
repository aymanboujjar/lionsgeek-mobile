import axios from "axios";


const APP_URL = "http://10.79.182.6:8000" ;

const IMAGE_URL = `${APP_URL}/storage/images`
const VIDEO_URL = `${APP_URL}/storage/videos`

const get = async (endpoint, Token) => {
    try {
        // Token is REQUIRED for all API calls
        if (!Token) {
            throw new Error('Authentication token is required');
        }

        const headers = {
            'Authorization': `Bearer ${Token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        const response = await axios.get(`${APP_URL}/api/${endpoint}`, { headers });
        return response;
    } catch (error) {
        console.log(`API ERROR\nMethod: GET\nEndpoint: ${endpoint}\nError: ${error?.response?.data || error?.message}`);
        throw error;
    }
};



const post = async (endpoint, data, Token) => {
    try {
        // Token is REQUIRED for all API calls (except login/forgot-password)
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
        
        if (Token) {
            headers['Authorization'] = `Bearer ${Token}`;
        }
        
        const response = await axios.post(`${APP_URL}/api/${endpoint}`, data, { headers });
        return response;
    } catch (error) {
        console.log(`API ERROR\nMethod: POST\nEndpoint: ${endpoint}\nError: ${error?.response?.data || error?.message}`);
        throw error;
    }
};



const put = async (endpoint, Token, data) => {
    try {
        const response = await axios.put(`${APP_URL}/api/${endpoint}`, data, {
            headers: { Token },
        });
        return response;
    } catch (error) {
        console.log(`API ERROR\nMethod: PUT\nEndpoint: ${endpoint}\nError: ${error}`);
        return null;
    }
};


//* Keep this just in case. For updating participants
// export const update_visitor = async (Token, first_name, last_name) => {
//     try {
//         const response = await axios.put(`${APP_URL}/api/visitor`, { first_name, last_name }, {
//             headers: { Token },
//         })
//         return response;
//     } catch (error) {

//         console.log("API ERROR:", error);

//     }
// }


const remove = async (endpoint, Token) => {
    try {
        const response = await axios.delete(`${APP_URL}/api/${endpoint}`, {
            headers: { Token: Token },
        });
        return response;
    } catch (error) {
        console.log(`API ERROR\nMethod: DELETE\nEndpoint: ${endpoint}\nError: ${error}`);
        return null;
    }
};

// Mobile API helpers with token from context
const getWithAuth = async (endpoint, token) => {
    return get(endpoint, token);
};

export default { get, put, post, remove, getWithAuth, APP_URL, IMAGE_URL, VIDEO_URL };
