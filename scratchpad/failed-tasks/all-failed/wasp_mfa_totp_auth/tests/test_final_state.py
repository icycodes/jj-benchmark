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
    reason = "TOTP-based Multi-Factor Authentication must be correctly implemented and verified."
    truth = (
        "Navigate to http://127.0.0.1:3000/signup. Sign up with a new user (e.g., username 'user_mfa' and password 'Password123!'). "
        "Log in, and verify you are redirected to the homepage '/' showing '2FA Status: Disabled'. "
        "Click 'Enable 2FA' to open the setup section. Read the raw TOTP secret from the page (format 'Secret: <secret_code>'). "
        "Generate a valid 6-digit TOTP token using the secret. Enter the token and click 'Confirm & Enable'. "
        "Verify that '2FA Status: Enabled' is displayed. Log out, and then log in again with the same credentials. "
        "Verify you are redirected to '/verify-2fa'. Generate a valid TOTP token, enter it, and click 'Verify'. "
        "Verify you are redirected to '/' and can add/view secret notes."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
