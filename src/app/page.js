"use client";

import { useState, useEffect, useCallback } from "react";
import {
  checkHealth,
  getStudents,
  searchStudents,
  registerStudent,
  getCourses,
  createCourse,
  getUsers,
  API_BASE_URL,
} from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState("students");

  // Health and Connectivity states
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  // Data states
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    nic: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
  });

  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    level: "HND",
    duration: "2 Years",
    fee: "",
    active: true,
  });

  // Connectivity check
  const pingBackend = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth(null);
      setHealthError(err.message || "Failed to connect to backend");
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsData, coursesData, usersData] = await Promise.allSettled([
        getStudents(),
        getCourses(),
        getUsers(),
      ]);

      if (studentsData.status === "fulfilled") setStudents(studentsData.value);
      if (coursesData.status === "fulfilled") setCourses(coursesData.value);
      if (usersData.status === "fulfilled") setUsers(usersData.value);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    pingBackend();
    fetchData();
  }, [pingBackend, fetchData]);

  // Handle student search
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const result = await searchStudents(searchQuery);
      setStudents(result.content || result);
    } catch (err) {
      setErrorMsg("Search failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle student registration
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const payload = {
        ...studentForm,
        dateOfBirth: studentForm.dateOfBirth ? studentForm.dateOfBirth : null,
      };
      const created = await registerStudent(payload);
      setSuccessMsg(`Student registered successfully! Student Number: ${created.studentNumber}`);
      setStudentForm({
        firstName: "",
        lastName: "",
        nic: "",
        email: "",
        phone: "",
        address: "",
        dateOfBirth: "",
      });
      fetchData();
      pingBackend();
    } catch (err) {
      setErrorMsg(err.message || "Failed to register student");
    } finally {
      setLoading(false);
    }
  };

  // Handle course creation
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const payload = {
        ...courseForm,
        fee: parseFloat(courseForm.fee),
      };
      const created = await createCourse(payload);
      setSuccessMsg(`Course '${created.name}' (${created.code}) created successfully!`);
      setCourseForm({
        code: "",
        name: "",
        level: "HND",
        duration: "2 Years",
        fee: "",
        active: true,
      });
      fetchData();
      pingBackend();
    } catch (err) {
      setErrorMsg(err.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Applebay Institute
              </h1>
              <p className="text-xs text-slate-500">
                Student Handling System • Full-Stack Platform
              </p>
            </div>
          </div>

          {/* Connectivity Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={pingBackend}
              disabled={healthLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-xs bg-white hover:bg-slate-50"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  health
                    ? "bg-emerald-500 animate-pulse"
                    : healthLoading
                    ? "bg-amber-400 animate-ping"
                    : "bg-rose-500"
                }`}
              />
              {healthLoading
                ? "Connecting..."
                : health
                ? "Backend & DB Connected"
                : "Backend Offline"}
              <span className="text-slate-400">↻</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Architecture Status Banner */}
        <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                System Topology & Live Connection
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                API Base URL: <code className="bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded font-mono text-xs">{API_BASE_URL}</code>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
              {/* Frontend Node */}
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Frontend (Next.js)
                </div>
                <div className="text-slate-500 mt-0.5">Port 3000 / Netlify</div>
              </div>

              {/* Backend Node */}
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${health ? "bg-emerald-500" : "bg-rose-500"}`} />
                  Backend (Spring Boot)
                </div>
                <div className="text-slate-500 mt-0.5">
                  {health ? "Status: UP (Port 8080)" : "Port 8080 Disconnected"}
                </div>
              </div>

              {/* Database Node */}
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${health ? "bg-emerald-500" : "bg-rose-500"}`} />
                  Database (PostgreSQL)
                </div>
                <div className="text-slate-500 mt-0.5 truncate max-w-[150px]">
                  {health ? health.database : "Port 5432"}
                </div>
              </div>
            </div>
          </div>
          {healthError && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              <strong>Connection Notice:</strong> {healthError}. Make sure your Spring Boot backend is running on <code>http://localhost:8080</code>.
            </div>
          )}
        </section>

        {/* Global Feedback Messages */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex justify-between items-center">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 flex gap-4 text-sm font-medium">
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === "students"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            🎓 Students & Registration ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === "courses"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📚 Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === "architecture"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            🔌 Data Flow & Architecture
          </button>
        </div>

        {/* TAB 1: STUDENTS */}
        {activeTab === "students" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Registration Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New Student</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generates an automatic unique student number (e.g. AB2026-0001).
                </p>
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Kasun"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Perera"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">NIC (National ID) *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.nic}
                    onChange={(e) => setStudentForm({ ...studentForm, nic: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. 200112304567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="kasun.p@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="0771234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    value={studentForm.dateOfBirth}
                    onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Address</label>
                  <input
                    type="text"
                    value={studentForm.address}
                    onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Colombo, Sri Lanka"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </button>
              </form>
            </div>

            {/* Students List & Search */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enrolled Students</h3>
                  <p className="text-xs text-slate-500">Live records from PostgreSQL database</p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, NIC, number..."
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none w-48"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-900"
                  >
                    Search
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        fetchData();
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
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
                      <th className="py-2.5 px-3">Student No</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">NIC</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.length > 0 ? (
                      students.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">
                            {st.studentNumber}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {st.firstName} {st.lastName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{st.nic}</td>
                          <td className="py-2.5 px-3 text-slate-600">{st.email}</td>
                          <td className="py-2.5 px-3 text-slate-500">{st.phone || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          {loading ? "Loading students..." : "No students registered yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COURSES */}
        {activeTab === "courses" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Course Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Course</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define HND programmes and short Certificate courses.
                </p>
              </div>

              <form onSubmit={handleCourseSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. HND-IT"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Higher National Diploma in IT"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Level *</label>
                    <select
                      value={courseForm.level}
                      onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="HND">HND</option>
                      <option value="Certificate">Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Duration *</label>
                    <input
                      type="text"
                      required
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="e.g. 2 Years"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Total Fee (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={courseForm.fee}
                    onChange={(e) => setCourseForm({ ...courseForm, fee: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="350000.00"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Creating..." : "Save Course"}
                </button>
              </form>
            </div>

            {/* Course Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.length > 0 ? (
                courses.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {c.code}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {c.level}
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-slate-900">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">Duration: {c.duration}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Course Fee:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        LKR {Number(c.fee).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
                  {loading ? "Loading courses..." : "No courses added yet."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DATA FLOW & ARCHITECTURE */}
        {activeTab === "architecture" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Data Flow & Layered Architecture (Assignment Spec)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Path of a request: Next.js Client → REST Controller → Service (Business Logic) → Repository → PostgreSQL Database
              </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-xs">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="font-bold text-blue-900">1. Frontend Layer</div>
                <div className="text-slate-600 mt-1">Next.js App Router</div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Runs on Port 3000 / Netlify. Sends JSON via Fetch.
                </div>
              </div>

              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="font-bold text-indigo-900">2. Controller Layer</div>
                <div className="text-slate-600 mt-1">Spring Boot WebMVC</div>
                <div className="mt-2 text-[11px] text-slate-500">
                  <code>@RestController</code> on Port 8080. Validates DTOs.
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="font-bold text-purple-900">3. Service Layer</div>
                <div className="text-slate-600 mt-1">Business Logic & Transactions</div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Generates student numbers, checks duplicate NIC/Email.
                </div>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-900">4. Repository & Database</div>
                <div className="text-slate-600 mt-1">Spring Data JPA + PostgreSQL</div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Port 5432. Relational persistence with transactions.
                </div>
              </div>
            </div>

            {/* Live Raw JSON Diagnostic */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-900 text-slate-100 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span>GET /api/health (Raw JSON Response)</span>
                <button
                  onClick={pingBackend}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
                >
                  Refresh Health
                </button>
              </div>
              <pre className="mt-3 overflow-x-auto text-emerald-400">
                {health ? JSON.stringify(health, null, 2) : "Backend offline or not reachable."}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
