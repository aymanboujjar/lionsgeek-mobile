import { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

const appContext = createContext();

const AppProvider = ({ children }) => {
    const [language, setLanguage] = useState("en");
    const [darkMode, setDarkMode] = useState(useColorScheme() == "dark");

    const appValue = {
        language,
        setLanguage,
        darkMode,
        setDarkMode,
    };
    return <appContext.Provider value={appValue}>{children}</appContext.Provider>;
};

const useAppContext = () => useContext(appContext);

export { AppProvider, appContext, useAppContext };
