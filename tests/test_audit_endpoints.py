import unittest
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import app

class RuralEduSecurityAndEndpointAudit(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    # 1. Health check verification
    def test_health_check(self):
        res = self.client.get('/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'healthy')

    # 2. Session security config verification
    def test_session_cookie_security_config(self):
        self.assertTrue(self.app.config.get('SESSION_COOKIE_HTTPONLY'))
        self.assertEqual(self.app.config.get('SESSION_COOKIE_SAMESITE'), 'Lax')

    # 3. Session check without login
    def test_session_unauthenticated(self):
        res = self.client.get('/session')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.get_json().get('logged_in'))

    # 4. Unauthenticated access prevention to all protected routes
    def test_unauthenticated_protected_routes(self):
        # Admin protected endpoints
        self.assertEqual(self.client.get('/admin/dashboard').status_code, 401)
        self.assertEqual(self.client.get('/admin/classes').status_code, 403)
        self.assertEqual(self.client.get('/admin/subjects').status_code, 403)
        self.assertEqual(self.client.get('/admin/chapters').status_code, 403)
        self.assertEqual(self.client.get('/admin/topics').status_code, 403)
        self.assertEqual(self.client.post('/add-course', json={}).status_code, 403)

        # Student protected endpoints (including alias)
        self.assertEqual(self.client.get('/student/dashboard').status_code, 401)
        self.assertEqual(self.client.get('/student/progress').status_code, 401)
        self.assertEqual(self.client.get('/student-progress').status_code, 401)
        self.assertEqual(self.client.post('/update-progress', json={}).status_code, 403)

        # Parent protected endpoints
        self.assertEqual(self.client.get('/parent/dashboard').status_code, 401)
        self.assertEqual(self.client.get('/parent/student').status_code, 401)

        # Profile protected endpoints
        self.assertEqual(self.client.get('/profile').status_code, 401)
        self.assertEqual(self.client.get('/student/profile').status_code, 401)
        self.assertEqual(self.client.get('/parent/profile').status_code, 401)

    # 5. Role-based access control: Student session trying Admin & Parent routes
    def test_student_session_rbac(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = 101
            sess['role'] = 'Student'
            sess['student_id'] = 1
            sess['class'] = 'Class 8'

        # Student forbidden from Admin routes
        self.assertEqual(self.client.get('/admin/dashboard').status_code, 401)
        self.assertEqual(self.client.get('/admin/classes').status_code, 403)
        self.assertEqual(self.client.post('/admin/classes', json={'class_name': 'Hack'}).status_code, 403)
        self.assertEqual(self.client.get('/admin/subjects').status_code, 403)
        self.assertEqual(self.client.get('/admin/chapters').status_code, 403)
        self.assertEqual(self.client.get('/admin/topics').status_code, 403)
        self.assertEqual(self.client.post('/add-course', json={}).status_code, 403)

        # Student forbidden from Parent routes
        self.assertEqual(self.client.get('/parent/dashboard').status_code, 401)
        self.assertEqual(self.client.get('/parent/student').status_code, 401)
        self.assertEqual(self.client.get('/parent/profile').status_code, 401)

    # 6. Role-based access control: Parent session trying Admin & Student routes
    def test_parent_session_rbac(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = 202
            sess['role'] = 'Parent'
            sess['parent_id'] = 2

        # Parent forbidden from Admin routes
        self.assertEqual(self.client.get('/admin/dashboard').status_code, 401)
        self.assertEqual(self.client.get('/admin/classes').status_code, 403)
        self.assertEqual(self.client.get('/admin/topics').status_code, 403)
        self.assertEqual(self.client.post('/add-course', json={}).status_code, 403)

        # Parent forbidden from Student mutator routes
        self.assertEqual(self.client.post('/update-progress', json={'course_id': 1, 'score': 100}).status_code, 403)
        self.assertEqual(self.client.get('/student/dashboard').status_code, 401)
        self.assertEqual(self.client.get('/student/progress').status_code, 401)
        self.assertEqual(self.client.get('/student/profile').status_code, 401)

    # 7. Admin registration validation
    def test_admin_registration_missing_phone_rejected(self):
        payload = {
            'role': 'Admin',
            'name': 'Test Admin',
            'email': 'admin_test@ruraledu.com',
            'password': 'adminpassword'
        }
        res = self.client.post('/register', json=payload)
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn("error", data)
        self.assertIn("phone", data['error'].lower())

    # 8. Admin registration missing required credentials
    def test_admin_registration_missing_credentials_rejected(self):
        payload = {
            'role': 'Admin',
            'phone': '9999999999'
        }
        res = self.client.post('/register', json=payload)
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn("error", data)

    # 9. Registration validation
    def test_registration_validation(self):
        # Missing required fields
        res = self.client.post('/register', json={})
        self.assertEqual(res.status_code, 400)

        # Invalid role
        res = self.client.post('/register', json={'name': 'Test', 'password': '123', 'role': 'Hacker'})
        self.assertEqual(res.status_code, 400)

        # Student missing class and parent phone
        res = self.client.post('/register', json={'name': 'Test', 'password': '123', 'role': 'Student'})
        self.assertEqual(res.status_code, 400)

    # 10. Login validation
    def test_login_validation(self):
        # Missing identifier
        res = self.client.post('/login', json={'password': '123', 'role': 'Student'})
        self.assertEqual(res.status_code, 400)

        # Missing password
        res = self.client.post('/login', json={'identifier': 'test', 'role': 'Student'})
        self.assertEqual(res.status_code, 400)

        # Missing role
        res = self.client.post('/login', json={'identifier': 'test', 'password': '123'})
        self.assertEqual(res.status_code, 400)

    # 11. Logout
    def test_logout(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = 101
            sess['role'] = 'Student'
        
        res = self.client.post('/logout')
        self.assertEqual(res.status_code, 200)

        # Verify session cleared
        res_sess = self.client.get('/session')
        self.assertFalse(res_sess.get_json().get('logged_in'))

if __name__ == '__main__':
    unittest.main()
