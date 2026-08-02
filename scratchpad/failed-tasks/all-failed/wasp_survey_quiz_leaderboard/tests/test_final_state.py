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
        terminate_on_interrupt = True

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
    printed_log_lines = 0

    def capture_logs(tag):
        nonlocal printed_log_lines
        if os.path.exists(info.logpath):
            with open(info.logpath, "r", errors="ignore") as f:
                all_lines = f.readlines()
            new_lines = all_lines[printed_log_lines:]
            skipped = printed_log_lines
            printed_log_lines = len(all_lines)
            print(f"============================== [{tag}: Begin] Captured {Starter.name} logfile ==============================")
            if skipped > 0:
                print(f"(skipped {skipped} already-printed lines)")
            print("".join(new_lines))
            print(f"============================== [{tag}: End  ] Captured {Starter.name} logfile ==============================")

    started = False
    try:
        # Run db migration and seed before starting the app
        print("Running database migrations...")
        subprocess.run(["wasp", "db", "migrate-dev", "--name", "init"], cwd=PROJECT_DIR, check=True)
        print("Seeding database...")
        subprocess.run(["wasp", "db", "seed", "seedQuizData"], cwd=PROJECT_DIR, check=True)

        print("Starting Wasp application...")
        xprocess.ensure(Starter.name, Starter)
        started = True
    except Exception as e:
        print(f"Startup failed: {e}")
        capture_logs("FAILED")
        raise e
    finally:
        if started:
            capture_logs("STARTED")

    yield
    capture_logs("TEARDOWN")
    info.terminate()

def test_task_verification(start_app, browser_verifier):
    reason = "Interactive quiz platform must enforce timers, calculate scores with weightings, and update leaderboards."
    truth = (
        "1. Navigate to http://127.0.0.1:3000/login.\n"
        "2. Log in using username 'quizmaster' and password 'password123'.\n"
        "3. Verify that you are redirected to the homepage at http://127.0.0.1:3000/.\n"
        "4. Verify that the quiz list shows 'JavaScript & Wasp Trivia' (data-testid=\"quiz-title-1\").\n"
        "5. Verify that the leaderboard (data-testid=\"leaderboard\") contains the competitor row (data-testid=\"leaderboard-row\") with username 'competitor' (data-testid=\"leaderboard-username\"), score '25' (data-testid=\"leaderboard-score\"), and time taken '5' (data-testid=\"leaderboard-time\").\n"
        "6. Click the 'Start Quiz' button for 'JavaScript & Wasp Trivia' (data-testid=\"start-quiz-btn-1\").\n"
        "7. Verify that you are redirected to the quiz taking page (e.g. /quiz/2).\n"
        "8. Verify that the countdown timer (data-testid=\"timer\") is visible and starts counting down from 30.\n"
        "9. Answer all questions correctly:\n"
        "   - Question 1: Select choice 'import ... with { type: 'ref' }' (choice with data-testid=\"choice-1\" or similar correct option).\n"
        "   - Question 2: Select choice 'SQLite' (choice with data-testid=\"choice-5\" or similar correct option).\n"
        "   - Question 3: Select choice '@wasp.sh/spec' (choice with data-testid=\"choice-9\" or similar correct option).\n"
        "10. Click the 'Submit Quiz' button (data-testid=\"submit-quiz-btn\").\n"
        "11. Verify that you are redirected to the results page (e.g. /results/2).\n"
        "12. Verify that the results page shows:\n"
        "    - Score: '50' (data-testid=\"results-score\").\n"
        "    - Timeout status: 'No' or 'Completed' (data-testid=\"results-timeout\").\n"
        "    - Time taken: a valid duration in seconds (data-testid=\"results-duration\").\n"
        "13. Click the 'Go Home' button (data-testid=\"go-home-btn\").\n"
        "14. Verify that you are redirected back to the homepage.\n"
        "15. Verify that the leaderboard now displays 'quizmaster' at the top with score '50', followed by 'competitor' with score '25'."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
