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

export async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

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
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(studentData),
  });
  return handleResponse(res);
}

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
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(courseData),
  });
  return handleResponse(res);
}

export async function getUsers() {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  return handleResponse(res);
}

export { API_BASE_URL };
