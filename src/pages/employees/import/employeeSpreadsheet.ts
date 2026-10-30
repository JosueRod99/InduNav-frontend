import type { EmployeeImportRow } from '../../../api/employees';
import { NAME_PREFIXES } from '../../../utils/personName';

// Employees spreadsheet: the downloadable template and reading an uploaded .xlsx.
// exceljs is loaded only when one of these runs, so it never weighs on the rest of the app.

type Key = Exclude<keyof EmployeeImportRow, 'row'>;

export const COLUMNS: { key: Key; header: string; width: number; required?: boolean; aliases: string[] }[] = [
  { key: 'employee_number', header: 'Número de empleado', width: 18, aliases: ['numero de empleado', 'no de empleado', 'num de empleado', 'numero empleado', 'no empleado', 'num empleado', 'numero', 'nomina', 'numero de nomina', 'clave', 'id empleado'] },
  { key: 'name_prefix', header: 'Título', width: 9, aliases: ['titulo', 'prefijo', 'grado'] },
  { key: 'first_name', header: 'Nombre(s)', width: 22, required: true, aliases: ['nombre s', 'nombres', 'nombre'] },
  { key: 'last_name', header: 'Apellidos', width: 24, required: true, aliases: ['apellidos', 'apellido s', 'apellido'] },
  { key: 'position', header: 'Puesto', width: 30, aliases: ['puesto', 'cargo'] },
  { key: 'department', header: 'Departamento', width: 22, aliases: ['departamento', 'depto'] },
  { key: 'area', header: 'Área', width: 26, aliases: ['area', 'area de trabajo'] },
  { key: 'manager', header: 'Jefe directo', width: 26, aliases: ['jefe directo', 'jefe', 'reporta a', 'supervisor', 'jefe inmediato'] },
  { key: 'email', header: 'Correo', width: 28, aliases: ['correo', 'correo electronico', 'email', 'e mail', 'mail'] },
  { key: 'phone', header: 'Teléfono', width: 16, aliases: ['telefono', 'tel', 'celular', 'movil'] },
  { key: 'hire_date', header: 'Fecha de ingreso', width: 16, aliases: ['fecha de ingreso', 'fecha ingreso', 'ingreso', 'fecha de alta'] },
];

export const MAX_ROWS = 1000;

const normHeader = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const loadExcel = async () => (await import('exceljs')).default;

/** Template with headers, the plant's areas and the titles as suggestions, and instructions */
export const buildTemplate = async (plantName: string, areaNames: string[]): Promise<Blob> => {
  const ExcelJS = await loadExcel();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'InduNav';

  const sheet = workbook.addWorksheet('Empleados', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = COLUMNS.map((c) => ({ header: c.required ? `${c.header} *` : c.header, key: c.key, width: c.width }));
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
  header.height = 22;

  // Lists for the drop-downs (a hidden sheet, so long area lists still work)
  const lists = workbook.addWorksheet('Listas', { state: 'hidden' });
  NAME_PREFIXES.forEach((p, i) => (lists.getCell(i + 1, 1).value = p));
  areaNames.forEach((a, i) => (lists.getCell(i + 1, 2).value = a));

  const columnLetter = (key: Key) => sheet.getColumn(key).letter;
  for (let row = 2; row <= MAX_ROWS + 1; row++) {
    // Suggestions only: other values are accepted (warning, not error)
    sheet.getCell(`${columnLetter('name_prefix')}${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`Listas!$A$1:$A$${NAME_PREFIXES.length}`],
      showErrorMessage: false,
    };
    if (areaNames.length) {
      sheet.getCell(`${columnLetter('area')}${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`Listas!$B$1:$B$${areaNames.length}`],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Área no registrada',
        error: 'Esa área no existe en la planta. Si continúas, el empleado se importará sin área.',
      };
    }
  }
  sheet.getColumn('hire_date').numFmt = 'dd/mm/yyyy';
  sheet.getColumn('employee_number').numFmt = '@'; // keep leading zeros
  sheet.getColumn('phone').numFmt = '@';

  const help = workbook.addWorksheet('Instrucciones');
  help.getColumn(1).width = 22;
  help.getColumn(2).width = 90;
  const lines: [string, string][] = [
    ['Planta', plantName],
    ['', ''],
    ['Columna', 'Qué escribir'],
    ['Número de empleado', 'Opcional. Si ya existe en la empresa, se actualiza ese empleado.'],
    ['Título', 'Opcional: Ing., Lic., C.P., Tec., etc.'],
    ['Nombre(s) *', 'Obligatorio.'],
    ['Apellidos *', 'Obligatorio.'],
    ['Puesto / Departamento', 'Opcionales.'],
    ['Área', 'Nombre o código de un área de esta planta (lista desplegable).'],
    ['Jefe directo', 'Número de empleado, correo o nombre completo de su jefe. Puede ser alguien de este mismo archivo.'],
    ['Correo / Teléfono', 'Opcionales. Si el correo ya existe en la empresa, se actualiza ese empleado. El teléfono puede ir con o sin lada (656 412 8901, +1 915 555 0100); sin código de país se toma como de México.'],
    ['Fecha de ingreso', 'Opcional, en formato día/mes/año.'],
    ['', ''],
    ['Importante', 'Las celdas vacías no borran datos de empleados que ya existen. Máximo 1000 empleados por archivo.'],
  ];
  lines.forEach(([a, b]) => help.addRow([a, b]));
  help.getRow(3).font = { bold: true };
  help.getCell('A1').font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Spreadsheet dates (Date, Excel serial number or "dd/mm/yyyy") → "YYYY-MM-DD"; anything else is sent as is */
const toDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return isoDate(value);
  if (typeof value === 'number' && value > 20000 && value < 80000) return isoDate(new Date(Math.round((value - 25569) * 86400000)));
  const text = String(value ?? '').trim();
  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;
  return text;
};

