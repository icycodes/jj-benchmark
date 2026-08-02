import subprocess
import os

def test_wasp_installed():
    try:
        result = subprocess.run(["wasp", "--version"], capture_output=True, text=True)
        assert result.returncode == 0
    except FileNotFoundError:
        assert False, "Wasp is not installed."

def test_project_dir_exists():
    project_dir = "/home/user/app"
    assert os.path.exists(project_dir), f"Project directory {project_dir} does not exist."
    assert os.path.isfile(os.path.join(project_dir, "main.wasp.ts")), "main.wasp.ts is missing."
    assert os.path.isfile(os.path.join(project_dir, "schema.prisma")), "schema.prisma is missing."
