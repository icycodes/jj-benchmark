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
        subprocess.run(["wasp", "db", "seed", "seedKanbanData"], cwd=PROJECT_DIR, check=True)

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
    """Run browser-based verification using PochiVerifier."""
    reason = "Kanban board must support persistent card positioning, assignments, subtasks, activity logs, and real-time/frequent synchronization."
    truth = (
        "1. Navigate to http://127.0.0.1:3000/login.\n"
        "2. Log in using username 'testuser' and password 'password123'.\n"
        "3. Verify that you are redirected to the main dashboard page.\n"
        "4. Click on the link to view the 'Project Kanban' board (redirects to /board/1).\n"
        "5. Verify that the columns 'Todo', 'In Progress', and 'Done' are displayed.\n"
        "6. Find the task card 'Implement Auth' under the 'Todo' column. Verify that it is unassigned and shows '0/1 subtasks complete'.\n"
        "7. Move the 'Implement Auth' task card from 'Todo' to 'In Progress' using the move dropdown/select with data-testid='move-list-select-1'.\n"
        "8. Reload the page and verify that 'Implement Auth' remains in the 'In Progress' column.\n"
        "9. Assign the card to 'collabuser' using the assignee dropdown/select with data-testid='assign-user-select-1'.\n"
        "10. Add a new subtask 'Test signup flow' using the input data-testid='new-subtask-input-1' and button data-testid='add-subtask-button-1'. Verify that the subtask status updates to '0/2 subtasks complete'.\n"
        "11. Check the checkbox for the first subtask 'Configure main.wasp.ts' (using data-testid='subtask-checkbox-1' or similar) to mark it as complete. Verify that the status updates to '1/2 subtasks complete'.\n"
        "12. Open a second, concurrent browser tab/session (or log out and log in as 'collabuser' with password 'password123' in a new incognito window/context if possible, otherwise do it sequentially in a new login session).\n"
        "13. Log in as 'collabuser' with password 'password123' and navigate to http://127.0.0.1:3000/board/1.\n"
        "14. Verify that 'Implement Auth' is displayed under 'In Progress', assigned to 'collabuser', with '1/2 subtasks complete'.\n"
        "15. Verify that the task's activity log (data-testid='activity-log-1') contains entries indicating that the task was moved to 'In Progress', assigned to 'collabuser', and subtask was completed."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
