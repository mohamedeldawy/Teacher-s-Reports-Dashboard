import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FiltersBar } from './components/FiltersBar';
import { ReportMatrixView } from './components/ReportMatrixView';
import { TeacherCardsView } from './components/TeacherCardsView';
import { RecentUpdatesFeed } from './components/RecentUpdatesFeed';
import { LectureModal } from './components/LectureModal';
import { ImportModal } from './components/ImportModal';
import {
  TeacherCourse,
  FilterState,
  LectureStatus,
  LectureReport,
  TEACHER_REPORT_STATUS_LABELS,
} from './types';
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

function matchesTeacherReportStatus(
  lecture: LectureReport,
  status: FilterState['teacherReportStatus']
): boolean {
  return status === 'all' || lecture.teacherReportStatus === status;
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
      (lecture.updatedBy === undefined || typeof lecture.updatedBy === 'string') &&
      (lecture.sentDate === undefined || typeof lecture.sentDate === 'string') &&
      (lecture.teacherReportStatus === undefined ||
        lecture.teacherReportStatus === 'approved' ||
        lecture.teacherReportStatus === 'argument' ||
        lecture.teacherReportStatus === 'rejected')
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
        lectures[lectureId] = {
          ...localEdit,
          sentDate: latestLecture.sentDate,
          teacherReportStatus: latestLecture.teacherReportStatus,
        };
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

async function fetchCurrentSheetTabs(): Promise<Array<{ name: string; csv: string }>> {
  return Promise.all(INITIAL_SPREADSHEETS.map(async ({ name }) => {
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
}

export default function App() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [lectureList, setLectureList] = useState<string[]>([]);
  const [localEdits, setLocalEdits] = useState<LocalLectureEdits>({});
  const [filters, setFilters] = useState<FilterState>({
    subject: 'all',
    grade: 'all',
    teacher: 'all',
    lecture: 'all',
    status: 'all',
    teacherReportStatus: 'all',
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

  const saveDashboardData = (
    updatedCourses: TeacherCourse[],
    updatedLectureIds: string[],
    updatedLocalEdits: LocalLectureEdits
  ): boolean => {
    let saved = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        courses: updatedCourses,
        allLectureIds: updatedLectureIds,
        localEdits: updatedLocalEdits,
      }));
    } catch (e) {
      console.error('Error saving dashboard data:', e);
      saved = false;
    }

    setCourses(updatedCourses);
    setLectureList(updatedLectureIds);
    setLocalEdits(updatedLocalEdits);
    return saved;
  };

  // Load cached data immediately, then sync the latest published sheet.
  useEffect(() => {
    let isCurrent = true;

    const initializeDashboard = async () => {
      let currentCourses: TeacherCourse[] = [];
      let currentLectureIds: string[] = [];
      let currentEdits: LocalLectureEdits = {};

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const savedData = JSON.parse(stored) as {
            courses?: TeacherCourse[];
            allLectureIds?: string[];
            localEdits?: unknown;
          };
          if (Array.isArray(savedData.courses) && Array.isArray(savedData.allLectureIds)) {
            currentCourses = savedData.courses;
            currentLectureIds = savedData.allLectureIds;
            if (isLocalLectureEdits(savedData.localEdits)) {
              currentEdits = savedData.localEdits;
            }
          }
        }
      } catch (error) {
        console.error('Could not load saved dashboard data:', error);
      }

      if (currentCourses.length === 0) {
        const fallback = parseSpreadsheetTabs(INITIAL_SPREADSHEETS);
        currentCourses = fallback.courses;
        currentLectureIds = fallback.allLectureIds;
      }

      if (!isCurrent) return;
      setCourses(currentCourses);
      setLectureList(currentLectureIds);
      setLocalEdits(currentEdits);
      setIsRefreshingSheet(true);

      try {
        const tabs = await fetchCurrentSheetTabs();
        const latest = parseSpreadsheetTabs(tabs);
        if (latest.courses.length === 0) {
          throw new Error('No teacher sections were found in the Google Sheet.');
        }
        if (!isCurrent) return;

        let savedData: {
          courses?: TeacherCourse[];
          localEdits?: unknown;
        } = {};
        try {
          const currentState = localStorage.getItem(STORAGE_KEY);
          if (currentState) savedData = JSON.parse(currentState);
        } catch (error) {
          console.error('Could not read saved dashboard data before initial sheet sync:', error);
        }
        const savedCourses = Array.isArray(savedData.courses) ? savedData.courses : currentCourses;
        const savedEdits = isLocalLectureEdits(savedData.localEdits) ? savedData.localEdits : currentEdits;
        const mergedCourses = mergeLocalLectureEdits(latest.courses, savedCourses, savedEdits);

        if (!saveDashboardData(mergedCourses, latest.allLectureIds, savedEdits)) {
          showToast('Loaded the latest Google Sheet data, but browser storage could not be updated.');
        }
      } catch (error) {
        console.error('Could not load the latest Google Sheet data:', error);
        if (isCurrent) {
          showToast(error instanceof Error
            ? `Sheet sync failed: ${error.message}. Showing saved dashboard data.`
            : 'Sheet sync failed. Showing saved dashboard data.');
        }
      } finally {
        if (isCurrent) setIsRefreshingSheet(false);
      }
    };

    void initializeDashboard();
    return () => {
      isCurrent = false;
    };
  }, []);

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
      const matchesLectureFilters = (lecture: LectureReport) =>
        (filters.lecture === 'all' || lecture.lectureId === filters.lecture) &&
        matchesLectureStatus(lecture, filters.status) &&
        matchesTeacherReportStatus(lecture, filters.teacherReportStatus);
      if (
        (filters.lecture !== 'all' || filters.status !== 'all' || filters.teacherReportStatus !== 'all') &&
        !lectures.some(matchesLectureFilters)
      ) {
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
            matchesLectureFilters(lecture) &&
            (lecture.note.toLowerCase().includes(query) ||
              Boolean(lecture.fileUrl?.toLowerCase().includes(query)) ||
              Boolean(lecture.sentDate?.toLowerCase().includes(query)) ||
              Boolean(
                lecture.teacherReportStatus &&
                TEACHER_REPORT_STATUS_LABELS[lecture.teacherReportStatus].toLowerCase().includes(query)
              ))
        );

        if (!matchesTeacher && !matchesSubject && !matchesGrade && !matchesRaw && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [courses, filters]);

  const statsCourses = useMemo(() => {
    if (filters.lecture === 'all') return filteredCourses;

    return filteredCourses.map(course => ({
      ...course,
      lectures: Object.fromEntries(
        Object.entries(course.lectures).filter(([lectureId]) => lectureId === filters.lecture)
      ),
    }));
  }, [filteredCourses, filters.lecture]);

  const visibleCourses = useMemo(() => {
    if (
      filters.lecture === 'all' &&
      filters.status === 'all' &&
      filters.teacherReportStatus === 'all'
    ) return filteredCourses;

    return filteredCourses.map(course => {
      const lectures = Object.fromEntries(
        Object.entries(course.lectures).filter(([lectureId, lecture]) =>
          (filters.lecture === 'all' || lectureId === filters.lecture) &&
          matchesLectureStatus(lecture, filters.status) &&
          matchesTeacherReportStatus(lecture, filters.teacherReportStatus)
        )
      );

      return {
        ...course,
        lectures,
      };
    });
  }, [filteredCourses, filters.lecture, filters.status, filters.teacherReportStatus]);

  const visibleLectureList = useMemo(() => {
    if (filters.lecture !== 'all') {
      return visibleCourses.some(course => course.lectures[filters.lecture])
        ? [filters.lecture]
        : [];
    }
    if (filters.status === 'all' && filters.teacherReportStatus === 'all') return lectureList;
    const visibleIds = new Set(
      visibleCourses.flatMap(course => Object.keys(course.lectures))
    );
    return lectureList.filter(lectureId => visibleIds.has(lectureId));
  }, [filters.lecture, filters.status, filters.teacherReportStatus, lectureList, visibleCourses]);

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
        sentDate: course.lectures[lectureId]?.sentDate,
        teacherReportStatus: course.lectures[lectureId]?.teacherReportStatus,
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
      const exportLectureList = filters.lecture === 'all' ? lectureList : [filters.lecture];
      const csv = exportCoursesToCsv(statsCourses, exportLectureList);
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

  const syncSheetData = async (preserveLocalEdits: boolean) => {
    setIsRefreshingSheet(true);
    try {
      const tabs = await fetchCurrentSheetTabs();
      const parsed = parseSpreadsheetTabs(tabs);
      if (parsed.courses.length === 0) {
        throw new Error('No teacher sections were found in the Google Sheet.');
      }

      let savedData: {
        courses?: TeacherCourse[];
        localEdits?: unknown;
      } = {};
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) savedData = JSON.parse(savedState);
      } catch (error) {
        console.error('Could not read saved dashboard data before sheet sync:', error);
      }
      const currentCourses = Array.isArray(savedData.courses) ? savedData.courses : courses;
      const currentEdits = isLocalLectureEdits(savedData.localEdits) ? savedData.localEdits : localEdits;
      const latestCourses = preserveLocalEdits
        ? mergeLocalLectureEdits(parsed.courses, currentCourses, currentEdits)
        : parsed.courses;
      const latestEdits = preserveLocalEdits ? currentEdits : {};

      if (!saveDashboardData(latestCourses, parsed.allLectureIds, latestEdits)) {
        showToast('Sheet synced, but browser storage could not be updated.');
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

  // Reset to the current published Google Sheet data
  const handleResetData = () => {
    if (window.confirm('Reset all lecture reports back to the current Google Sheet snapshot?')) {
      setFilters({
        subject: 'all',
        grade: 'all',
        teacher: 'all',
        lecture: 'all',
        status: 'all',
        teacherReportStatus: 'all',
        searchQuery: '',
        viewMode: 'report_matrix',
      });
      void syncSheetData(false);
    }
  };

  const handleRestoreCurrentSheetData = () => {
    void syncSheetData(false);
  };

  const handleRefreshSheetData = async () => {
    await syncSheetData(true);
  };

  // Open modal for a specific lecture cell
  const handleSelectLecture = (course: TeacherCourse, lectureId: string) => {
    setSelectedCourse(course);
    setSelectedLectureId(lectureId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/40 text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-950">
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
      <main className="flex-1 w-full px-3 sm:px-5 lg:px-6 py-5">
        {/* KPI & Summary Bar */}
        <StatsBar
          filteredCourses={statsCourses}
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
          availableLectures={lectureList}
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
