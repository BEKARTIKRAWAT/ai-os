import subprocess
import tempfile
import os
import sys

def execute_code(code: str, language: str) -> dict:
    try:
        if language == "python":
            return run_python(code)
        elif language in ["javascript", "js", "node"]:
            return run_javascript(code)
        elif language in ["bash", "shell", "sh"]:
            return run_bash(code)
        else:
            return {
                "output": f"Language '{language}' supported nahi hai abhi.",
                "error": None,
                "success": False
            }
    except Exception as e:
        return {
            "output": "",
            "error": str(e),
            "success": False
        }

def run_python(code: str) -> dict:
    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.py',
        delete=False,
        encoding='utf-8'
    ) as f:
        modified_code = "import builtins\nbuiltins.input = lambda x='': '10'\n" + code
        f.write(modified_code)
        temp_file = f.name

    try:
        result = subprocess.run(
            [sys.executable, temp_file],
            capture_output=True,
            text=True,
            timeout=30,
            encoding='utf-8'
        )
        return {
            "output": result.stdout,
            "error": result.stderr if result.stderr else None,
            "success": result.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {
            "output": "",
            "error": "⏰ Code timeout — 30 seconds se zyada time lag raha hai!",
            "success": False
        }
    finally:
        os.unlink(temp_file)

def run_javascript(code: str) -> dict:
    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.js',
        delete=False,
        encoding='utf-8'
    ) as f:
        f.write(code)
        temp_file = f.name

    try:
        result = subprocess.run(
            ["node", temp_file],
            capture_output=True,
            text=True,
            timeout=30,
            encoding='utf-8'
        )
        return {
            "output": result.stdout,
            "error": result.stderr if result.stderr else None,
            "success": result.returncode == 0
        }
    except FileNotFoundError:
        return {
            "output": "",
            "error": "Node.js install nahi hai!",
            "success": False
        }
    except subprocess.TimeoutExpired:
        return {
            "output": "",
            "error": "⏰ Code timeout!",
            "success": False
        }
    finally:
        os.unlink(temp_file)

def run_bash(code: str) -> dict:
    try:
        result = subprocess.run(
            code,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30,
            encoding='utf-8'
        )
        return {
            "output": result.stdout,
            "error": result.stderr if result.stderr else None,
            "success": result.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {
            "output": "",
            "error": "⏰ Code timeout!",
            "success": False
        }

def detect_language(code: str) -> str:
    code_lower = code.lower()

    if "console.log" in code or "require(" in code or "const " in code or "let " in code:
        return "javascript"
    elif "print(" in code or "import " in code or "def " in code or "class " in code:
        return "python"
    elif code_lower.startswith("#!/bin/bash") or "echo " in code_lower:
        return "bash"
    else:
        return "python"