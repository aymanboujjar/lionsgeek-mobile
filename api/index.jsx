import axios from "axios";


const APP_URL = process.env.EXPO_PUBLIC_APP_URL;

const IMAGE_URL = `${APP_URL}/storage/images`
const VIDEO_URL = `${APP_URL}/storage/videos`

const get = async (endpoint, Token) => {
    try {
        let response;

        if (Token) {
            response = await axios.get(`${APP_URL}/api/${endpoint}`, {
                headers: { Token }
            });
        } else {
            response = await axios.get(`${APP_URL}/api/${endpoint}`);
            
        }

        return response;
    } catch (error) {
        console.log(`API ERROR\nMethod: GET\nEndpoint: ${endpoint}\nError: ${error}`);
        return null;
    }
};



const post = async (endpoint, data, Token) => {
    try {
        const response = await axios.post(`${APP_URL}/api/${endpoint}`, data, {
            headers: { Token },
        });
        return response;
    } catch (error) {
        console.log(`API ERROR\nMethod: POST\nEndpoint: ${endpoint}\nError: ${error}`);
        return null;
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

export default { get, put, post, remove, APP_URL, IMAGE_URL, VIDEO_URL };
