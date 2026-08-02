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
    reason = "The background job queue must process campaigns with proper rate limiting and retries."
    truth = "Navigate to http://127.0.0.1:3000. Sign up at /signup with username 'testuser' and password 'password123'. Log in and navigate to the dashboard at /. Click the button with id='trigger-campaign' to trigger a campaign with 10 emails (8 normal, 2 containing 'fail' in the address). Verify that the first 5 emails are processed immediately, while the rest are rate-limited and retried. Wait for at least 60-70 seconds and verify that the campaign status eventually changes to 'COMPLETED' with sentCount === 10 and failedCount === 0, and that the failing emails show exactly 3 attempts in the UI/database."
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
