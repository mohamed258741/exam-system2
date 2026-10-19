import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExamAttempt, QuestionReviewItem } from '../types';
import { AASTMT_LOGO_BASE64 } from '../assets/logo';

/**
 * Ensures all embedded images (including base64) are fully loaded & painted before snapshot.
 */
async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 800);
      });
    })
  );
  await new Promise((resolve) => setTimeout(resolve, 80));
}

/**
 * Generates an official, formal Arabic PDF report for a student's examination attempt.
 * Styled in high-prestige AASTMT & Egyptian Customs navy & gold formal certificate layout.
 */
export async function downloadFormalStudentPdf(
  attempt: ExamAttempt,
  questionsReview: QuestionReviewItem[]
): Promise<boolean> {
  const container = document.createElement('div');
  container.id = 'formal-report-print-container';
  container.setAttribute('dir', 'rtl');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '850px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Cairo', 'Tajawal', Arial, sans-serif";
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';

  const score = attempt.score ?? 0;
  const percentage = attempt.percentage ?? 0;
  const isPassed = score >= 25;
  const durationMin = attempt.duration_seconds ? Math.floor(attempt.duration_seconds / 60) : 0;
  const durationSec = attempt.duration_seconds ? attempt.duration_seconds % 60 : 0;

  let gradeArabic = 'راسب';
  if (percentage >= 85) gradeArabic = 'ممتاز (مرتبة الشرف)';
  else if (percentage >= 75) gradeArabic = 'جيد جداً';
  else if (percentage >= 65) gradeArabic = 'جيد';
  else if (percentage >= 50) gradeArabic = 'مقبول';

  // Build the complete formal HTML markup with pure inline styles
  container.innerHTML = `
    <div style="padding: 30px; background-color: #ffffff; color: #0f172a; line-height: 1.5; font-family: 'Cairo', 'Tajawal', sans-serif;">
      
      <!-- Formal Outer Border Frame -->
      <div style="border: 2px solid #002882; border-radius: 12px; padding: 24px; position: relative; background: #ffffff; overflow: hidden;">
        
        <!-- Subtle Authentic Academy Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; pointer-events: none; z-index: 0; text-align: center;">
          <img src="${AASTMT_LOGO_BASE64}" alt="علامة مائية" style="width: 420px; height: 420px; object-fit: contain;" />
        </div>

        <!-- Header: Official Emblem & Department Names -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d97706; padding-bottom: 16px; margin-bottom: 20px; position: relative; z-index: 1;">
          <div style="text-align: right; width: 33%;">
            <div style="font-size: 13px; font-weight: bold; color: #002882;">جامعة الدول العربية</div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a;">الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري</div>
            <div style="font-size: 11px; color: #64748b;">كلية النقل الدولي واللوجستيات — تقييم الكفاءة</div>
          </div>
          
          <div style="text-align: center; width: 34%;">
            <img src="${AASTMT_LOGO_BASE64}" alt="شعار الأكاديمية الرسمي" style="width: 68px; height: 68px; object-fit: contain; margin-bottom: 4px; display: inline-block;" />
            <div style="font-size: 15px; font-weight: 900; color: #002882;">الأكاديمية العربية للعلوم والتكنولوجيا</div>
            <div style="font-size: 11px; font-weight: bold; color: #d97706;">إدارة الاختبارات والتقييم الإلكتروني المعتمد</div>
          </div>

          <div style="text-align: left; width: 33%; font-size: 11px; color: #475569;">
            <div><strong>رقم الوثيقة:</strong> <span style="font-family: monospace;">${attempt.id}</span></div>
            <div><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
            <div><strong>الحالة:</strong> <span style="color: #059669; font-weight: bold;">معتمد رسمياً</span></div>
          </div>
        </div>

        <!-- Certificate Title Banner -->
        <div style="text-align: center; margin-bottom: 24px; background: linear-gradient(135deg, #002882 0%, #0f172a 100%); color: #ffffff; padding: 14px; border-radius: 8px; position: relative; z-index: 1;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #fbbf24;">تقرير نتيجة اختبار الإجراءات الجمركية</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #e2e8f0;">تقييم الكفاءة المهنية والتشريعات المنظمة للاستيراد والتصدير وقانون الجمارك رقم 207 لسنة 2020</p>
        </div>

        <!-- Student Information Formal Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <tbody>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; width: 18%; color: #1e3a8a;">اسم الطالب:</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 900; width: 32%; color: #0f172a; font-size: 13px;">${attempt.student_name}</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; width: 18%; color: #1e3a8a;">رقم طلب الدخول:</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-family: monospace; width: 32%;">${attempt.access_request_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">تاريخ الاختبار:</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${new Date(attempt.started_at).toLocaleDateString('ar-EG')}</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">توقيت البدء والتسليم:</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">
                ${new Date(attempt.started_at).toLocaleTimeString('ar-EG')} — ${attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleTimeString('ar-EG') : '—'}
              </td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">المدة المستغرقة:</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold;">${durationMin} دقيقة و ${durationSec} ثانية</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">رقم المحاولة:</td>
              <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">المحاولة رقم (${attempt.attempt_number})</td>
            </tr>
          </tbody>
        </table>

        <!-- Formal Scorecard Summary Box -->
        <div style="display: flex; gap: 12px; margin-bottom: 24px; text-align: center;">
          <div style="flex: 1; padding: 12px; background: #f8fafc; border: 2px solid ${isPassed ? '#059669' : '#dc2626'}; border-radius: 8px;">
            <div style="font-size: 11px; color: #64748b; font-weight: bold;">النتيجة العامة</div>
            <div style="font-size: 22px; font-weight: 900; color: ${isPassed ? '#059669' : '#dc2626'};">${isPassed ? 'ناجح' : 'راسب'}</div>
            <div style="font-size: 10px; color: #475569;">${gradeArabic}</div>
          </div>

          <div style="flex: 1; padding: 12px; background: #eff6ff; border: 2px solid #1e3a8a; border-radius: 8px;">
            <div style="font-size: 11px; color: #1e3a8a; font-weight: bold;">الدرجة النهائية</div>
            <div style="font-size: 22px; font-weight: 900; color: #1e3a8a;">${score} <span style="font-size: 12px; font-weight: normal; color: #64748b;">/ 50</span></div>
            <div style="font-size: 10px; color: #475569;">النسبة: ${percentage}%</div>
          </div>

          <div style="flex: 1; padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
            <div style="font-size: 11px; color: #047857; font-weight: bold;">الإجابات الصحيحة</div>
            <div style="font-size: 22px; font-weight: 900; color: #059669;">${attempt.correct_count ?? 0}</div>
            <div style="font-size: 10px; color: #059669;">سؤال صحيح (+1)</div>
          </div>

          <div style="flex: 1; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
            <div style="font-size: 11px; color: #b91c1c; font-weight: bold;">الإجابات الخاطئة</div>
            <div style="font-size: 22px; font-weight: 900; color: #dc2626;">${attempt.incorrect_count ?? 0}</div>
            <div style="font-size: 10px; color: #dc2626;">سؤال خاطئ (0)</div>
          </div>

          <div style="flex: 1; padding: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px;">
            <div style="font-size: 11px; color: #475569; font-weight: bold;">غير المجابة</div>
            <div style="font-size: 22px; font-weight: 900; color: #475569;">${attempt.unanswered_count ?? 0}</div>
            <div style="font-size: 10px; color: #64748b;">سؤال فارغ (0)</div>
          </div>
        </div>

        <!-- Section Title: Questions Review Table -->
        <div style="font-size: 14px; font-weight: bold; color: #1e3a8a; border-right: 4px solid #d97706; padding-right: 8px; margin-bottom: 12px;">
          جدول المراجعة التفصيلية لكافة الأسئلة (50 سؤال)
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 24px; text-align: right;">
          <thead>
            <tr style="background: #1e3a8a; color: #ffffff;">
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 5%; text-align: center;">م</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 45%;">نص السؤال الجمركي</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 20%;">إجابة الطالب</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 20%;">الإجابة النموذجية</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 10%; text-align: center;">التقييم</th>
            </tr>
          </thead>
          <tbody>
            ${questionsReview
              .map((q, idx) => {
                const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                const statusColor = q.is_correct ? '#059669' : q.is_unanswered ? '#64748b' : '#dc2626';
                const statusText = q.is_correct ? 'صحيحة (+1)' : q.is_unanswered ? 'غير مجاب (0)' : 'خاطئة (0)';

                return `
                  <tr style="background: ${bg};">
                    <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${q.question_number}</td>
                    <td style="padding: 5px; border: 1px solid #e2e8f0; color: #1e293b;">${q.question_text}</td>
                    <td style="padding: 5px; border: 1px solid #e2e8f0; color: ${q.is_correct ? '#059669' : q.is_unanswered ? '#94a3b8' : '#dc2626'}; font-weight: bold;">
                      ${q.student_option ? `(${q.student_option}) ${q.student_option_text}` : '—'}
                    </td>
                    <td style="padding: 5px; border: 1px solid #e2e8f0; color: #047857; font-weight: bold;">
                      (${q.correct_option}) ${q.correct_option_text}
                    </td>
                    <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${statusColor};">
                      ${statusText}
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>

        <!-- Formal Signatures & Stamps Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px dashed #cbd5e1; padding-top: 20px; font-size: 11px; position: relative; z-index: 1;">
          <div style="text-align: center; width: 30%;">
            <div style="font-weight: bold; color: #002882; margin-bottom: 25px;">مدرس المادة / المشرف الأكاديمي</div>
            <div style="border-bottom: 1px solid #94a3b8; width: 140px; margin: 0 auto 6px;"></div>
            <div style="color: #64748b; font-size: 10px;">التوقيع والاعتماد</div>
          </div>

          <div style="text-align: center; width: 30%;">
            <div style="width: 82px; height: 82px; border: 2px dashed #002882; border-radius: 50%; margin: 0 auto 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #002882; font-weight: bold; font-size: 8px; padding: 4px; background: rgba(0, 40, 130, 0.03);">
              <img src="${AASTMT_LOGO_BASE64}" alt="خاتم الشعار" style="width: 44px; height: 44px; object-fit: contain; margin-bottom: 2px;" />
              <span>خاتم الاعتماد الأكاديمي</span>
            </div>
            <div style="color: #002882; font-size: 9px; font-weight: bold;">الأكاديمية العربية للنقل البحري</div>
          </div>

          <div style="text-align: center; width: 30%;">
            <div style="font-weight: bold; color: #002882; margin-bottom: 25px;">عميد الكلية / مدير شؤون التعليم</div>
            <div style="border-bottom: 1px solid #94a3b8; width: 140px; margin: 0 auto 6px;"></div>
            <div style="color: #64748b; font-size: 10px;">يعتمد رسمياً</div>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 850
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

    const safeName = attempt.student_name.trim().replace(/\s+/g, '_');
    pdf.save(`نتيجة_امتحان_الجمارك_${safeName}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating formal PDF, falling back to print window:', err);
    // Bulletproof Fallback: Open in dedicated print/PDF window
    openFormalPrintWindow(attempt, questionsReview);
    return true;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Downloads a formal consolidated results PDF for the instructor.
 */
export async function downloadFormalConsolidatedPdf(
  studentsData: { attempt: ExamAttempt; questionsReview: QuestionReviewItem[] }[]
): Promise<boolean> {
  const container = document.createElement('div');
  container.id = 'formal-consolidated-container';
  container.setAttribute('dir', 'rtl');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '950px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Cairo', 'Tajawal', Arial, sans-serif";
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';

  let totalScore = 0;
  let passedCount = 0;
  studentsData.forEach(s => {
    const sc = s.attempt.score || 0;
    totalScore += sc;
    if (sc >= 25) passedCount++;
  });
  const avg = studentsData.length > 0 ? (totalScore / studentsData.length).toFixed(1) : '0';
  const passRate = studentsData.length > 0 ? Math.round((passedCount / studentsData.length) * 100) : 0;

  container.innerHTML = `
    <div style="padding: 30px; background-color: #ffffff; color: #0f172a; line-height: 1.5; font-family: 'Cairo', 'Tajawal', sans-serif;">
      <div style="border: 2px solid #002882; border-radius: 12px; padding: 24px; background: #ffffff; position: relative; overflow: hidden;">
        
        <!-- Subtle Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.035; pointer-events: none; z-index: 0; text-align: center;">
          <img src="${AASTMT_LOGO_BASE64}" alt="علامة مائية" style="width: 480px; height: 480px; object-fit: contain;" />
        </div>

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d97706; padding-bottom: 16px; margin-bottom: 20px; position: relative; z-index: 1;">
          <div style="text-align: right; width: 33%;">
            <div style="font-size: 13px; font-weight: bold; color: #002882;">جامعة الدول العربية</div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a;">الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري</div>
            <div style="font-size: 11px; color: #64748b;">كلية النقل الدولي واللوجستيات</div>
          </div>
          <div style="text-align: center; width: 34%;">
            <img src="${AASTMT_LOGO_BASE64}" alt="شعار الأكاديمية" style="width: 64px; height: 64px; object-fit: contain; margin-bottom: 4px; display: inline-block;" />
            <div style="font-size: 16px; font-weight: 900; color: #002882;">التقرير المجمع لنتائج اختبار الإجراءات الجمركية</div>
            <div style="font-size: 11px; color: #d97706; font-weight: bold;">سجل درجات الطلاب والمحاولات المعتمدة</div>
          </div>
          <div style="text-align: left; width: 33%; font-size: 11px; color: #475569;">
            <div><strong>تاريخ الاستخراج:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
            <div><strong>إجمالي الطلاب:</strong> ${studentsData.length} طالب</div>
            <div><strong>الجهة المعتمدة:</strong> الأكاديمية العربية</div>
          </div>
        </div>

        <!-- KPI Strip -->
        <div style="display: flex; gap: 12px; margin-bottom: 20px; text-align: center; position: relative; z-index: 1;">
          <div style="flex: 1; padding: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
            <div style="font-size: 11px; color: #002882; font-weight: bold;">إجمالي المحاولات المكتملة</div>
            <div style="font-size: 20px; font-weight: 900; color: #002882;">${studentsData.length}</div>
          </div>
          <div style="flex: 1; padding: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
            <div style="font-size: 11px; color: #047857; font-weight: bold;">نسبة النجاح العامة</div>
            <div style="font-size: 20px; font-weight: 900; color: #059669;">${passRate}%</div>
          </div>
          <div style="flex: 1; padding: 10px; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px;">
            <div style="font-size: 11px; color: #854d0e; font-weight: bold;">متوسط الدرجات</div>
            <div style="font-size: 20px; font-weight: 900; color: #ca8a04;">${avg} / 50</div>
          </div>
          <div style="flex: 1; padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
            <div style="font-size: 11px; color: #475569; font-weight: bold;">عدد الناجحين</div>
            <div style="font-size: 20px; font-weight: 900; color: #059669;">${passedCount}</div>
          </div>
        </div>

        <!-- Consolidated Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; text-align: right; position: relative; z-index: 1;">
          <thead>
            <tr style="background: #002882; color: #ffffff;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; width: 5%;">م</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 25%;">اسم الطالب</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 12%; text-align: center;">الدرجة (من 50)</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 10%; text-align: center;">النسبة</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 10%; text-align: center;">الصحيحة</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 10%; text-align: center;">الخاطئة</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 10%; text-align: center;">غير المجابة</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 18%; text-align: center;">تاريخ وتوقيت التسليم</th>
            </tr>
          </thead>
          <tbody>
            ${studentsData
              .map((s, idx) => {
                const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                const isPassed = (s.attempt.score || 0) >= 25;
                return `
                  <tr style="background: ${bg};">
                    <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${idx + 1}</td>
                    <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${s.attempt.student_name}</td>
                    <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 900; color: ${isPassed ? '#059669' : '#dc2626'}; font-size: 12px;">
                      ${s.attempt.score ?? 0}
                    </td>
                    <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${s.attempt.percentage}%</td>
                    <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; color: #059669; font-weight: bold;">${s.attempt.correct_count ?? 0}</td>
                    <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626;">${s.attempt.incorrect_count ?? 0}</td>
                    <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${s.attempt.unanswered_count ?? 0}</td>
                    <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #475569;">
                      ${s.attempt.submitted_at ? new Date(s.attempt.submitted_at).toLocaleString('ar-EG') : '—'}
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>

        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 11px; position: relative; z-index: 1;">
          <div><strong>المشرف الأكاديمي:</strong> .....................................</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${AASTMT_LOGO_BASE64}" alt="خاتم" style="width: 36px; height: 36px; object-fit: contain;" />
            <div><strong>خاتم الاعتماد:</strong> معتمد رسمياً من الأكاديمية العربية</div>
          </div>
          <div><strong>مدير شؤون الاختبارات:</strong> .....................................</div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 950
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

    pdf.save('تقرير_مجمع_نتائج_الإجراءات_الجمركية.pdf');
    return true;
  } catch (err) {
    console.error('Error generating consolidated PDF:', err);
    openConsolidatedPrintWindow(studentsData);
    return true;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Fallback and native high-resolution print window for the student's report.
 */
export function openFormalPrintWindow(
  attempt: ExamAttempt,
  questionsReview: QuestionReviewItem[]
) {
  const score = attempt.score ?? 0;
  const percentage = attempt.percentage ?? 0;
  const isPassed = score >= 25;
  const durationMin = attempt.duration_seconds ? Math.floor(attempt.duration_seconds / 60) : 0;
  const durationSec = attempt.duration_seconds ? attempt.duration_seconds % 60 : 0;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لمعاينة وطباعة التقرير');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>نتيجة امتحان الجمارك - ${attempt.student_name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Cairo', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: #ffffff;
          color: #0f172a;
          direction: rtl;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
          @page { margin: 12mm; size: A4; }
          tr { page-break-inside: avoid; }
        }
        .header-box {
          border: 2px solid #1e3a8a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .print-btn {
          background: #1e3a8a;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: center; margin-bottom: 20px;">
        <button class="print-btn" onclick="window.print()">طباعة أو حفظ التقرير بصيغة PDF</button>
      </div>
      <div class="header-box" style="position: relative; overflow: hidden; border: 2px solid #002882;">
        <!-- Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; pointer-events: none; z-index: 0; text-align: center;">
          <img src="${AASTMT_LOGO_BASE64}" alt="علامة مائية" style="width: 380px; height: 380px; object-fit: contain;" />
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d97706; padding-bottom: 12px; margin-bottom: 16px; position: relative; z-index: 1;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${AASTMT_LOGO_BASE64}" alt="شعار الأكاديمية" style="width: 58px; height: 58px; object-fit: contain;" />
            <div>
              <div style="font-weight: bold; color: #002882; font-size: 13px;">جامعة الدول العربية</div>
              <div style="font-size: 12px; font-weight: bold; color: #0f172a;">الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري</div>
              <div style="font-size: 11px; color: #64748b;">كلية النقل الدولي واللوجستيات</div>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: 900; color: #002882;">شهادة نتيجة اختبار الإجراءات الجمركية</div>
            <div style="font-size: 11px; color: #d97706; font-weight: bold;">منظومة التقييم والاختبارات المعتمدة</div>
          </div>
          <div style="text-align: left; font-size: 11px;">
            <div>رقم الطلب: ${attempt.access_request_id}</div>
            <div>التاريخ: ${new Date(attempt.started_at).toLocaleDateString('ar-EG')}</div>
            <div style="color: #059669; font-weight: bold;">معتمد رسمياً</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; position: relative; z-index: 1;">
          <tr style="background: #f8fafc;">
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 20%;">اسم الطالب:</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 900; font-size: 14px;">${attempt.student_name}</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 20%;">النتيجة:</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 900; color: ${isPassed ? '#059669' : '#dc2626'};">
              ${isPassed ? 'ناجح' : 'راسب'} (${attempt.score} من 50) — ${percentage}%
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">الصحيحة:</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; color: #059669; font-weight: bold;">${attempt.correct_count ?? 0}</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">الخاطئة / غير المجابة:</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${attempt.incorrect_count ?? 0} خاطئة / ${attempt.unanswered_count ?? 0} بدون إجابة</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">المدة المستغرقة:</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${durationMin} دقيقة و ${durationSec} ثانية</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">توقيت التسليم:</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleTimeString('ar-EG') : '—'}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; position: relative; z-index: 1;">
          <thead>
            <tr style="background: #002882; color: white;">
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 5%; text-align: center;">م</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 45%;">نص السؤال</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 22%;">إجابة الطالب</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 20%;">الإجابة الصحيحة</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 8%; text-align: center;">الدرجة</th>
            </tr>
          </thead>
          <tbody>
            ${questionsReview
              .map(
                (q) => `
                <tr style="background: ${q.question_number % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                  <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${q.question_number}</td>
                  <td style="padding: 5px; border: 1px solid #e2e8f0;">${q.question_text}</td>
                  <td style="padding: 5px; border: 1px solid #e2e8f0; color: ${q.is_correct ? '#059669' : q.is_unanswered ? '#94a3b8' : '#dc2626'}; font-weight: bold;">
                    ${q.student_option ? `(${q.student_option}) ${q.student_option_text}` : '—'}
                  </td>
                  <td style="padding: 5px; border: 1px solid #e2e8f0; color: #047857; font-weight: bold;">(${q.correct_option}) ${q.correct_option_text}</td>
                  <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${q.is_correct ? '#059669' : '#dc2626'};">
                    ${q.is_correct ? '+1' : '0'}
                  </td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>

        <!-- Signatures & Stamp -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px dashed #cbd5e1; padding-top: 20px; font-size: 11px; margin-top: 20px; position: relative; z-index: 1;">
          <div style="text-align: center; width: 30%;">
            <div style="font-weight: bold; color: #002882; margin-bottom: 25px;">مدرس المادة / المشرف الأكاديمي</div>
            <div style="border-bottom: 1px solid #94a3b8; width: 140px; margin: 0 auto 6px;"></div>
            <div style="color: #64748b; font-size: 10px;">التوقيع والاعتماد</div>
          </div>
          <div style="text-align: center; width: 30%;">
            <div style="width: 80px; height: 80px; border: 2px dashed #002882; border-radius: 50%; margin: 0 auto 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #002882; font-weight: bold; font-size: 8px; padding: 4px; background: rgba(0, 40, 130, 0.03);">
              <img src="${AASTMT_LOGO_BASE64}" alt="خاتم" style="width: 44px; height: 44px; object-fit: contain; margin-bottom: 2px;" />
              <span>خاتم الاعتماد الأكاديمي</span>
            </div>
            <div style="color: #002882; font-size: 9px; font-weight: bold;">الأكاديمية العربية للنقل البحري</div>
          </div>
          <div style="text-align: center; width: 30%;">
            <div style="font-weight: bold; color: #002882; margin-bottom: 25px;">عميد الكلية / مدير شؤون التعليم</div>
            <div style="border-bottom: 1px solid #94a3b8; width: 140px; margin: 0 auto 6px;"></div>
            <div style="color: #64748b; font-size: 10px;">يعتمد رسمياً</div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Fallback and native high-resolution print window for consolidated results.
 */
export function openConsolidatedPrintWindow(
  studentsData: { attempt: ExamAttempt; questionsReview: QuestionReviewItem[] }[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لمعاينة التقرير');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير المجمع لنتائج الإجراءات الجمركية</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; padding: 20px; direction: rtl; }
        @media print { .no-print { display: none !important; } @page { margin: 10mm; size: A4 landscape; } }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; }
        th { background: #002882; color: white; }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: center; margin-bottom: 20px;">
        <button style="background: #002882; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;" onclick="window.print()">طباعة أو حفظ التقرير المجمع بصيغة PDF</button>
      </div>
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 15px; border-bottom: 2px solid #002882; padding-bottom: 12px;">
        <img src="${AASTMT_LOGO_BASE64}" alt="شعار الأكاديمية" style="width: 58px; height: 58px; object-fit: contain;" />
        <div>
          <h2 style="margin: 0; color: #002882; font-size: 18px;">التقرير المجمع لنتائج اختبار الإجراءات الجمركية</h2>
          <div style="font-size: 12px; color: #334155; font-weight: bold;">الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري — جامعة الدول العربية</div>
          <div style="font-size: 11px; color: #64748b;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')} — عدد الطلاب: ${studentsData.length} طالب — معتمد رسمياً</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>م</th>
            <th>اسم الطالب</th>
            <th>رقم الطلب</th>
            <th>الدرجة من 50</th>
            <th>النسبة %</th>
            <th>الصحيحة</th>
            <th>الخاطئة</th>
            <th>غير المجابة</th>
            <th>تاريخ التسليم</th>
          </tr>
        </thead>
        <tbody>
          ${studentsData
            .map(
              (s, i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td style="font-weight: bold;">${s.attempt.student_name}</td>
              <td>${s.attempt.access_request_id}</td>
              <td style="font-weight: bold; text-align: center;">${s.attempt.score ?? 0}</td>
              <td style="text-align: center;">${s.attempt.percentage}%</td>
              <td style="text-align: center; color: #059669;">${s.attempt.correct_count ?? 0}</td>
              <td style="text-align: center; color: #dc2626;">${s.attempt.incorrect_count ?? 0}</td>
              <td style="text-align: center;">${s.attempt.unanswered_count ?? 0}</td>
              <td style="text-align: center;">${s.attempt.submitted_at ? new Date(s.attempt.submitted_at).toLocaleString('ar-EG') : '—'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `);
  printWindow.document.close();
}
