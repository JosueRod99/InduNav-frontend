import { ChartColumn, Plus, Trash2, Type } from 'lucide-react';
import SortableList, { moveItem } from '../../../components/ui/SortableList';
import { newBlockId, type SectionBlock, type TourLanguage } from '../../../api/tourBuilder';
import TranslatedField from './TranslatedField';
import ChartFields from './ChartFields';

const MAX_BLOCKS = 20;

interface BlocksEditorProps {
  blocks: SectionBlock[];
  language: TourLanguage;
  onChange: (blocks: SectionBlock[]) => void;
}

/** Ordered content of a custom section: any mix of text and chart blocks */
const BlocksEditor = ({ blocks, language, onChange }: BlocksEditorProps) => {
  const update = (index: number, block: SectionBlock) => onChange(blocks.map((b, i) => (i === index ? block : b)));

  const remove = (index: number) => {
    const what = blocks[index].type === 'chart' ? 'esta gráfica' : 'este bloque de texto';
    if (window.confirm(`¿Quitar ${what}?`)) onChange(blocks.filter((_, i) => i !== index));
  };

  const add = (type: SectionBlock['type']) =>
    onChange([
      ...blocks,
      type === 'text'
        ? { type: 'text', id: newBlockId(), body: {} }
        : { type: 'chart', id: newBlockId(), title: {}, chart: { type: 'bar', points: [] } },
    ]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Contenido</p>

      {blocks.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-500">
          Agrega bloques de texto y gráficas en el orden en que quieres que se lean.
        </p>
      ) : (
        <SortableList
          items={blocks}
          getKey={(b) => b.id}
          onMove={(from, to) => onChange(moveItem(blocks, from, to))}
          className="space-y-2"
          handleLabel="Arrastra para cambiar el orden del bloque"
          renderItem={(block, index) => (
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {block.type === 'chart' ? <ChartColumn className="h-3.5 w-3.5" /> : <Type className="h-3.5 w-3.5" />}
                  {block.type === 'chart' ? 'Gráfica' : 'Texto'}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={block.type === 'chart' ? 'Quitar gráfica' : 'Quitar texto'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {block.type === 'text' ? (
                <TranslatedField
                  value={block.body}
                  language={language}
                  onChange={(body) => update(index, { ...block, body })}
                  multiline
                  rows={4}
                  placeholder="Ej. Medimos la respuesta del taller cada mes…"
                />
              ) : (
                <div className="space-y-3">
                  <TranslatedField
                    label="Título de la gráfica"
                    value={block.title}
                    language={language}
                    onChange={(title) => update(index, { ...block, title })}
                    maxLength={500}
                  />
                  <ChartFields
                    chart={block.chart}
                    language={language}
                    title={block.title?.[language] || block.title?.es}
                    onChange={(chart) => update(index, { ...block, chart })}
                  />
                </div>
              )}
            </div>
          )}
        />
      )}

      {blocks.length < MAX_BLOCKS && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => add('text')}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Texto
          </button>
          <button
            type="button"
            onClick={() => add('chart')}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Gráfica
          </button>
        </div>
      )}
    </div>
  );
};

export default BlocksEditor;
