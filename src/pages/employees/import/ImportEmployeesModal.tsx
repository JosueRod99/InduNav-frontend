import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, XCircle } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { importEmployees, type EmployeeImportResult, type EmployeeImportRow } from '../../../api/employees';
import { getAreas } from '../../../api/areas';
import { buildTemplate, parseSpreadsheet, type ParsedSpreadsheet } from './employeeSpreadsheet';

// Import the employees of a plant from Excel: download the template, upload the file, review
// every row (new / update / error, with warnings) and confirm. Only valid rows are saved.

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  plantName: string;
}

type Step = { kind: 'pick' } | { kind: 'preview'; file: string; parsed: ParsedSpreadsheet; result: EmployeeImportResult } | { kind: 'done'; result: EmployeeImportResult };

const ACTION_BADGE = {
  create: { text: 'Nuevo', className: 'bg-green-100 text-green-800' },
  update: { text: 'Actualizar', className: 'bg-blue-100 text-blue-800' },
  error: { text: 'Error', className: 'bg-red-100 text-red-800' },
};

const ImportEmployeesModal = ({ isOpen, onClose, plantId, plantName }: ImportEmployeesModalProps) => {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const [busy, setBusy] = useState<null | 'template' | 'reading' | 'saving'>(null);
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [rows, setRows] = useState<EmployeeImportRow[]>([]);

  const close = () => {
    setStep({ kind: 'pick' });
    setOnlyIssues(false);
    onClose();
  };

  const downloadTemplate = async () => {
    setBusy('template');
    try {
      const { areas } = await getAreas({ plant_id: plantId, limit: 500 });
      const blob = await buildTemplate(plantName, areas.map((a) => a.name));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Plantilla empleados - ${plantName}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo generar la plantilla');
    } finally {
      setBusy(null);
    }
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      toast.error('Sube un archivo de Excel (.xlsx)');
      return;
    }
    setBusy('reading');
    try {
      const parsed = await parseSpreadsheet(file);
      if (parsed.missingRequired.length) throw new Error(`Faltan las columnas: ${parsed.missingRequired.join(', ')}`);
      if (!parsed.rows.length) throw new Error('El archivo no tiene empleados');
      const result = await importEmployees(plantId, parsed.rows, true);
      setRows(parsed.rows);
      setStep({ kind: 'preview', file: file.name, parsed, result });
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'No se pudo leer el archivo');
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const confirm = async () => {
    setBusy('saving');
    try {
      const result = await importEmployees(plantId, rows, false);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['orgChart'] });
      queryClient.invalidateQueries({ queryKey: ['plant-summary', plantId] });
      setStep({ kind: 'done', result });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo importar');
    } finally {
      setBusy(null);
    }
  };

  const fileInputElement = (
    <input ref={fileInput} type="file" accept=".xlsx" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
  );

  if (step.kind === 'done') {
    const { summary } = step.result;
    return (
      <Modal isOpen={isOpen} onClose={close} title="Importación terminada" size="md" footer={<Button onClick={close}>Listo</Button>}>
        <div className="space-y-2 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <p className="text-gray-900">
            <strong>{summary.create}</strong> empleado{summary.create === 1 ? '' : 's'} nuevo{summary.create === 1 ? '' : 's'} y{' '}
            <strong>{summary.update}</strong> actualizado{summary.update === 1 ? '' : 's'} en {plantName}.
          </p>
          {summary.errors > 0 && (
            <p className="text-sm text-red-700">
              {summary.errors} fila{summary.errors === 1 ? '' : 's'} con error no se importaron. Corrígelas en el archivo y vuelve a importarlo: lo ya
              importado se actualiza, no se duplica.
            </p>
          )}
        </div>
      </Modal>
    );
  }

  if (step.kind === 'preview') {
    const { summary } = step.result;
    const valid = summary.create + summary.update;
    const visible = onlyIssues ? step.result.rows.filter((r) => r.messages.length) : step.result.rows;
    return (
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Revisar importación"
        size="xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {fileInputElement}
            <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={!!busy}>
              Cambiar archivo
            </Button>
            <Button onClick={confirm} disabled={!valid || !!busy} className="gap-1.5">
              {busy === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar {valid} empleado{valid === 1 ? '' : 's'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <FileSpreadsheet className="h-4 w-4 text-green-700" />
            <span className="truncate">
              {step.file} · hoja "{step.parsed.sheetName}" · {step.parsed.rows.length} fila{step.parsed.rows.length === 1 ? '' : 's'}
            </span>
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800">{summary.create} nuevos</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-800">{summary.update} a actualizar</span>
            {summary.errors > 0 && <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800">{summary.errors} con error (no se importan)</span>}
            {summary.warnings > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">{summary.warnings} con avisos</span>}
            <label className="ml-auto flex items-center gap-1.5 text-gray-600">
              <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} className="rounded border-gray-300" />
              Solo filas con errores o avisos
            </label>
          </div>
          {step.parsed.truncated && <p className="text-sm text-amber-700">El archivo tiene más de 1000 empleados: solo se leyeron los primeros 1000.</p>}

          <div className="max-h-[55vh] overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="sticky top-0 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Acción</th>
                  <th className="px-3 py-2">Empleado</th>
                  <th className="px-3 py-2">Área</th>
                  <th className="px-3 py-2">Jefe directo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {visible.map((r) => (
                  <tr key={r.row} className={r.action === 'error' ? 'bg-red-50/50' : ''}>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-500">{r.row}</td>
                    <td className="px-3 py-2 align-top">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[r.action].className}`}>{ACTION_BADGE[r.action].text}</span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="font-medium text-gray-900">{r.name}</span>
                      {r.messages.map((m, i) => (
                        <span key={i} className={`mt-0.5 flex items-start gap-1 text-xs ${m.level === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                          {m.level === 'error' ? <XCircle className="mt-px h-3.5 w-3.5 flex-shrink-0" /> : <AlertTriangle className="mt-px h-3.5 w-3.5 flex-shrink-0" />}
                          {m.text}
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-2 align-top text-gray-700">{r.area || '—'}</td>
                    <td className="px-3 py-2 align-top text-gray-700">{r.manager || '—'}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      Ninguna fila tiene errores ni avisos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title={`Importar empleados · ${plantName}`} size="lg">
      <div className="space-y-5">
        <ol className="space-y-4 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
            <div className="space-y-2">
              <p>
                Descarga la plantilla. Ya trae las áreas de esta planta y los títulos (Ing., Lic.…) como listas desplegables.
              </p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadTemplate} disabled={!!busy}>
                {busy === 'template' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Descargar plantilla
              </Button>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
            <p>
              Llénala (Nombre y Apellidos son obligatorios). <strong>Jefe directo</strong> puede ser el número, correo o nombre de otra persona
              del archivo o de la empresa. También sirve tu propio Excel si usa los mismos encabezados.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
            <div className="w-full space-y-2">
              <p>Súbela. Antes de guardar verás qué empleados son nuevos, cuáles se actualizan y si hay errores.</p>
              {fileInputElement}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  readFile(e.dataTransfer.files?.[0]);
                }}
                disabled={!!busy}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-gray-600 hover:border-blue-400 hover:bg-blue-50/40 disabled:opacity-60"
              >
                {busy === 'reading' ? <Loader2 className="h-8 w-8 animate-spin text-blue-600" /> : <Upload className="h-8 w-8 text-gray-400" />}
                <span className="font-medium">{busy === 'reading' ? 'Revisando el archivo…' : 'Elegir o arrastrar archivo .xlsx'}</span>
              </button>
            </div>
          </li>
        </ol>
        <p className="text-xs text-gray-500">
          Empleados que ya existen (mismo número de empleado o correo) se actualizan con las celdas que tengan valor; las celdas vacías no
          borran datos.
        </p>
      </div>
    </Modal>
  );
};

export default ImportEmployeesModal;
