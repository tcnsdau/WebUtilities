import * as XLSX from 'xlsx';

/**
 * Xuất dữ liệu sang định dạng Excel XLSX với hỗ trợ đầy đủ tiếng Việt UTF-8
 * @param data Danh sách các đối tượng dữ liệu
 * @param fileName Tên file xuất (không kèm hoặc có kèm .xlsx)
 * @param sheetName Tên sheet
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  fileName: string,
  sheetName: string = 'DanhSach'
) {
  if (!data || data.length === 0) {
    alert('Không có dữ liệu để xuất Excel!');
    return;
  }

  // Tạo Worksheet từ JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Tự động tính toán độ rộng các cột
  const columnWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => (row[key] ? String(row[key]).length : 0))
    );
    return { wch: Math.min(Math.max(maxLength + 4, 12), 60) };
  });
  worksheet['!cols'] = columnWidths;

  // Tạo Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Tạo tên file an toàn
  const cleanFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

  // Xuất file XLSX (hỗ trợ Unicode UTF-8 chuẩn định dạng XLSX)
  XLSX.writeFile(workbook, cleanFileName, { bookType: 'xlsx', type: 'binary' });
}
