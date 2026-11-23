import unittest
import requests
import time

BASE_URL = "http://127.0.0.1:5000"

class TestStudentParentManagement(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.session = requests.Session()
        cls.admin_email = "admin@ruraledu.com"
        cls.admin_pass = "admin123"

        login_res = cls.session.post(f"{BASE_URL}/login", json={
            "identifier": cls.admin_email,
            "password": cls.admin_pass,
            "role": "Admin"
        })
        assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"

    def test_01_unauthorized_access(self):
        # A fresh unauthenticated session should be denied
        anon_session = requests.Session()
        res_stu = anon_session.get(f"{BASE_URL}/admin/students")
        self.assertIn(res_stu.status_code, [401, 403])

        res_par = anon_session.get(f"{BASE_URL}/admin/parents")
        self.assertIn(res_par.status_code, [401, 403])

    def test_02_get_students_and_parents(self):
        res_stu = self.session.get(f"{BASE_URL}/admin/students")
        self.assertEqual(res_stu.status_code, 200)
        self.assertIn("students", res_stu.json())

        res_par = self.session.get(f"{BASE_URL}/admin/parents")
        self.assertEqual(res_par.status_code, 200)
        self.assertIn("parents", res_par.json())

    def test_03_student_crud_lifecycle(self):
        ts = int(time.time() * 1000)
        stu_email = f"test_stu_{ts}@ruraledu.org"
        stu_phone = f"987{str(ts)[-7:]}"
        parent_phone = f"988{str(ts)[-7:]}"

        # 1. Create Student
        create_res = self.session.post(f"{BASE_URL}/admin/students", json={
            "name": "Audit Student",
            "email": stu_email,
            "phone": stu_phone,
            "password": "Password123!",
            "class": "Class 9",
            "primary_parent_phone": parent_phone
        })
        self.assertEqual(create_res.status_code, 201)
        data = create_res.json()
        student_id = data["student_id"]
        user_id = data["user_id"]

        # 2. Update Student
        updated_name = "Audit Student Updated"
        updated_class = "Class 10"
        updated_phone = f"986{str(ts)[-7:]}"
        update_res = self.session.put(f"{BASE_URL}/admin/students", json={
            "student_id": student_id,
            "name": updated_name,
            "email": stu_email,
            "phone": updated_phone,
            "class": updated_class,
            "primary_parent_phone": parent_phone
        })
        self.assertEqual(update_res.status_code, 200)
        self.assertIn("Student updated successfully", update_res.json().get("message", ""))

        # Verify update via GET
        list_res = self.session.get(f"{BASE_URL}/admin/students")
        self.assertEqual(list_res.status_code, 200)
        matched = [s for s in list_res.json()["students"] if s["student_id"] == student_id]
        self.assertTrue(len(matched) > 0)
        self.assertEqual(matched[0]["name"], updated_name)
        self.assertEqual(matched[0]["class"], updated_class)
        self.assertEqual(matched[0]["phone"], updated_phone)

        # 3. Delete Student
        del_res = self.session.delete(f"{BASE_URL}/admin/students?student_id={student_id}")
        self.assertEqual(del_res.status_code, 200)
        self.assertIn("Student deleted successfully", del_res.json().get("message", ""))

        # Verify deleted
        list_after = self.session.get(f"{BASE_URL}/admin/students")
        remaining = [s for s in list_after.json()["students"] if s["student_id"] == student_id]
        self.assertEqual(len(remaining), 0)

    def test_04_parent_crud_lifecycle(self):
        ts = int(time.time() * 1000)
        par_email = f"test_par_{ts}@ruraledu.org"
        par_phone = f"977{str(ts)[-7:]}"

        # 1. Create Parent
        create_res = self.session.post(f"{BASE_URL}/admin/parents", json={
            "name": "Audit Parent",
            "email": par_email,
            "phone": par_phone,
            "password": "ParentPass123!"
        })
        self.assertEqual(create_res.status_code, 201)
        data = create_res.json()
        parent_id = data["parent_id"]

        # 2. Update Parent
        updated_name = "Audit Parent Updated"
        updated_phone = f"976{str(ts)[-7:]}"
        update_res = self.session.put(f"{BASE_URL}/admin/parents", json={
            "parent_id": parent_id,
            "name": updated_name,
            "email": par_email,
            "phone": updated_phone
        })
        self.assertEqual(update_res.status_code, 200)
        self.assertIn("Parent updated successfully", update_res.json().get("message", ""))

        # Verify update via GET
        list_res = self.session.get(f"{BASE_URL}/admin/parents")
        self.assertEqual(list_res.status_code, 200)
        matched = [p for p in list_res.json()["parents"] if p["parent_id"] == parent_id]
        self.assertTrue(len(matched) > 0)
        self.assertEqual(matched[0]["name"], updated_name)
        self.assertEqual(matched[0]["phone"], updated_phone)

        # 3. Delete Parent
        del_res = self.session.delete(f"{BASE_URL}/admin/parents?parent_id={parent_id}")
        self.assertEqual(del_res.status_code, 200)
        self.assertIn("Parent deleted successfully", del_res.json().get("message", ""))

        # Verify deleted
        list_after = self.session.get(f"{BASE_URL}/admin/parents")
        remaining = [p for p in list_after.json()["parents"] if p["parent_id"] == parent_id]
        self.assertEqual(len(remaining), 0)

if __name__ == '__main__':
    unittest.main()
