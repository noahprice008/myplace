import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type LangCode =
  | "en" | "he" | "ar" | "es" | "pt" | "fr" | "de" | "it" | "ru" | "tr"
  | "pl" | "nl" | "zh" | "ja" | "ko" | "hi" | "bn" | "ur" | "id" | "vi";

export const LANGUAGES: { code: LangCode; label: string; native: string; rtl?: boolean }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "he", label: "Hebrew", native: "עברית", rtl: true },
  { code: "ar", label: "Arabic", native: "العربية", rtl: true },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "zh", label: "Chinese (Simplified)", native: "简体中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ur", label: "Urdu", native: "اردو", rtl: true },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
];

export type TKey =
  | "nav.wall" | "nav.work" | "nav.cash" | "nav.diary" | "nav.hours"
  | "header.upgrade" | "header.pro" | "header.settings" | "header.language"
  | "header.export" | "header.import"
  | "quick.title" | "quick.thought" | "quick.expense" | "quick.hours" | "quick.task"
  | "quick.what" | "quick.amount" | "quick.hoursWorked" | "quick.save" | "quick.cancel"
  | "quick.added" | "wall.events" | "wall.mine" | "wall.all" | "common.today"
  | "title.wall" | "sub.wall" | "title.work" | "sub.work" | "title.cash" | "sub.cash"
  | "title.diary" | "sub.diary" | "title.hours" | "sub.hours"
  | "common.save" | "common.cancel" | "common.delete" | "common.clear" | "common.add"
  | "common.all" | "common.total" | "common.date" | "common.name" | "common.amount"
  | "common.week" | "common.month" | "common.allTime" | "common.preview" | "common.colour"
  | "work.logShift" | "work.shifts" | "work.history" | "work.addWorkplace" | "work.newWorkplace"
  | "work.hourly" | "work.daily" | "work.byTask" | "work.hourlyRate" | "work.dayRate"
  | "work.hoursWorked" | "work.daysWorked" | "work.shiftDate" | "work.shiftTotal"
  | "work.saveShift" | "work.toInvoice" | "work.freelance" | "work.noShifts" | "work.create"
  | "sched.displayedHours" | "sched.starts" | "sched.ends" | "sched.thisWeek" | "sched.nextWeek"
  | "sched.lockWeek" | "sched.unlockWeek" | "sched.lockedMsg" | "sched.pickJob"
  | "sched.personal" | "sched.other" | "sched.unavailable" | "sched.colours"
  | "sched.noWorkplaces"
  | "cash.expenses" | "cash.fixedCosts" | "diary.appointments"
  | "wall.placeholder" | "wall.post" | "wall.empty"
  | "a11y.title" | "a11y.textSize" | "a11y.sizeNormal" | "a11y.sizeLarge" | "a11y.sizeXl"
  | "a11y.contrast" | "a11y.motion" | "a11y.underline" | "a11y.boldText" | "a11y.targets"
  | "a11y.reset" | "wall.mood" | "wall.photo" | "pro.perMonth"
  | "backup.restored" | "backup.bad";

type Dict = Record<TKey, string>;

const en: Dict = {
  "nav.wall": "Wall",
  "nav.work": "Work",
  "nav.cash": "Cash",
  "nav.diary": "Diary",
  "nav.hours": "Hours",
  "header.upgrade": "Upgrade",
  "header.pro": "Pro",
  "header.settings": "Settings",
  "header.language": "Language",
  "header.export": "Export my data",
  "header.import": "Import backup",
  "quick.title": "Quick add",
  "quick.thought": "Thought",
  "quick.expense": "Expense",
  "quick.hours": "Hours",
  "quick.task": "Task",
  "quick.what": "What happened?",
  "quick.amount": "Amount",
  "quick.hoursWorked": "Hours worked",
  "quick.save": "Save",
  "quick.cancel": "Cancel",
  "quick.added": "Added",
  "wall.events": "Activity",
  "wall.mine": "Mine",
  "wall.all": "All",
  "common.today": "Today",
  "title.wall": "My wall",
  "sub.wall": "Thoughts, notes, journal & lists",
  "title.work": "Work & earnings",
  "sub.work": "Log a shift, watch it add up",
  "title.cash": "Cashflow",
  "sub.cash": "Income & expenditure in one place",
  "title.diary": "Calendar",
  "sub.diary": "Shifts and appointments together",
  "title.hours": "Schedule",
  "sub.hours": "Sunday to Saturday",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.clear": "Clear",
  "common.add": "Add",
  "common.all": "All",
  "common.total": "Total",
  "common.date": "Date",
  "common.name": "Name",
  "common.amount": "Amount",
  "common.week": "This week",
  "common.month": "This month",
  "common.allTime": "All time",
  "common.preview": "Preview",
  "common.colour": "Colour",
  "work.logShift": "Log shift",
  "work.shifts": "Shifts",
  "work.history": "History",
  "work.addWorkplace": "Add workplace",
  "work.newWorkplace": "New workplace",
  "work.hourly": "Paid by hour",
  "work.daily": "Paid by day",
  "work.byTask": "Paid by task",
  "work.hourlyRate": "Hourly rate",
  "work.dayRate": "Day rate",
  "work.hoursWorked": "Hours worked",
  "work.daysWorked": "Days worked",
  "work.shiftDate": "Shift date",
  "work.shiftTotal": "Shift total",
  "work.saveShift": "Save shift",
  "work.toInvoice": "To invoice",
  "work.freelance": "Freelance — invoice this work",
  "work.noShifts": "No shifts yet",
  "work.create": "Create workplace",
  "sched.displayedHours": "Displayed hours",
  "sched.starts": "Starts",
  "sched.ends": "Ends",
  "sched.thisWeek": "This week",
  "sched.nextWeek": "Next week",
  "sched.lockWeek": "Lock week",
  "sched.unlockWeek": "Unlock week",
  "sched.lockedMsg": "This week is locked",
  "sched.pickJob": "Pick a job, then tap or drag across the hours.",
  "sched.personal": "Personal",
  "sched.other": "Other",
  "sched.unavailable": "Unavailable",
  "sched.colours": "Slot colours",
  "sched.noWorkplaces": "Add a workplace in the Work tab to paint it here.",
  "cash.expenses": "Expenses",
  "cash.fixedCosts": "Fixed costs",
  "diary.appointments": "Appointments",
  "wall.placeholder": "What's on your mind?",
  "wall.post": "Post",
  "wall.empty": "Nothing here yet",
  "a11y.title": "Accessibility",
  "a11y.textSize": "Text size",
  "a11y.sizeNormal": "Normal",
  "a11y.sizeLarge": "Large",
  "a11y.sizeXl": "Extra large",
  "a11y.contrast": "High contrast",
  "a11y.motion": "Reduce motion",
  "a11y.underline": "Underline links",
  "a11y.boldText": "Bolder text",
  "a11y.targets": "Bigger tap targets",
  "a11y.reset": "Reset",
  "wall.mood": "Mood",
  "wall.photo": "Photo",
  "pro.perMonth": "per month",
  "backup.restored": "Backup restored — reloading",
  "backup.bad": "That file isn't a myplace backup",
};

