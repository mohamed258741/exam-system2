export interface QuestionItem {
  id: number;
  question_number: number;
  question_text: string;
  options: {
    key: 'أ' | 'ب' | 'ج' | 'د';
    text: string;
  }[];
  correct_option: 'أ' | 'ب' | 'ج' | 'د';
  points: number;
}

export const QUESTIONS_DATA: QuestionItem[] = [
  {
    id: 1,
    question_number: 1,
    question_text: "تُعد الإجراءات الجمركية بمثابة الشرايين الرئيسية التي تضمن انسيابية البضائع عبر الحدود:",
    options: [
      { key: 'أ', text: "المصرية" },
      { key: 'ب', text: "الأوروبية" },
      { key: 'ج', text: "الآسيوية" },
      { key: 'د', text: "الأفريقية" }
    ],
    correct_option: 'أ',
    points: 1
  },
  {
    id: 2,
    question_number: 2,
    question_text: "الهدف الأساسي للإجراءات الجمركية هو تنظيم ومراقبة تيار السلع:",
    options: [
      { key: 'أ', text: "الواردة فقط" },
      { key: 'ب', text: "الصادرة فقط" },
      { key: 'ج', text: "الواردة والصادرة" },
      { key: 'د', text: "العابرة فقط" }
    ],
    correct_option: 'ج',
    points: 1
  },
  {
    id: 3,
    question_number: 3,
    question_text: "الإطار الذي يضمن التوازن بين تيسير التجارة وحماية حقوق الدولة ومصالحها الأمنية يمثله:",
    options: [
      { key: 'أ', text: "القانون والشروط التجارية" },
      { key: 'ب', text: "النظام التخليصي المباشر" },
      { key: 'ج', text: "الإطار القانوني والتنظيمي للإجراءات" },
      { key: 'د', text: "الاتفاقيات الثنائية فقط" }
    ],
    correct_option: 'ج',
    points: 1
  },
  {
    id: 4,
    question_number: 4,
    question_text: "الإجراءات الجمركية هي:",
    options: [
      { key: 'أ', text: "مجرد خطوات إدارية روتينية" },
      { key: 'ب', text: "الركيزة الأساسية للعمل الجمركي في مصر" },
      { key: 'ج', text: "إجراءات اختيارية للمستوردين" },
      { key: 'د', text: "لوائح داخلية للمنافذ فقط" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 5,
    question_number: 5,
    question_text: "من أهداف وضع أسس وقواعد الرقابة على البضائع حماية المجتمع من دخول بضائع:",
    options: [
      { key: 'أ', text: "ذات جودة عالية" },
      { key: 'ب', text: "ضارة أو ممنوعة أو غير مطابقة للمواصفات" },
      { key: 'ج', text: "ذات أسعار منخفضة" },
      { key: 'د', text: "معفاة من الرسوم" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 6,
    question_number: 6,
    question_text: "تسهم الإجراءات الجمركية الدقيقة في حماية إيرادات الدولة من خلال:",
    options: [
      { key: 'أ', text: "فرض رسوم إضافية عشوائية" },
      { key: 'ب', text: "وضع الضوابط الدقيقة لتحصيل الرسوم ومنع التهرب" },
      { key: 'ج', text: "تأخير الإفراج الجمركي" },
      { key: 'د', text: "إلغاء الإعفاءات كافة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 7,
    question_number: 7,
    question_text: "الهدف الأول من الأهداف الأربعة الجمركية هو وضع الإجراءات التنفيذية التي تحقق التوازن بين:",
    options: [
      { key: 'أ', text: "السرعة والتكلفة" },
      { key: 'ب', text: "التيسير والرقابة" },
      { key: 'ج', text: "الاستيراد والتصدير" },
      { key: 'د', text: "الربح والجودة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 8,
    question_number: 8,
    question_text: "الهدف الثالث من الأهداف الجمركية ينص على تبسيط الإجراءات باستخدام:",
    options: [
      { key: 'أ', text: "العنصر البشري المكثف" },
      { key: 'ب', text: "تكنولوجيا المعلومات والتحول الرقمي" },
      { key: 'ج', text: "المستندات الورقية التقليدية" },
      { key: 'د', text: "الفحص الميداني الشامل" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 9,
    question_number: 9,
    question_text: "يُعرف نظام التسجيل المسبق للشحنات باختصاره الشهير:",
    options: [
      { key: 'أ', text: "CIF" },
      { key: 'ب', text: "ACI" },
      { key: 'ج', text: "HS CODE" },
      { key: 'د', text: "PCA" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 10,
    question_number: 10,
    question_text: "من المزايا الرئيسية لنظام التسجيل المسبق للشحنات (ACI):",
    options: [
      { key: 'أ', text: "إلغاء الحاجة إلى المستندات الجمركية." },
      { key: 'ب', text: "تقليل زمن الإفراج عن البضائع وتعزيز إدارة المخاطر قبل وصولها." },
      { key: 'ج', text: "إعفاء جميع الشحنات من الرسوم الجمركية." },
      { key: 'د', text: "السماح بدخول الشحنات دون تقديم بيانات مسبقة." }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 11,
    question_number: 11,
    question_text: "المصدر الأول والأساسي للإجراءات الجمركية في مصر هو:",
    options: [
      { key: 'أ', text: "اللائحة التنفيذية" },
      { key: 'ب', text: "قانون الجمارك رقم 207 لسنة 2020" },
      { key: 'ج', text: "المنشورات والتعليمات" },
      { key: 'د', text: "قانون الاستيراد والتصدير" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 12,
    question_number: 12,
    question_text: "المصدر الثاني من حيث الأهمية للإجراءات الجمركية هو:",
    options: [
      { key: 'أ', text: "الاتفاقيات الدولية" },
      { key: 'ب', text: "اللائحة التنفيذية رقم 430 لسنة 2021" },
      { key: 'ج', text: "منشورات مصلحة الجمارك" },
      { key: 'د', text: "قانون الاستثمار" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 13,
    question_number: 13,
    question_text: "قانون الاستيراد والتصدير رقم 118 صدر في عام:",
    options: [
      { key: 'أ', text: "1963" },
      { key: 'ب', text: "1975" },
      { key: 'ج', text: "2005" },
      { key: 'د', text: "2020" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 14,
    question_number: 14,
    question_text: "من أبرز الاتفاقيات الدولية التي تشكل مصدراً للإجراءات الجمركية اتفاقية:",
    options: [
      { key: 'أ', text: "كيوتو لتبسيط وتنسيق الإجراءات الجمركية" },
      { key: 'ب', text: "باريس للمناخ" },
      { key: 'ج', text: "جنيف للحقوق" },
      { key: 'د', text: "النقل البري السريع" }
    ],
    correct_option: 'أ',
    points: 1
  },
  {
    id: 15,
    question_number: 15,
    question_text: "المصدر الخامس والأكثر مرونة في التطبيق اليومي هو:",
    options: [
      { key: 'أ', text: "اتفاقية كيوتو" },
      { key: 'ب', text: "المنشورات والتعليمات الصادرة عن القطاع المختص" },
      { key: 'ج', text: "قانون الجمارك" },
      { key: 'د', text: "اللائحة التنفيذية" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 16,
    question_number: 16,
    question_text: "نظام رمز النقل الدولي للبضائع المعفاة مؤقتاً بدون رسوم (مثل العينات والمعدات) يسمى:",
    options: [
      { key: 'أ', text: "PACKING LIST" },
      { key: 'ب', text: "ATA CARNET" },
      { key: 'ج', text: "CUSTOMS BROKER" },
      { key: 'د', text: "COMMERCIAL INVOICE" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 17,
    question_number: 17,
    question_text: "فحص سجلات الشركة الجمركية بعد الإفراج عن البضائع يُعرف بـ:",
    options: [
      { key: 'أ', text: "التقييم الجمركي" },
      { key: 'ب', text: "التدقيق اللاحق (PCA)" },
      { key: 'ج', text: "تصنيف البضائع" },
      { key: 'د', text: "المعاينة والكشف" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 18,
    question_number: 18,
    question_text: "شرط استخدام مصطلح الشحن CIF يقتصر على النقل:",
    options: [
      { key: 'أ', text: "الجوي والبري" },
      { key: 'ب', text: "البحري أو النهري فقط" },
      { key: 'ج', text: "متعدد الوسائط" },
      { key: 'د', text: "البري فقط" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 19,
    question_number: 19,
    question_text: "في شرط الشحن CIP يتم تقديم تغطية تأمينية:",
    options: [
      { key: 'أ', text: "أدنى (Institute Cargo Clauses C)" },
      { key: 'ب', text: "أعلى (Institute Cargo Clauses A)" },
      { key: 'ج', text: "متوسطة" },
      { key: 'د', text: "بدون تأمين" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 20,
    question_number: 20,
    question_text: "تكمن نقطة انتقال المخاطر إلى المشتري في شرط الشحن CIP بمجرد:",
    options: [
      { key: 'أ', text: "تحميل البضاعة على السفينة" },
      { key: 'ب', text: "تسليم البضاعة لأول ناقل" },
      { key: 'ج', text: "وصول البضاعة لميناء التفريغ" },
      { key: 'د', text: "دفع قيمة الفاتورة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 21,
    question_number: 21,
    question_text: "البيان الذي يصدره قائد وسيلة النقل عن البضائع المجهزة للتفريغ في الميناء يسمى:",
    options: [
      { key: 'أ', text: "الفاتورة التجارية" },
      { key: 'ب', text: "قائمة الشحن (المانيفست)" },
      { key: 'ج', text: "شهادة المنشأ" },
      { key: 'د', text: "قائمة التعبئة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 22,
    question_number: 22,
    question_text: "يسمح بتقديم ملحق لقائمة الشحن خلال كم ساعة من وصول وسيلة النقل؟",
    options: [
      { key: 'أ', text: "12 ساعة" },
      { key: 'ب', text: "24 ساعة" },
      { key: 'ج', text: "48 ساعة" },
      { key: 'د', text: "72 ساعة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 23,
    question_number: 23,
    question_text: "يجوز التعديل في قوائم الشحن قبل:",
    options: [
      { key: 'أ', text: "الإفراج" },
      { key: 'ب', text: "قيد 46" },
      { key: 'ج', text: "الفحص الطبي" },
      { key: 'د', text: "التحميل" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 24,
    question_number: 24,
    question_text: "يتم تعديل الوزن والعدد في المانيفست بناءً على طلب من التوكيل الملاحي بشرط تقديم:",
    options: [
      { key: 'أ', text: "فاكس تعديل المستندات أو مستندات مؤيدة" },
      { key: 'ب', text: "إقرار جمركي جديد" },
      { key: 'ج', text: "شهادة صحية جديدة" },
      { key: 'د', text: "خطة شحن جديدة" }
    ],
    correct_option: 'أ',
    points: 1
  },
  {
    id: 25,
    question_number: 25,
    question_text: "التعديل في الوجه برسم الوارد بنظام المناطق الحرة يستلزم موافقة:",
    options: [
      { key: 'أ', text: "وزارة المالية" },
      { key: 'ب', text: "الهيئة العامة للاستثمار" },
      { key: 'ج', text: "مصلحة الجمارك فقط" },
      { key: 'د', text: "وزارة التجارة والصناعة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 26,
    question_number: 26,
    question_text: "يسمح بنسبة عجز للبضائع المعبأة بقدر:",
    options: [
      { key: 'أ', text: "2%" },
      { key: 'ب', text: "5%" },
      { key: 'ج', text: "10%" },
      { key: 'د', text: "15%" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 27,
    question_number: 27,
    question_text: "يسمح بنسبة عجز للبضائع الصب (السائبة) بقدر:",
    options: [
      { key: 'أ', text: "5%" },
      { key: 'ب', text: "10%" },
      { key: 'ج', text: "15%" },
      { key: 'د', text: "20%" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 28,
    question_number: 28,
    question_text: "تقسم المستودعات الجمركية طبقاً للمادة (105) إلى نوعين هما:",
    options: [
      { key: 'أ', text: "مستودع خاص ومستودع مؤقت" },
      { key: 'ب', text: "مستودع عام ومستودع خاص" },
      { key: 'ج', text: "مستودع داخلي ومستودع خارجي" },
      { key: 'د', text: "مستودع جوي ومستودع بحري" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 29,
    question_number: 29,
    question_text: "المستودع الجمركي العام هو الذي:",
    options: [
      { key: 'أ', text: "يُستغل لتخزين بضائع الترخيص فقط" },
      { key: 'ب', text: "تُخزَن فيه البضائع لحساب الغير" },
      { key: 'ج', text: "ينشأ دائماً داخل الموانئ" },
      { key: 'د', text: "يُخصص للبضائع المعفاة فقط" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 30,
    question_number: 30,
    question_text: "تنشأ المستودعات الجمركية العامة والخاصة:",
    options: [
      { key: 'أ', text: "داخل الموانئ" },
      { key: 'ب', text: "خارج الموانئ" },
      { key: 'ج', text: "على الحدود البرية فقط" },
      { key: 'د', text: "داخل المناطق الحرة فقط" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 31,
    question_number: 31,
    question_text: "النمط المخصص للإقرارات ذات المخاطر المرتفعة وتتطلب معاينة وتدقيقاً كاملاً هو:",
    options: [
      { key: 'أ', text: "المسار الأخضر" },
      { key: 'ب', text: "المسار الأزرق" },
      { key: 'ج', text: "المسار الأصفر" },
      { key: 'د', text: "المسار الأحمر" }
    ],
    correct_option: 'د',
    points: 1
  },
  {
    id: 32,
    question_number: 32,
    question_text: "المسار الذي لا يتطلب إجراءات معاينة أو كشف ويفرج عن البضاعة مباشرة يعرف بـ:",
    options: [
      { key: 'أ', text: "المسار الأخضر" },
      { key: 'ب', text: "المسار الأحمر" },
      { key: 'ج', text: "المسار الأصفر" },
      { key: 'د', text: "المسار البرتقالي" }
    ],
    correct_option: 'أ',
    points: 1
  },
  {
    id: 33,
    question_number: 33,
    question_text: "الطرد البريدي طبقاً للمادة الأولى هو البضاعة التي تنقل بشرط ألا يزيد وزنها على:",
    options: [
      { key: 'أ', text: "20 كجم" },
      { key: 'ب', text: "30 كجم" },
      { key: 'ج', text: "50 كجم" },
      { key: 'د', text: "100 كجم" }
    ],
    correct_option: 'ج',
    points: 1
  },
  {
    id: 34,
    question_number: 34,
    question_text: "مواصفات الطرود الجوية ألا تزيد عن وزن 50 كيلو وأن لا تزيد قيمتها عن:",
    options: [
      { key: 'أ', text: "1000 دولار" },
      { key: 'ب', text: "2000 دولار" },
      { key: 'ج', text: "2000 دولار (2 دولار كرمز للحد الأدنى)" },
      { key: 'د', text: "500 دولار" }
    ],
    correct_option: 'ج',
    points: 1
  },
  {
    id: 35,
    question_number: 35,
    question_text: "يشترط للإفراج عن السلع المستوردة تقديم شهادة منشأ، وتستثنى من ذلك:",
    options: [
      { key: 'أ', text: "السلع بالملحق 2 والسلع المفرج عنها بضمان" },
      { key: 'ب', text: "المنتجات الصناعية" },
      { key: 'ج', text: "البضائع بحراً" },
      { key: 'د', text: "المنسوجات والأقمشة" }
    ],
    correct_option: 'أ',
    points: 1
  },
  {
    id: 36,
    question_number: 36,
    question_text: "يسمح بالإفراج غير المشروط بدون شهادة منشأ لـ:",
    options: [
      { key: 'أ', text: "البضائع الاستهلاكية الكبيرة" },
      { key: 'ب', text: "الكتب والصحف أو الأقراص المدمجة" },
      { key: 'ج', text: "سيارات الركوب" },
      { key: 'د', text: "المعدات الثقيلة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 37,
    question_number: 37,
    question_text: "مخلفات السفن الأجنبية المستعملة يفرج عنها في حدود مبلغ يومياً لكل تاجر قدره:",
    options: [
      { key: 'أ', text: "100 جنيه" },
      { key: 'ب', text: "299 جنيه" },
      { key: 'ج', text: "500 جنيه" },
      { key: 'د', text: "1000 جنيه" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 38,
    question_number: 38,
    question_text: "البضاعة التي تدخل تحت بند \"استخدام خاص\" هي:",
    options: [
      { key: 'أ', text: "كل ما يستورده الشخص لاستخدامه المنزلي" },
      { key: 'ب', text: "كل ما يستورده المصنع ويستخدمه في نشاطه" },
      { key: 'ج', text: "الشحنات الحكومية المعفاة" },
      { key: 'د', text: "العينات المجانية للترويج" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 39,
    question_number: 39,
    question_text: "الإجراء الجمركي الذي يتم بموجبه نقل البضائع تحت رقابة الجمارك من ميناء لآخر يسمى:",
    options: [
      { key: 'أ', text: "الاستيراد النهائي" },
      { key: 'ب', text: "الترانزيت المباشر" },
      { key: 'ج', text: "إعادة التصدير" },
      { key: 'د', text: "السماح المؤقت" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 40,
    question_number: 40,
    question_text: "يجوز لمالك البضاعة طلب العدول عن النظام الجمركي المقيد به البيان الجمركي قبل:",
    options: [
      { key: 'أ', text: "السداد" },
      { key: 'ب', text: "الإفراج عن البضائع" },
      { key: 'ج', text: "المعاينة" },
      { key: 'د', text: "التخليص" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 41,
    question_number: 41,
    question_text: "مدة صلاحية البيان الجمركي هي:",
    options: [
      { key: 'أ', text: "شهر واحد" },
      { key: 'ب', text: "3 أشهر" },
      { key: 'ج', text: "6 أشهر" },
      { key: 'د', text: "سنة كاملة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 42,
    question_number: 42,
    question_text: "تكون مدة رقم التسجيل المسبق (ACID) مبدئياً:",
    options: [
      { key: 'أ', text: "3 أشهر" },
      { key: 'ب', text: "6 أشهر وتمتد لـ 6 أشهر أخرى بقرار رئيس إدارة مركزية" },
      { key: 'ج', text: "سنة كاملة" },
      { key: 'د', text: "شهرين غير قابلين للتمديد" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 43,
    question_number: 43,
    question_text: "يحق للمستورد في حال رفض ACID أن يقدم تظلماً خلال:",
    options: [
      { key: 'أ', text: "يوم عمل واحد" },
      { key: 'ب', text: "يومي عمل ومعه الأوراق الثبوتية" },
      { key: 'ج', text: "أسبوع من تاريخ الرفض" },
      { key: 'د', text: "15 يوماً" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 44,
    question_number: 44,
    question_text: "يجب أن تُسلّم قائمة الشحن يدوياً أو إلكترونياً قبل وصول الشحنة بـ:",
    options: [
      { key: 'أ', text: "12 ساعة" },
      { key: 'ب', text: "24 ساعة أو 48 ساعة" },
      { key: 'ج', text: "72 ساعة" },
      { key: 'د', text: "5 أيام" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 45,
    question_number: 45,
    question_text: "يُحظر تماماً إدخال النقد المصري والأجنبي للتداول أو إخراجها عن طريق:",
    options: [
      { key: 'أ', text: "البنوك الرسمية" },
      { key: 'ب', text: "الرسائل البريدية أو الطرود البريدية" },
      { key: 'ج', text: "أجهزة الصراف الآلي" },
      { key: 'د', text: "المنافذ الجمركية المباشرة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 46,
    question_number: 46,
    question_text: "تنص المادة (62) من قانون الجمارك رقم 207 لسنة 2020 على إجراء:",
    options: [
      { key: 'أ', text: "إعادة التصدير" },
      { key: 'ب', text: "سحب العينات للتحليل" },
      { key: 'ج', text: "السداد الإلكتروني" },
      { key: 'د', text: "التنازل عن البضاعة" }
    ],
    correct_option: 'ب',
    points: 1
  },
  {
    id: 47,
    question_number: 47,
    question_text: "المادة (71) من قانون الجمارك تتعلق بـ:",
    options: [
      { key: 'أ', text: "سداد الرسوم الجمركية والسداد الإلكتروني" },
      { key: 'ب', text: "التخلص من البضائع" },
      { key: 'ج', text: "شروط المانيفست" },
      { key: 'د', text: "المعاينة والفحص" }
    ],
    correct_option: 'أ',
    points: 1
  },
  {
    id: 48,
    question_number: 48,
    question_text: "التخلص من البضائع المتروكة أو المهملة يجوز بالبيع أو الإعدام وفقاً للمادة:",
    options: [
      { key: 'أ', text: "المادة (59)" },
      { key: 'ب', text: "المادة (60)" },
      { key: 'ج', text: "المادة (77)" },
      { key: 'د', text: "المادة (74)" }
    ],
    correct_option: 'ج',
    points: 1
  },
  {
    id: 49,
    question_number: 49,
    question_text: "يُحظر استيراد لعب الأطفال التي:",
    options: [
      { key: 'أ', text: "تزيد أوزانها عن 5 كجم" },
      { key: 'ب', text: "تعمل بالبطاريات الجافة" },
      { key: 'ج', text: "تشكل خطورة كالمسدسات أو البنادق التي تطلق مقذوفات" },
      { key: 'د', text: "المصنوعة من البلاستيك المقوى" }
    ],
    correct_option: 'ج',
    points: 1
  },
  {
    id: 50,
    question_number: 50,
    question_text: "من السلع المسموح باستيرادها مستعملة بشروط خاصة طبقاً للملحق رقم (2):",
    options: [
      { key: 'أ', text: "الأغذية المحفوظة" },
      { key: 'ب', text: "خطوط الإنتاج والآلات والمعدات وقطع غيارها" },
      { key: 'ج', text: "الملابس الجاهزة المصنوعة" },
      { key: 'د', text: "المستحضرات الطبية" }
    ],
    correct_option: 'ب',
    points: 1
  }
];

// Helper to get public question list without answers
export function getPublicQuestions() {
  return QUESTIONS_DATA.map(q => ({
    id: q.id,
    question_number: q.question_number,
    question_text: q.question_text,
    options: q.options,
    points: q.points
  }));
}
