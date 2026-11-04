// Excel file of a report. exceljs is loaded only when downloading, so it never weighs on the rest of the app.

export interface ReportColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string | number | null | undefined;
  date?: boolean; // YYYY-MM-DD text: a real date in the file
  width?: number; // in the file
  inPreview?: boolean; // shown in the page's table (false: only in the file)
}

export interface ReportSheet<T = any> {
  name: string;
  columns: ReportColumn<T>[];
  rows: T[];
}

const toDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

/** Sheets accept 31 characters and none of these */
const sheetName = (name: string) => name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);

const fileName = (name: string) => name.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();

export const downloadReport = async ({ title, subtitle, sheets }: { title: string; subtitle: string; sheets: ReportSheet[] }) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const generated = new Date();

  sheets.forEach(({ name, columns, rows }) => {
    const sheet = workbook.addWorksheet(sheetName(name));
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A2').value = subtitle;
    sheet.getCell('A3').value = `Generado el ${generated.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })} · ${rows.length} registros`;
    sheet.getCell('A2').font = sheet.getCell('A3').font = { color: { argb: 'FF4B5563' } };

    const HEADER_ROW = 5;
    const header = sheet.getRow(HEADER_ROW);
    columns.forEach((column, index) => {
      const cell = header.getCell(index + 1);
      cell.value = column.label;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } } };
      sheet.getColumn(index + 1).width = column.width ?? 18;
    });
    rows.forEach((row, rowIndex) => {
      const line = sheet.getRow(HEADER_ROW + 1 + rowIndex);
      columns.forEach((column, index) => {
        const value = column.value(row);
        if (value === null || value === undefined || value === '') return;
        const cell = line.getCell(index + 1);
        if (column.date && typeof value === 'string') {
          cell.value = toDate(value);
          cell.numFmt = 'dd/mm/yyyy';
        } else {
          cell.value = value;
        }
      });
    });
    sheet.views = [{ state: 'frozen', ySplit: HEADER_ROW }];
    if (columns.length > 0) sheet.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW + rows.length, column: columns.length } };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName(title)} - ${fileName(subtitle.split(' · ').slice(0, 2).join(' '))} - ${generated.toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};
