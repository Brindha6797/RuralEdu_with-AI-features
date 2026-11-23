const API_BASE = 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Set up headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Merge options and enforce credentials for session support
  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth API
  login: (identifier, password, role) => 
    request('/login', {
      method: 'POST',
      body: { identifier, password, role }
    }),
    
  register: (userData) => 
    request('/register', {
      method: 'POST',
      body: userData
    }),
    
  logout: () => 
    request('/logout', { method: 'POST' }),
    
  getSession: () => 
    request('/session', { method: 'GET' }),

  // User & Profile API
  getProfile: () => 
    request('/profile', { method: 'GET' }),

  getStudentProfile: () =>
    request('/student/profile', { method: 'GET' }),

  getParentProfile: () =>
    request('/parent/profile', { method: 'GET' }),

  // Dashboard APIs
  getStudentDashboard: () =>
    request('/student/dashboard', { method: 'GET' }),

  getParentDashboard: () =>
    request('/parent/dashboard', { method: 'GET' }),

  getAdminDashboard: () =>
    request('/admin/dashboard', { method: 'GET' }),

  // Course & Topic API
  getCourses: (className = '') => {
    const query = className ? `?class_name=${encodeURIComponent(className)}` : '';
    return request(`/courses${query}`, { method: 'GET' });
  },
  
  addCourse: (courseData) => 
    request('/add-course', {
      method: 'POST',
      body: courseData
    }),

  // Progress API
  getProgress: () => 
    request('/student/progress', { method: 'GET' }),
  
  updateProgress: (courseId, score = null) => 
    request('/update-progress', {
      method: 'POST',
      body: { course_id: courseId, score }
    }),

  // Admin Hierarchy Management APIs
  getAdminClasses: () =>
    request('/admin/classes', { method: 'GET' }),

  getAdminSubjects: () =>
    request('/admin/subjects', { method: 'GET' }),

  getAdminChapters: () =>
    request('/admin/chapters', { method: 'GET' }),

  getAdminTopics: () =>
    request('/admin/topics', { method: 'GET' })
};
