import { TeacherCourse, LectureReport, LectureStatus } from '../types';

export function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function formatGradeLabel(grade: string): string {
  const normalized = grade.trim().toLowerCase();
  switch (normalized) {
    case 'jr4':
    case 'p4':
      return 'Junior 4 (Primary 4)';
    case 'jr5':
    case 'p5':
      return 'Junior 5 (Primary 5)';
    case 'jr6':
    case 'p6':
      return 'Junior 6 (Primary 6)';
    case 'm1':
    case 'prep1':
      return 'Middle 1 (Prep 1)';
    case 'm2':
    case 'prep2':
      return 'Middle 2 (Prep 2)';
    case 'm3':
    case 'prep3':
      return 'Middle 3 (Prep 3)';
    case 'sec1':
      return 'Secondary 1';
    case 'sec2':
      return 'Secondary 2';
    case 'sec3':
      return 'Secondary 3';
    default:
      return grade.trim();
  }
}

export function parseHeaderCode(header: string): {
  subject: string;
  subjectCategory: string;
  grade: string;
  gradeLabel: string;
  teacher: string;
} {
  const cleanHeader = header.trim();
  const parts = cleanHeader.split('-').map(p => p.trim()).filter(Boolean);

  let subjectCategory = 'General';
  let subject = cleanHeader;
  let grade = 'General';
  let teacher = cleanHeader;

  if (parts.length >= 4) {
    // e.g. ["Sci", "En", "Jr4", "Nada Hassan"]
    const rawSubj = parts[0].toLowerCase();
    const lang = parts[1].toLowerCase();
    grade = parts[2].toUpperCase();
    teacher = parts.slice(3).join('-');

    if (rawSubj.startsWith('sci')) {
      subjectCategory = 'Science';
      subject = lang.includes('en') ? 'Science (English)' : 'Science (Arabic)';
    } else if (rawSubj === 'ss') {
      subjectCategory = 'Social Studies';
      subject = 'Social Studies';
    } else if (rawSubj === 'phl' || rawSubj === 'phil') {
      subjectCategory = 'Philosophy';
      subject = 'Philosophy';
    } else if (rawSubj === 'hx' || rawSubj.startsWith('hist')) {
      subjectCategory = 'History';
      subject = 'History';
    } else if (rawSubj === 'phy') {
      subjectCategory = 'Physics';
      subject = 'Physics';
    } else if (rawSubj === 'isc' || rawSubj.startsWith('integrated')) {
      subjectCategory = 'Integrated Science';
      subject = 'Integrated Science';
    } else if (rawSubj.startsWith('math')) {
      subjectCategory = 'Math';
      subject = lang.includes('en') ? 'Math (English)' : 'Math (Arabic)';
    } else if (rawSubj.startsWith('ar')) {
      subjectCategory = 'Arabic';
      subject = 'Arabic Language';
    } else if (rawSubj.startsWith('en')) {
      subjectCategory = 'English';
      subject = 'English Language';
    } else {
      subjectCategory = parts[0];
      subject = `${parts[0]} (${parts[1]})`;
    }
  } else if (parts.length === 3) {
    // e.g. ["Science", "M1", "Fady"] or ["Math", "Jr4", "Hany"]
    const rawSubj = parts[0].toLowerCase();
    grade = parts[1].toUpperCase();
    teacher = parts[2];

    if (rawSubj.startsWith('sci')) {
      subjectCategory = 'Science';
      subject = 'Science';
    } else if (rawSubj === 'ss') {
      subjectCategory = 'Social Studies';
      subject = 'Social Studies';
    } else if (rawSubj === 'phl' || rawSubj === 'phil') {
      subjectCategory = 'Philosophy';
      subject = 'Philosophy';
    } else if (rawSubj === 'hx' || rawSubj.startsWith('hist')) {
      subjectCategory = 'History';
      subject = 'History';
    } else if (rawSubj === 'phy') {
      subjectCategory = 'Physics';
      subject = 'Physics';
    } else if (rawSubj === 'isc' || rawSubj.startsWith('integrated')) {
      subjectCategory = 'Integrated Science';
      subject = 'Integrated Science';
    } else if (rawSubj.startsWith('math')) {
      subjectCategory = 'Math';
      subject = 'Math';
    } else if (rawSubj.startsWith('ar')) {
      subjectCategory = 'Arabic';
      subject = 'Arabic';
    } else if (rawSubj.startsWith('en')) {
      subjectCategory = 'English';
      subject = 'English';
    } else {
      subjectCategory = parts[0];
      subject = parts[0];
    }
  } else if (parts.length === 2) {
    grade = parts[0].toUpperCase();
    teacher = parts[1];
    subjectCategory = 'General';
    subject = 'General';
  }

  return {
    subject,
    subjectCategory,
    grade,
    gradeLabel: formatGradeLabel(grade),
    teacher: teacher.replace(/\t/g, '').trim(),
  };
}