const KEYS = Object.keys(en) as TKey[];

const make = (v: string[]): Dict => {
  const out = {} as Dict;
  KEYS.forEach((k, i) => (out[k] = v[i] ?? en[k]));
  return out;
};

/* order matches Object.keys(en) */
const DICTS: Record<LangCode, Dict> = {
  en,
  he: make(["קיר","עבודה","כסף","יומן","שעות","שדרוג","פרו","הגדרות","שפה","ייצוא הנתונים","ייבוא גיבוי","הוספה מהירה","מחשבה","הוצאה","שעות","משימה","מה קרה?","סכום","שעות עבודה","שמירה","ביטול","נוסף","פעילות","שלי","הכל","היום","הקיר שלי","מחשבות, פתקים, יומן ורשימות","עבודה והכנסות","תעדו משמרת וראו את הסכום עולה","תזרים מזומנים","הכנסות והוצאות במקום אחד","לוח שנה","משמרות ופגישות יחד","לוח זמנים","ראשון עד שבת","שמירה","ביטול","מחיקה","ניקוי","הוספה","הכל","סה\"כ","תאריך","שם","סכום","השבוע","החודש","מאז ומתמיד","תצוגה מקדימה","צבע","תיעוד משמרת","משמרות","היסטוריה","הוספת מקום עבודה","מקום עבודה חדש","תשלום לפי שעה","תשלום לפי יום","תשלום לפי משימה","תעריף שעתי","תעריף יומי","שעות עבודה","ימי עבודה","תאריך המשמרת","סה\"כ למשמרת","שמירת משמרת","לחיוב","פרילנס — להוציא חשבונית","אין עדיין משמרות","יצירת מקום עבודה","שעות מוצגות","מתחיל","מסתיים","השבוע","שבוע הבא","נעילת השבוע","שחרור נעילה","השבוע נעול","בחרו עבודה ואז גררו על השעות.","אישי","אחר","לא זמין","צבעי משבצות","הוסיפו מקום עבודה בלשונית העבודה כדי לצבוע כאן.","הוצאות","הוצאות קבועות","פגישות","מה עובר לכם בראש?","פרסום","אין כאן עדיין כלום"]),
  ar: make(["الحائط","العمل","المال","اليوميات","الساعات","ترقية","برو","الإعدادات","اللغة","تصدير بياناتي","استيراد نسخة","إضافة سريعة","فكرة","مصروف","ساعات","مهمة","ماذا حدث؟","المبلغ","ساعات العمل","حفظ","إلغاء","تمت الإضافة","النشاط","لي","الكل","اليوم","حائطي","أفكار وملاحظات ويوميات وقوائم","العمل والأرباح","سجّل وردية وشاهد المجموع","التدفق النقدي","الدخل والمصروفات في مكان واحد","التقويم","الورديات والمواعيد معًا","الجدول","الأحد إلى السبت","حفظ","إلغاء","حذف","مسح","إضافة","الكل","المجموع","التاريخ","الاسم","المبلغ","هذا الأسبوع","هذا الشهر","كل الوقت","معاينة","اللون","تسجيل وردية","الورديات","السجل","إضافة مكان عمل","مكان عمل جديد","أجر بالساعة","أجر باليوم","أجر بالمهمة","أجر الساعة","أجر اليوم","ساعات العمل","أيام العمل","تاريخ الوردية","إجمالي الوردية","حفظ الوردية","للفوترة","عمل حر — إصدار فاتورة","لا توجد ورديات بعد","إنشاء مكان عمل","الساعات المعروضة","يبدأ","ينتهي","هذا الأسبوع","الأسبوع القادم","قفل الأسبوع","فتح الأسبوع","هذا الأسبوع مقفل","اختر عملاً ثم اسحب على الساعات.","شخصي","آخر","غير متاح","ألوان الخانات","أضف مكان عمل من تبويب العمل لتلوينه هنا.","المصروفات","التكاليف الثابتة","المواعيد","بماذا تفكر؟","نشر","لا يوجد شيء هنا بعد"]),
  es: make(["Muro","Trabajo","Dinero","Diario","Horas","Mejorar","Pro","Ajustes","Idioma","Exportar mis datos","Importar copia","Añadir rápido","Pensamiento","Gasto","Horas","Tarea","¿Qué pasó?","Importe","Horas trabajadas","Guardar","Cancelar","Añadido","Actividad","Míos","Todo","Hoy","Mi muro","Pensamientos, notas, diario y listas","Trabajo e ingresos","Registra un turno y suma","Flujo de caja","Ingresos y gastos en un solo lugar","Calendario","Turnos y citas juntos","Horario","De domingo a sábado","Guardar","Cancelar","Eliminar","Limpiar","Añadir","Todo","Total","Fecha","Nombre","Importe","Esta semana","Este mes","Histórico","Vista previa","Color","Registrar turno","Turnos","Historial","Añadir lugar de trabajo","Nuevo lugar de trabajo","Pago por hora","Pago por día","Pago por tarea","Tarifa por hora","Tarifa por día","Horas trabajadas","Días trabajados","Fecha del turno","Total del turno","Guardar turno","Por facturar","Autónomo — facturar este trabajo","Aún no hay turnos","Crear lugar de trabajo","Horas mostradas","Empieza","Termina","Esta semana","Próxima semana","Bloquear semana","Desbloquear semana","Esta semana está bloqueada","Elige un trabajo y arrastra sobre las horas.","Personal","Otro","No disponible","Colores de las casillas","Añade un lugar de trabajo en la pestaña Trabajo para pintarlo aquí.","Gastos","Costes fijos","Citas","¿Qué estás pensando?","Publicar","Aquí todavía no hay nada"]),
  pt: make(["Mural","Trabalho","Dinheiro","Diário","Horas","Upgrade","Pro","Definições","Idioma","Exportar dados","Importar cópia","Adição rápida","Pensamento","Despesa","Horas","Tarefa","O que aconteceu?","Valor","Horas trabalhadas","Guardar","Cancelar","Adicionado","Atividade","Meus","Tudo","Hoje","O meu mural","Pensamentos, notas, diário e listas","Trabalho e ganhos","Registe um turno e veja somar","Fluxo de caixa","Receitas e despesas num só lugar","Calendário","Turnos e compromissos juntos","Horário","De domingo a sábado","Guardar","Cancelar","Eliminar","Limpar","Adicionar","Tudo","Total","Data","Nome","Valor","Esta semana","Este mês","Sempre","Pré-visualização","Cor","Registar turno","Turnos","Histórico","Adicionar local de trabalho","Novo local de trabalho","Pago à hora","Pago ao dia","Pago por tarefa","Valor por hora","Valor por dia","Horas trabalhadas","Dias trabalhados","Data do turno","Total do turno","Guardar turno","A faturar","Freelance — faturar este trabalho","Ainda sem turnos","Criar local de trabalho","Horas apresentadas","Começa","Termina","Esta semana","Próxima semana","Bloquear semana","Desbloquear semana","Esta semana está bloqueada","Escolha um trabalho e arraste pelas horas.","Pessoal","Outro","Indisponível","Cores dos blocos","Adicione um local de trabalho no separador Trabalho para o pintar aqui.","Despesas","Custos fixos","Compromissos","Em que está a pensar?","Publicar","Ainda não há nada aqui"]),
  fr: make(["Mur","Travail","Argent","Journal","Heures","Passer Pro","Pro","Réglages","Langue","Exporter mes données","Importer une sauvegarde","Ajout rapide","Pensée","Dépense","Heures","Tâche","Que s'est-il passé ?","Montant","Heures travaillées","Enregistrer","Annuler","Ajouté","Activité","Les miens","Tout","Aujourd'hui","Mon mur","Pensées, notes, journal et listes","Travail et revenus","Notez une vacation, voyez le total","Trésorerie","Revenus et dépenses au même endroit","Calendrier","Vacations et rendez-vous réunis","Planning","Du dimanche au samedi","Enregistrer","Annuler","Supprimer","Effacer","Ajouter","Tout","Total","Date","Nom","Montant","Cette semaine","Ce mois-ci","Depuis le début","Aperçu","Couleur","Noter une vacation","Vacations","Historique","Ajouter un lieu de travail","Nouveau lieu de travail","Payé à l'heure","Payé à la journée","Payé à la tâche","Taux horaire","Tarif journalier","Heures travaillées","Jours travaillés","Date de la vacation","Total de la vacation","Enregistrer","À facturer","Freelance — facturer ce travail","Aucune vacation","Créer le lieu de travail","Heures affichées","Début","Fin","Cette semaine","Semaine prochaine","Verrouiller la semaine","Déverrouiller","Cette semaine est verrouillée","Choisissez un travail puis glissez sur les heures.","Personnel","Autre","Indisponible","Couleurs des cases","Ajoutez un lieu de travail dans l'onglet Travail pour le colorer ici.","Dépenses","Charges fixes","Rendez-vous","À quoi pensez-vous ?","Publier","Rien ici pour l'instant"]),
  de: make(["Wand","Arbeit","Geld","Tagebuch","Stunden","Upgrade","Pro","Einstellungen","Sprache","Daten exportieren","Backup importieren","Schnell hinzufügen","Gedanke","Ausgabe","Stunden","Aufgabe","Was ist passiert?","Betrag","Gearbeitete Stunden","Speichern","Abbrechen","Hinzugefügt","Aktivität","Meine","Alle","Heute","Meine Wand","Gedanken, Notizen, Tagebuch & Listen","Arbeit & Verdienst","Schicht eintragen, Summe wächst","Cashflow","Einnahmen und Ausgaben an einem Ort","Kalender","Schichten und Termine zusammen","Wochenplan","Sonntag bis Samstag","Speichern","Abbrechen","Löschen","Leeren","Hinzufügen","Alle","Gesamt","Datum","Name","Betrag","Diese Woche","Diesen Monat","Gesamtzeit","Vorschau","Farbe","Schicht eintragen","Schichten","Verlauf","Arbeitsplatz hinzufügen","Neuer Arbeitsplatz","Stundenlohn","Tageslohn","Pro Aufgabe","Stundensatz","Tagessatz","Gearbeitete Stunden","Gearbeitete Tage","Datum der Schicht","Schichtsumme","Schicht speichern","Zu berechnen","Freiberuflich — abrechnen","Noch keine Schichten","Arbeitsplatz anlegen","Angezeigte Stunden","Beginn","Ende","Diese Woche","Nächste Woche","Woche sperren","Woche entsperren","Diese Woche ist gesperrt","Job wählen, dann über die Stunden ziehen.","Privat","Sonstiges","Nicht verfügbar","Feldfarben","Füge im Tab Arbeit einen Arbeitsplatz hinzu, um ihn hier zu färben.","Ausgaben","Fixkosten","Termine","Woran denkst du?","Posten","Hier ist noch nichts"]),
  it: make(["Bacheca","Lavoro","Soldi","Diario","Ore","Passa a Pro","Pro","Impostazioni","Lingua","Esporta i dati","Importa backup","Aggiunta rapida","Pensiero","Spesa","Ore","Attività","Cos'è successo?","Importo","Ore lavorate","Salva","Annulla","Aggiunto","Attività","Miei","Tutti","Oggi","La mia bacheca","Pensieri, note, diario ed elenchi","Lavoro e guadagni","Registra un turno e vedi il totale","Flusso di cassa","Entrate e uscite in un unico posto","Calendario","Turni e appuntamenti insieme","Orario","Da domenica a sabato","Salva","Annulla","Elimina","Svuota","Aggiungi","Tutti","Totale","Data","Nome","Importo","Questa settimana","Questo mese","Sempre","Anteprima","Colore","Registra turno","Turni","Cronologia","Aggiungi luogo di lavoro","Nuovo luogo di lavoro","Pagato a ora","Pagato a giornata","Pagato a compito","Tariffa oraria","Tariffa giornaliera","Ore lavorate","Giorni lavorati","Data del turno","Totale turno","Salva turno","Da fatturare","Freelance — fattura questo lavoro","Ancora nessun turno","Crea luogo di lavoro","Ore mostrate","Inizia","Finisce","Questa settimana","Prossima settimana","Blocca settimana","Sblocca settimana","Questa settimana è bloccata","Scegli un lavoro e trascina sulle ore.","Personale","Altro","Non disponibile","Colori delle caselle","Aggiungi un luogo di lavoro nella scheda Lavoro per colorarlo qui.","Spese","Costi fissi","Appuntamenti","A cosa stai pensando?","Pubblica","Qui non c'è ancora nulla"]),
  ru: make(["Стена","Работа","Деньги","Дневник","Часы","Улучшить","Про","Настройки","Язык","Экспорт данных","Импорт копии","Быстрое добавление","Мысль","Расход","Часы","Задача","Что случилось?","Сумма","Отработано часов","Сохранить","Отмена","Добавлено","Активность","Мои","Все","Сегодня","Моя стена","Мысли, заметки, дневник и списки","Работа и доходы","Отметьте смену и смотрите, как растёт сумма","Денежный поток","Доходы и расходы в одном месте","Календарь","Смены и встречи вместе","Расписание","С воскресенья по субботу","Сохранить","Отмена","Удалить","Очистить","Добавить","Все","Итого","Дата","Название","Сумма","На этой неделе","В этом месяце","За всё время","Предпросмотр","Цвет","Записать смену","Смены","История","Добавить место работы","Новое место работы","Оплата за час","Оплата за день","Оплата за задачу","Ставка за час","Ставка за день","Отработано часов","Отработано дней","Дата смены","Итого за смену","Сохранить смену","К оплате","Фриланс — выставить счёт","Смен пока нет","Создать место работы","Отображаемые часы","Начало","Конец","Эта неделя","Следующая неделя","Заблокировать неделю","Разблокировать","Неделя заблокирована","Выберите работу и проведите по часам.","Личное","Другое","Недоступно","Цвета ячеек","Добавьте место работы во вкладке «Работа», чтобы закрасить его здесь.","Расходы","Постоянные расходы","Встречи","О чём вы думаете?","Опубликовать","Здесь пока пусто"]),
  tr: make(["Duvar","İş","Para","Günlük","Saatler","Yükselt","Pro","Ayarlar","Dil","Verilerimi dışa aktar","Yedek içe aktar","Hızlı ekle","Düşünce","Harcama","Saat","Görev","Ne oldu?","Tutar","Çalışılan saat","Kaydet","İptal","Eklendi","Etkinlik","Benim","Tümü","Bugün","Duvarım","Düşünceler, notlar, günlük ve listeler","İş ve kazanç","Vardiya gir, toplamı izle","Nakit akışı","Gelir ve giderler tek yerde","Takvim","Vardiyalar ve randevular bir arada","Program","Pazardan cumartesiye","Kaydet","İptal","Sil","Temizle","Ekle","Tümü","Toplam","Tarih","Ad","Tutar","Bu hafta","Bu ay","Tüm zamanlar","Önizleme","Renk","Vardiya gir","Vardiyalar","Geçmiş","İş yeri ekle","Yeni iş yeri","Saatlik ücret","Günlük ücret","Görev başı","Saat ücreti","Gün ücreti","Çalışılan saat","Çalışılan gün","Vardiya tarihi","Vardiya toplamı","Vardiyayı kaydet","Faturalanacak","Serbest çalışma — faturalandır","Henüz vardiya yok","İş yeri oluştur","Gösterilen saatler","Başlangıç","Bitiş","Bu hafta","Gelecek hafta","Haftayı kilitle","Kilidi aç","Bu hafta kilitli","Bir iş seçin, sonra saatlerin üzerinde sürükleyin.","Kişisel","Diğer","Müsait değil","Kutu renkleri","Burada boyamak için İş sekmesinden bir iş yeri ekleyin.","Harcamalar","Sabit giderler","Randevular","Aklından ne geçiyor?","Paylaş","Burada henüz bir şey yok"]),
  pl: make(["Ściana","Praca","Pieniądze","Dziennik","Godziny","Ulepsz","Pro","Ustawienia","Język","Eksportuj dane","Importuj kopię","Szybkie dodawanie","Myśl","Wydatek","Godziny","Zadanie","Co się stało?","Kwota","Przepracowane godziny","Zapisz","Anuluj","Dodano","Aktywność","Moje","Wszystko","Dziś","Moja ściana","Myśli, notatki, dziennik i listy","Praca i zarobki","Zapisz zmianę i patrz, jak rośnie","Przepływy","Przychody i wydatki w jednym miejscu","Kalendarz","Zmiany i spotkania razem","Grafik","Od niedzieli do soboty","Zapisz","Anuluj","Usuń","Wyczyść","Dodaj","Wszystko","Razem","Data","Nazwa","Kwota","W tym tygodniu","W tym miesiącu","Od początku","Podgląd","Kolor","Zapisz zmianę","Zmiany","Historia","Dodaj miejsce pracy","Nowe miejsce pracy","Płatne za godzinę","Płatne za dzień","Płatne za zadanie","Stawka godzinowa","Stawka dzienna","Przepracowane godziny","Przepracowane dni","Data zmiany","Suma zmiany","Zapisz zmianę","Do zafakturowania","Freelance — wystaw fakturę","Brak zmian","Utwórz miejsce pracy","Wyświetlane godziny","Początek","Koniec","Ten tydzień","Następny tydzień","Zablokuj tydzień","Odblokuj tydzień","Ten tydzień jest zablokowany","Wybierz pracę i przeciągnij po godzinach.","Osobiste","Inne","Niedostępny","Kolory pól","Dodaj miejsce pracy w zakładce Praca, aby je tu pomalować.","Wydatki","Koszty stałe","Spotkania","O czym myślisz?","Opublikuj","Jeszcze nic tu nie ma"]),
  nl: make(["Muur","Werk","Geld","Dagboek","Uren","Upgraden","Pro","Instellingen","Taal","Mijn gegevens exporteren","Back-up importeren","Snel toevoegen","Gedachte","Uitgave","Uren","Taak","Wat is er gebeurd?","Bedrag","Gewerkte uren","Opslaan","Annuleren","Toegevoegd","Activiteit","Mijne","Alles","Vandaag","Mijn muur","Gedachten, notities, dagboek en lijstjes","Werk en inkomsten","Noteer een dienst en zie het oplopen","Cashflow","Inkomsten en uitgaven op één plek","Agenda","Diensten en afspraken samen","Rooster","Zondag tot zaterdag","Opslaan","Annuleren","Verwijderen","Wissen","Toevoegen","Alles","Totaal","Datum","Naam","Bedrag","Deze week","Deze maand","Altijd","Voorbeeld","Kleur","Dienst noteren","Diensten","Geschiedenis","Werkplek toevoegen","Nieuwe werkplek","Per uur betaald","Per dag betaald","Per taak betaald","Uurtarief","Dagtarief","Gewerkte uren","Gewerkte dagen","Datum van de dienst","Totaal dienst","Dienst opslaan","Te factureren","Freelance — dit werk factureren","Nog geen diensten","Werkplek aanmaken","Getoonde uren","Begint","Eindigt","Deze week","Volgende week","Week vergrendelen","Week ontgrendelen","Deze week is vergrendeld","Kies werk en sleep over de uren.","Persoonlijk","Overig","Niet beschikbaar","Vakkleuren","Voeg een werkplek toe op het tabblad Werk om die hier te kleuren.","Uitgaven","Vaste lasten","Afspraken","Waar denk je aan?","Plaatsen","Hier is nog niets"]),
  zh: make(["墙","工作","现金","日记","工时","升级","专业版","设置","语言","导出我的数据","导入备份","快速添加","想法","支出","工时","任务","发生了什么？","金额","工作小时","保存","取消","已添加","动态","我的","全部","今天","我的墙","想法、笔记、日记与清单","工作与收入","记录一次班次，看着累积","现金流","收入与支出集中管理","日历","班次与约会一览","日程表","周日至周六","保存","取消","删除","清空","添加","全部","合计","日期","名称","金额","本周","本月","全部时间","预览","颜色","记录班次","班次","历史","添加工作地点","新的工作地点","按小时计酬","按天计酬","按任务计酬","小时费率","日费率","工作小时","工作天数","班次日期","班次合计","保存班次","待开票","自由职业 — 为此开票","还没有班次","创建工作地点","显示时段","开始","结束","本周","下周","锁定本周","解锁本周","本周已锁定","先选择工作，再在时段上拖动。","个人","其他","不可用","格子颜色","在“工作”标签中添加工作地点，即可在此上色。","支出","固定支出","约会","在想些什么？","发布","这里还没有内容"]),
  ja: make(["ウォール","仕事","お金","日記","時間","アップグレード","Pro","設定","言語","データを書き出す","バックアップを読み込む","クイック追加","メモ","支出","時間","タスク","何がありましたか？","金額","勤務時間","保存","キャンセル","追加しました","アクティビティ","自分","すべて","今日","マイウォール","メモ・日記・リストをひとつに","仕事と収入","シフトを記録して合計を確認","キャッシュフロー","収入と支出をまとめて管理","カレンダー","シフトと予定をまとめて","スケジュール","日曜から土曜","保存","キャンセル","削除","クリア","追加","すべて","合計","日付","名前","金額","今週","今月","全期間","プレビュー","色","シフト記録","シフト","履歴","勤務先を追加","新しい勤務先","時給制","日給制","タスク単位","時給","日給","勤務時間","勤務日数","シフトの日付","シフト合計","シフトを保存","請求予定","フリーランス — 請求する","シフトはまだありません","勤務先を作成","表示する時間帯","開始","終了","今週","来週","週をロック","ロック解除","この週はロック中です","仕事を選んで時間をドラッグします。","プライベート","その他","対応不可","マスの色","「仕事」タブで勤務先を追加すると、ここで色を塗れます。","支出","固定費","予定","いま考えていることは？","投稿","まだ何もありません"]),
  ko: make(["월","일","돈","일기","시간","업그레이드","프로","설정","언어","내 데이터 내보내기","백업 가져오기","빠른 추가","생각","지출","시간","할 일","무슨 일이 있었나요?","금액","근무 시간","저장","취소","추가됨","활동","내 것","전체","오늘","내 월","생각, 메모, 일기, 목록","일과 수입","근무를 기록하고 합계를 확인하세요","현금 흐름","수입과 지출을 한곳에서","캘린더","근무와 약속을 함께","일정표","일요일부터 토요일까지","저장","취소","삭제","지우기","추가","전체","합계","날짜","이름","금액","이번 주","이번 달","전체 기간","미리보기","색상","근무 기록","근무","기록","근무지 추가","새 근무지","시급제","일급제","건당 지급","시급","일급","근무 시간","근무 일수","근무 날짜","근무 합계","근무 저장","청구 예정","프리랜스 — 이 일 청구","아직 근무가 없습니다","근무지 만들기","표시 시간","시작","종료","이번 주","다음 주","주 잠금","잠금 해제","이번 주는 잠겨 있습니다","일을 고른 뒤 시간 위로 드래그하세요.","개인","기타","불가","칸 색상","일 탭에서 근무지를 추가하면 여기에 색을 칠할 수 있어요.","지출","고정비","약속","무슨 생각을 하고 있나요?","게시","아직 아무것도 없습니다"]),
  hi: make(["वॉल","काम","पैसा","डायरी","घंटे","अपग्रेड","प्रो","सेटिंग्स","भाषा","मेरा डेटा निर्यात करें","बैकअप आयात करें","त्वरित जोड़","विचार","खर्च","घंटे","कार्य","क्या हुआ?","राशि","काम के घंटे","सहेजें","रद्द करें","जोड़ा गया","गतिविधि","मेरा","सभी","आज","मेरी वॉल","विचार, नोट्स, डायरी और सूचियाँ","काम और कमाई","शिफ्ट दर्ज करें और कुल देखें","नकदी प्रवाह","आय और खर्च एक ही जगह","कैलेंडर","शिफ्ट और अपॉइंटमेंट साथ में","समय-सारिणी","रविवार से शनिवार","सहेजें","रद्द करें","हटाएँ","साफ़ करें","जोड़ें","सभी","कुल","तारीख","नाम","राशि","इस हफ्ते","इस महीने","हमेशा","झलक","रंग","शिफ्ट दर्ज करें","शिफ्ट","इतिहास","कार्यस्थल जोड़ें","नया कार्यस्थल","प्रति घंटा","प्रति दिन","प्रति कार्य","प्रति घंटा दर","प्रति दिन दर","काम के घंटे","काम के दिन","शिफ्ट की तारीख","शिफ्ट कुल","शिफ्ट सहेजें","बिल करने योग्य","फ्रीलांस — इसका बिल बनाएँ","अभी कोई शिफ्ट नहीं","कार्यस्थल बनाएँ","दिखाए गए घंटे","शुरू","समाप्त","इस हफ्ते","अगले हफ्ते","हफ्ता लॉक करें","अनलॉक करें","यह हफ्ता लॉक है","काम चुनें, फिर घंटों पर खींचें।","निजी","अन्य","अनुपलब्ध","खाने के रंग","यहाँ रंग भरने के लिए काम टैब में कार्यस्थल जोड़ें।","खर्च","निश्चित खर्च","अपॉइंटमेंट","आप क्या सोच रहे हैं?","पोस्ट करें","यहाँ अभी कुछ नहीं है"]),
  bn: make(["ওয়াল","কাজ","টাকা","ডায়েরি","ঘণ্টা","আপগ্রেড","প্রো","সেটিংস","ভাষা","আমার ডেটা রপ্তানি","ব্যাকআপ আমদানি","দ্রুত যোগ","ভাবনা","খরচ","ঘণ্টা","কাজ","কী হয়েছে?","পরিমাণ","কাজের ঘণ্টা","সংরক্ষণ","বাতিল","যোগ হয়েছে","কার্যকলাপ","আমার","সব","আজ","আমার ওয়াল","ভাবনা, নোট, ডায়েরি ও তালিকা","কাজ ও আয়","শিফট লিখুন, মোট দেখুন","নগদ প্রবাহ","আয় ও ব্যয় এক জায়গায়","ক্যালেন্ডার","শিফট ও অ্যাপয়েন্টমেন্ট একসাথে","সময়সূচি","রবিবার থেকে শনিবার","সংরক্ষণ","বাতিল","মুছুন","পরিষ্কার","যোগ","সব","মোট","তারিখ","নাম","পরিমাণ","এই সপ্তাহে","এই মাসে","সব সময়","প্রিভিউ","রঙ","শিফট লিখুন","শিফট","ইতিহাস","কর্মস্থল যোগ করুন","নতুন কর্মস্থল","ঘণ্টায় বেতন","দিনে বেতন","কাজ অনুযায়ী","ঘণ্টার হার","দিনের হার","কাজের ঘণ্টা","কাজের দিন","শিফটের তারিখ","শিফট মোট","শিফট সংরক্ষণ","বিল করতে","ফ্রিল্যান্স — বিল করুন","এখনও কোনো শিফট নেই","কর্মস্থল তৈরি করুন","প্রদর্শিত সময়","শুরু","শেষ","এই সপ্তাহ","পরের সপ্তাহ","সপ্তাহ লক করুন","আনলক করুন","এই সপ্তাহ লক করা","একটি কাজ বাছুন, তারপর ঘণ্টার উপর টানুন।","ব্যক্তিগত","অন্যান্য","অনুপলব্ধ","ঘরের রঙ","এখানে রং করতে কাজ ট্যাবে কর্মস্থল যোগ করুন।","খরচ","নির্দিষ্ট খরচ","অ্যাপয়েন্টমেন্ট","কী ভাবছেন?","পোস্ট","এখনও কিছু নেই"]),
  ur: make(["وال","کام","پیسہ","ڈائری","گھنٹے","اپ گریڈ","پرو","ترتیبات","زبان","میرا ڈیٹا برآمد کریں","بیک اپ درآمد کریں","فوری اضافہ","خیال","خرچ","گھنٹے","کام","کیا ہوا؟","رقم","کام کے گھنٹے","محفوظ کریں","منسوخ","شامل ہو گیا","سرگرمی","میرا","سب","آج","میری وال","خیالات، نوٹس، ڈائری اور فہرستیں","کام اور آمدنی","شفٹ درج کریں اور مجموعہ دیکھیں","کیش فلو","آمدن اور اخراجات ایک جگہ","کیلنڈر","شفٹیں اور ملاقاتیں ایک ساتھ","شیڈول","اتوار سے ہفتہ","محفوظ کریں","منسوخ","حذف کریں","صاف کریں","شامل کریں","سب","کل","تاریخ","نام","رقم","اس ہفتے","اس مہینے","ہمیشہ","جھلک","رنگ","شفٹ درج کریں","شفٹیں","تاریخچہ","کام کی جگہ شامل کریں","نئی کام کی جگہ","فی گھنٹہ","فی دن","فی کام","فی گھنٹہ ریٹ","فی دن ریٹ","کام کے گھنٹے","کام کے دن","شفٹ کی تاریخ","شفٹ کا کل","شفٹ محفوظ کریں","بل کے لیے","فری لانس — اس کا بل بنائیں","ابھی کوئی شفٹ نہیں","کام کی جگہ بنائیں","دکھائے گئے گھنٹے","شروع","اختتام","اس ہفتے","اگلے ہفتے","ہفتہ مقفل کریں","مقفل کھولیں","یہ ہفتہ مقفل ہے","کام منتخب کریں، پھر گھنٹوں پر گھسیٹیں۔","ذاتی","دیگر","دستیاب نہیں","خانوں کے رنگ","یہاں رنگ بھرنے کے لیے کام ٹیب میں جگہ شامل کریں۔","اخراجات","مقررہ اخراجات","ملاقاتیں","آپ کیا سوچ رہے ہیں؟","پوسٹ کریں","یہاں ابھی کچھ نہیں"]),
  id: make(["Dinding","Kerja","Uang","Buku harian","Jam","Tingkatkan","Pro","Pengaturan","Bahasa","Ekspor data saya","Impor cadangan","Tambah cepat","Pikiran","Pengeluaran","Jam","Tugas","Apa yang terjadi?","Jumlah","Jam kerja","Simpan","Batal","Ditambahkan","Aktivitas","Milik saya","Semua","Hari ini","Dinding saya","Pikiran, catatan, jurnal & daftar","Kerja & penghasilan","Catat shift, lihat totalnya bertambah","Arus kas","Pemasukan dan pengeluaran di satu tempat","Kalender","Shift dan janji temu jadi satu","Jadwal","Minggu sampai Sabtu","Simpan","Batal","Hapus","Bersihkan","Tambah","Semua","Total","Tanggal","Nama","Jumlah","Minggu ini","Bulan ini","Sepanjang waktu","Pratinjau","Warna","Catat shift","Shift","Riwayat","Tambah tempat kerja","Tempat kerja baru","Dibayar per jam","Dibayar per hari","Dibayar per tugas","Tarif per jam","Tarif per hari","Jam kerja","Hari kerja","Tanggal shift","Total shift","Simpan shift","Untuk ditagih","Freelance — tagih pekerjaan ini","Belum ada shift","Buat tempat kerja","Jam yang ditampilkan","Mulai","Selesai","Minggu ini","Minggu depan","Kunci minggu","Buka kunci","Minggu ini terkunci","Pilih pekerjaan, lalu geser pada jam-jamnya.","Pribadi","Lainnya","Tidak tersedia","Warna kotak","Tambahkan tempat kerja di tab Kerja untuk mewarnainya di sini.","Pengeluaran","Biaya tetap","Janji temu","Apa yang kamu pikirkan?","Kirim","Belum ada apa-apa di sini"]),
  vi: make(["Tường","Công việc","Tiền","Nhật ký","Giờ","Nâng cấp","Pro","Cài đặt","Ngôn ngữ","Xuất dữ liệu","Nhập bản sao lưu","Thêm nhanh","Suy nghĩ","Chi tiêu","Giờ","Việc cần làm","Chuyện gì đã xảy ra?","Số tiền","Số giờ làm","Lưu","Huỷ","Đã thêm","Hoạt động","Của tôi","Tất cả","Hôm nay","Tường của tôi","Suy nghĩ, ghi chú, nhật ký và danh sách","Công việc & thu nhập","Ghi ca làm và xem tổng tăng lên","Dòng tiền","Thu và chi ở cùng một nơi","Lịch","Ca làm và cuộc hẹn cùng chỗ","Thời khoá biểu","Chủ nhật đến thứ Bảy","Lưu","Huỷ","Xoá","Xoá hết","Thêm","Tất cả","Tổng","Ngày","Tên","Số tiền","Tuần này","Tháng này","Toàn bộ","Xem trước","Màu","Ghi ca làm","Ca làm","Lịch sử","Thêm nơi làm việc","Nơi làm việc mới","Trả theo giờ","Trả theo ngày","Trả theo việc","Giá mỗi giờ","Giá mỗi ngày","Số giờ làm","Số ngày làm","Ngày của ca","Tổng ca làm","Lưu ca làm","Cần xuất hoá đơn","Tự do — xuất hoá đơn việc này","Chưa có ca làm nào","Tạo nơi làm việc","Khung giờ hiển thị","Bắt đầu","Kết thúc","Tuần này","Tuần sau","Khoá tuần","Mở khoá tuần","Tuần này đang khoá","Chọn công việc rồi kéo trên các giờ.","Cá nhân","Khác","Không rảnh","Màu ô","Thêm nơi làm việc ở tab Công việc để tô màu tại đây.","Chi tiêu","Chi phí cố định","Cuộc hẹn","Bạn đang nghĩ gì?","Đăng","Chưa có gì ở đây"]),
};

