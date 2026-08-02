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
    reason = "Review system must support star ratings, upvotes, and moderation queue workflows."
    truth = (
        "1. Navigate to http://127.0.0.1:3000/signup. "
        "2. Register a regular user 'user1' with password 'password123'. "
        "3. Navigate to '/' and select the first product ('Wireless Headphones'). "
        "4. Submit a review with rating '4', title 'Great headphones', and content 'These are really great headphones!'. "
        "5. Verify that the review is NOT displayed on the product page yet, and the average rating is still 'No reviews yet' or '0' (since it is pending moderation). "
        "6. Submit another review that is spam: rating '5', title 'Buy now!', and content 'Get cheap crypto here!'. "
        "7. Verify that this spam review is also NOT displayed. "
        "8. Click logout. "
        "9. Navigate to '/signup' and register an admin user 'admin' with password 'password123'. "
        "10. Navigate to '/moderation'. Verify that the review 'Great headphones' is visible in the moderation queue, but the spam review 'Buy now!' is NOT visible. "
        "11. Click the 'Approve' button for the 'Great headphones' review. "
        "12. Verify that the approved review is no longer in the moderation list. "
        "13. Navigate back to '/' and click on 'Wireless Headphones'. "
        "14. Verify that the review 'Great headphones' is now visible on the product page, and the average rating has updated to '4' or '4.0'."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
