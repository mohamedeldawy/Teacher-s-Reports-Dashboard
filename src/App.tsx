import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FiltersBar } from './components/FiltersBar';
import { ReportMatrixView } from './components/ReportMatrixView';
import { TeacherCardsView } from './components/TeacherCardsView';
import { RecentUpdatesFeed } from './components/RecentUpdatesFeed';
import { LectureModal } from './components/LectureModal';
import { ImportModal } from './components/ImportModal';
import { TeacherCourse, FilterState, LectureStatus, LectureReport } from './types';
import {
  getGoogleDrivePreviewUrl,
  hasLectureReport,
  parseSpreadsheet,
  parseSpreadsheetTabs,
  exportCoursesToCsv,
} from './utils/parser';
import { GOOGLE_SHEET_ID, INITIAL_SPREADSHEETS } from './data/initialData';
import { CheckCircle2, AlertCircle, Info, BookOpen } from 'lucide-react';

const STORAGE_KEY = 'academic_teacher_lecture_reports_v5';

type LocalLectureEdits = Record<string, Record<string, LectureReport>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLectureStatus(status: unknown): status is LectureStatus {
  return status === 'completed' || status === 'pending' || status === 'issue';
}

function matchesLectureStatus(lecture: LectureReport, status: FilterState['status']): boolean {
  if (status === 'has_report') {
    return lecture.status === 'completed' && hasLectureReport(lecture);
  }
  if (status === 'pending') {
    return lecture.status === 'pending' && !lecture.note.trim() && !lecture.fileUrl?.trim();
  }
  if (status === 'issue') return lecture.status === 'issue';
  return true;
}

function isLocalLectureEdits(value: unknown): value is LocalLectureEdits {
  if (!isRecord(value)) return false;

  return Object.values(value).every(lectures => {
    if (!isRecord(lectures)) return false;

    return Object.values(lectures).every(lecture =>
      isRecord(lecture) &&
      typeof lecture.lectureId === 'string' &&
      typeof lecture.note === 'string' &&
      isLectureStatus(lecture.status) &&
      (lecture.fileUrl === undefined || typeof lecture.fileUrl === 'string') &&
      (lecture.timestamp === undefined || typeof lecture.timestamp === 'string') &&
      (lecture.updatedBy === undefined || typeof lecture.updatedBy === 'string')
    );
  });
}

