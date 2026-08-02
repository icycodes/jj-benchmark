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
    assert os.path.isdir(project_dir), f"{project_dir} is not a directory."

def test_initial_files_exist():
    project_dir = "/home/user/app"
    required_files = ["main.wasp.ts", "package.json", "schema.prisma"]
    for f in required_files:
        path = os.path.join(project_dir, f)
        assert os.path.isfile(path), f"Initial file {f} is missing in {project_dir}."