export function detectLectureStatus(note: string): LectureStatus {
  const trimmed = note.trim();
  if (!trimmed) return 'pending';

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('مشكلة') ||
    lower.includes('لم يحضر') ||
    lower.includes('غياب') ||
    lower.includes('عطل') ||
    lower.includes('issue') ||
    lower.includes('alert') ||
    lower.includes('تأجيل') ||
    lower.includes('ملغية') ||
    lower.includes('اعتذار') ||
    lower.includes('canceled') ||
    lower.includes('cancelled')
  ) {
    return 'issue';
  }
  return 'completed';
}

export function hasLectureReport(lecture: Pick<LectureReport, 'note' | 'fileUrl'>): boolean {
  return Boolean(lecture.note.trim() || lecture.fileUrl?.trim());
}

/**
 * Split CSV lines taking quotes into account
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  const cells = result.map(c => c.trim());
  while (cells.length > 0 && !cells[cells.length - 1]) cells.pop();
  return cells;
}

function normalizeLectureId(value: string): string {
  const normalized = value.trim();
  const match = normalized.match(/^(?:lecture|lec|l)\s*(\d+)$/i);
  return match ? `L${Number(match[1])}` : normalized;
}

function sortLectureIds(a: string, b: string): number {
  const numberA = a.match(/^L(\d+)$/i)?.[1];
  const numberB = b.match(/^L(\d+)$/i)?.[1];
  if (numberA && numberB) return Number(numberA) - Number(numberB);
  if (numberA) return -1;
  if (numberB) return 1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function getGoogleDrivePreviewUrl(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    if (
      url.protocol !== 'https:' ||
      (url.hostname !== 'drive.google.com' && url.hostname !== 'docs.google.com')
    ) {
      return null;
    }

    const fileId = url.pathname.match(/\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
    return fileId
      ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`
      : null;
  } catch {
    return null;
  }
}

function isHeaderRow(cells: string[]): boolean {
  const firstCell = cells[0]?.trim().toLowerCase();
  return firstCell === 'lectures' || firstCell === 'lecture' || firstCell === 'حصة';
}

function getTeacherGradeReportGroupWidth(cells: string[]): number | null {
  for (const groupWidth of [5, 4]) {
    if (cells.length < groupWidth || cells.length % groupWidth !== 0) continue;

    let matchesHeader = true;
    for (let i = 0; i < cells.length; i += groupWidth) {
      const hasExpectedColumns =
        cells[i]?.trim().toLowerCase() === 'lectures' &&
        cells[i + 1]?.trim().toLowerCase() === 'teacher' &&
        cells[i + 2]?.trim().toLowerCase() === 'grade' &&
        cells[i + 3]?.trim().toLowerCase() === 'report';
      const hasFileUrlColumn = groupWidth === 4 ||
        ['file url', 'file link', 'report url', 'url', 'link'].includes(
          cells[i + 4]?.trim().toLowerCase()
        );

      if (!hasExpectedColumns || !hasFileUrlColumn) {
        matchesHeader = false;
        break;
      }
    }

    if (matchesHeader) return groupWidth;
  }

  return null;
}

function isTeacherGradeReportHeader(cells: string[]): boolean {
  return getTeacherGradeReportGroupWidth(cells) !== null;
}

function parseTeacherGradeReportSheet(rows: string[][], groupWidth: number): {
  courses: TeacherCourse[];
  allLectureIds: string[];
} {
  const courseMap = new Map<string, TeacherCourse>();
  const lectureSet = new Set<string>();
  let activeCourses: Array<TeacherCourse | undefined> = [];

  for (const row of rows) {
    if (isTeacherGradeReportHeader(row)) {
      activeCourses = new Array<TeacherCourse | undefined>(row.length / groupWidth);
      continue;
    }

    for (let column = 0, group = 0; column < row.length; column += groupWidth, group++) {
      const rawLectureId = row[column]?.trim() || '';
      if (!rawLectureId) continue;
      const lectureId = normalizeLectureId(rawLectureId);

      lectureSet.add(lectureId);

      const previousCourse = activeCourses[group];
      const rawHeader = row[column + 1]?.trim() || previousCourse?.rawHeader || '';
      const grade = row[column + 2]?.trim() || previousCourse?.grade || '';
      if (!rawHeader || !grade) continue;

      const courseKey = `${rawHeader.toLowerCase()}::${grade.toLowerCase()}`;
      let course = courseMap.get(courseKey);
      if (!course) {
        const meta = parseHeaderCode(rawHeader);
        course = {
          id: courseKey,
          rawHeader,
          subject: meta.subject,
          subjectCategory: meta.subjectCategory,
          grade,
          gradeLabel: formatGradeLabel(grade),
          teacher: meta.teacher,
          lectures: {},
          totalLectures: 0,
          completedLectures: 0,
          completionRate: 0,
        };
        courseMap.set(courseKey, course);
      }
      activeCourses[group] = course;

      const reportValue = row[column + 3]?.trim() || '';
      const reportUrl = getGoogleDrivePreviewUrl(reportValue) ? reportValue : '';
      const note = reportUrl ? '' : reportValue;
      const fileUrl = reportUrl || (groupWidth === 5 ? row[column + 4]?.trim() || '' : '');
      course.lectures[lectureId] = {
        lectureId,
        note,
        status: fileUrl ? 'completed' : detectLectureStatus(note),
        fileUrl: fileUrl || undefined,
        timestamp: note ? 'Recently submitted' : undefined,
      };
    }
  }

  const courses = Array.from(courseMap.values()).map(course => {
    const lectureEntries = Object.values(course.lectures);
    const total = lectureEntries.length;
    const completed = lectureEntries.filter(hasLectureReport).length;

    return {
      ...course,
      totalLectures: total,
      completedLectures: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const allLectureIds = Array.from(lectureSet).sort(sortLectureIds);

  return { courses, allLectureIds };
}

/**
 * Robust parser that handles horizontally and vertically stacked spreadsheet exports
 */
