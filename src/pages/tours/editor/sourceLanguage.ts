import { createContext, useContext } from 'react';

// The language a tour was written in: what is shown while a translation is missing
export const SourceLanguageContext = createContext({ code: 'es', name: 'Español' });

export const useSourceLanguage = () => useContext(SourceLanguageContext);
