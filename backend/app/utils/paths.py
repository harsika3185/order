import os

def get_project_root() -> str:
    """
    Robustly resolves the absolute path to the project root directory.
    Works whether running from project root, backend folder, or arbitrary subdirectories.
    """
    # 1. Check if CWD is project root
    cwd = os.path.abspath(os.getcwd())
    if os.path.exists(os.path.join(cwd, "models")) and os.path.exists(os.path.join(cwd, "data")):
        return cwd
        
    # 2. Check if parent of CWD is project root (e.g. running inside backend/)
    parent = os.path.abspath(os.path.join(cwd, ".."))
    if os.path.exists(os.path.join(parent, "models")) and os.path.exists(os.path.join(parent, "data")):
        return parent

    # 3. Anchor based on this file's location: backend/app/utils/paths.py -> 3 levels up
    file_anchor = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    return file_anchor

def resolve_path(*subpaths: str) -> str:
    """Resolves a path relative to the project root."""
    return os.path.join(get_project_root(), *subpaths)