export function parseSpreadsheet(csvRaw: string): {
  courses: TeacherCourse[];
  allLectureIds: string[];
} {
  const rawLines = csvRaw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (rawLines.length === 0) {
    return { courses: [], allLectureIds: [] };
  }

  const rows = rawLines.map(parseCsvLine);
  const groupWidth = rows.map(getTeacherGradeReportGroupWidth).find(width => width !== null);
  if (groupWidth) {
    return parseTeacherGradeReportSheet(rows, groupWidth);
  }

  // Find all block starts by matching the header label, not lecture data rows.
  const blockStartIndices: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (isHeaderRow(rows[i])) {
      blockStartIndices.push(i);
    }
  }

  // If no explicit "Lectures" header line found, treat line 0 as header
  if (blockStartIndices.length === 0) {
    blockStartIndices.push(0);
  }

  const courseMap = new Map<string, TeacherCourse>();
  const lectureSet = new Set<string>();

  for (let b = 0; b < blockStartIndices.length; b++) {
    const startIdx = blockStartIndices[b];
    const nextStartIdx = b + 1 < blockStartIndices.length ? blockStartIndices[b + 1] : rows.length;

    const headerCells = rows[startIdx];
    // Pairs: (0, 1), (2, 3), (4, 5)...
    // 0 is "Lectures", 1 is Teacher Header
    const columnPairs: Array<{
      lectureColIdx: number;
      reportColIdx: number;
      headerText: string;
      parsedMeta: ReturnType<typeof parseHeaderCode>;
    }> = [];

    for (let c = 0; c < headerCells.length; c += 2) {
      const headerText = headerCells[c + 1];
      if (headerText && headerText.trim().length > 0) {
        const meta = parseHeaderCode(headerText);
        columnPairs.push({
          lectureColIdx: c,
          reportColIdx: c + 1,
          headerText,
          parsedMeta: meta,
        });
      }
    }

    // Now iterate rows in this block (from startIdx + 1 to nextStartIdx - 1)
    for (let r = startIdx + 1; r < nextStartIdx; r++) {
      const rowCells = rows[r];
      if (rowCells.length === 0) continue;

      for (const pair of columnPairs) {
        const rawLectureId = rowCells[pair.lectureColIdx]?.trim() || '';
        if (!rawLectureId) continue;

        const lectureId = normalizeLectureId(rawLectureId);
        lectureSet.add(lectureId);

        const note = rowCells[pair.reportColIdx]?.trim() || '';
        const courseKey = pair.headerText.trim();

        let course = courseMap.get(courseKey);
        if (!course) {
          course = {
            id: courseKey,
            rawHeader: pair.headerText,
            subject: pair.parsedMeta.subject,
            subjectCategory: pair.parsedMeta.subjectCategory,
            grade: pair.parsedMeta.grade,
            gradeLabel: pair.parsedMeta.gradeLabel,
            teacher: pair.parsedMeta.teacher,
            lectures: {},
            totalLectures: 0,
            completedLectures: 0,
            completionRate: 0,
          };
          courseMap.set(courseKey, course);
        }

        const status = detectLectureStatus(note);
        course.lectures[lectureId] = {
          lectureId,
          note,
          status,
          timestamp: note ? 'Recently submitted' : undefined,
        };
      }
    }
  }

  // Calculate lecture summary stats for each course
  const courses: TeacherCourse[] = Array.from(courseMap.values()).map(course => {
    const lectureEntries = Object.values(course.lectures);
    const total = lectureEntries.length;
    const completed = lectureEntries.filter(l => l.status === 'completed' || (l.note && l.note.trim().length > 0)).length;
    return {
      ...course,
      totalLectures: total,
      completedLectures: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // Sort lecture IDs naturally: L1, L2, L3, ... L10, L11, etc.
  const sortedLectures = Array.from(lectureSet).sort(sortLectureIds);

  // Default to L1..L15 if none found
  const allLectureIds = sortedLectures.length > 0 
    ? sortedLectures 
    : Array.from({ length: 15 }, (_, i) => `L${i + 1}`);

  return { courses, allLectureIds };
}

export function parseSpreadsheetTabs(
  tabs: ReadonlyArray<{ name: string; csv: string }>
): {
  courses: TeacherCourse[];
  allLectureIds: string[];
} {
  const courses: TeacherCourse[] = [];
  const lectureSet = new Set<string>();

  for (const tab of tabs) {
    const result = parseSpreadsheet(tab.csv);
    const normalizedTab = tab.name.trim().toLowerCase();
    const tabSubject = normalizedTab === 'science-en'
      ? { subject: 'Science (English)', category: 'Science (English)' }
      : normalizedTab === 'science-ar'
        ? { subject: 'Science (Arabic)', category: 'Science (Arabic)' }
        : normalizedTab === 'math-en'
          ? { subject: 'Math (English)', category: 'Math (English)' }
          : normalizedTab === 'math-ar'
            ? { subject: 'Math (Arabic)', category: 'Math (Arabic)' }
            : normalizedTab === 'social-studies'
              ? { subject: 'Social Studies', category: 'Social Studies' }
              : normalizedTab === 'integrated science'
                ? { subject: 'Integrated Science', category: 'Integrated Science' }
                : undefined;

    for (const lectureId of result.allLectureIds) lectureSet.add(lectureId);
    courses.push(...result.courses.map(course => ({
      ...course,
      id: `${tab.name}::${course.id}`,
      subject: tabSubject?.subject ?? course.subject,
      subjectCategory: tabSubject?.category ?? course.subjectCategory,
    })));
  }

  const allLectureIds = Array.from(lectureSet).sort(sortLectureIds);

  return { courses, allLectureIds };
}

/**
 * Exports courses to CSV format matching the spreadsheet
 */
export function exportCoursesToCsv(courses: TeacherCourse[], lectureList: string[]): string {
  if (courses.length === 0) return '';

  // The Report cell contains either a Drive URL or the plain-text report.
  const headerParts: string[] = [];
  courses.forEach(() => {
    headerParts.push('Lectures', 'Teacher', 'Grade', 'Report');
  });
  const lines: string[] = [headerParts.join(',')];

  // Rows for each lecture
  lectureList.forEach(lecId => {
    const rowParts: string[] = [];
    courses.forEach(c => {
      rowParts.push(
        lecId,
        `"${c.rawHeader.replace(/"/g, '""')}"`,
        `"${c.grade.replace(/"/g, '""')}"`,
      );
      const note = c.lectures[lecId]?.note || '';
      const fileUrl = c.lectures[lecId]?.fileUrl || '';
      const reportValue = fileUrl || note;
      rowParts.push(reportValue ? `"${reportValue.replace(/"/g, '""')}"` : '');
    });
    lines.push(rowParts.join(','));
  });

  return lines.join('\n');
}