function mergeLocalLectureEdits(
  latestCourses: TeacherCourse[],
  currentCourses: TeacherCourse[],
  localEdits: LocalLectureEdits
): TeacherCourse[] {
  const currentCoursesById = new Map(currentCourses.map(course => [course.id, course]));

  return latestCourses.map(course => {
    const currentCourse = currentCoursesById.get(course.id);
    const lectures = { ...course.lectures };
    Object.entries(lectures).forEach(([lectureId, latestLecture]) => {
      const localEdit = localEdits[course.id]?.[lectureId];
      const currentLecture = currentCourse?.lectures[lectureId];

      if (localEdit) {
        lectures[lectureId] = localEdit;
      } else if (
        currentLecture &&
        currentLecture.note === latestLecture.note &&
        currentLecture.fileUrl === latestLecture.fileUrl
      ) {
        // Retain status-only edits made before local edit tracking was added.
        lectures[lectureId] = { ...latestLecture, status: currentLecture.status };
      }
    });

    const lectureEntries = Object.values(lectures);
    const total = lectureEntries.length;
    const completed = lectureEntries.filter(hasLectureReport).length;

    return {
      ...course,
      lectures,
      totalLectures: total,
      completedLectures: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

export default function App() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [lectureList, setLectureList] = useState<string[]>([]);
  const [localEdits, setLocalEdits] = useState<LocalLectureEdits>({});
  const [filters, setFilters] = useState<FilterState>({
    subject: 'all',
    grade: 'all',
    teacher: 'all',
    status: 'all',
    searchQuery: '',
    viewMode: 'report_matrix',
  });

  // Modal states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshingSheet, setIsRefreshingSheet] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initialize data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const savedData = JSON.parse(stored) as {
          courses?: TeacherCourse[];
          allLectureIds?: string[];
          localEdits?: unknown;
        };
        if (Array.isArray(savedData.courses) && Array.isArray(savedData.allLectureIds)) {
          setCourses(savedData.courses);
          setLectureList(savedData.allLectureIds);
          if (isLocalLectureEdits(savedData.localEdits)) {
            setLocalEdits(savedData.localEdits);
          }
          return;
        }
      }

      const { courses: initialCourses, allLectureIds } = parseSpreadsheetTabs(INITIAL_SPREADSHEETS);
      setCourses(initialCourses);
      setLectureList(allLectureIds);
    } catch (e) {
      console.error('Error loading initial data:', e);
      const { courses: fallbackCourses, allLectureIds } = parseSpreadsheetTabs(INITIAL_SPREADSHEETS);
      setCourses(fallbackCourses);
      setLectureList(allLectureIds);
    }
  }, []);

  const saveDashboardData = (
    updatedCourses: TeacherCourse[],
    updatedLectureIds: string[],
    updatedLocalEdits: LocalLectureEdits
  ): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        courses: updatedCourses,
        allLectureIds: updatedLectureIds,
        localEdits: updatedLocalEdits,
      }));
    } catch (e) {
      console.error('Error saving dashboard data:', e);
      return false;
    }

    setCourses(updatedCourses);
    setLectureList(updatedLectureIds);
    setLocalEdits(updatedLocalEdits);
    return true;
  };

  // Available subjects from current dataset
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => {
      if (c.subjectCategory) set.add(c.subjectCategory);
    });
    return Array.from(set).sort();
  }, [courses]);

  // Available grades
  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => {
      if (c.grade) set.add(c.grade);
    });
    return Array.from(set).sort();
  }, [courses]);

  // Available teachers (Filtered dynamically by selected subject/grade)
  const availableTeachers = useMemo(() => {
    const filteredForTeachers = courses.filter(c => {
      if (filters.subject !== 'all' && c.subjectCategory.toLowerCase() !== filters.subject.toLowerCase()) {
        return false;
      }
      if (filters.grade !== 'all' && c.grade.toLowerCase() !== filters.grade.toLowerCase()) {
        return false;
      }
      return true;
    });

    const set = new Set<string>();
    filteredForTeachers.forEach(c => {
      if (c.teacher) set.add(c.teacher);
    });
    return Array.from(set).sort();
  }, [courses, filters.subject, filters.grade]);

  // Filtered courses for display
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // 1. Subject filter
      if (filters.subject !== 'all' && c.subjectCategory.toLowerCase() !== filters.subject.toLowerCase()) {
        return false;
      }

      // 2. Grade filter
      if (filters.grade !== 'all' && c.grade.toLowerCase() !== filters.grade.toLowerCase()) {
        return false;
      }

      // 3. Teacher filter
      if (filters.teacher !== 'all' && c.teacher.toLowerCase() !== filters.teacher.toLowerCase()) {
        return false;
      }

      const lectures = Object.values(c.lectures) as LectureReport[];
      if (filters.status !== 'all' && !lectures.some(lecture => matchesLectureStatus(lecture, filters.status))) {
        return false;
      }

      // 5. Search query (matches teacher, subject, grade, or any lecture note)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesTeacher = c.teacher.toLowerCase().includes(query);
        const matchesSubject = c.subject.toLowerCase().includes(query);
        const matchesGrade = c.grade.toLowerCase().includes(query);
        const matchesRaw = c.rawHeader.toLowerCase().includes(query);
        const matchesNote = lectures.some(
          lecture =>
            matchesLectureStatus(lecture, filters.status) &&
            (lecture.note.toLowerCase().includes(query) ||
              Boolean(lecture.fileUrl?.toLowerCase().includes(query)))
        );

        if (!matchesTeacher && !matchesSubject && !matchesGrade && !matchesRaw && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [courses, filters]);

  const visibleCourses = useMemo(() => {
    if (filters.status === 'all') return filteredCourses;

    return filteredCourses.map(course => {
      const lectures = Object.fromEntries(
        Object.entries(course.lectures).filter(([, lecture]) =>
          matchesLectureStatus(lecture, filters.status)
        )
      );

      return {
        ...course,
        lectures,
      };
    });
  }, [filteredCourses, filters.status]);

  const visibleLectureList = useMemo(() => {
    if (filters.status === 'all') return lectureList;
    const visibleIds = new Set(
      visibleCourses.flatMap(course => Object.keys(course.lectures))
    );
    return lectureList.filter(lectureId => visibleIds.has(lectureId));
  }, [filters.status, lectureList, visibleCourses]);

  // Handle saving an individual lecture report
  const handleSaveLecture = (
    courseId: string,
    lectureId: string,
    note: string,
    status: LectureStatus
  ) => {
    let savedLecture: LectureReport | undefined;
    const updatedCourses = courses.map(course => {
      if (course.id !== courseId) return course;

      const updatedLectures = { ...course.lectures };
      const fileUrl = getGoogleDrivePreviewUrl(note) ? note : undefined;
      const lecture: LectureReport = {
        lectureId,
        note: fileUrl ? '' : note,
        status: fileUrl ? 'completed' : note.trim() ? status : 'pending',
        fileUrl,
        timestamp: note.trim() ? 'Just updated' : undefined,
      };
      savedLecture = lecture;
      updatedLectures[lectureId] = lecture;

      const lectureEntries = Object.values(updatedLectures) as LectureReport[];
      const total = lectureEntries.length;
      const completed = lectureEntries.filter(hasLectureReport).length;

      return {
        ...course,
        lectures: updatedLectures,
        totalLectures: total,
        completedLectures: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    if (!savedLecture) {
      showToast('Could not find this lecture to save the update.');
      return;
    }

    const updatedLocalEdits = {
      ...localEdits,
      [courseId]: {
        ...localEdits[courseId],
        [lectureId]: savedLecture,
      },
    };
    if (!saveDashboardData(updatedCourses, lectureList, updatedLocalEdits)) {
      showToast('Could not save this update in browser storage.');
      return;
    }
    showToast(`Saved update for ${selectedCourse?.teacher || 'Teacher'} - ${lectureId}`);
  };

  // Handle spreadsheet import
  const handleApplySpreadsheetData = (csvText: string) => {
    try {
      const { courses: parsedCourses, allLectureIds } = parseSpreadsheet(csvText);
      if (parsedCourses.length > 0) {
        if (!saveDashboardData(parsedCourses, allLectureIds, {})) {
          showToast('Could not save the imported data in browser storage.');
          return;
        }
        showToast(`Successfully imported ${parsedCourses.length} teacher sections!`);
      }
    } catch (e) {
      console.error(e);
      showToast('Error importing spreadsheet data.');
    }
  };

  // Handle CSV export
  const handleExportCsv = () => {
    try {
      const csv = exportCoursesToCsv(filteredCourses, lectureList);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `teacher_lecture_reports_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported filtered report to CSV');
    } catch (e) {
      console.error(e);
      showToast('Failed to export CSV');
    }
  };

  // Reset to the bundled Google Sheet snapshot
  const handleResetData = () => {
    if (window.confirm('Reset all lecture reports back to the current Google Sheet snapshot?')) {
      localStorage.removeItem(STORAGE_KEY);
      const { courses: fallbackCourses, allLectureIds } = parseSpreadsheetTabs(INITIAL_SPREADSHEETS);
      setCourses(fallbackCourses);
      setLectureList(allLectureIds);
      setLocalEdits({});
      setFilters({
        subject: 'all',
        grade: 'all',
        teacher: 'all',
        status: 'all',
        searchQuery: '',
        viewMode: 'report_matrix',
      });
      showToast('Reset dashboard to the current Google Sheet snapshot');
    }
  };

  const handleRestoreCurrentSheetData = () => {
    const { courses: initialCourses, allLectureIds } = parseSpreadsheetTabs(INITIAL_SPREADSHEETS);
    if (!saveDashboardData(initialCourses, allLectureIds, {})) {
      showToast('Could not save the current sheet data in this browser.');
      return;
    }
    showToast(`Loaded ${initialCourses.length} sections from ${INITIAL_SPREADSHEETS.length} sheet tabs.`);
  };

  const handleRefreshSheetData = async () => {
    setIsRefreshingSheet(true);
    try {
      const tabs = await Promise.all(INITIAL_SPREADSHEETS.map(async ({ name }) => {
        const url = new URL(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq`);
        url.searchParams.set('tqx', 'out:csv');
        url.searchParams.set('sheet', name);
        const response = await fetch(url, { cache: 'no-store' });
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('text/csv')) {
          throw new Error(`Could not load "${name}" tab (HTTP ${response.status}).`);
        }
        return { name, csv: await response.text() };
      }));
      const { courses: parsedCourses, allLectureIds } = parseSpreadsheetTabs(tabs);
      if (parsedCourses.length === 0) {
        throw new Error('No teacher sections were found in the Google Sheet.');
      }
      const savedState = localStorage.getItem(STORAGE_KEY);
      const savedData: {
        courses?: TeacherCourse[];
        localEdits?: unknown;
      } = savedState ? JSON.parse(savedState) : {};
      const currentCourses = Array.isArray(savedData.courses) ? savedData.courses : [];
      const currentEdits = isLocalLectureEdits(savedData.localEdits) ? savedData.localEdits : {};
      const latestCourses = mergeLocalLectureEdits(parsedCourses, currentCourses, currentEdits);
      if (!saveDashboardData(latestCourses, allLectureIds, currentEdits)) {
        showToast('Sheet refreshed, but browser storage could not be updated.');
        return;
      }

      showToast(`Synced ${latestCourses.length} sections from ${tabs.length} sheet tabs.`);
    } catch (error) {
      console.error('Could not refresh Google Sheet data:', error);
      showToast(error instanceof Error ? `Sheet sync failed: ${error.message}` : 'Sheet sync failed.');
    } finally {
      setIsRefreshingSheet(false);
    }
  };

  // Open modal for a specific lecture cell
  const handleSelectLecture = (course: TeacherCourse, lectureId: string) => {
    setSelectedCourse(course);
    setSelectedLectureId(lectureId);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Application Bar */}
      <Header
        onOpenImport={() => setIsImportOpen(true)}
        onExportCsv={handleExportCsv}
        onResetData={handleResetData}
        onRefreshSheet={handleRefreshSheetData}
        isRefreshingSheet={isRefreshingSheet}
        totalSections={courses.length}
        totalSubjects={availableSubjects.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI & Summary Bar */}
        <StatsBar
          filteredCourses={filteredCourses}
          onQuickFilterStatus={status => setFilters(prev => ({ ...prev, status }))}
          activeStatusFilter={filters.status}
        />

        {/* Multi-level Filters Bar (Subject, Grade, Teacher, Status, Search) */}
        <FiltersBar
          filters={filters}
          onChangeFilters={updated => setFilters(prev => ({ ...prev, ...updated }))}
          availableSubjects={availableSubjects}
          availableGrades={availableGrades}
          availableTeachers={availableTeachers}
          totalResultsCount={filteredCourses.length}
        />

        {/* Primary View Container */}
        <div className="transition-all duration-200">
          {filters.viewMode === 'report_matrix' && (
            <ReportMatrixView
              courses={visibleCourses}
              lectureList={visibleLectureList}
              onSelectLecture={handleSelectLecture}
            />
          )}

          {filters.viewMode === 'teacher_cards' && (
            <TeacherCardsView
              courses={visibleCourses}
              lectureList={visibleLectureList}
              onSelectLecture={handleSelectLecture}
            />
          )}

          {filters.viewMode === 'updates_feed' && (
            <RecentUpdatesFeed
              courses={visibleCourses}
              statusFilter={filters.status}
              onSelectLecture={handleSelectLecture}
            />
          )}
        </div>
      </main>

      {/* Lecture Note Inspector / Editor Modal */}
      <LectureModal
        isOpen={Boolean(selectedCourse && selectedLectureId)}
        onClose={() => {
          setSelectedCourse(null);
          setSelectedLectureId(null);
        }}
        course={selectedCourse}
        lectureId={selectedLectureId}
        onSaveLecture={handleSaveLecture}
      />

      {/* Import / Paste Spreadsheet Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onApplyData={handleApplySpreadsheetData}
        onApplyCurrentData={handleRestoreCurrentSheetData}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