/* ---- Extra keys, translated per language (order matters) ---- */

const EXTRA_KEYS: TKey[] = [
  "a11y.title", "a11y.textSize", "a11y.sizeNormal", "a11y.sizeLarge", "a11y.sizeXl",
  "a11y.contrast", "a11y.motion", "a11y.underline", "a11y.boldText", "a11y.targets",
  "a11y.reset", "wall.mood", "wall.photo", "pro.perMonth", "backup.restored", "backup.bad",
];

const EXTRA: Partial<Record<LangCode, string[]>> = {
  he: ["נגישות","גודל טקסט","רגיל","גדול","גדול מאוד","ניגודיות גבוהה","הפחתת אנימציות","קו תחתון לקישורים","טקסט מודגש","אזורי לחיצה גדולים","איפוס","מצב רוח","תמונה","לחודש","הגיבוי שוחזר — טוען מחדש","הקובץ הזה אינו גיבוי של myplace"],
  ar: ["إمكانية الوصول","حجم النص","عادي","كبير","كبير جدًا","تباين عالٍ","تقليل الحركة","تسطير الروابط","خط أعرض","أهداف لمس أكبر","إعادة تعيين","المزاج","صورة","شهريًا","تم استعادة النسخة — جارٍ إعادة التحميل","هذا الملف ليس نسخة myplace"],
  es: ["Accesibilidad","Tamaño del texto","Normal","Grande","Muy grande","Alto contraste","Reducir movimiento","Subrayar enlaces","Texto más grueso","Zonas táctiles grandes","Restablecer","Ánimo","Foto","al mes","Copia restaurada — recargando","Ese archivo no es una copia de myplace"],
  pt: ["Acessibilidade","Tamanho do texto","Normal","Grande","Muito grande","Alto contraste","Reduzir movimento","Sublinhar ligações","Texto mais grosso","Áreas de toque maiores","Redefinir","Humor","Foto","por mês","Cópia restaurada — a recarregar","Esse ficheiro não é uma cópia do myplace"],
  fr: ["Accessibilité","Taille du texte","Normal","Grand","Très grand","Contraste élevé","Réduire les animations","Souligner les liens","Texte plus gras","Zones tactiles plus grandes","Réinitialiser","Humeur","Photo","par mois","Sauvegarde restaurée — rechargement","Ce fichier n'est pas une sauvegarde myplace"],
  de: ["Barrierefreiheit","Textgröße","Normal","Groß","Sehr groß","Hoher Kontrast","Bewegung reduzieren","Links unterstreichen","Fetterer Text","Größere Tippflächen","Zurücksetzen","Stimmung","Foto","pro Monat","Backup wiederhergestellt — wird neu geladen","Diese Datei ist kein myplace-Backup"],
  it: ["Accessibilità","Dimensione del testo","Normale","Grande","Molto grande","Contrasto elevato","Riduci animazioni","Sottolinea i link","Testo più spesso","Aree di tocco più grandi","Reimposta","Umore","Foto","al mese","Backup ripristinato — ricarico","Questo file non è un backup di myplace"],
  ru: ["Доступность","Размер текста","Обычный","Крупный","Очень крупный","Высокий контраст","Меньше анимации","Подчёркивать ссылки","Жирнее текст","Крупнее области нажатия","Сбросить","Настроение","Фото","в месяц","Копия восстановлена — перезагрузка","Это не резервная копия myplace"],
  tr: ["Erişilebilirlik","Yazı boyutu","Normal","Büyük","Çok büyük","Yüksek kontrast","Hareketi azalt","Bağlantıları altı çizili","Daha kalın yazı","Daha büyük dokunma alanı","Sıfırla","Ruh hâli","Fotoğraf","aylık","Yedek geri yüklendi — yenileniyor","Bu dosya bir myplace yedeği değil"],
  pl: ["Dostępność","Rozmiar tekstu","Normalny","Duży","Bardzo duży","Wysoki kontrast","Ogranicz animacje","Podkreślaj linki","Grubszy tekst","Większe pola dotyku","Resetuj","Nastrój","Zdjęcie","miesięcznie","Kopia przywrócona — przeładowanie","Ten plik nie jest kopią myplace"],
  nl: ["Toegankelijkheid","Tekstgrootte","Normaal","Groot","Extra groot","Hoog contrast","Minder beweging","Links onderstrepen","Dikkere tekst","Grotere tikvlakken","Herstellen","Stemming","Foto","per maand","Back-up teruggezet — opnieuw laden","Dat bestand is geen myplace-back-up"],
  zh: ["无障碍","文字大小","标准","大","特大","高对比度","减少动画","为链接加下划线","更粗的文字","更大的点按区域","重置","心情","照片","每月","备份已恢复 — 正在重新加载","该文件不是 myplace 备份"],
  ja: ["アクセシビリティ","文字サイズ","標準","大","特大","ハイコントラスト","動きを減らす","リンクに下線","文字を太く","タップ領域を大きく","リセット","気分","写真","月額","バックアップを復元 — 再読み込み中","このファイルは myplace のバックアップではありません"],
  ko: ["접근성","글자 크기","보통","크게","아주 크게","고대비","모션 줄이기","링크 밑줄","더 굵은 글자","더 큰 터치 영역","초기화","기분","사진","월","백업 복원됨 — 다시 불러오는 중","이 파일은 myplace 백업이 아닙니다"],
  hi: ["सुलभता","पाठ का आकार","सामान्य","बड़ा","बहुत बड़ा","उच्च कंट्रास्ट","एनिमेशन कम करें","लिंक रेखांकित करें","मोटा पाठ","बड़े टैप क्षेत्र","रीसेट","मनोदशा","फ़ोटो","प्रति माह","बैकअप बहाल — फिर लोड हो रहा है","यह फ़ाइल myplace बैकअप नहीं है"],
  bn: ["অ্যাক্সেসিবিলিটি","লেখার আকার","স্বাভাবিক","বড়","অতি বড়","উচ্চ কনট্রাস্ট","অ্যানিমেশন কমান","লিঙ্কে আন্ডারলাইন","মোটা লেখা","বড় ট্যাপ এলাকা","রিসেট","মুড","ছবি","প্রতি মাসে","ব্যাকআপ পুনরুদ্ধার — রিলোড হচ্ছে","এই ফাইলটি myplace ব্যাকআপ নয়"],
  ur: ["قابلِ رسائی","متن کا سائز","عام","بڑا","بہت بڑا","زیادہ کنٹراسٹ","حرکت کم کریں","لنکس کے نیچے لکیر","گاڑھا متن","بڑے ٹیپ حصے","ری سیٹ","موڈ","تصویر","ماہانہ","بیک اپ بحال — دوبارہ لوڈ ہو رہا ہے","یہ فائل myplace بیک اپ نہیں ہے"],
  id: ["Aksesibilitas","Ukuran teks","Normal","Besar","Sangat besar","Kontras tinggi","Kurangi gerakan","Garis bawahi tautan","Teks lebih tebal","Area ketuk lebih besar","Atur ulang","Suasana hati","Foto","per bulan","Cadangan dipulihkan — memuat ulang","Berkas itu bukan cadangan myplace"],
  vi: ["Trợ năng","Cỡ chữ","Bình thường","Lớn","Rất lớn","Tương phản cao","Giảm chuyển động","Gạch chân liên kết","Chữ đậm hơn","Vùng nhấn lớn hơn","Đặt lại","Tâm trạng","Ảnh","mỗi tháng","Đã phục hồi bản sao — đang tải lại","Tệp đó không phải bản sao lưu myplace"],
};

