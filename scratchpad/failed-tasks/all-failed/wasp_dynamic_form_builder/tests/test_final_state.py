import pytest
import subprocess
import os
import socket
import requests
from xprocess import ProcessStarter
from pochi_verifier import PochiVerifier

PROJECT_DIR = "/home/user/app"
PORT = 3000
HOST = "127.0.0.1"
BASE_URL = f"http://{HOST}:{PORT}"

@pytest.fixture(scope="session")
def browser_verifier():
    return PochiVerifier()

@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "start_app"
        args = ["wasp", "start"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 180

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex((HOST, PORT)) != 0:
                    return False
            try:
                resp = requests.get(BASE_URL, timeout=20)
                return resp.status_code < 500
            except requests.RequestException:
                return False

    info = xprocess.getinfo(Starter.name)
    try:
        # Run db migration before starting the app
        subprocess.run(["wasp", "db", "migrate-dev", "--name", "init"], cwd=PROJECT_DIR, check=True)
        xprocess.ensure(Starter.name, Starter)
    except Exception as e:
        print(f"Startup failed: {e}")
        raise e
    yield
    info.terminate()

def test_task_verification(start_app, browser_verifier):
    reason = "Dynamic form builder must support dynamic schemas, conditional logic, and server-side validation."
    truth = (
        "1. Sign up as a new user with username 'admin' and password 'password123' at http://127.0.0.1:3000/signup. This user must be saved with the ADMIN role.\n"
        "2. Log in as 'admin' / 'password123' if not automatically logged in.\n"
        "3. Navigate to the form builder page at http://127.0.0.1:3000/forms/new. Create a form with Title 'Driver Registration', Description 'Register as a delivery driver.', and paste the following JSON schema into the Schema textarea:\n"
        "[\n"
        "  {\n"
        "    \"id\": \"name\",\n"
        "    \"label\": \"Full Name\",\n"
        "    \"type\": \"text\",\n"
        "    \"required\": true\n"
        "  },\n"
        "  {\n"
        "    \"id\": \"age\",\n"
        "    \"label\": \"Age\",\n"
        "    \"type\": \"number\",\n"
        "    \"required\": true,\n"
        "    \"min\": 18\n"
        "  },\n"
        "  {\n"
        "    \"id\": \"has_license\",\n"
        "    \"label\": \"Do you have a driver's license?\",\n"
        "    \"type\": \"boolean\",\n"
        "    \"required\": false\n"
        "  },\n"
        "  {\n"
        "    \"id\": \"license_number\",\n"
        "    \"label\": \"License Number\",\n"
        "    \"type\": \"text\",\n"
        "    \"required\": true,\n"
        "    \"conditions\": [\n"
        "      {\n"
        "        \"field\": \"has_license\",\n"
        "        \"value\": true\n"
        "      }\n"
        "    ]\n"
        "  }\n"
        "]\n"
        "4. Submit the form. Verify that the form is successfully created and redirected to the home page or list of forms.\n"
        "5. Click the Logout button.\n"
        "6. Sign up as a new user with username 'john' and password 'password123' at http://127.0.0.1:3000/signup. This user must be saved with the USER role.\n"
        "7. Navigate to the newly created form at http://127.0.0.1:3000/forms/<form-id> (or click it from the list of forms on the home page).\n"
        "8. Test client/server-side validation for age: Fill in Full Name 'John Doe', Age '16', leave 'Do you have a driver's license?' unchecked, and submit. Verify that an error message (e.g. 'Age must be at least 18') is shown and submission is blocked.\n"
        "9. Test client/server-side validation for conditional field: Change Age to '25', check 'Do you have a driver's license?' (set to true), leave 'License Number' blank, and submit. Verify that an error message (e.g. 'License Number is required') is shown and submission is blocked.\n"
        "10. Test successful submission: Enter License Number 'DL-99999' and submit. Verify submission succeeds (redirected to home page or shown a success message).\n"
        "11. Click Logout.\n"
        "12. Log in as 'admin' / 'password123'. Navigate to the responses page for this form at http://127.0.0.1:3000/forms/<form-id>/responses. Verify that John Doe's response is listed in a table or list showing: Full Name: 'John Doe', Age: 25, Has License: true, and License Number: 'DL-99999'."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
