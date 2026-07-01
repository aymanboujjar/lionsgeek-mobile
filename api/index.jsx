import axios from "axios";
import {
  normalizeEvents,
  isSameEventId,
  participantEmailsMatch,
  normalizeParticipantEmail,
  getEventDate,
} from '@/utils/events';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL;

const ensureAppUrl = () => {
    const value = typeof APP_URL === 'string' ? APP_URL.trim() : '';
    if (!value) {
        throw new Error(
            'EXPO_PUBLIC_APP_URL is not set. Create a .env file (see .env.example) and restart Expo.'
        );
    }
    return value.replace(/\/+$/, '');
};

const IMAGE_URL = APP_URL ? `${APP_URL}/storage/images` : '';
const VIDEO_URL = APP_URL ? `${APP_URL}/storage/videos` : '';

const getPublic = async (endpoint) => {
    try {
        const baseUrl = ensureAppUrl();
        const url = `${baseUrl}/api/${endpoint}`;
        const response = await axios.get(url, {
            headers: {
                Accept: 'application/json',
            },
        });

        if (typeof response.data === 'string') {
            const jsonMatch = response.data.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    response.data = JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    console.log(`API WARNING: Failed to parse JSON from response for ${endpoint}`);
                }
            }
        }

        return response;
    } catch (error) {
        const baseUrl = (() => {
            try { return ensureAppUrl(); } catch { return ''; }
        })();
        const url = baseUrl ? `${baseUrl}/api/${endpoint}` : `/api/${endpoint}`;
        const errorData = error?.response?.data;
        const errorMessage = typeof errorData === 'object'
            ? JSON.stringify(errorData, null, 2)
            : (errorData || error?.message || 'Unknown error');
        console.log(`API ERROR\nMethod: GET (public)\nURL: ${url}\nEndpoint: ${endpoint}\nError: ${errorMessage}`);
        throw error;
    }
};

