export type LectureStatus = 'completed' | 'pending' | 'issue' | 'cancelled';

export interface LectureReport {
  lectureId: string; // e.g. "L1", "L2"
  note: string;
  status: LectureStatus;
  timestamp?: string;
  updatedBy?: string;
}

export interface TeacherCourse {
  id: string; // Unique course key, e.g. "Sci-En-Jr4-Nada Hassan"
  rawHeader: string;
  subject: string; // e.g. "Science (English)"
  subjectCategory: string; // e.g. "Science"
  grade: string; // e.g. "Jr4", "M1"
  gradeLabel: string; // e.g. "Junior 4 (Primary 4)"
  teacher: string; // e.g. "Nada Hassan"
  lectures: Record<string, LectureReport>; // Keyed by lectureId, e.g. "L1"
  totalLectures: number;
  completedLectures: number;
  completionRate: number;
}

export interface FilterState {
  subject: string;
  grade: string;
  teacher: string;
  status: 'all' | 'has_report' | 'pending' | 'issue';
  searchQuery: string;
  viewMode: 'report_matrix' | 'teacher_cards' | 'updates_feed';
}

export interface ParsedSpreadsheetResult {
  courses: TeacherCourse[];
  lectureList: string[]; // e.g. ["L1", "L2", ... "L15"]
  subjects: string[];
  grades: string[];
  teachers: string[];
}
