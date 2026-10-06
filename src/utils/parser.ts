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
    lower.includes('تأجيل') ||
    lower.includes('ملغية') ||
    lower.includes('اعتذار') ||
    lower.includes('canceled') ||
    lower.includes('cancelled')
  ) {
    return 'cancelled';
  }

  if (
    lower.includes('مشكلة') ||
    lower.includes('لم يحضر') ||
    lower.includes('غياب') ||
    lower.includes('عطل') ||
    lower.includes('issue') ||
    lower.includes('alert')
  ) {
    return 'issue';
  }

  return 'completed';
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
  return result.map(c => c.trim());
}

function normalizeLectureId(value: string): string {
  const normalized = value.trim();
  const match = normalized.match(/^(?:lecture|lec|l)\s*(\d+)$/i);
  return match ? `L${Number(match[1])}` : normalized.toUpperCase();
}

function isHeaderRow(cells: string[]): boolean {
  const firstCell = cells[0]?.trim().toLowerCase();
  return firstCell === 'lectures' || firstCell === 'lecture' || firstCell === 'حصة';
}

function isTeacherGradeReportHeader(cells: string[]): boolean {
  if (cells.length < 4 || cells.length % 4 !== 0) return false;

  for (let i = 0; i < cells.length; i += 4) {
    if (
      cells[i]?.trim().toLowerCase() !== 'lectures' ||
      cells[i + 1]?.trim().toLowerCase() !== 'teacher' ||
      cells[i + 2]?.trim().toLowerCase() !== 'grade' ||
      cells[i + 3]?.trim().toLowerCase() !== 'report'
    ) {
      return false;
    }
  }

  return true;
}

function parseTeacherGradeReportSheet(rows: string[][]): {
  courses: TeacherCourse[];
  allLectureIds: string[];
} {
  const courseMap = new Map<string, TeacherCourse>();
  const lectureSet = new Set<string>();
  let activeCourses: Array<TeacherCourse | undefined> = [];

  for (const row of rows) {
    if (isTeacherGradeReportHeader(row)) {
      activeCourses = new Array<TeacherCourse | undefined>(row.length / 4);
      continue;
    }

    for (let column = 0, group = 0; column < row.length; column += 4, group++) {
      const rawLectureId = row[column]?.trim() || '';
      if (!rawLectureId) continue;
      const lectureId = normalizeLectureId(rawLectureId);
      if (!/^L\d+$/i.test(lectureId)) continue;

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

      const note = row[column + 3]?.trim() || '';
      course.lectures[lectureId] = {
        lectureId,
        note,
        status: detectLectureStatus(note),
        timestamp: note ? 'Recently submitted' : undefined,
      };
    }
  }

  const courses = Array.from(courseMap.values()).map(course => {
    const lectureEntries = Object.values(course.lectures);
    const total = lectureEntries.length;
    const completed = lectureEntries.filter(
      lecture => lecture.status === 'completed' || (lecture.note && lecture.note.trim().length > 0)
    ).length;

    return {
      ...course,
      totalLectures: total,
      completedLectures: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const allLectureIds = Array.from(lectureSet).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

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
  if (rows.some(isTeacherGradeReportHeader)) {
    return parseTeacherGradeReportSheet(rows);
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
  const sortedLectures = Array.from(lectureSet).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  // Default to L1..L15 if none found
  const allLectureIds = sortedLectures.length > 0 
    ? sortedLectures 
    : Array.from({ length: 15 }, (_, i) => `L${i + 1}`);

  return { courses, allLectureIds };
}

/**
 * Exports courses to CSV format matching the spreadsheet
 */
export function exportCoursesToCsv(courses: TeacherCourse[], lectureList: string[]): string {
  if (courses.length === 0) return '';

  // Keep teacher and grade metadata explicit so imported edits survive reloads.
  const headerParts: string[] = [];
  courses.forEach(() => {
    headerParts.push('Lectures', 'Teacher', 'Grade', 'Report');
  });
  const lines: string[] = [headerParts.join(',')];

  // Rows for each lecture
  lectureList.forEach(lecId => {
    const rowParts: string[] = [];
    courses.forEach(c => {
      rowParts.push(lecId, `"${c.rawHeader.replace(/"/g, '""')}"`, `"${c.grade.replace(/"/g, '""')}"`);
      const note = c.lectures[lecId]?.note || '';
      rowParts.push(note ? `"${note.replace(/"/g, '""')}"` : '');
    });
    lines.push(rowParts.join(','));
  });

  return lines.join('\n');
}
