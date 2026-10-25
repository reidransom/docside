#!/usr/bin/env python3
"""Compile the shipped stylesheet and default light palette."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


if __name__ == "__main__":
    subprocess.run(
        ["sass", "--no-source-map", str(ROOT / "_sass/docifly.scss"),
         str(ROOT / "assets/docifly.css")],
        check=True,
    )