const get = async (endpoint, Token) => {
    try {
        const baseUrl = ensureAppUrl();
        // Token is REQUIRED for all API calls
        if (!Token) {
            throw new Error('Authentication token is required');
        }

        const headers = {
            'Authorization': `Bearer ${Token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        const url = `${baseUrl}/api/${endpoint}`;
        const response = await axios.get(url, { headers });
        
        // Handle case where response.data is a string with HTML warnings + JSON
        if (typeof response.data === 'string') {
            // Extract JSON from string (find the JSON object)
            const jsonMatch = response.data.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    response.data = JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    console.log(`API WARNING: Failed to parse JSON from response for ${endpoint}`);
                    // Keep original response.data if parsing fails
                }
            }
        }
        
        return response;
    } catch (error) {
        const baseUrl = (() => {
            try { return ensureAppUrl(); } catch { return ''; }
        })();
        const url = baseUrl ? `${baseUrl}/api/${endpoint}` : `/api/${endpoint}`;
        const errorData = error?.response?.data;
        const errorMessage = typeof errorData === 'object' 
            ? JSON.stringify(errorData, null, 2)
            : (errorData || error?.message || 'Unknown error');
        console.log(`API ERROR\nMethod: GET\nURL: ${url}\nEndpoint: ${endpoint}\nError: ${errorMessage}`);
        if (error?.response?.status) {
            console.log(`Status: ${error.response.status}`);
        }
        throw error;
    }
};



const post = async (endpoint, data, Token) => {
    try {
        const baseUrl = ensureAppUrl();
        // Token is REQUIRED for all API calls (except login/forgot-password)
        const headers = {
            'Accept': 'application/json',
        };

        // Check if data is FormData (React Native FormData)
        // In React Native, FormData is a global, so we check for it
        const isFormData = data && (
            (typeof FormData !== 'undefined' && data instanceof FormData) ||
            (data.constructor && data.constructor.name === 'FormData') ||
            (data._parts !== undefined) // React Native FormData has _parts
        );

        // For JSON, we set application/json.
        // For FormData (uploads), axios-on-RN is more reliable when explicitly
        // using multipart/form-data (boundary is handled by the native layer).
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        } else {
            headers['Content-Type'] = 'multipart/form-data';
        }

        if (Token) {
            headers['Authorization'] = `Bearer ${Token}`;
        }

        const url = `${baseUrl}/api/${endpoint}`;
        const response = await axios.post(url, data, {
            headers,
            // Avoid custom transformRequest for FormData — it can break multipart in RN and cause Network Error
            timeout: 30000,
        });
        
        // Handle case where response.data is a string with HTML warnings + JSON
        if (typeof response.data === 'string') {
            // Extract JSON from string (find the JSON object)
            const jsonMatch = response.data.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    response.data = JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    console.log(`API WARNING: Failed to parse JSON from response for ${endpoint}`);
                    // Keep original response.data if parsing fails
                }
            }
        }
        
        return response;
    } catch (error) {
        const baseUrl = (() => {
            try { return ensureAppUrl(); } catch { return ''; }
        })();
        const url = baseUrl ? `${baseUrl}/api/${endpoint}` : `/api/${endpoint}`;
        const status = error?.response?.status;
        const errorData = error?.response?.data;
        const errorMessage = typeof errorData === 'object'
            ? JSON.stringify(errorData, null, 2)
            : (errorData || error?.message || 'Unknown error');
        console.log(`API ERROR\nMethod: POST\nURL: ${url}\nEndpoint: ${endpoint}\nStatus: ${status ?? 'unknown'}\nError: ${errorMessage}`);
        throw error;
    }
};



const put = async (endpoint, Token, data) => {
    try {
        const baseUrl = ensureAppUrl();
        if (!Token) {
            throw new Error('Authentication token is required');
        }

        const headers = {
            'Authorization': `Bearer ${Token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        const url = `${baseUrl}/api/${endpoint}`;
        const response = await axios.put(url, data, { headers });
        return response;
    } catch (error) {
        const baseUrl = (() => {
            try { return ensureAppUrl(); } catch { return ''; }
        })();
        const url = baseUrl ? `${baseUrl}/api/${endpoint}` : `/api/${endpoint}`;
        const errorData = error?.response?.data;
        const errorMessage = typeof errorData === 'object'
            ? JSON.stringify(errorData, null, 2)
            : (errorData || error?.message || 'Unknown error');
        console.log(`API ERROR\nMethod: PUT\nURL: ${url}\nEndpoint: ${endpoint}\nError: ${errorMessage}`);
        throw error;
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
        const baseUrl = ensureAppUrl();
        if (!Token) {
            throw new Error('Authentication token is required');
        }

        const headers = {
            'Authorization': `Bearer ${Token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        const url = `${baseUrl}/api/${endpoint}`;
        const response = await axios.delete(url, { headers });
        return response;
    } catch (error) {
        const baseUrl = (() => {
            try { return ensureAppUrl(); } catch { return ''; }
        })();
        const url = baseUrl ? `${baseUrl}/api/${endpoint}` : `/api/${endpoint}`;
        const errorData = error?.response?.data;
        const errorMessage = typeof errorData === 'object'
            ? JSON.stringify(errorData, null, 2)
            : (errorData || error?.message || 'Unknown error');
        console.log(`API ERROR\nMethod: DELETE\nURL: ${url}\nEndpoint: ${endpoint}\nError: ${errorMessage}`);
        throw error;
    }
};

// Mobile API helpers with token from context
const getWithAuth = async (endpoint, token) => {
    return get(endpoint, token);
};
const postWithAuth = async (endpoint, data, token) => {
    return post(endpoint, data, token);
};

// ---------------------------------------------------------------------------
// Voice call helpers
// Backend routes (see routes/api.php on the Laravel side). All call routes
// live inside the `auth:sanctum` + `prefix('mobile')` group, so the real
// URLs are /api/mobile/calls/... and /api/mobile/call/ably-token.
//   GET    /api/mobile/call/ably-token
//   POST   /api/mobile/calls/initiate          { callee_id }
//   GET    /api/mobile/calls/{id}
//   POST   /api/mobile/calls/{id}/accept
//   POST   /api/mobile/calls/{id}/reject
//   POST   /api/mobile/calls/{id}/end
// All return JSON. These helpers unwrap response.data so callers can
// just `await API.initiateCall(...)` and use the result directly.
// ---------------------------------------------------------------------------

const initiateCall = async (calleeId, token) => {
    const response = await post('mobile/calls/initiate', { callee_id: calleeId }, token);
    return response?.data;
};

const acceptCall = async (callId, token) => {
    const response = await post(`mobile/calls/${callId}/accept`, {}, token);
    return response?.data;
};

const rejectCall = async (callId, token) => {
    const response = await post(`mobile/calls/${callId}/reject`, {}, token);
    return response?.data;
};

const endCall = async (callId, token) => {
    const response = await post(`mobile/calls/${callId}/end`, {}, token);
    return response?.data;
};

const getCall = async (callId, token) => {
    const response = await get(`mobile/calls/${callId}`, token);
    return response?.data;
};

const getCallAblyToken = async (token) => {
    const response = await get('mobile/call/ably-token', token);
    return response?.data;
};

// ---------------------------------------------------------------------------
// Stories
//   GET    /api/mobile/stories                  → { groups: [...] }
//   POST   /api/mobile/stories  (multipart)     → { story }
//   POST   /api/mobile/stories/{id}/view        → { ok }
//   DELETE /api/mobile/stories/{id}             → { ok }
// ---------------------------------------------------------------------------

const listStories = async (token) => {
    const response = await get('mobile/stories', token);
    return response?.data;
};

const createStory = async ({ uri, type, durationMs, width, height, mimeType, audience, overlays }, token) => {
    const form = new FormData();
    const isVideo = type === 'video';
    const fallbackName = isVideo ? `story_${Date.now()}.mp4` : `story_${Date.now()}.jpg`;
    const fallbackMime = isVideo ? 'video/mp4' : 'image/jpeg';
    form.append('media', {
        uri,
        name: fallbackName,
        type: mimeType || fallbackMime,
    });
    form.append('media_type', isVideo ? 'video' : 'image');
    if (durationMs) form.append('duration_ms', String(Math.round(durationMs)));
    if (width)      form.append('width', String(Math.round(width)));
    if (height)     form.append('height', String(Math.round(height)));
    if (audience === 'close_friends' || audience === 'public') {
        form.append('audience', audience);
    }
    if (Array.isArray(overlays) && overlays.length > 0) {
        form.append('overlays', JSON.stringify(overlays));
    }
    const response = await post('mobile/stories', form, token);
    return response?.data;
};

const viewStory = async (storyId, token) => {
    const response = await post(`mobile/stories/${storyId}/view`, {}, token);
    return response?.data;
};

const deleteStory = async (storyId, token) => {
    const response = await remove(`mobile/stories/${storyId}`, token);
    return response?.data;
};

const getStoryViewers = async (storyId, token) => {
    const response = await get(`mobile/stories/${storyId}/viewers`, token);
    return response?.data;
};

const reactToStory = async (storyId, emoji, token) => {
    const response = await post(`mobile/stories/${storyId}/react`, { emoji }, token);
    return response?.data;
};

const removeStoryReaction = async (storyId, token) => {
    const response = await remove(`mobile/stories/${storyId}/react`, token);
    return response?.data;
};

const replyToStory = async (storyId, message, token) => {
    const response = await post(`mobile/stories/${storyId}/reply`, { message }, token);
    return response?.data;
};

const repostStoryFromMention = async (storyId, token) => {
    const response = await post(`mobile/stories/${storyId}/mention-repost`, {}, token);
    return response?.data;
};

const reportStoryCaptureEvent = async (storyId, kind, token) => {
    const response = await post(`mobile/stories/${storyId}/capture-event`, { kind }, token);
    return response?.data;
};

// ─── Highlights ───────────────────────────────────────────────────────────
const listHighlights = async (userId, token) => {
    const response = await get(`mobile/users/${userId}/highlights`, token);
    return response?.data;
};

const getHighlight = async (highlightId, token) => {
    const response = await get(`mobile/highlights/${highlightId}`, token);
    return response?.data;
};

const createHighlight = async ({ title, storyId }, token) => {
    const response = await post(
        `mobile/highlights`,
        { title, story_id: storyId },
        token,
    );
    return response?.data;
};

const addStoryToHighlight = async (highlightId, storyId, token) => {
    const response = await post(
        `mobile/highlights/${highlightId}/stories`,
        { story_id: storyId },
        token,
    );
    return response?.data;
};

const removeStoryFromHighlight = async (highlightId, storyId, token) => {
    const response = await remove(
        `mobile/highlights/${highlightId}/stories/${storyId}`,
        token,
    );
    return response?.data;
};

const deleteHighlight = async (highlightId, token) => {
    const response = await remove(`mobile/highlights/${highlightId}`, token);
    return response?.data;
};

// ─── Close friends ────────────────────────────────────────────────────────
const listCloseFriends = async (token) => {
    const response = await get(`mobile/close-friends`, token);
    return response?.data;
};

const addCloseFriend = async (friendId, token) => {
    const response = await post(`mobile/close-friends/${friendId}`, {}, token);
    return response?.data;
};

const removeCloseFriend = async (friendId, token) => {
    const response = await remove(`mobile/close-friends/${friendId}`, token);
    return response?.data;
};

// ─── Generic user search (used for @mentions in stories) ──────────────────
const searchUsers = async (query, token) => {
    const q = encodeURIComponent(String(query || '').trim());
    const response = await get(`mobile/search?type=students&q=${q}`, token);
    return response?.data;
};

// ─── Music browse (story music sticker) ───────────────────────────────────
// GET /mobile/music/browse?section=top_morocco|search|trending|original&country=MA&q=&limit=50
// Returns: { section, title, country, source, items[], total, preview_max_ms, story_max_ms }
const browseMusic = async (token, {
    section = 'top_morocco',
    country = 'MA',
    q = '',
    limit = 50,
} = {}) => {
    const params = new URLSearchParams({
        section: String(section),
        country: String(country),
        limit: String(limit),
    });
    const query = String(q || '').trim();
    if (query) params.set('q', query);
    const response = await get(`mobile/music/browse?${params.toString()}`, token);
    return response?.data;
};

/** @deprecated use browseMusic({ section: 'search', q }) */
const searchMusic = async (query, token, { limit = 50 } = {}) => {
    return browseMusic(token, { section: 'search', q: query, limit });
};

/** @deprecated use browseMusic({ section: 'top_morocco' }) */
const getMusicCharts = async (token, { country = 'MA', limit = 50 } = {}) => {
    return browseMusic(token, { section: 'top_morocco', country, limit });
};

// ---------------------------------------------------------------------------
// Events (lionsgeek.ma events-info API — API-key auth, separate from Sanctum)
// Proxy mode: EXPO_PUBLIC_EVENTS_INFO_USE_PROXY=true → mylionsgeek /api/events-info/*
// Direct mode: hits lionsgeek.ma /api/*
// ---------------------------------------------------------------------------

const EVENTS_PUBLIC_URL = (
    process.env.EXPO_PUBLIC_EVENTS_INFO_SECTION_URL ||
    process.env.EVENTS_INFO_SECTION_URL ||
    ''
).replace(/\/+$/, '');

const EVENTS_APP_URL = (process.env.EXPO_PUBLIC_APP_URL || '').replace(/\/+$/, '');

const EVENTS_USE_PROXY =
    String(process.env.EXPO_PUBLIC_EVENTS_INFO_USE_PROXY || '').toLowerCase() === 'true';

const EVENTS_API_KEY = (
    process.env.EXPO_PUBLIC_EVENTS_INFO_SECTION_KEY ||
    process.env.EVENTS_INFO_SECTION_KEY ||
    ''
).trim();

const EVENTS_REQUEST_BASE = EVENTS_USE_PROXY ? EVENTS_APP_URL : EVENTS_PUBLIC_URL;
const EVENTS_API_PREFIX = EVENTS_USE_PROXY ? 'api/events-info' : 'api';

const ensureEventsConfig = () => {
    if (EVENTS_USE_PROXY && !EVENTS_APP_URL) {
        throw new Error(
            'EXPO_PUBLIC_APP_URL is not set but proxy mode is on. Set it in .env and restart Expo with: npx expo start -c'
        );
    }
    if (!EVENTS_USE_PROXY && !EVENTS_PUBLIC_URL) {
        throw new Error(
            'EXPO_PUBLIC_EVENTS_INFO_SECTION_URL is not set. Add it to .env and restart Expo with: npx expo start -c'
        );
    }
    if (!EVENTS_API_KEY) {
        throw new Error(
            'EXPO_PUBLIC_EVENTS_INFO_SECTION_KEY is not set. Add it to .env and restart Expo with: npx expo start -c'
        );
    }
};

const eventsAuthHeaders = () => ({
    Authorization: `Bearer ${EVENTS_API_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
});

const buildEventsUrl = (endpoint) => `${EVENTS_REQUEST_BASE}/${EVENTS_API_PREFIX}/${endpoint}`;

const buildEventsBookingUrl = () => {
    if (EVENTS_USE_PROXY) {
        return `${EVENTS_APP_URL}/api/events-info/booking/store`;
    }
    if (!EVENTS_PUBLIC_URL) {
        throw new Error(
            'EXPO_PUBLIC_EVENTS_INFO_SECTION_URL is not set. Add it to .env and restart Expo with: npx expo start -c'
        );
    }
    return `${EVENTS_PUBLIC_URL}/api/booking/store`;
};

const getEventsInfo = async (endpoint) => {
    ensureEventsConfig();
    return axios.get(buildEventsUrl(endpoint), { headers: eventsAuthHeaders() });
};

const putEventsInfo = async (endpoint, data) => {
    ensureEventsConfig();
    return axios.put(buildEventsUrl(endpoint), data, { headers: eventsAuthHeaders() });
};

const postEventsBooking = async (data) => {
    ensureEventsConfig();
    return axios.post(buildEventsBookingUrl(), data, { headers: eventsAuthHeaders() });
};

const getEvents = () => getEventsInfo('events');

const getEvent = (eventId) => getEventsInfo(`events/${eventId}`);

const storeEventBooking = (payload) => postEventsBooking(payload);

const validateEventInvitation = (payload) => putEventsInfo('validate-event-invitation', payload);

const manualEventChecking = (bookingId, eventId) =>
    putEventsInfo('manual-event-checking', { id: Number(bookingId), event_id: Number(eventId) });

const OTHER_EVENTS_BATCH_SIZE = 4;

const fetchParticipantOtherRegistrations = async (email, excludeEventId) => {
    const normalizedEmail = normalizeParticipantEmail(email);
    if (!normalizedEmail) return [];

    const listResponse = await getEvents();
    const events = normalizeEvents(listResponse?.data ?? []).filter(
        (event) => !isSameEventId(event.id, excludeEventId)
    );

    const matches = [];

    for (let index = 0; index < events.length; index += OTHER_EVENTS_BATCH_SIZE) {
        const batch = events.slice(index, index + OTHER_EVENTS_BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(async (summary) => {
                if (isSameEventId(summary.id, excludeEventId)) return null;

                try {
                    const response = await getEvent(summary.id);
                    const event = response?.data?.event ?? summary;
                    if (isSameEventId(event.id, excludeEventId)) return null;

                    const participants = Array.isArray(response?.data?.participants)
                        ? response.data.participants
                        : [];
                    const registration = participants.find((p) =>
                        participantEmailsMatch(p.email, normalizedEmail)
                    );
                    if (!registration) return null;

                    return { event, registration };
                } catch {
                    return null;
                }
            })
        );

        matches.push(...batchResults.filter(Boolean));
    }

    const withoutCurrent = matches.filter((item) => !isSameEventId(item.event?.id, excludeEventId));

    return withoutCurrent.sort((a, b) => {
        const da = getEventDate(a.event)?.getTime() ?? 0;
        const db = getEventDate(b.event)?.getTime() ?? 0;
        return db - da;
    });
};

export default {
    get,
    getPublic,
    put,
    post,
    remove,
    getWithAuth,
    postWithAuth,
    APP_URL,
    IMAGE_URL,
    VIDEO_URL,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    getCall,
    getCallAblyToken,
    listStories,
    createStory,
    viewStory,
    deleteStory,
    getStoryViewers,
    reactToStory,
    removeStoryReaction,
    replyToStory,
    repostStoryFromMention,
    reportStoryCaptureEvent,
    listHighlights,
    getHighlight,
    createHighlight,
    addStoryToHighlight,
    removeStoryFromHighlight,
    deleteHighlight,
    listCloseFriends,
    addCloseFriend,
    removeCloseFriend,
    searchUsers,
    browseMusic,
    searchMusic,
    getMusicCharts,
    EVENTS_PUBLIC_URL,
    EVENTS_APP_URL,
    EVENTS_USE_PROXY,
    getEvents,
    getEvent,
    storeEventBooking,
    validateEventInvitation,
    manualEventChecking,
    fetchParticipantOtherRegistrations,
};
