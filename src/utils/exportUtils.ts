import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { ExamAttempt, QuestionReviewItem } from '../types';

/**
 * Renders an HTML element to high-resolution multi-page PDF using html2canvas & jsPDF.
 * This guarantees 100% authentic Arabic ligature shaping, Cairo font rendering,
 * and exact right-to-left layout without character disconnection.
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(filename);
}

/**
 * Downloads Excel spreadsheet of examination attempts.
 */
export function exportAttemptsToExcel(attempts: ExamAttempt[], filename = 'customs_exam_results.xlsx') {
  const rows = attempts.map(a => {
    let statusArabic = 'غير مكتمل';
    if (a.status === 'submitted') statusArabic = 'تم التسليم';
    if (a.status === 'expired') statusArabic = 'انتهى الوقت';
    if (a.status === 'active') statusArabic = 'جارٍ أداء الامتحان';
    if (a.status === 'reset') statusArabic = 'تمت إعادة التعيين';

    return {
      'اسم الطالب': a.student_name,
      'رقم المحاولة': a.attempt_number,
      'رقم طلب الدخول': a.access_request_id,
      'الدرجة من 50': a.score ?? '—',
      'النسبة المئوية': a.percentage !== undefined ? `${a.percentage}%` : '—',
      'الإجابات الصحيحة': a.correct_count ?? '—',
      'الإجابات الخاطئة': a.incorrect_count ?? '—',
      'الأسئلة غير المجابة': a.unanswered_count ?? '—',
      'تاريخ البدء': a.started_at ? new Date(a.started_at).toLocaleString('ar-EG') : '—',
      'تاريخ التسليم': a.submitted_at ? new Date(a.submitted_at).toLocaleString('ar-EG') : '—',
      'المدة (بالدقائق)': a.duration_seconds ? Math.round(a.duration_seconds / 60) : '—',
      'حالة الامتحان': statusArabic
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'النتائج النهائية');
  XLSX.writeFile(wb, filename);
}

/**
 * Downloads CSV of examination attempts with UTF-8 BOM.
 */
export function exportAttemptsToCsv(attempts: ExamAttempt[], filename = 'customs_exam_results.csv') {
  const rows = attempts.map(a => {
    let statusArabic = 'غير مكتمل';
    if (a.status === 'submitted') statusArabic = 'تم التسليم';
    if (a.status === 'expired') statusArabic = 'انتهى الوقت';
    if (a.status === 'active') statusArabic = 'جارٍ أداء الامتحان';
    if (a.status === 'reset') statusArabic = 'تمت إعادة التعيين';

    return {
      'اسم الطالب': a.student_name,
      'رقم المحاولة': a.attempt_number,
      'رقم طلب الدخول': a.access_request_id,
      'الدرجة من 50': a.score ?? '',
      'النسبة المئوية': a.percentage !== undefined ? `${a.percentage}%` : '',
      'الإجابات الصحيحة': a.correct_count ?? '',
      'الإجابات الخاطئة': a.incorrect_count ?? '',
      'الأسئلة غير المجابة': a.unanswered_count ?? '',
      'تاريخ البدء': a.started_at ? new Date(a.started_at).toLocaleString('ar-EG') : '',
      'تاريخ التسليم': a.submitted_at ? new Date(a.submitted_at).toLocaleString('ar-EG') : '',
      'حالة الامتحان': statusArabic
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
