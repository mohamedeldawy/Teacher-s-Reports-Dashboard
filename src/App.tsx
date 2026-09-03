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
import { parseSpreadsheet, exportCoursesToCsv } from './utils/parser';
import { RAW_SAMPLE_SPREADSHEET } from './data/initialData';
import { CheckCircle2, AlertCircle, Info, BookOpen } from 'lucide-react';

const STORAGE_KEY = 'academic_teacher_lecture_reports_v1';

export default function App() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [lectureList, setLectureList] = useState<string[]>([]);
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
      const csvToLoad = stored && stored.trim().length > 0 ? stored : RAW_SAMPLE_SPREADSHEET;
      const { courses: parsedCourses, allLectureIds } = parseSpreadsheet(csvToLoad);
      setCourses(parsedCourses);
      setLectureList(allLectureIds);
    } catch (e) {
      console.error('Error loading initial data:', e);
      const { courses: fallbackCourses, allLectureIds } = parseSpreadsheet(RAW_SAMPLE_SPREADSHEET);
      setCourses(fallbackCourses);
      setLectureList(allLectureIds);
    }
  }, []);

  // Save courses to localStorage whenever updated
  const saveCoursesToStorage = (updatedCourses: TeacherCourse[]) => {
    setCourses(updatedCourses);
    try {
      const csv = exportCoursesToCsv(updatedCourses, lectureList);
      localStorage.setItem(STORAGE_KEY, csv);
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
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

      // 4. Status filter
      if (filters.status === 'has_report') {
        const hasAnyReport = (Object.values(c.lectures) as LectureReport[]).some(
          l => l.status === 'completed' || (l.note && l.note.trim().length > 0)
        );
        if (!hasAnyReport) return false;
      } else if (filters.status === 'pending') {
        const hasAnyPending = (Object.values(c.lectures) as LectureReport[]).some(
          l => l.status === 'pending' || !l.note || l.note.trim().length === 0
        );
        if (!hasAnyPending) return false;
      } else if (filters.status === 'issue') {
        const hasAnyIssue = (Object.values(c.lectures) as LectureReport[]).some(l => l.status === 'issue');
        if (!hasAnyIssue) return false;
      }

      // 5. Search query (matches teacher, subject, grade, or any lecture note)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesTeacher = c.teacher.toLowerCase().includes(query);
        const matchesSubject = c.subject.toLowerCase().includes(query);
        const matchesGrade = c.grade.toLowerCase().includes(query);
        const matchesRaw = c.rawHeader.toLowerCase().includes(query);
        const matchesNote = (Object.values(c.lectures) as LectureReport[]).some(
          l => l.note && l.note.toLowerCase().includes(query)
        );

        if (!matchesTeacher && !matchesSubject && !matchesGrade && !matchesRaw && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [courses, filters]);

  // Handle saving an individual lecture report
  const handleSaveLecture = (
    courseId: string,
    lectureId: string,
    note: string,
    status: LectureStatus
  ) => {
    const updatedCourses = courses.map(course => {
      if (course.id !== courseId) return course;

      const updatedLectures = { ...course.lectures };
      updatedLectures[lectureId] = {
        lectureId,
        note,
        status,
        timestamp: note ? 'Just updated' : undefined,
      };

      const lectureEntries = Object.values(updatedLectures) as LectureReport[];
      const total = lectureEntries.length;
      const completed = lectureEntries.filter(
        l => l.status === 'completed' || (l.note && l.note.trim().length > 0)
      ).length;

      return {
        ...course,
        lectures: updatedLectures,
        totalLectures: total,
        completedLectures: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    saveCoursesToStorage(updatedCourses);
    showToast(`Saved update for ${selectedCourse?.teacher || 'Teacher'} - ${lectureId}`);
  };

  // Handle spreadsheet import
  const handleApplySpreadsheetData = (csvText: string) => {
    try {
      const { courses: parsedCourses, allLectureIds } = parseSpreadsheet(csvText);
      if (parsedCourses.length > 0) {
        setCourses(parsedCourses);
        setLectureList(allLectureIds);
        localStorage.setItem(STORAGE_KEY, csvText);
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

  // Reset to original data
  const handleResetData = () => {
    if (window.confirm('Reset all lecture reports back to the original spreadsheet data?')) {
      localStorage.removeItem(STORAGE_KEY);
      const { courses: fallbackCourses, allLectureIds } = parseSpreadsheet(RAW_SAMPLE_SPREADSHEET);
      setCourses(fallbackCourses);
      setLectureList(allLectureIds);
      setFilters({
        subject: 'all',
        grade: 'all',
        teacher: 'all',
        status: 'all',
        searchQuery: '',
        viewMode: 'report_matrix',
      });
      showToast('Reset dashboard to original spreadsheet data');
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
        totalTeachers={courses.length}
        totalSubjects={availableSubjects.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI & Summary Bar */}
        <StatsBar
          courses={courses}
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
              courses={filteredCourses}
              lectureList={lectureList}
              onSelectLecture={handleSelectLecture}
            />
          )}

          {filters.viewMode === 'teacher_cards' && (
            <TeacherCardsView
              courses={filteredCourses}
              lectureList={lectureList}
              onSelectLecture={handleSelectLecture}
            />
          )}

          {filters.viewMode === 'updates_feed' && (
            <RecentUpdatesFeed
              courses={filteredCourses}
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
