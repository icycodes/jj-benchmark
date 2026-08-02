import os
import shutil
import pytest

PROJECT_DIR = "/home/user/app"

def test_wasp_cli_available():
    assert shutil.which("wasp") is not None, "Wasp CLI ('wasp') is not available in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_main_wasp_ts_exists():
    wasp_spec_path = os.path.join(PROJECT_DIR, "main.wasp.ts")
    assert os.path.isfile(wasp_spec_path), f"Wasp spec file {wasp_spec_path} is missing."
