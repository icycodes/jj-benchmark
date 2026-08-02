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

def test_files_exist():
    required_files = [
        "main.wasp.ts",
        "schema.prisma"
    ]
    for f in required_files:
        path = os.path.join(PROJECT_DIR, f)
        assert os.path.isfile(path), f"Required file {path} is missing."

def test_task_verification(start_app, browser_verifier):
    reason = "User role and subscription plan restrictions must be applied correctly in the SaaS application."
    truth = (
        "1. Open http://127.0.0.1:3000/signup. Create an account with username 'bob' and password 'password123'. "
        "After registration, log out.\n"
        "2. Open http://127.0.0.1:3000/signup again. Create an account with username 'alice' and password 'password123'.\n"
        "3. As 'alice', you should be on the dashboard page (/). Create an organization by entering 'Acme Corp' "
        "into the organization name input and clicking 'Create Organization'.\n"
        "4. You should be redirected to the organization details page at /organization/<id>. "
        "Verify that you see the organization name 'Acme Corp', that your role is displayed as 'OWNER', "
        "and that the current plan is displayed as 'FREE'.\n"
        "5. Under the 'Features' section on the same page, verify that:\n"
        "   - The Analytics feature displays 'Upgrade to PRO to access Analytics'.\n"
        "   - The Audit Logs feature displays 'Upgrade to ENTERPRISE to access Audit Logs'.\n"
        "6. In the 'Add Member' section, type 'bob' in the username input, select the role 'MEMBER', and click 'Add Member'. "
        "Verify that 'bob' appears in the members list with the role 'MEMBER'.\n"
        "7. In the billing/plan section, select 'PRO' from the plan dropdown and click 'Update Plan'. "
        "Verify that the displayed current plan updates to 'PRO'.\n"
        "8. In the 'Features' section, verify that:\n"
        "   - The Analytics feature now displays 'Analytics Data: Active'.\n"
        "   - The Audit Logs feature still displays 'Upgrade to ENTERPRISE to access Audit Logs'.\n"
        "9. Click 'Logout' to log out of Alice's account.\n"
        "10. Log in as 'bob' with password 'password123'. Go to the dashboard page at / and click the link/button to view "
        "the 'Acme Corp' organization details page at /organization/<id>.\n"
        "11. Verify that Bob's role is displayed as 'MEMBER' and the current plan is 'PRO'.\n"
        "12. Verify that Bob can see the active Analytics feature ('Analytics Data: Active').\n"
        "13. Verify that the 'Add Member' form is not visible to Bob, or displays 'Only Owners and Admins can add members'.\n"
        "14. Verify that the billing/plan update controls are not visible to Bob, or display 'Only Owners can manage billing'."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
