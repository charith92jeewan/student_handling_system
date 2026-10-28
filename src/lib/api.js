// API client for Applebay Institute Student Handling System

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/+$/, "");

async function handleResponse(res) {
  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    let errorMessage = "An error occurred";
    if (typeof data === "object" && data !== null) {
      if (data.message) {
        errorMessage = data.message;
      } else if (data.errors) {
        errorMessage = Object.values(data.errors).join(", ");
      } else if (data.error) {
        errorMessage = data.error;
      }
    } else if (typeof data === "string" && data.trim()) {
      errorMessage = data;
    }
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ---------------- HEALTH ----------------
export async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

// ---------------- COURSES ----------------
export async function getCourses() {
  const res = await fetch(`${API_BASE_URL}/courses`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function createCourse(courseData) {
  const res = await fetch(`${API_BASE_URL}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(courseData),
  });
  return handleResponse(res);
}

export async function updateCourse(id, courseData) {
  const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(courseData),
  });
  return handleResponse(res);
}

export async function deleteCourse(id) {
  const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// Course Modules & GP Credits
export async function getCourseModules(courseId) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/modules`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function addCourseModule(courseId, moduleData) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/modules`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(moduleData),
  });
  return handleResponse(res);
}

export async function updateCourseModule(courseId, moduleId, moduleData) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/modules/${moduleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(moduleData),
  });
  return handleResponse(res);
}

export async function deleteCourseModule(courseId, moduleId) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/modules/${moduleId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ---------------- STUDENTS ----------------
export async function getStudents() {
  const res = await fetch(`${API_BASE_URL}/students`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function searchStudents(query = "", page = 0, size = 10) {
  const url = `${API_BASE_URL}/students/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function registerStudent(studentData) {
  const res = await fetch(`${API_BASE_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(studentData),
  });
  return handleResponse(res);
}

export async function updateStudent(id, studentData) {
  const res = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(studentData),
  });
  return handleResponse(res);
}

export async function deleteStudent(id) {
  const res = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ---------------- ENROLMENT ----------------
export async function getEnrollments(courseId = null, studentId = null) {
  let url = `${API_BASE_URL}/enrollments`;
  const params = [];
  if (courseId) params.push(`courseId=${courseId}`);
  if (studentId) params.push(`studentId=${studentId}`);
  if (params.length > 0) url += `?${params.join("&")}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function enrollStudent(enrollmentData) {
  const res = await fetch(`${API_BASE_URL}/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(enrollmentData),
  });
  return handleResponse(res);
}

export async function deleteEnrollment(id) {
  const res = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ---------------- ATTENDANCE ----------------
export async function markAttendance(payload) {
  const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getAttendanceByCourseAndDate(courseId, dateStr) {
  const res = await fetch(`${API_BASE_URL}/attendance/course/${courseId}?date=${dateStr}`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

export async function getStudentAttendanceSummary(studentId) {
  const res = await fetch(`${API_BASE_URL}/attendance/student/${studentId}`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

export { API_BASE_URL };
