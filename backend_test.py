#!/usr/bin/env python3
"""
Backend API Testing for Salon Scheduler SaaS
Tests all API endpoints for the multi-tenant salon scheduling system
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class SalonAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_data = None
        self.tenant_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, auth_required: bool = False) -> tuple[bool, Dict]:
        """Make HTTP request and validate response"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data = self.make_request('GET', '/')
        if success and 'message' in data:
            self.log_test("Root API endpoint", True)
            return True
        else:
            self.log_test("Root API endpoint", False, f"Response: {data}")
            return False

    def test_tenant_info(self):
        """Test tenant info endpoint"""
        success, data = self.make_request('GET', '/tenant')
        if success and 'tenant_id' in data:
            self.tenant_data = data
            self.log_test("Tenant info endpoint", True)
            return True
        else:
            self.log_test("Tenant info endpoint", False, f"Response: {data}")
            return False

    def test_services_endpoint(self):
        """Test services endpoint (public)"""
        success, data = self.make_request('GET', '/services')
        if success and isinstance(data, list):
            self.log_test("Services endpoint (public)", True)
            return True
        else:
            self.log_test("Services endpoint (public)", False, f"Response: {data}")
            return False

    def test_employees_endpoint(self):
        """Test employees endpoint (public)"""
        success, data = self.make_request('GET', '/employees')
        if success and isinstance(data, list):
            self.log_test("Employees endpoint (public)", True)
            return True
        else:
            self.log_test("Employees endpoint (public)", False, f"Response: {data}")
            return False

    def test_auth_me_without_token(self):
        """Test auth/me endpoint without authentication"""
        success, data = self.make_request('GET', '/auth/me', expected_status=401)
        if success:
            self.log_test("Auth/me without token (401 expected)", True)
            return True
        else:
            self.log_test("Auth/me without token (401 expected)", False, f"Response: {data}")
            return False

    def test_create_service_without_auth(self):
        """Test creating service without authentication"""
        service_data = {
            "name": "Test Service",
            "duration": 60,
            "price": 100.0,
            "description": "Test service description"
        }
        success, data = self.make_request('POST', '/services', service_data, expected_status=401)
        if success:
            self.log_test("Create service without auth (401 expected)", True)
            return True
        else:
            self.log_test("Create service without auth (401 expected)", False, f"Response: {data}")
            return False

    def test_create_employee_without_auth(self):
        """Test creating employee without authentication"""
        employee_data = {
            "name": "Test Employee",
            "email": "test@example.com",
            "phone": "+5511999999999"
        }
        success, data = self.make_request('POST', '/employees', employee_data, expected_status=401)
        if success:
            self.log_test("Create employee without auth (401 expected)", True)
            return True
        else:
            self.log_test("Create employee without auth (401 expected)", False, f"Response: {data}")
            return False

    def test_appointments_endpoint(self):
        """Test appointments endpoint (public)"""
        success, data = self.make_request('GET', '/appointments')
        if success and isinstance(data, list):
            self.log_test("Appointments endpoint (public)", True)
            return True
        else:
            self.log_test("Appointments endpoint (public)", False, f"Response: {data}")
            return False

    def test_available_slots_endpoint(self):
        """Test available slots endpoint"""
        # This requires service_id and employee_id, so we'll test with dummy data
        params = "employee_id=test&date=2024-01-01&service_id=test"
        success, data = self.make_request('GET', f'/appointments/available-slots?{params}', expected_status=404)
        # Expecting 404 because tenant/service/employee don't exist
        if success or (not success and "não encontrado" in str(data).lower()):
            self.log_test("Available slots endpoint structure", True)
            return True
        else:
            self.log_test("Available slots endpoint structure", False, f"Response: {data}")
            return False

    def test_blocked_times_without_auth(self):
        """Test blocked times endpoint without auth"""
        success, data = self.make_request('GET', '/blocked-times', expected_status=401)
        if success:
            self.log_test("Blocked times without auth (401 expected)", True)
            return True
        else:
            self.log_test("Blocked times without auth (401 expected)", False, f"Response: {data}")
            return False

    def test_reports_without_auth(self):
        """Test reports endpoint without auth"""
        params = "date_from=2024-01-01&date_to=2024-01-31"
        success, data = self.make_request('GET', f'/reports/revenue?{params}', expected_status=401)
        if success:
            self.log_test("Reports without auth (401 expected)", True)
            return True
        else:
            self.log_test("Reports without auth (401 expected)", False, f"Response: {data}")
            return False

    def test_invalid_endpoints(self):
        """Test invalid endpoints return 404"""
        success, data = self.make_request('GET', '/invalid-endpoint', expected_status=404)
        if success:
            self.log_test("Invalid endpoint returns 404", True)
            return True
        else:
            self.log_test("Invalid endpoint returns 404", False, f"Response: {data}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🔍 Starting Salon Scheduler Backend API Tests")
        print(f"📡 Testing API at: {self.api_url}")
        print("=" * 60)

        # Basic API tests
        self.test_root_endpoint()
        self.test_tenant_info()
        self.test_services_endpoint()
        self.test_employees_endpoint()
        self.test_appointments_endpoint()
        
        # Auth-protected endpoint tests (without auth)
        self.test_auth_me_without_token()
        self.test_create_service_without_auth()
        self.test_create_employee_without_auth()
        self.test_blocked_times_without_auth()
        self.test_reports_without_auth()
        
        # Edge case tests
        self.test_available_slots_endpoint()
        self.test_invalid_endpoints()

        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

    def get_test_summary(self):
        """Get test summary for reporting"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results,
            "tenant_data": self.tenant_data
        }

def main():
    """Main test execution"""
    tester = SalonAPITester()
    exit_code = tester.run_all_tests()
    
    # Save detailed results
    summary = tester.get_test_summary()
    with open('backend_test_results.json', 'w') as f:
        json.dump(summary, f, indent=2, default=str)
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())