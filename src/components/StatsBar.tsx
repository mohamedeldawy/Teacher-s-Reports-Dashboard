import React from 'react';
import { BookOpen, Users, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { TeacherCourse, LectureReport } from '../types';

interface StatsBarProps {
  courses: TeacherCourse[];
  filteredCourses: TeacherCourse[];
  onQuickFilterStatus?: (status: 'all' | 'has_report' | 'pending' | 'issue') => void;
  activeStatusFilter: 'all' | 'has_report' | 'pending' | 'issue';
}

export const StatsBar: React.FC<StatsBarProps> = ({
  courses,
  filteredCourses,
  onQuickFilterStatus,
  activeStatusFilter,
}) => {
  // Aggregate stats across filtered courses
  let totalLectures = 0;
  let completedLectures = 0;
  let issueLectures = 0;

  filteredCourses.forEach(course => {
    const lectureList = Object.values(course.lectures) as LectureReport[];
    totalLectures += lectureList.length;
    lectureList.forEach(l => {
      if (l.status === 'completed' || (l.note && l.note.trim().length > 0)) {
        completedLectures++;
      }
      if (l.status === 'issue') {
        issueLectures++;
      }
    });
  });

  const pendingLectures = Math.max(0, totalLectures - completedLectures);
  const overallRate = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  const uniqueSubjects = new Set(filteredCourses.map(c => c.subjectCategory)).size;
  const uniqueTeachers = new Set(filteredCourses.map(c => c.teacher)).size;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Subject & Teachers */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Teachers Tracked</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-slate-900">{uniqueTeachers}</span>
            <span className="text-xs text-slate-400">in {uniqueSubjects} subjects</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Total Scheduled Lectures */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Total Lectures</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-slate-900">{totalLectures}</span>
            <span className="text-xs text-slate-400">across sections</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
      </div>

      {/* Completed / Reports Submitted */}
      <button
        id="stat-card-completed"
        onClick={() => onQuickFilterStatus && onQuickFilterStatus(activeStatusFilter === 'has_report' ? 'all' : 'has_report')}
        className={`text-left rounded-xl p-3.5 border transition cursor-pointer ${
          activeStatusFilter === 'has_report'
            ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
            : 'bg-white border-slate-200 hover:border-emerald-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
              <span>Updated & Reported</span>
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-emerald-800">{completedLectures}</span>
              <span className="text-xs font-medium text-emerald-600">({overallRate}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </button>

      {/* Pending Reports */}
      <button
        id="stat-card-pending"
        onClick={() => onQuickFilterStatus && onQuickFilterStatus(activeStatusFilter === 'pending' ? 'all' : 'pending')}
        className={`text-left rounded-xl p-3.5 border transition cursor-pointer ${
          activeStatusFilter === 'pending'
            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
            : 'bg-white border-slate-200 hover:border-amber-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-700">Pending Updates</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-amber-800">{pendingLectures}</span>
              <span className="text-xs text-amber-600">to report</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </button>

      {/* Progress & Completion Rate */}
      <div className="col-span-2 sm:col-span-1 bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium text-slate-500">Reporting Rate</p>
          <span className="text-xs font-bold text-slate-800">{overallRate}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, overallRate)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
          <span>{completedLectures} done</span>
          <span>{pendingLectures} pending</span>
        </div>
      </div>
    </div>
  );
};
