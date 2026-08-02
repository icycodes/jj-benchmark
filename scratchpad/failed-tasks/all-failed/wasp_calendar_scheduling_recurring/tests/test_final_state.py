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
        # Seed the database
        subprocess.run(["wasp", "db", "seed", "seedCalendarUser"], cwd=PROJECT_DIR, check=True)
        xprocess.ensure(Starter.name, Starter)
    except Exception as e:
        print(f"Startup failed: {e}")
        raise e
    yield
    info.terminate()

def test_task_verification(start_app, browser_verifier):
    reason = "Calendar scheduling system must handle recurring events and block conflicting bookings correctly."
    truth = (
        "Navigate to http://127.0.0.1:3000/login. "
        "Log in using username 'calendaruser' and password 'password123'. "
        "Create a recurring event with title 'Weekly Sync', start time '2026-08-03T09:00', end time '2026-08-03T10:00', isRecurring checked, RRULE 'FREQ=WEEKLY;BYDAY=MO', and timezone 'UTC'. "
        "Verify that 'Weekly Sync' is successfully created. "
        "Then, attempt to create a single non-recurring event with title 'Conflicting Meeting', start time '2026-08-10T09:30', end time '2026-08-10T10:30', isRecurring unchecked, and timezone 'UTC'. "
        "Verify that the event creation is rejected with an error message containing 'overlap' or 'conflict' in the element with data-testid='error-message'. "
        "Next, create a single non-recurring event with title 'Tuesday Project Work', start time '2026-08-11T09:00', end time '2026-08-11T10:00', isRecurring unchecked, and timezone 'UTC'. "
        "Verify that 'Tuesday Project Work' is successfully created. "
        "Set the range start to '2026-08-01' and range end to '2026-08-31'. "
        "Verify that the expanded occurrences list (data-testid='expanded-occurrences-list') contains 5 occurrences of 'Weekly Sync' (on August 3, 10, 17, 24, and 31) and 1 occurrence of 'Tuesday Project Work' (on August 11), and does NOT contain any occurrences of 'Conflicting Meeting'."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
