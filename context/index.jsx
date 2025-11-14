import { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const appContext = createContext();

const AppProvider = ({ children }) => {
    const [language, setLanguage] = useState("en");
    const [darkMode, setDarkMode] = useState(useColorScheme() == "dark");
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        (async () => {
            const t = await AsyncStorage.getItem('auth_token');
            const u = await AsyncStorage.getItem('auth_user');
            if (t) {
                setToken(t);
                // console.log('[CONTEXT] Token loaded from storage');
            }
            if (u) {
                const parsedUser = JSON.parse(u);
                setUser(parsedUser);
                // console.log('[CONTEXT] User data loaded from storage:', JSON.stringify(parsedUser, null, 2));
            }
        })();
    }, []);

    const saveAuth = async (nextToken, nextUser) => {
        // console.log('[CONTEXT] Saving auth data:', { hasToken: !!nextToken, hasUser: !!nextUser });
        if (nextUser) {
            // console.log('[CONTEXT] User data to save:', JSON.stringify(nextUser, null, 2));
        }
        setToken(nextToken);
        setUser(nextUser);
        await AsyncStorage.setItem('auth_token', nextToken ?? "");
        await AsyncStorage.setItem('auth_user', JSON.stringify(nextUser ?? null));
        // console.log('[CONTEXT] Auth data saved to AsyncStorage');
    };

    const signOut = async () => {
        setToken(null);
        setUser(null);
        await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    };

    const appValue = {
        language,
        setLanguage,
        darkMode,
        setDarkMode,
        token,
        user,
        saveAuth,
        signOut,
    };
    return <appContext.Provider value={appValue}>{children}</appContext.Provider>;
};

const useAppContext = () => useContext(appContext);

export { AppProvider, appContext, useAppContext };
