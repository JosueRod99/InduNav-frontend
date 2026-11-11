import { createContext, useContext } from 'react';
import type { TranslationMeta } from '../../../utils/translationState';

// The language a tour was written in: what is shown while a translation is missing
export const SourceLanguageContext = createContext({ code: 'es', name: 'Español' });

export const useSourceLanguage = () => useContext(SourceLanguageContext);

// Which texts of what is being edited (the tour or one area) came from the translator
export const TranslationMetaContext = createContext<TranslationMeta>({});

export const useTranslationMeta = () => useContext(TranslationMetaContext);
