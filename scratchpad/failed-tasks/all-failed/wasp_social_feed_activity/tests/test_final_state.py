import pytest
import subprocess
import os
import socket
import requests
import time
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
        subprocess.run(["wasp", "db", "seed", "devSeedSimple"], cwd=PROJECT_DIR, check=True)
        xprocess.ensure(Starter.name, Starter)
    except Exception as e:
        print(f"Startup failed: {e}")
        raise e
    yield
    info.terminate()

def test_task_verification(start_app, browser_verifier):
    reason = "Social feed must support nested comments, likes, and customized activity feeds."
    truth = (
        "Navigate to http://127.0.0.1:3000. Log in as alice (password: password123). "
        "Create a post with title 'Alice First Post' and content 'Hello world from Alice!'. "
        "Under the newly created post, add a top-level comment 'Great post!'. "
        "Under that comment, add a nested reply 'Thank you!'. "
        "Like the post by clicking the like button (verify it shows 1 like). "
        "Log out of alice's account. "
        "Log in as bob (password: password123). "
        "Verify that bob's activity feed (the element with id='activity-feed' or data-testid='activity-feed') "
        "displays the activities performed by alice: creating the post, commenting on the post, and liking the post."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
