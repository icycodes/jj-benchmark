import pytest
import subprocess
import os
import socket
import requests
import shutil
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
        timeout = 240
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
        subprocess.run(["wasp", "db", "seed", "devSeedSimple"], cwd=PROJECT_DIR, check=True)

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

def test_custom_middleware_or_endpoint():
    """Verify that a custom API endpoint is defined in main.wasp.ts and implemented in src/."""
    main_wasp = os.path.join(PROJECT_DIR, "main.wasp.ts")
    assert os.path.isfile(main_wasp), "main.wasp.ts does not exist."
    with open(main_wasp, "r", errors="ignore") as f:
        wasp_content = f.read()

    assert "api(" in wasp_content, "A custom API endpoint must be declared in main.wasp.ts using the api() constructor."

def test_task_verification(start_app, browser_verifier):
    reason = "Developer portal must manage API keys, track custom usage quotas, and enforce rate limits correctly."
    truth = (
        "1. Navigate to http://127.0.0.1:3000/login.\n"
        "2. Log in using username 'devuser' and password 'password123'.\n"
        "3. Verify that you are redirected to the main dashboard page.\n"
        "4. Generate a new API key named 'TestKey' with a quota of 5 requests.\n"
        "5. Verify that the generated key is displayed in the list and copy its value.\n"
        "6. Use the 'Test API Key' section on the page to make 5 successful requests using this key.\n"
        "7. Verify that for each of the 5 requests, the response status is 200 and the response body indicates success.\n"
        "8. Verify that the API Key usage dashboard increments and shows the usage is 5/5.\n"
        "9. Try to make a 6th request using the same key, and verify that the request is blocked with an HTTP 429 status code and a 'Quota exceeded' error message.\n"
        "10. Verify that the logs section displays the requests with the correct HTTP statuses (200 for the first five, 429 for the sixth).\n"
        "11. Generate a second API key named 'RateLimitKey' with a quota of 10 requests.\n"
        "12. Use the 'Test API Key' section to make 4 rapid requests within 2 seconds using the second key.\n"
        "13. Verify that the first 3 requests succeed with HTTP 200, and the 4th request is rate-limited with HTTP 429 and a 'Rate limit exceeded' error message.\n"
        "14. Wait 10 seconds, then try again and verify that the next request succeeds with HTTP 200."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