/** Text of a cell, whatever exceljs returns (rich text, links, formulas…) */
const cellText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return isoDate(value);
  if (typeof value === 'object') {
    const v = value as { richText?: { text: string }[]; text?: unknown; result?: unknown; hyperlink?: string };
    if (v.richText) return v.richText.map((r) => r.text).join('');
    if (v.text !== undefined) return cellText(v.text);
    if (v.result !== undefined) return cellText(v.result);
    return '';
  }
  return String(value).trim();
};

export interface ParsedSpreadsheet {
  rows: EmployeeImportRow[];
  sheetName: string;
  recognized: string[]; // headers found
  missingRequired: string[];
  truncated: boolean;
}

export const parseSpreadsheet = async (file: File): Promise<ParsedSpreadsheet> => {
  const ExcelJS = await loadExcel();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.getWorksheet('Empleados') || workbook.worksheets.find((w) => w.state !== 'hidden') || workbook.worksheets[0];
  if (!sheet) throw new Error('El archivo no tiene hojas');

  // Header row: the first of the first 10 rows that names at least two known columns
  let headerRow = 0;
  let columnByIndex = new Map<number, Key>();
  for (let r = 1; r <= Math.min(10, sheet.rowCount) && !headerRow; r++) {
    const found = new Map<number, Key>();
    sheet.getRow(r).eachCell((cell, col) => {
      const text = normHeader(cellText(cell.value));
      const column = COLUMNS.find((c) => c.aliases.includes(text));
      if (column && ![...found.values()].includes(column.key)) found.set(col, column.key);
    });
    if (found.size >= 2) {
      headerRow = r;
      columnByIndex = found;
    }
  }
  if (!headerRow) throw new Error('No se encontraron los encabezados (Nombre, Apellidos…). Usa la plantilla de InduNav.');

  const keys = [...columnByIndex.values()];
  const rows: EmployeeImportRow[] = [];
  let truncated = false;
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const data: EmployeeImportRow = { row: r };
    columnByIndex.forEach((key, col) => {
      const raw = row.getCell(col).value;
      const text = key === 'hire_date' ? toDate(raw && typeof raw === 'object' && 'result' in (raw as object) ? (raw as any).result : raw) : cellText(raw);
      if (text) data[key] = text;
    });
    if (Object.keys(data).length === 1) continue; // empty row
    if (rows.length === MAX_ROWS) {
      truncated = true;
      break;
    }
    rows.push(data);
  }

  return {
    rows,
    sheetName: sheet.name,
    recognized: COLUMNS.filter((c) => keys.includes(c.key)).map((c) => c.header),
    missingRequired: COLUMNS.filter((c) => c.required && !keys.includes(c.key)).map((c) => c.header),
    truncated,
  };
};
