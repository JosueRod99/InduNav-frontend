import { createContext, useContext, type ReactNode } from 'react';
import type { ViewerTexts } from './viewerTexts';

const ViewerTextsContext = createContext<ViewerTexts | null>(null);

export const ViewerTextsProvider = ({ texts, children }: { texts: ViewerTexts; children: ReactNode }) => (
  <ViewerTextsContext.Provider value={texts}>{children}</ViewerTextsContext.Provider>
);

export const useViewerTexts = () => {
  const texts = useContext(ViewerTextsContext);
  if (!texts) throw new Error('useViewerTexts needs a ViewerTextsProvider');
  return texts;
};

/** A translated text with its number in bold: "Aquí trabajan **5** personas". Takes the text with {count} unfilled */
export const WithBoldCount = ({ text, count }: { text: string; count: number }) => {
  const [before, after = ''] = text.split('{count}');
  return (
    <>
      {before}
      <strong className="text-slate-900">{count}</strong>
      {after}
    </>
  );
};