for (const [code, values] of Object.entries(EXTRA) as [LangCode, string[]][]) {
  EXTRA_KEYS.forEach((k, i) => {
    if (values[i]) DICTS[code][k] = values[i];
  });
}

/** BCP-47 locale used for every date, time and number format. */
export const LOCALES: Record<LangCode, string> = {
  en: "en-GB", he: "he-IL", ar: "ar", es: "es-ES", pt: "pt-PT", fr: "fr-FR", de: "de-DE",
  it: "it-IT", ru: "ru-RU", tr: "tr-TR", pl: "pl-PL", nl: "nl-NL", zh: "zh-CN", ja: "ja-JP",
  ko: "ko-KR", hi: "hi-IN", bn: "bn-BD", ur: "ur-PK", id: "id-ID", vi: "vi-VN",
};

let activeLocale = "en-GB";

/** Locale for module-level Intl formatting outside React components. */
export const getLocale = () => activeLocale;

const STORAGE_KEY = "myplace:language";

type Ctx = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (k: TKey) => string;
  rtl: boolean;
  /** BCP-47 locale for date/time/number formatting. */
  locale: string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (saved && DICTS[saved]) setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const rtl = LANGUAGES.find((l) => l.code === lang)?.rtl ?? false;

  activeLocale = LOCALES[lang] ?? "en-GB";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [lang, rtl]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      rtl,
      locale: LOCALES[lang] ?? "en-GB",
      setLang: (l: LangCode) => {
        setLangState(l);
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignore */
        }
      },
      t: (k: TKey) => DICTS[lang][k] ?? en[k],
    }),
    [lang, rtl],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  return { lang: "en", setLang: () => {}, t: (k) => en[k], rtl: false, locale: "en-GB" };
}

/** Locale bound to the active language, for Intl formatting. */
export function useLocale() {
  return useLanguage().locale;
}
