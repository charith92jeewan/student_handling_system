"use client";

import { useState, useEffect, useCallback } from "react";
import {
  checkHealth,
  // Courses & Modules
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseModules,
  addCourseModule,
  updateCourseModule,
  deleteCourseModule,
  // Students
  getStudents,
  searchStudents,
  registerStudent,
  updateStudent,
  deleteStudent,
  // Enrolment
  getEnrollments,
  enrollStudent,
  deleteEnrollment,
  // Attendance
  markAttendance,
  getAttendanceByCourseAndDate,
  getStudentAttendanceSummary,
  API_BASE_URL,
} from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState("students");

  // Health / connectivity
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Global feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Primary data lists
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  // ================= Students State =================
  const [searchQuery, setSearchQuery] = useState("");
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    nic: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
  });
  const [editingStudentId, setEditingStudentId] = useState(null);

  // ================= Courses State =================
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    level: "HND",
    duration: "2 Years",
    fee: "",
  });
  const [editingCourseId, setEditingCourseId] = useState(null);

  // Course Modules & Course Contents State
  const [selectedCourseForModules, setSelectedCourseForModules] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    moduleCode: "",
    name: "",
    description: "",
    gpCredits: 3.0,
    semester: "Semester 1",
    orderIndex: 1,
  });
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [semesterFilter, setSemesterFilter] = useState("ALL");

  // ================= Enrolment State =================
  const [enrollForm, setEnrollForm] = useState({
    studentId: "",
    courseId: "",
    batch: "Batch 01",
  });

  // ================= Attendance Mark State =================
  const [attCourseId, setAttCourseId] = useState("");
  const [attDate, setAttDate] = useState("");
  const [attRecords, setAttRecords] = useState([]); // [{ enrollmentId, studentName, studentNumber, status: "PRESENT"|"ABSENT" }]
  const [attLoading, setAttLoading] = useState(false);

  // ================= Attendance View State =================
  const [viewStudentId, setViewStudentId] = useState("");
  const [studentSummary, setStudentSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ---------------- Fetch initial data ----------------
  const ping = useCallback(async () => {
    setHealthLoading(true);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stList, cList, enList] = await Promise.all([
        getStudents(),
        getCourses(),
        getEnrollments(),
      ]);
      setStudents(stList);
      setCourses(cList);
      setEnrollments(enList);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set default date to today YYYY-MM-DD
    setAttDate(new Date().toISOString().split("T")[0]);
    ping();
    refreshAll();
  }, [ping, refreshAll]);

  // ---------------- Student Handlers ----------------
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const payload = {
        ...studentForm,
        dateOfBirth: studentForm.dateOfBirth || null,
      };

      if (editingStudentId) {
        await updateStudent(editingStudentId, payload);
        setSuccessMsg("Student updated successfully!");
        setEditingStudentId(null);
      } else {
        const created = await registerStudent(payload);
        setSuccessMsg(`Student registered with Student No: ${created.studentNumber}`);
      }

      setStudentForm({
        firstName: "",
        lastName: "",
        nic: "",
        email: "",
        phone: "",
        address: "",
        dateOfBirth: "",
      });
      await refreshAll();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (st) => {
    setEditingStudentId(st.id);
    setStudentForm({
      firstName: st.firstName || "",
      lastName: st.lastName || "",
      nic: st.nic || "",
      email: st.email || "",
      phone: st.phone || "",
      address: st.address || "",
      dateOfBirth: st.dateOfBirth || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteStudent = async (id) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await deleteStudent(id);
      setSuccessMsg("Student deleted successfully.");
      await refreshAll();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSearch = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const pageData = await searchStudents(searchQuery);
      setStudents(pageData.content || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Course Handlers ----------------
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const payload = {
        ...courseForm,
        fee: courseForm.fee ? parseFloat(courseForm.fee) : 0,
        active: true,
      };

      if (editingCourseId) {
        await updateCourse(editingCourseId, payload);
        setSuccessMsg("Course updated successfully!");
        setEditingCourseId(null);
      } else {
        const created = await createCourse(payload);
        setSuccessMsg(`Course '${created.name}' (${created.code}) added!`);
      }

      setCourseForm({ code: "", name: "", level: "HND", duration: "2 Years", fee: "" });
      await refreshAll();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (c) => {
    setEditingCourseId(c.id);
    setCourseForm({
      code: c.code,
      name: c.name,
      level: c.level,
      duration: c.duration,
      fee: c.fee ? String(c.fee) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await deleteCourse(id);
      setSuccessMsg("Course deleted successfully.");
      if (selectedCourseForModules?.id === id) {
        setSelectedCourseForModules(null);
        setCourseModules([]);
      }
      await refreshAll();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Course Modules & Contents Handlers ----------------
  const handleSelectCourseModules = async (course) => {
    if (selectedCourseForModules?.id === course.id) {
      setSelectedCourseForModules(null);
      setCourseModules([]);
      return;
    }
    setSelectedCourseForModules(course);
    setEditingModuleId(null);
    setModuleForm({
      moduleCode: "",
      name: "",
      description: "",
      gpCredits: 3.0,
      semester: "Semester 1",
      orderIndex: (course.modules?.length || 0) + 1,
    });
    setModulesLoading(true);
    try {
      const data = await getCourseModules(course.id);
      setCourseModules(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForModules) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const payload = {
        moduleCode: moduleForm.moduleCode.trim(),
        name: moduleForm.name.trim(),
        description: moduleForm.description ? moduleForm.description.trim() : "",
        gpCredits: parseFloat(moduleForm.gpCredits) || 3.0,
        semester: moduleForm.semester,
        orderIndex: parseInt(moduleForm.orderIndex, 10) || 1,
      };

      if (editingModuleId) {
        await updateCourseModule(selectedCourseForModules.id, editingModuleId, payload);
        setSuccessMsg(`Module '${payload.name}' updated successfully!`);
        setEditingModuleId(null);
      } else {
        const created = await addCourseModule(selectedCourseForModules.id, payload);
        setSuccessMsg(`Module '${created.name}' (${created.moduleCode}) added with ${created.gpCredits} GP Credits!`);
      }

      setModuleForm({
        moduleCode: "",
        name: "",
        description: "",
        gpCredits: 3.0,
        semester: "Semester 1",
        orderIndex: courseModules.length + 1,
      });

      const updatedModules = await getCourseModules(selectedCourseForModules.id);
      setCourseModules(updatedModules);
      await refreshAll();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (mod) => {
    setEditingModuleId(mod.id);
    setModuleForm({
      moduleCode: mod.moduleCode,
      name: mod.name,
      description: mod.description || "",
      gpCredits: mod.gpCredits != null ? mod.gpCredits : 3.0,
      semester: mod.semester || "Semester 1",
      orderIndex: mod.orderIndex != null ? mod.orderIndex : 1,
    });
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    if (!selectedCourseForModules) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await deleteCourseModule(selectedCourseForModules.id, moduleId);
      setSuccessMsg("Module deleted successfully.");
      const updatedModules = await getCourseModules(selectedCourseForModules.id);
      setCourseModules(updatedModules);
      await refreshAll();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Enrolment Handlers ----------------
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollForm.studentId || !enrollForm.courseId) {
      setErrorMsg("Please select both a student and a course.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const created = await enrollStudent({
        studentId: Number(enrollForm.studentId),
        courseId: Number(enrollForm.courseId),
        batch: enrollForm.batch,
      });
      setSuccessMsg(`Enrolled ${created.studentName} into ${created.courseName} (${created.batch})!`);
      setEnrollForm({ studentId: "", courseId: "", batch: "Batch 01" });
      await refreshAll();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async (id) => {
    if (!confirm("Are you sure you want to remove this enrolment?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await deleteEnrollment(id);
      setSuccessMsg("Enrolment removed.");
      await refreshAll();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Attendance Mark Handlers ----------------
  const loadClassForAttendance = async () => {
    if (!attCourseId) {
      setErrorMsg("Please choose a course first.");
      return;
    }
    setErrorMsg("");
    setAttLoading(true);
    try {
      const enrolled = await getEnrollments(Number(attCourseId));
      if (enrolled.length === 0) {
        setErrorMsg("No students are enrolled in this course yet. Please enrol students in the Enrolment section first.");
        setAttRecords([]);
        return;
      }

      const existing = await getAttendanceByCourseAndDate(Number(attCourseId), attDate);
      const existingMap = new Map();
      existing.forEach((a) => existingMap.set(a.enrollmentId, a.status));

      const initial = enrolled.map((e) => ({
        enrollmentId: e.id,
        studentName: e.studentName,
        studentNumber: e.studentNumber,
        status: existingMap.get(e.id) || "PRESENT",
      }));
      setAttRecords(initial);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAttLoading(false);
    }
  };

  const toggleStatus = (idx, status) => {
    setAttRecords((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], status };
      return copy;
    });
  };

  const handleSaveAttendance = async () => {
    if (attRecords.length === 0) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await markAttendance({
        attendanceDate: attDate,
        records: attRecords.map((r) => ({
          enrollmentId: r.enrollmentId,
          status: r.status,
        })),
      });
      setSuccessMsg(`Attendance saved for ${attDate} (${attRecords.length} students).`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Attendance View Handlers ----------------
  const handleLoadStudentAttendance = async (studentIdToLoad) => {
    const id = studentIdToLoad || viewStudentId;
    if (!id) {
      setErrorMsg("Please select a student.");
      return;
    }
    setErrorMsg("");
    setSummaryLoading(true);
    try {
      const summary = await getStudentAttendanceSummary(Number(id));
      setStudentSummary(summary);
    } catch (err) {
      setErrorMsg(err.message);
      setStudentSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans relative overflow-x-hidden">
      {/* ============================================================== */}
      {/* BACKGROUND WATERMARK (Repeated & Centered Diagonal)            */}
      {/* ============================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.03] select-none"
      >
        <div className="transform -rotate-12 space-y-24 text-center">
          <div className="text-6xl sm:text-8xl md:text-9xl font-black tracking-widest uppercase text-white whitespace-nowrap">
            powered by charithj
          </div>
          <div className="text-6xl sm:text-8xl md:text-9xl font-black tracking-widest uppercase text-cyan-400 whitespace-nowrap">
            powered by charithj
          </div>
          <div className="text-6xl sm:text-8xl md:text-9xl font-black tracking-widest uppercase text-purple-400 whitespace-nowrap">
            powered by charithj
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FLOATING CORNER WATERMARK BADGE                                */}
      {/* ============================================================== */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 shadow-xl shadow-cyan-500/20 backdrop-blur-md text-xs group hover:border-cyan-400 transition-all">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-slate-400 font-medium">powered by</span>
          <span className="font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:brightness-125 transition-all">
            charithj
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HEADER NAVBAR                                                  */}
      {/* ============================================================== */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-cyan-500/30 border border-cyan-300/30">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-tight">
                  Applebay Institute
                </h1>
                <span className="text-3xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 tracking-wider">
                  Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Student Handling System</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-medium">
                  powered by charithj
                </span>
              </p>
            </div>
          </div>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { ping(); refreshAll(); }}
              disabled={healthLoading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-700 bg-slate-900/90 text-slate-200 hover:border-slate-500 hover:bg-slate-800 transition-all shadow-inner"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  health
                    ? "bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"
                    : healthLoading
                    ? "bg-amber-400 animate-ping"
                    : "bg-rose-500 shadow-sm shadow-rose-500"
                }`}
              />
              <span className="text-xs">
                {health ? "Backend & DB Connected" : "Backend Offline"}
              </span>
              <span className="text-slate-500 hover:text-white transition-colors">↻</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTAINER                                                 */}
      {/* ============================================================== */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Alerts */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 rounded-xl text-xs flex justify-between items-center shadow-lg shadow-emerald-950/40 backdrop-blur-md animate-in fade-in">
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</span>
              <span>{successMsg}</span>
            </span>
            <button onClick={() => setSuccessMsg("")} className="font-bold text-emerald-400 hover:text-white transition-colors px-1">✕</button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-950/70 border border-rose-500/60 text-rose-200 rounded-xl text-xs flex justify-between items-center shadow-lg shadow-rose-950/40 backdrop-blur-md animate-in fade-in">
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">⚠</span>
              <span>{errorMsg}</span>
            </span>
            <button onClick={() => setErrorMsg("")} className="font-bold text-rose-400 hover:text-white transition-colors px-1">✕</button>
          </div>
        )}

        {/* Tab Navigation Pill Bar */}
        <nav className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap gap-1.5 text-xs font-semibold backdrop-blur-xl shadow-xl shadow-black/50">
          <button
            onClick={() => { setActiveTab("students"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`px-4 py-2 rounded-xl transition-all font-bold ${
              activeTab === "students"
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => { setActiveTab("courses"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`px-4 py-2 rounded-xl transition-all font-bold ${
              activeTab === "courses"
                ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 text-white shadow-lg shadow-purple-500/25 scale-[1.02]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => { setActiveTab("enrolment"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`px-4 py-2 rounded-xl transition-all font-bold ${
              activeTab === "enrolment"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25 scale-[1.02]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Enrolment ({enrollments.length})
          </button>
          <button
            onClick={() => { setActiveTab("markAttendance"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`px-4 py-2 rounded-xl transition-all font-bold ${
              activeTab === "markAttendance"
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => { setActiveTab("viewAttendance"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`px-4 py-2 rounded-xl transition-all font-bold ${
              activeTab === "viewAttendance"
                ? "bg-gradient-to-r from-pink-600 via-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/25 scale-[1.02]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Student Attendance & Summary
          </button>
        </nav>

        {/* ============================================================== */}
        {/* TAB 1: STUDENTS (Registration, Search, CRUD)                   */}
        {/* ============================================================== */}
        {activeTab === "students" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Student Registration Form */}
            <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/40 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                    {editingStudentId ? "Edit Student" : "Register Student"}
                  </h3>
                  <p className="text-3xs text-slate-400">Create new student records in PostgreSQL</p>
                </div>
                {editingStudentId && (
                  <button
                    onClick={() => {
                      setEditingStudentId(null);
                      setStudentForm({ firstName: "", lastName: "", nic: "", email: "", phone: "", address: "", dateOfBirth: "" });
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                    placeholder="Kasun"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                    placeholder="Perera"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">NIC *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.nic}
                    onChange={(e) => setStudentForm({ ...studentForm, nic: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                    placeholder="200112304567"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                    placeholder="kasun.p@gmail.com"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                    placeholder="0771234567"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Address</label>
                  <input
                    type="text"
                    value={studentForm.address}
                    onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                    placeholder="Colombo, Sri Lanka"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={studentForm.dateOfBirth}
                    onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-3 py-2.5 text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/30"
                >
                  {loading ? "Saving..." : editingStudentId ? "Update Student" : "Register Student"}
                </button>
              </form>
            </div>

            {/* Student Directory Table & Search */}
            <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                    Student Directory
                  </h3>
                  <p className="text-3xs text-slate-400">Total {students.length} registered students</p>
                </div>

                {/* Search Box */}
                <form onSubmit={handleStudentSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, NIC, No..."
                    className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none w-48 transition-all"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1.5 text-xs text-white font-semibold hover:brightness-110 shadow-xs"
                  >
                    Search
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); refreshAll(); }}
                      className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="py-2.5 px-3">Student No</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">NIC</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.length > 0 ? (
                      students.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                            {st.studentNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {st.firstName} {st.lastName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-mono text-2xs">{st.nic}</td>
                          <td className="py-2.5 px-3 text-slate-300">{st.email}</td>
                          <td className="py-2.5 px-3 text-slate-400">{st.phone || "-"}</td>
                          <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleEditStudent(st)}
                              className="px-2.5 py-1 rounded-md border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 font-semibold transition-all text-2xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st.id)}
                              className="px-2.5 py-1 rounded-md border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 font-semibold transition-all text-2xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          {loading ? "Loading student records..." : "No students found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: COURSES (CRUD + COURSE CONTENTS + GP CREDIT LEVELS)     */}
        {/* ============================================================== */}
        {activeTab === "courses" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add / Update Course Form */}
              <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/40 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                      {editingCourseId ? "Edit Course" : "Add Course"}
                    </h3>
                    <p className="text-3xs text-slate-400">Define academic qualifications</p>
                  </div>
                  {editingCourseId && (
                    <button
                      onClick={() => {
                        setEditingCourseId(null);
                        setCourseForm({ code: "", name: "", level: "HND", duration: "2 Years", fee: "" });
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleCourseSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Course Code *</label>
                    <input
                      type="text"
                      required
                      value={courseForm.code}
                      onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                      placeholder="e.g. HND-IT"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Course Name *</label>
                    <input
                      type="text"
                      required
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                      placeholder="e.g. Higher National Diploma in IT"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Level *</label>
                    <select
                      value={courseForm.level}
                      onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                    >
                      <option value="HND">HND</option>
                      <option value="Certificate">Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Duration *</label>
                    <input
                      type="text"
                      required
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                      placeholder="e.g. 2 Years / 6 Months"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Fee (LKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={courseForm.fee}
                      onChange={(e) => setCourseForm({ ...courseForm, fee: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all font-mono"
                      placeholder="350000.00"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-3 py-2.5 text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-purple-600/30"
                  >
                    {loading ? "Saving..." : editingCourseId ? "Update Course" : "Save Course"}
                  </button>
                </form>
              </div>

              {/* Courses Table */}
              <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-fuchsia-400"></span>
                      View Courses
                    </h3>
                    <p className="text-3xs text-slate-400">
                      Click <span className="font-semibold text-purple-400">Course Contents & GP</span> to view syllabus and credit breakdown
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-2xs">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Level</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">GP Credits</th>
                        <th className="py-2.5 px-3">Modules</th>
                        <th className="py-2.5 px-3">Fee</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {courses.length > 0 ? (
                        courses.map((c) => {
                          const isSelected = selectedCourseForModules?.id === c.id;
                          return (
                            <tr
                              key={c.id}
                              className={`transition-colors ${
                                isSelected
                                  ? "bg-purple-950/40 border-l-2 border-purple-500"
                                  : "hover:bg-slate-800/40"
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold text-purple-400">
                                {c.code}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-white">{c.name}</td>
                              <td className="py-2.5 px-3 text-slate-300">{c.level}</td>
                              <td className="py-2.5 px-3 text-slate-400">{c.duration}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 shadow-xs">
                                  ★ {c.totalGpCredits != null ? `${c.totalGpCredits.toFixed(1)} GP` : "0.0 GP"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-800 text-purple-300 border border-slate-700">
                                  {c.moduleCount || 0} modules
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-300 font-mono text-2xs whitespace-nowrap">
                                {c.fee ? `LKR ${Number(c.fee).toLocaleString()}` : "-"}
                              </td>
                              <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleSelectCourseModules(c)}
                                  className={`px-3 py-1 rounded-md text-2xs font-bold transition-all border ${
                                    isSelected
                                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-md shadow-purple-600/30"
                                      : "bg-purple-950/50 border-purple-500/40 text-purple-300 hover:bg-purple-900/60"
                                  }`}
                                  title="View and edit course contents and GP credits"
                                >
                                  {isSelected ? "Hide Contents ✕" : "Course Contents & GP"}
                                </button>
                                <button
                                  onClick={() => handleEditCourse(c)}
                                  className="px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold transition-all text-2xs"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(c.id)}
                                  className="px-2.5 py-1 rounded-md border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 font-semibold transition-all text-2xs"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            {loading ? "Loading courses..." : "No courses found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Course Contents & GP Credits Management Panel */}
            {selectedCourseForModules && (
              <div className="bg-slate-900/90 rounded-2xl border-2 border-purple-500/60 p-6 shadow-2xl shadow-purple-950/60 backdrop-blur-2xl space-y-5 animate-in fade-in duration-200">
                {/* Course Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-purple-950 text-purple-300 border border-purple-500/40">
                        {selectedCourseForModules.code}
                      </span>
                      <span className="px-2 py-0.5 rounded text-2xs font-medium bg-slate-800 text-slate-300">
                        {selectedCourseForModules.level} • {selectedCourseForModules.duration}
                      </span>
                      <span className="text-3xs text-slate-400 font-mono">
                        powered by charithj
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">
                      {selectedCourseForModules.name} — Course Contents & Modules
                    </h2>
                    <p className="text-xs text-slate-400">
                      Curriculum syllabus breakdown and Grade Point (GP) credit value allocation for each module.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-4 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-right shadow-inner">
                      <div className="text-3xs uppercase tracking-wider text-emerald-400 font-extrabold">Total GP Credits</div>
                      <div className="text-base font-black text-emerald-300">
                        ★ {courseModules.reduce((acc, m) => acc + (m.gpCredits || 0), 0).toFixed(1)} GP
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-purple-950/70 border border-purple-500/40 text-right shadow-inner">
                      <div className="text-3xs uppercase tracking-wider text-purple-400 font-extrabold">Total Modules</div>
                      <div className="text-base font-black text-purple-300">
                        {courseModules.length} Modules
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCourseForModules(null)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
                    >
                      Close ✕
                    </button>
                  </div>
                </div>

                {/* Sub-grid: Modules List (2 cols) & Add/Edit Module Form (1 col) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Modules List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Course Modules & Syllabus Outline ({courseModules.length})
                      </h4>
                      {/* Semester Filter Pills */}
                      <div className="flex items-center gap-1.5 text-2xs">
                        {["ALL", "Semester 1", "Semester 2"].map((sem) => (
                          <button
                            key={sem}
                            onClick={() => setSemesterFilter(sem)}
                            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                              semesterFilter === sem
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {sem}
                          </button>
                        ))}
                      </div>
                    </div>

                    {modulesLoading ? (
                      <div className="py-12 text-center text-slate-500 text-xs">Loading course modules...</div>
                    ) : courseModules.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                        No course modules added yet for this course. Use the form on the right to add the first module with its GP credit level.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {courseModules
                          .filter((m) => semesterFilter === "ALL" || m.semester === semesterFilter)
                          .map((m) => {
                            const isBeingEdited = editingModuleId === m.id;
                            return (
                              <div
                                key={m.id}
                                className={`p-4 rounded-xl border transition-all ${
                                  isBeingEdited
                                    ? "border-purple-400 bg-purple-950/30 shadow-lg shadow-purple-950/40"
                                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60 shadow-md"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <span className="mt-0.5 inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs">
                                      {m.moduleCode}
                                    </span>
                                    <div>
                                      <h5 className="text-sm font-bold text-white leading-snug">
                                        {m.name}
                                      </h5>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                                          ★ {m.gpCredits != null ? `${m.gpCredits.toFixed(1)} GP Credits` : "3.0 GP Credits"}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-2xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                          {m.semester || "Semester 1"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    <button
                                      onClick={() => handleEditModule(m)}
                                      className="px-2.5 py-1 rounded-md text-2xs font-semibold border border-purple-500/40 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteModule(m.id)}
                                      className="px-2.5 py-1 rounded-md text-2xs font-semibold border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {/* Syllabus / Course Content Description */}
                                <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
                                  <span className="font-semibold text-purple-300 block mb-0.5 text-2xs uppercase tracking-wide">
                                    Course Content / Syllabus Outline:
                                  </span>
                                  <p className="whitespace-pre-line text-slate-300">
                                    {m.description || "No detailed syllabus content provided."}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Right: Add / Edit Module Form */}
                  <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {editingModuleId ? "Edit Module & GP Credits" : "Add Module to Course"}
                        </h4>
                        <p className="text-3xs text-purple-400 font-mono">Course: {selectedCourseForModules.code}</p>
                      </div>
                      {editingModuleId && (
                        <button
                          onClick={() => {
                            setEditingModuleId(null);
                            setModuleForm({
                              moduleCode: "",
                              name: "",
                              description: "",
                              gpCredits: 3.0,
                              semester: "Semester 1",
                              orderIndex: courseModules.length + 1,
                            });
                          }}
                          className="text-2xs text-rose-400 hover:text-rose-300 underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleModuleSubmit} className="space-y-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">Module Code *</label>
                        <input
                          type="text"
                          required
                          value={moduleForm.moduleCode}
                          onChange={(e) => setModuleForm({ ...moduleForm, moduleCode: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition-all"
                          placeholder="e.g. IT101 / CS201"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">Module Name *</label>
                        <input
                          type="text"
                          required
                          value={moduleForm.name}
                          onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition-all"
                          placeholder="e.g. Full-Stack Web Development"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold text-slate-300 block mb-1">
                            GP Credit Level *
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="30"
                            required
                            value={moduleForm.gpCredits}
                            onChange={(e) => setModuleForm({ ...moduleForm, gpCredits: e.target.value })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-bold text-emerald-400 focus:border-emerald-400 focus:outline-none transition-all"
                            placeholder="3.0"
                          />
                          <span className="text-3xs text-slate-500">e.g. 2.0, 3.0, 4.0</span>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-300 block mb-1">Semester *</label>
                          <select
                            value={moduleForm.semester}
                            onChange={(e) => setModuleForm({ ...moduleForm, semester: e.target.value })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:border-purple-400 focus:outline-none text-xs transition-all"
                          >
                            <option value="Semester 1">Semester 1</option>
                            <option value="Semester 2">Semester 2</option>
                            <option value="Semester 3">Semester 3</option>
                            <option value="Semester 4">Semester 4</option>
                            <option value="Year 1">Year 1</option>
                            <option value="Year 2">Year 2</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">
                          Course Content / Syllabus Outline
                        </label>
                        <textarea
                          rows={4}
                          value={moduleForm.description}
                          onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none text-xs leading-relaxed transition-all"
                          placeholder="Outline key syllabus modules, topics, lab assignments, or practical work..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-3 py-2.5 text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/30"
                      >
                        {loading
                          ? "Saving..."
                          : editingModuleId
                          ? "Update Module & GP Credits"
                          : "Save Module & Content"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ENROLMENT (Enrol Student in Course)                      */}
        {/* ============================================================== */}
        {activeTab === "enrolment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Enrol Form */}
            <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/40 space-y-4">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  Enrol a Student in a Course
                </h3>
                <p className="text-3xs text-slate-400">Links an existing registered student to a course.</p>
              </div>

              <form onSubmit={handleEnrollSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Select Student *</label>
                  <select
                    required
                    value={enrollForm.studentId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all"
                  >
                    <option value="">-- Choose a Student --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.studentNumber} — {st.firstName} {st.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Select Course *</label>
                  <select
                    required
                    value={enrollForm.courseId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all"
                  >
                    <option value="">-- Choose a Course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name} ({c.totalGpCredits != null ? c.totalGpCredits.toFixed(1) : 0} GP)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Batch / Group</label>
                  <input
                    type="text"
                    value={enrollForm.batch}
                    onChange={(e) => setEnrollForm({ ...enrollForm, batch: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all"
                    placeholder="Batch 01"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-3 py-2.5 text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/30"
                >
                  {loading ? "Enrolling..." : "Enrol Student"}
                </button>
              </form>
            </div>

            {/* Active Enrolments Table */}
            <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                    Active Enrolments
                  </h3>
                  <p className="text-3xs text-slate-400">Total {enrollments.length} enrolled student records</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Batch</th>
                      <th className="py-2.5 px-3">Enrolled On</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {enrollments.length > 0 ? (
                      enrollments.map((en) => (
                        <tr key={en.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">{en.studentName}</div>
                            <div className="font-mono text-cyan-400 text-2xs">{en.studentNumber}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-purple-400 text-2xs block">{en.courseCode}</span>
                            <span className="text-slate-300">{en.courseName}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-2xs font-medium bg-slate-800 text-amber-300 border border-slate-700">
                              {en.batch}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-2xs">{en.enrollmentDate}</td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteEnrollment(en.id)}
                              className="px-2.5 py-1 rounded-md border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 font-semibold transition-all text-2xs"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          {loading ? "Loading enrolments..." : "No active enrolments yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: MARK ATTENDANCE (Present / Absent)                       */}
        {/* ============================================================== */}
        {activeTab === "markAttendance" && (
          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/40 space-y-4 animate-in fade-in duration-200">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Mark Attendance for Students of a Course
              </h3>
              <p className="text-xs text-slate-400">
                Pick a course and date, then mark each enrolled student as Present or Absent.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Course *</label>
                <select
                  value={attCourseId}
                  onChange={(e) => setAttCourseId(e.target.value)}
                  className="rounded-lg border border-slate-700 px-3 py-2 bg-slate-900 text-white focus:border-emerald-400 focus:outline-none min-w-[240px]"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name} ({c.totalGpCredits != null ? c.totalGpCredits.toFixed(1) : 0} GP)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="rounded-lg border border-slate-700 px-3 py-2 bg-slate-900 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={loadClassForAttendance}
                disabled={attLoading || !attCourseId}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-white font-bold hover:brightness-110 disabled:opacity-50 shadow-md shadow-emerald-600/30 transition-all"
              >
                {attLoading ? "Loading Class..." : "Load Students"}
              </button>
            </div>

            {/* Students List for Attendance */}
            {attRecords.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wide">
                    Enrolled Students ({attRecords.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAttRecords((prev) => prev.map((r) => ({ ...r, status: "PRESENT" })))}
                      className="px-2.5 py-1 rounded-md text-2xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
                    >
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttRecords((prev) => prev.map((r) => ({ ...r, status: "ABSENT" })))}
                      className="px-2.5 py-1 rounded-md text-2xs font-semibold bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60"
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-2xs">
                      <tr>
                        <th className="py-2.5 px-3">Student Number</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3 text-right">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {attRecords.map((rec, idx) => (
                        <tr key={rec.enrollmentId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                            {rec.studentNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">{rec.studentName}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                              <button
                                type="button"
                                onClick={() => toggleStatus(idx, "PRESENT")}
                                className={`px-3 py-1 font-bold transition-all ${
                                  rec.status === "PRESENT"
                                    ? "bg-emerald-600 text-white shadow-inner"
                                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStatus(idx, "ABSENT")}
                                className={`px-3 py-1 font-bold transition-all border-l border-slate-700 ${
                                  rec.status === "ABSENT"
                                    ? "bg-rose-600 text-white shadow-inner"
                                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={loading}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-white font-bold hover:brightness-110 disabled:opacity-50 text-xs shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {loading ? "Saving to Database..." : "Save Attendance to Database"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: VIEW ATTENDANCE & PERCENTAGE                            */}
        {/* ============================================================== */}
        {activeTab === "viewAttendance" && (
          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-800 shadow-xl shadow-black/40 space-y-5 animate-in fade-in duration-200">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-pink-400"></span>
                View Attendance Records & Percentage of a Student
              </h3>
              <p className="text-xs text-slate-400">
                Calculates total sessions, present count, absent count, and attendance %.
              </p>
            </div>

            {/* Student Picker */}
            <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
              <div className="flex-1 min-w-[240px]">
                <label className="block font-semibold text-slate-300 mb-1">Select Student *</label>
                <select
                  value={viewStudentId}
                  onChange={(e) => {
                    setViewStudentId(e.target.value);
                    if (e.target.value) handleLoadStudentAttendance(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-700 px-3 py-2 bg-slate-900 text-white focus:border-pink-400 focus:outline-none"
                >
                  <option value="">-- Choose a Student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.studentNumber} — {st.firstName} {st.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleLoadStudentAttendance()}
                disabled={summaryLoading || !viewStudentId}
                className="rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2 text-white font-bold hover:brightness-110 disabled:opacity-50 shadow-md shadow-pink-600/30 transition-all"
              >
                {summaryLoading ? "Calculating..." : "Calculate & View"}
              </button>
            </div>

            {/* Attendance Summary Cards & Table */}
            {studentSummary && (
              <div className="space-y-5 pt-2">
                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl shadow-inner">
                    <div className="text-slate-400 text-3xs uppercase font-extrabold tracking-wider">Total Sessions</div>
                    <div className="text-2xl font-black text-white mt-1">{studentSummary.totalSessions}</div>
                  </div>
                  <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl shadow-inner">
                    <div className="text-emerald-400 text-3xs uppercase font-extrabold tracking-wider">Present</div>
                    <div className="text-2xl font-black text-emerald-300 mt-1">{studentSummary.presentCount}</div>
                  </div>
                  <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl shadow-inner">
                    <div className="text-rose-400 text-3xs uppercase font-extrabold tracking-wider">Absent</div>
                    <div className="text-2xl font-black text-rose-300 mt-1">{studentSummary.absentCount}</div>
                  </div>
                  <div className="p-4 bg-cyan-950/40 border border-cyan-800/60 rounded-xl shadow-inner">
                    <div className="text-cyan-400 text-3xs uppercase font-extrabold tracking-wider">Attendance Rate</div>
                    <div className="text-2xl font-black text-cyan-300 mt-1">
                      {studentSummary.attendancePercentage}%
                    </div>
                  </div>
                </div>

                {/* Detailed Session History */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>
                      Session History for {studentSummary.studentName} ({studentSummary.studentNumber})
                    </span>
                    <span className="text-3xs text-slate-400 font-mono">powered by charithj</span>
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-2xs">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Course</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {studentSummary.records && studentSummary.records.length > 0 ? (
                          studentSummary.records.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-cyan-400">{r.attendanceDate}</td>
                              <td className="py-2.5 px-3 text-white font-semibold">{r.courseName}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                                    r.status === "PRESENT"
                                      ? "bg-emerald-950/80 border border-emerald-500/60 text-emerald-300"
                                      : "bg-rose-950/80 border border-rose-500/60 text-rose-300"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-slate-500">
                              No attendance sessions recorded yet for this student.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* FOOTER WITH PROMINENT WATERMARK                                */}
      {/* ============================================================== */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/90 py-6 text-center text-xs text-slate-400 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs">
              A
            </span>
            <span className="text-slate-300 font-semibold">Applebay Institute</span>
            <span className="text-slate-600">•</span>
            <span>Student Handling System</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Academic Portal</span>
            <span className="text-slate-600">•</span>
            <span className="font-medium text-slate-400">
              powered by{" "}
              <span className="font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                charithj
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
