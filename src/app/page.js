"use client";

import { useState, useEffect, useCallback } from "react";
import {
  checkHealth,
  // Courses
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
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
    try {
      const [stRes, crRes, enRes] = await Promise.allSettled([
        getStudents(),
        getCourses(),
        getEnrollments(),
      ]);
      if (stRes.status === "fulfilled") setStudents(stRes.value);
      if (crRes.status === "fulfilled") setCourses(crRes.value);
      if (enRes.status === "fulfilled") setEnrollments(enRes.value);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
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
        setSuccessMsg(`Student registered! Student No: ${created.studentNumber}`);
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
      firstName: st.firstName,
      lastName: st.lastName,
      nic: st.nic,
      email: st.email,
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
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await searchStudents(searchQuery);
      setStudents(res.content || res);
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
      // 1. Get all enrollments for this course
      const enrolled = await getEnrollments(Number(attCourseId));
      if (enrolled.length === 0) {
        setErrorMsg("No students are enrolled in this course yet. Please enrol students in the Enrolment section first.");
        setAttRecords([]);
        return;
      }

      // 2. Check if attendance was already marked for this date
      const existing = await getAttendanceByCourseAndDate(Number(attCourseId), attDate);
      const existingMap = new Map();
      existing.forEach((a) => existingMap.set(a.enrollmentId, a.status));

      // 3. Build state
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Applebay Institute</h1>
              <p className="text-xs text-slate-500">Student Handling System — Academic Management Portal</p>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { ping(); refreshAll(); }}
              disabled={healthLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  health ? "bg-emerald-500" : healthLoading ? "bg-amber-400 animate-ping" : "bg-rose-500"
                }`}
              />
              {health ? "Backend & DB Connected" : "Backend Offline"}
              <span className="text-slate-400">↻</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex justify-between items-center">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="font-bold text-emerald-700 hover:text-emerald-900">✕</button>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex justify-between items-center">
            <span>⚠ {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="font-bold text-rose-700 hover:text-rose-900">✕</button>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="border-b border-slate-200 flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab("students"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === "students"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => { setActiveTab("courses"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === "courses"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => { setActiveTab("enrolment"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === "enrolment"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Enrolment ({enrollments.length})
          </button>
          <button
            onClick={() => { setActiveTab("markAttendance"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === "markAttendance"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => { setActiveTab("viewAttendance"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === "viewAttendance"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Student Attendance & Summary
          </button>
        </nav>

        {/* ============================================================== */}
        {/* TAB 1: STUDENTS (CRUD + Search)                                */}
        {/* ============================================================== */}
        {activeTab === "students" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingStudentId ? "Edit Student" : "Register Student"}
                </h3>
                {editingStudentId && (
                  <button
                    onClick={() => {
                      setEditingStudentId(null);
                      setStudentForm({ firstName: "", lastName: "", nic: "", email: "", phone: "", address: "", dateOfBirth: "" });
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="Kasun"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="Perera"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">NIC *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.nic}
                    onChange={(e) => setStudentForm({ ...studentForm, nic: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="200112304567"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="kasun.p@gmail.com"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="0771234567"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Address</label>
                  <input
                    type="text"
                    value={studentForm.address}
                    onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="Colombo, Sri Lanka"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    value={studentForm.dateOfBirth}
                    onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded bg-blue-600 px-3 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : editingStudentId ? "Update Student" : "Register Student"}
                </button>
              </form>
            </div>

            {/* List & Search */}
            <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">Student Directory</h3>

                {/* Search students by name */}
                <form onSubmit={handleStudentSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name / NIC / No..."
                    className="rounded border border-slate-300 px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none w-48"
                  />
                  <button type="submit" className="rounded bg-slate-800 px-2.5 py-1 text-xs text-white hover:bg-slate-900">
                    Search
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); refreshAll(); }}
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-2.5">No</th>
                      <th className="py-2 px-2.5">Name</th>
                      <th className="py-2 px-2.5">NIC</th>
                      <th className="py-2 px-2.5">Email</th>
                      <th className="py-2 px-2.5">Phone</th>
                      <th className="py-2 px-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.length > 0 ? (
                      students.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2.5 font-mono font-bold text-blue-600">{st.studentNumber}</td>
                          <td className="py-2 px-2.5 font-medium text-slate-800">{st.firstName} {st.lastName}</td>
                          <td className="py-2 px-2.5 text-slate-600">{st.nic}</td>
                          <td className="py-2 px-2.5 text-slate-600">{st.email}</td>
                          <td className="py-2 px-2.5 text-slate-500">{st.phone || "-"}</td>
                          <td className="py-2 px-2.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleEditStudent(st)}
                              className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st.id)}
                              className="px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          {loading ? "Loading..." : "No students found."}
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
        {/* TAB 2: COURSES (CRUD)                                          */}
        {/* ============================================================== */}
        {activeTab === "courses" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add / Update Course Form */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCourseId ? "Edit Course" : "Add Course"}
                </h3>
                {editingCourseId && (
                  <button
                    onClick={() => {
                      setEditingCourseId(null);
                      setCourseForm({ code: "", name: "", level: "HND", duration: "2 Years", fee: "" });
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleCourseSubmit} className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. HND-IT"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Higher National Diploma in IT"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Level *</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="HND">HND</option>
                    <option value="Certificate">Certificate</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Duration *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. 2 Years / 6 Months"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Fee (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={courseForm.fee}
                    onChange={(e) => setCourseForm({ ...courseForm, fee: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="350000.00"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded bg-blue-600 px-3 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : editingCourseId ? "Update Course" : "Save Course"}
                </button>
              </form>
            </div>

            {/* Courses Table */}
            <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">View Courses</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-2.5">Code</th>
                      <th className="py-2 px-2.5">Name</th>
                      <th className="py-2 px-2.5">Level</th>
                      <th className="py-2 px-2.5">Duration</th>
                      <th className="py-2 px-2.5">Fee</th>
                      <th className="py-2 px-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.length > 0 ? (
                      courses.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2.5 font-mono font-bold text-blue-600">{c.code}</td>
                          <td className="py-2 px-2.5 font-medium text-slate-800">{c.name}</td>
                          <td className="py-2 px-2.5 text-slate-600">{c.level}</td>
                          <td className="py-2 px-2.5 text-slate-600">{c.duration}</td>
                          <td className="py-2 px-2.5 text-slate-600">
                            {c.fee ? `LKR ${Number(c.fee).toLocaleString()}` : "-"}
                          </td>
                          <td className="py-2 px-2.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleEditCourse(c)}
                              className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id)}
                              className="px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          {loading ? "Loading..." : "No courses found."}
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
        {/* TAB 3: ENROLMENT (Enrol Student in Course)                      */}
        {/* ============================================================== */}
        {activeTab === "enrolment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrol Form */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Enrol a Student in a Course</h3>
              <p className="text-xs text-slate-500">Links an existing registered student to a course.</p>

              <form onSubmit={handleEnrollSubmit} className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Select Student *</label>
                  <select
                    required
                    value={enrollForm.studentId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
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
                  <label className="font-semibold text-slate-700">Select Course *</label>
                  <select
                    required
                    value={enrollForm.courseId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Choose a Course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Batch / Group</label>
                  <input
                    type="text"
                    value={enrollForm.batch}
                    onChange={(e) => setEnrollForm({ ...enrollForm, batch: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
                    placeholder="Batch 01"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded bg-blue-600 px-3 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Enrolling..." : "Enrol Student"}
                </button>
              </form>
            </div>

            {/* Enrolments Table */}
            <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Active Enrolments</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-2.5">Student No</th>
                      <th className="py-2 px-2.5">Student Name</th>
                      <th className="py-2 px-2.5">Course</th>
                      <th className="py-2 px-2.5">Batch</th>
                      <th className="py-2 px-2.5">Enrolled Date</th>
                      <th className="py-2 px-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.length > 0 ? (
                      enrollments.map((en) => (
                        <tr key={en.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2.5 font-mono font-bold text-blue-600">{en.studentNumber}</td>
                          <td className="py-2 px-2.5 font-medium text-slate-800">{en.studentName}</td>
                          <td className="py-2 px-2.5 text-slate-600">{en.courseCode} — {en.courseName}</td>
                          <td className="py-2 px-2.5 text-slate-500">{en.batch}</td>
                          <td className="py-2 px-2.5 text-slate-500">{en.enrolledDate}</td>
                          <td className="py-2 px-2.5 text-right">
                            <button
                              onClick={() => handleDeleteEnrollment(en.id)}
                              className="px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No enrolments yet. Enrol a student using the form on the left.
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
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Mark Attendance for Students of a Course
              </h3>
              <p className="text-xs text-slate-500">
                Pick a course and date, then mark each enrolled student as Present or Absent.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Select Course *</label>
                <select
                  value={attCourseId}
                  onChange={(e) => setAttCourseId(e.target.value)}
                  className="mt-1 rounded border border-slate-300 px-2.5 py-1.5 bg-white focus:border-blue-500 focus:outline-none min-w-[220px]"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Date *</label>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="mt-1 rounded border border-slate-300 px-2.5 py-1.5 bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={loadClassForAttendance}
                disabled={attLoading}
                className="rounded bg-slate-800 px-3 py-1.5 text-white font-semibold hover:bg-slate-900 disabled:opacity-50"
              >
                {attLoading ? "Loading Class..." : "Load Students"}
              </button>
            </div>

            {/* Attendance Student List */}
            {attRecords.length > 0 && (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-2.5">Student No</th>
                        <th className="py-2 px-2.5">Student Name</th>
                        <th className="py-2 px-2.5 text-center">Status (Present / Absent)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attRecords.map((rec, idx) => (
                        <tr key={rec.enrollmentId} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-mono font-bold text-blue-600">{rec.studentNumber}</td>
                          <td className="py-2 px-2.5 font-medium text-slate-800">{rec.studentName}</td>
                          <td className="py-2 px-2.5 text-center">
                            <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-xs">
                              <button
                                type="button"
                                onClick={() => toggleStatus(idx, "PRESENT")}
                                className={`px-3 py-1 font-semibold transition-colors ${
                                  rec.status === "PRESENT"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStatus(idx, "ABSENT")}
                                className={`px-3 py-1 font-semibold transition-colors border-l border-slate-300 ${
                                  rec.status === "ABSENT"
                                    ? "bg-rose-600 text-white"
                                    : "bg-white text-slate-600 hover:bg-slate-50"
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

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={loading}
                    className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 text-xs shadow-xs"
                  >
                    {loading ? "Saving to Database..." : "Save Attendance"}
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
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                View Attendance Records & Percentage of a Student
              </h3>
              <p className="text-xs text-slate-500">
                Calculates total sessions, present count, absent count, and attendance %.
              </p>
            </div>

            {/* Student Picker */}
            <div className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
              <div className="flex-1 min-w-[240px]">
                <label className="block font-semibold text-slate-700">Select Student *</label>
                <select
                  value={viewStudentId}
                  onChange={(e) => {
                    setViewStudentId(e.target.value);
                    if (e.target.value) handleLoadStudentAttendance(e.target.value);
                  }}
                  className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 bg-white focus:border-blue-500 focus:outline-none"
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
                className="rounded bg-slate-800 px-3 py-1.5 text-white font-semibold hover:bg-slate-900 disabled:opacity-50"
              >
                {summaryLoading ? "Loading..." : "Load Attendance"}
              </button>
            </div>

            {/* Attendance Summary Cards & Table */}
            {studentSummary && (
              <div className="space-y-4 pt-2">
                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="text-slate-500">Total Sessions</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{studentSummary.totalSessions}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="text-emerald-700 font-semibold">Present</div>
                    <div className="text-xl font-bold text-emerald-800 mt-1">{studentSummary.presentCount}</div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md">
                    <div className="text-rose-700 font-semibold">Absent</div>
                    <div className="text-xl font-bold text-rose-800 mt-1">{studentSummary.absentCount}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-blue-700 font-semibold">Attendance %</div>
                    <div className="text-xl font-bold text-blue-900 mt-1">
                      {studentSummary.attendancePercentage}%
                    </div>
                  </div>
                </div>

                {/* Detailed Session History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                    Session History for {studentSummary.studentName} ({studentSummary.studentNumber})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                        <tr>
                          <th className="py-2 px-2.5">Date</th>
                          <th className="py-2 px-2.5">Course</th>
                          <th className="py-2 px-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentSummary.records && studentSummary.records.length > 0 ? (
                          studentSummary.records.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 font-mono text-slate-700">{r.attendanceDate}</td>
                              <td className="py-2 px-2.5 text-slate-800 font-medium">{r.courseName}</td>
                              <td className="py-2 px-2.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                    r.status === "PRESENT"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-slate-400">
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
    </div>
  );
}
