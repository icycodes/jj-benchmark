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
        print("Running database migrations...")
        subprocess.run(["wasp", "db", "migrate-dev", "--name", "init"], cwd=PROJECT_DIR, check=True)
        print("Seeding database...")
        subprocess.run(["wasp", "db", "seed", "seedDevData"], cwd=PROJECT_DIR, check=True)

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

def test_database_schema():
    """Verify that the required models are defined in schema.prisma."""
    schema_path = os.path.join(PROJECT_DIR, "schema.prisma")
    assert os.path.isfile(schema_path), "schema.prisma does not exist."
    with open(schema_path, "r") as f:
        schema_content = f.read()

    assert "model User" in schema_content, "User model is missing in schema.prisma."
    assert "model Channel" in schema_content, "Channel model is missing in schema.prisma."
    assert "model Message" in schema_content, "Message model is missing in schema.prisma."
    assert "model ReadReceipt" in schema_content, "ReadReceipt model is missing in schema.prisma."

def test_wasp_config():
    """Verify that the Wasp configuration references WebSockets."""
    config_path = os.path.join(PROJECT_DIR, "main.wasp.ts")
    assert os.path.isfile(config_path), "main.wasp.ts does not exist."
    with open(config_path, "r") as f:
        config_content = f.read()

    assert "webSocket" in config_content, "WebSocket configuration is missing in main.wasp.ts."
    assert "webSocketFn" in config_content, "webSocketFn reference is missing in main.wasp.ts."

def test_task_verification(start_app, browser_verifier):
    """Run browser-based verification using PochiVerifier."""
    reason = "Real-time chat must support channels, active user tracking, typing indicators, and real-time read receipts."
    truth = (
        "1. Open two browser sessions. In Session 1, navigate to http://127.0.0.1:3000/login, and log in as 'alice' with password 'password123'.\n"
        "2. In Session 2, navigate to http://127.0.0.1:3000/login, and log in as 'bob' with password 'password123'.\n"
        "3. In Session 1, click on the '#general' channel. Verify the active users list has exactly 'alice'.\n"
        "4. In Session 2, click on the '#general' channel. Verify both sessions now show 'alice' and 'bob' in their active users lists.\n"
        "5. In Session 1, type something in the message input field. Verify that Session 2 displays a typing indicator for 'alice'.\n"
        "6. Stop typing in Session 1 and wait 4 seconds. Verify that the typing indicator for 'alice' disappears in Session 2.\n"
        "7. In Session 1, type 'Hello Bob!' and click Send. Verify that the message immediately appears in Session 2's message list.\n"
        "8. Verify that Session 1 immediately shows 'bob' in the read receipts list for the 'Hello Bob!' message, because bob is active in the channel.\n"
        "9. In Session 2, click the back link to return to the channels list page. Verify that in Session 1, 'bob' is removed from the active users list.\n"
        "10. In Session 1, send 'Are you there?'. Verify that the read receipts list for 'Are you there?' is empty.\n"
        "11. In Session 2, click on '#general' to re-enter the channel. Verify that in Session 1, the 'Are you there?' message now shows 'bob' in its read receipts list."
    )
    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_task_verification"
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
