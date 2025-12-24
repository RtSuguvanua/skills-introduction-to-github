#!/usr/bin/env python3
"""
Backend API Testing for Fiji Business Register Management System
Tests all API endpoints for functionality and integration
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class FijiBusinessRegisterTester:
    def __init__(self, base_url="https://businessreg-fiji.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details, "response": response_data})
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, files: Optional[Dict] = None) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, headers=headers, files=files, data=data)
                else:
                    response = requests.post(url, headers=headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
            
            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.make_request('GET', '/')
        self.log_test("Root API endpoint", success, 
                     "" if success else f"Status: {response.get('status_code', 'Unknown')}")
        return success

    def test_fsic_endpoints(self):
        """Test FSIC classification endpoints"""
        # Test FSIC sections
        success, response = self.make_request('GET', '/fsic/sections')
        self.log_test("FSIC Sections endpoint", success and isinstance(response, list),
                     "" if success else f"Expected list, got: {type(response)}")
        
        # Test FSIC divisions
        success, response = self.make_request('GET', '/fsic/divisions')
        self.log_test("FSIC Divisions endpoint", success and isinstance(response, list),
                     "" if success else f"Expected list, got: {type(response)}")
        
        # Test FSIC lookup
        success, response = self.make_request('GET', '/fsic/lookup/01')
        self.log_test("FSIC Lookup endpoint", success and isinstance(response, dict),
                     "" if success else f"Expected dict, got: {type(response)}")

    def test_surveys_endpoint(self):
        """Test surveys endpoint"""
        success, response = self.make_request('GET', '/surveys')
        self.log_test("Surveys endpoint", success and isinstance(response, list),
                     "" if success else f"Expected list, got: {type(response)}")

    def test_reference_data_endpoints(self):
        """Test reference data endpoints"""
        # Test provinces
        success, response = self.make_request('GET', '/reference/provinces')
        self.log_test("Provinces endpoint", success and isinstance(response, list),
                     "" if success else f"Expected list, got: {type(response)}")
        
        # Test divisions
        success, response = self.make_request('GET', '/reference/divisions')
        self.log_test("Divisions endpoint", success and isinstance(response, list),
                     "" if success else f"Expected list, got: {type(response)}")

    def test_dashboard_stats_without_auth(self):
        """Test dashboard stats endpoint without authentication (should fail)"""
        success, response = self.make_request('GET', '/stats/dashboard', expected_status=401)
        self.log_test("Dashboard stats (no auth)", success,
                     "" if success else f"Expected 401, got: {response.get('status_code')}")

    def test_businesses_without_auth(self):
        """Test businesses endpoint without authentication (should fail)"""
        success, response = self.make_request('GET', '/businesses', expected_status=401)
        self.log_test("Businesses list (no auth)", success,
                     "" if success else f"Expected 401, got: {response.get('status_code')}")

    def test_auth_me_without_token(self):
        """Test auth/me endpoint without token (should fail)"""
        success, response = self.make_request('GET', '/auth/me', expected_status=401)
        self.log_test("Auth me (no token)", success,
                     "" if success else f"Expected 401, got: {response.get('status_code')}")

    def test_public_endpoints(self):
        """Test all public endpoints that don't require authentication"""
        print("\n🔍 Testing Public Endpoints...")
        
        self.test_root_endpoint()
        self.test_fsic_endpoints()
        self.test_surveys_endpoint()
        self.test_reference_data_endpoints()

    def test_protected_endpoints_without_auth(self):
        """Test protected endpoints without authentication"""
        print("\n🔒 Testing Protected Endpoints (No Auth - Should Fail)...")
        
        self.test_dashboard_stats_without_auth()
        self.test_businesses_without_auth()
        self.test_auth_me_without_token()

    def test_import_endpoints_without_auth(self):
        """Test import endpoints without authentication (should fail)"""
        print("\n📁 Testing Import Endpoints (No Auth - Should Fail)...")
        
        # Test Excel import
        success, response = self.make_request('POST', '/import/excel', expected_status=401)
        self.log_test("Excel import (no auth)", success,
                     "" if success else f"Expected 401, got: {response.get('status_code')}")
        
        # Test FRCS import
        success, response = self.make_request('POST', '/import/frcs', expected_status=401)
        self.log_test("FRCS import (no auth)", success,
                     "" if success else f"Expected 401, got: {response.get('status_code')}")
        
        # Test MOJ import
        success, response = self.make_request('POST', '/import/moj', expected_status=401)
        self.log_test("MOJ import (no auth)", success,
                     "" if success else f"Expected 401, got: {response.get('status_code')}")

    def test_user_management_without_auth(self):
        """Test user management endpoints without authentication (should fail)"""
        print("\n👥 Testing User Management (No Auth - Should Fail)...")
        
        success, response = self.make_request('GET', '/users', expected_status=401)
        self.log_test("Users list (no auth)", success,
                     "" if success else f"Expected 401, got: {response.get('status_code')}")

    def test_notifications_without_auth(self):
        """Test notifications endpoints without authentication (should fail)"""
        print("\n🔔 Testing Notifications (No Auth - Should Fail)...")
        
        success, response = self.make_request('GET', '/notifications', expected_status=401)
        self.log_test("Notifications (no auth)", success,
                     "" if success else f"Expected 401, got: {response.get('status_code')}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Fiji Business Register Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Test public endpoints
        self.test_public_endpoints()
        
        # Test protected endpoints without auth (should fail)
        self.test_protected_endpoints_without_auth()
        self.test_import_endpoints_without_auth()
        self.test_user_management_without_auth()
        self.test_notifications_without_auth()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"  {i}. {test['test']}: {test['error']}")
        
        return self.tests_passed, self.tests_run, self.failed_tests

def main():
    """Main test execution"""
    tester = FijiBusinessRegisterTester()
    passed, total, failed = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "base_url": tester.base_url,
        "summary": {
            "total_tests": total,
            "passed_tests": passed,
            "failed_tests": len(failed),
            "success_rate": f"{(passed/total*100):.1f}%" if total > 0 else "0%"
        },
        "test_results": tester.test_results,
        "failed_tests": failed
    }
    
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: /app/test_reports/backend_test_results.json")
    
    # Return appropriate exit code
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())