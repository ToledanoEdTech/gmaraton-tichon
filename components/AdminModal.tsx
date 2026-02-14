import React, { useState, useEffect, useMemo } from 'react';
import { Student } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { updateClassBonusInSheet } from '../services/dataManager';
import { X, Check, Lock, Save, AlertTriangle, Search, Sparkles, Users, CheckSquare, Square, Award } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAddPoints: (studentId: string, points: number) => void;
  onAddPointsToMultiple?: (studentIds: string[], points: number) => Promise<void>;
  onExport: () => void;
  onClassBonusUpdated?: () => void | Promise<void>;
}

export const AdminModal: React.FC<Props> = ({ isOpen, onClose, students, onAddPoints, onAddPointsToMultiple, onExport, onClassBonusUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [pointsToAdd, setPointsToAdd] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state for class-based multi-select
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'single' | 'class' | 'bonus'>('class');
  
  const [selectedClassForBonus, setSelectedClassForBonus] = useState<string>("");
  const [classBonusValue, setClassBonusValue] = useState<number | ''>('');

  // Get unique classes
  const classes = useMemo(() => {
    const uniqueClasses = Array.from(new Set(students.map(s => s.grade))).sort();
    return uniqueClasses;
  }, [students]);

  // Get students from selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.grade === selectedClass).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedClass, students]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setSearchQuery("");
        setPointsToAdd('');
        setSelectedStudentId("");
        setSearchResults([]);
        setSelectedStudent(null);
        setIsSearchFocused(false);
        setSuccessMessage("");
        setIsSubmitting(false);
        setIsAuthenticated(false);
        setPasswordInput("");
        setSelectedClass("");
        setSelectedStudentIds(new Set());
        setViewMode('class');
        setSelectedClassForBonus("");
        setClassBonusValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("סיסמא שגויה");
      setPasswordInput("");
    }
  };

  const hasClassAction = selectedStudentIds.size > 0 && typeof pointsToAdd === 'number' && pointsToAdd > 0;
  const hasSingleAction = !!selectedStudentId && typeof pointsToAdd === 'number' && pointsToAdd > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (viewMode === 'class' && !hasClassAction) return;
    if (viewMode === 'single' && !hasSingleAction) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      if (viewMode === 'class' && selectedStudentIds.size > 0) {
        const ids = Array.from(selectedStudentIds);
        const points = typeof pointsToAdd === 'number' && pointsToAdd > 0 ? pointsToAdd : 0;
        if (points > 0 && onAddPointsToMultiple) {
          await onAddPointsToMultiple(ids, points);
        } else if (points > 0) {
          for (const id of ids) await onAddPoints(id, points);
        }
        setSuccessMessage(`✓ ${points} נקודות ל${ids.length} תלמידים`);
        setSelectedStudentIds(new Set());
        setPointsToAdd('');
      } else if (viewMode === 'single' && selectedStudentId) {
        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;
        const points = typeof pointsToAdd === 'number' && pointsToAdd > 0 ? pointsToAdd : 0;
        if (points > 0) await onAddPoints(selectedStudentId, points);
        setSuccessMessage(`✓ ${student.name}: ${points} נקודות`);
        setPointsToAdd('');
        setSelectedStudentId("");
        setSelectedStudent(null);
        setSearchQuery("");
        setSearchResults([]);
      }
      if (onClassBonusUpdated) setTimeout(() => onClassBonusUpdated(), 500);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      alert("שגיאה בעדכון. אנא נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPoints = async (points: number) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      if (viewMode === 'class' && selectedStudentIds.size > 0) {
        // Batch update for multiple students
        if (onAddPointsToMultiple) {
          await onAddPointsToMultiple(Array.from(selectedStudentIds), points);
          setSuccessMessage(`✓ ${points} נקודות נוספו ל${selectedStudentIds.size} תלמידים`);
        } else {
          // Fallback: update one by one
          const ids = Array.from(selectedStudentIds);
          for (const id of ids) {
            await onAddPoints(id, points);
          }
          setSuccessMessage(`✓ ${points} נקודות נוספו ל${ids.length} תלמידים`);
        }
        setSelectedStudentIds(new Set());
      } else if (viewMode === 'single' && selectedStudentId) {
        // Single student update
        await onAddPoints(selectedStudentId, points);
        const student = students.find(s => s.id === selectedStudentId);
        setSuccessMessage(`✓ ${points} נקודות נוספו ל${student?.name || 'התלמיד'}`);
        setSelectedStudentId("");
        setSelectedStudent(null);
        setSearchQuery("");
        setSearchResults([]);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      alert("שגיאה בעדכון הניקוד. אנא נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === classStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(classStudents.map(s => s.id)));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 0) {
      const filtered = students.filter(s =>
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.grade.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setSearchResults(filtered);
      if (filtered.length === 1 && filtered[0].name.toLowerCase() === q.toLowerCase()) {
        setSelectedStudent(filtered[0]);
        setSelectedStudentId(filtered[0].id);
      } else {
        setSelectedStudent(null);
        setSelectedStudentId("");
      }
    } else {
      setSearchResults([]);
      setSelectedStudent(null);
      setSelectedStudentId("");
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSelectedStudentId(student.id);
    setSearchQuery(student.name);
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const handleUpdateClassBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForBonus || typeof classBonusValue !== 'number' || isSubmitting) {
      console.log("[AdminModal] Validation failed:", { selectedClassForBonus, classBonusValue, isSubmitting });
      return;
    }

    console.log("[AdminModal] Starting class bonus update:", { grade: selectedClassForBonus, bonus: classBonusValue });
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const result = await updateClassBonusInSheet(selectedClassForBonus, classBonusValue);
      console.log("[AdminModal] Update result:", result);
      
      if (result.success) {
        const totalText = typeof result.totalBonus === 'number'
          ? ` סה"כ בונוס כיתתי: ${result.totalBonus}`
          : '';
        setSuccessMessage(`✓ נוספו ${classBonusValue} נקודות בונוס לכיתה ${selectedClassForBonus}.${totalText}`);
        setClassBonusValue('');
        setSelectedClassForBonus("");
        // Refresh data - wait a bit to ensure Google Sheets has updated
        setTimeout(() => {
          if (onClassBonusUpdated) {
            console.log("[AdminModal] Refreshing data...");
            onClassBonusUpdated();
          }
        }, 500);
      } else {
        console.error("[AdminModal] Update failed");
        // Error message is already shown in updateClassBonusInSheet
      }
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("[AdminModal] Exception during update:", error);
      alert(`שגיאה בעדכון הבונוס הכיתתי: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-800 p-3 md:p-4 flex justify-between items-center border-b border-slate-700 shrink-0">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-amber-500" />
            ממשק ניהול
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto">
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <Lock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400">אנא הזן סיסמת מנהל לביצוע שינויים</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">סיסמא</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  placeholder="****"
                />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-amber-900/20">
                כניסה למערכת
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              
              {students.length === 0 && (
                  <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      לא נטענו תלמידים. וודא שהחיבור תקין.
                  </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-300 p-3 rounded-lg text-center animate-in slide-in-from-top-2">
                  {successMessage}
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('class')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'class'
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 inline-block mr-2" />
                  עדכון לפי כיתה
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'single'
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4 inline-block mr-2" />
                  עדכון תלמיד בודד
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('bonus')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'bonus'
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-4 h-4 inline-block mr-2" />
                  בונוס כיתתי
                </button>
              </div>

              {/* Add Points Form */}
              {viewMode === 'class' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Class Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">בחר כיתה</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        setSelectedStudentIds(new Set());
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">-- בחר כיתה --</option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Students List with Checkboxes */}
                  {selectedClass && classStudents.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-300">בחר תלמידים</label>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-xs text-amber-500 hover:text-amber-400 font-medium"
                        >
                          {selectedStudentIds.size === classStudents.length ? 'בטל בחירה' : 'בחר הכל'}
                        </button>
                      </div>
                      <div className="bg-slate-950 border border-slate-700 rounded-lg max-h-64 overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {classStudents.map((student) => {
                            const isSelected = selectedStudentIds.has(student.id);
                            return (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => handleToggleStudent(student.id)}
                                className={`w-full text-right p-3 rounded-lg transition-all flex items-center justify-between group ${
                                  isSelected
                                    ? 'bg-amber-500/20 border border-amber-500/50'
                                    : 'hover:bg-slate-800 border border-transparent'
                                }`}
                              >
                                <div className="text-left flex items-center gap-3">
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-amber-500" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-500" />
                                  )}
                                  <div>
                                    <span className="text-lg font-bold text-amber-500">{student.score.toLocaleString()}</span>
                                    <span className="text-xs text-slate-500 block">נקודות</span>
                                  </div>
                                </div>
                                <div className="flex-1 text-right mr-4">
                                  <h3 className={`text-base font-bold transition-colors ${
                                    isSelected ? 'text-amber-300' : 'text-white group-hover:text-amber-400'
                                  }`}>
                                    {student.name}
                                  </h3>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {selectedStudentIds.size > 0 && (
                        <p className="text-sm text-amber-400 text-center">
                          נבחרו {selectedStudentIds.size} תלמידים
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quick Points Buttons */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">לחצנים מהירים</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[10, 20, 30, 50, 100].map((points) => (
                        <button
                          key={points}
                          type="button"
                          onClick={() => handleQuickPoints(points)}
                          disabled={selectedStudentIds.size === 0 || isSubmitting}
                          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all shadow-lg shadow-amber-900/20 text-sm"
                        >
                          {points}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Points Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">נקודות להוספה</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      min="1"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!hasClassAction || isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        מעדכן...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        עדכן ({selectedStudentIds.size} תלמידים)
                      </>
                    )}
                  </button>
                </form>
              ) : viewMode === 'single' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">חפש תלמיד</label>
                    <div className="relative">
                      <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 flex items-center gap-3 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="הקלד שם או כיתה..."
                          className="bg-transparent w-full text-white outline-none"
                          value={searchQuery}
                          onChange={handleSearch}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        />
                      </div>

                      {/* Search Results Dropdown */}
                      {isSearchFocused && searchQuery.length > 0 && searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-amber-500/30 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                          <div className="p-2">
                            {searchResults.map((student) => (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => handleSelectStudent(student)}
                                className="w-full text-right p-3 hover:bg-slate-800 rounded-lg transition-all flex items-center justify-between group"
                              >
                                <div className="text-left">
                                  <span className="text-xl font-bold text-amber-500">{student.score.toLocaleString()}</span>
                                  <span className="text-xs text-slate-500 block">נקודות</span>
                                </div>
                                <div className="flex-1 text-right mr-4">
                                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{student.name}</h3>
                                  <p className="text-slate-400 text-sm">{student.grade}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Student Display */}
                  {selectedStudent ? (
                    <div className="bg-slate-800/50 border border-amber-500/30 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/30">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{selectedStudent.name}</h3>
                            <p className="text-slate-400 text-sm">{selectedStudent.grade}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-3xl font-black text-amber-500">{selectedStudent.score.toLocaleString()}</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">נקודות</span>
                        </div>
                      </div>
                    </div>
                  ) : searchQuery.length > 0 && searchResults.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 text-center">
                      <p className="text-slate-400">לא נמצאו תלמידים התואמים לחיפוש</p>
                    </div>
                  ) : null}

                  {/* Quick Points Buttons */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">לחצנים מהירים</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[10, 20, 30, 50, 100].map((points) => (
                        <button
                          key={points}
                          type="button"
                          onClick={() => handleQuickPoints(points)}
                          disabled={!selectedStudentId || isSubmitting}
                          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all shadow-lg shadow-amber-900/20 text-sm"
                        >
                          {points}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">נקודות להוספה</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      min="1"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!hasSingleAction || isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        מעדכן...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        עדכן
                      </>
                    )}
                  </button>
                </form>
              ) : viewMode === 'bonus' ? (
                <form onSubmit={handleUpdateClassBonus} className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-amber-300 mb-2">
                      <Award className="w-5 h-5" />
                      <span className="font-bold">בונוס כיתתי</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      הוסף בונוס נקודות לכיתה שלמה. הבונוס יתווסף לניקוד הכיתתי הכולל ולא יופיע כניקוד פרטני של תלמידים.
                    </p>
                  </div>

                  {/* Class Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">בחר כיתה</label>
                    <select
                      value={selectedClassForBonus}
                      onChange={(e) => setSelectedClassForBonus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">-- בחר כיתה --</option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bonus Value Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">מספר נקודות בונוס</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500"
                      value={classBonusValue}
                      onChange={(e) => setClassBonusValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      required
                      min="0"
                    />
                    <p className="text-xs text-slate-500">
                      הערה: זה יחליף את הבונוס הקיים. להגדלת הבונוס, הזן את הסכום הכולל הרצוי.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedClassForBonus || !classBonusValue || isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        מעדכן...
                      </>
                    ) : (
                      <>
                        <Award className="w-5 h-5" />
                        עדכן בונוס כיתתי
                      </>
                    )}
                  </button>
                </form>
              ) : null}

              <div className="pt-4 border-t border-slate-700">
                <button
                  onClick={onExport}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-5 h-5" />
                  ייצוא נתונים לאקסל
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
