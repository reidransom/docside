#!/usr/bin/env python3
"""Import and check the pinned, local Basecoat standalone distribution."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[2]
DESTINATION = ROOT / "assets/vendor/basecoat"
PACKAGE = "basecoat-css"
VERSION = "1.1.0"
ARCHIVE_URL = f"https://registry.npmjs.org/{PACKAGE}/-/{PACKAGE}-{VERSION}.tgz"
DISTRIBUTION_URL = f"https://cdn.jsdelivr.net/npm/{PACKAGE}@{VERSION}/"
METADATA_MEMBER = "package/package.json"
FILES = {
    "basecoat.cdn.min.css": "package/dist/basecoat.cdn.min.css",
    "LICENSE.md": "package/LICENSE.md",
}
MANIFEST = "manifest.json"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_archive(archive: Path) -> dict[str, bytes]:
    """Read only the allowlisted regular files, without extracting any paths."""
    data = archive.read_bytes()
    required = {METADATA_MEMBER, *FILES.values()}
    selected = {}
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as source:
        for member in source:
            if member.name not in required:
                continue
            if member.name in selected:
                raise ValueError(f"Duplicate required archive member: {member.name}")
            if not member.isfile():
                raise ValueError(f"Required member is not a regular file: {member.name}")
            with source.extractfile(member) as stream:
                selected[member.name] = stream.read()
    missing = required - selected.keys()
    if missing:
        raise ValueError(f"Missing required archive members: {', '.join(sorted(missing))}")
    metadata = json.loads(selected[METADATA_MEMBER])
    if not isinstance(metadata, dict) or (
        metadata.get("name"), metadata.get("version"), metadata.get("license")
    ) != (PACKAGE, VERSION, "MIT"):
        raise ValueError(f"Expected {PACKAGE}@{VERSION} with its MIT license")
    if any(not selected[member] for member in FILES.values()):
        raise ValueError("Required CSS and license must not be empty")
    # Preserve dependency notices in the original CSS, as well as listing them
    # in the manifest. Never strip comments or rewrite the stylesheet.
    notices = re.findall(rb"/\*!.*?\*/", selected[FILES["basecoat.cdn.min.css"]], re.S)
    manifest = {
        "schema_version": 1,
        "package": {
            "name": PACKAGE,
            "version": VERSION,
            "license": "MIT",
            "metadata_member": METADATA_MEMBER,
            "metadata_sha256": digest(selected[METADATA_MEMBER]),
        },
        "archive": {"url": ARCHIVE_URL, "sha256": digest(data)},
        "files": {
            name: {
                "member": member,
                "url": DISTRIBUTION_URL + member.removeprefix("package/"),
                "sha256": digest(selected[member]),
                "bytes": len(selected[member]),
            }
            for name, member in FILES.items()
        },
        "retained_css_notices": [notice.decode("utf-8") for notice in notices],
    }
    return {
        **{name: selected[member] for name, member in FILES.items()},
        MANIFEST: (json.dumps(manifest, indent=2) + "\n").encode("utf-8"),
    }


def import_archive(archive: Path, destination: Path = DESTINATION) -> None:
    # Validate every input before touching the existing installation. Stage all
    # outputs together and roll back the directory rename if publication fails.
    outputs = read_archive(archive)
    if destination.is_symlink():
        raise ValueError("Vendor destination must not be a symbolic link")
    if destination.exists() and not destination.is_dir():
        raise ValueError("Vendor destination must be a directory")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".basecoat-", dir=destination.parent) as temporary:
        staging = Path(temporary) / "new"
        backup = Path(temporary) / "previous"
        staging.mkdir()
        for name, data in outputs.items():
            (staging / name).write_bytes(data)
        existed = destination.exists()
        if existed:
            os.replace(destination, backup)
        try:
            os.replace(staging, destination)
        except OSError:
            if existed:
                os.replace(backup, destination)
            raise


def check(destination: Path = DESTINATION) -> None:
    """Verify installed bytes and pinned provenance without needing the archive."""
    manifest_path = destination / MANIFEST
    if destination.is_symlink() or manifest_path.is_symlink():
        raise ValueError("Vendor directory and manifest must not be symbolic links")
    manifest = json.loads(manifest_path.read_bytes())
    if not isinstance(manifest, dict) or manifest.get("schema_version") != 1:
        raise ValueError("Unsupported Basecoat manifest")
    package = manifest.get("package")
    if not isinstance(package, dict) or any(package.get(key) != value for key, value in {
        "name": PACKAGE, "version": VERSION, "license": "MIT", "metadata_member": METADATA_MEMBER,
    }.items()):
        raise ValueError("Manifest does not describe the pinned Basecoat package")
    archive = manifest.get("archive")
    if not isinstance(archive, dict) or archive.get("url") != ARCHIVE_URL:
        raise ValueError("Manifest archive source does not match the pinned release")
    for value in (archive.get("sha256"), package.get("metadata_sha256")):
        if not isinstance(value, str) or not re.fullmatch(r"[0-9a-f]{64}", value):
            raise ValueError("Manifest provenance digest is invalid")
    files = manifest.get("files")
    if not isinstance(files, dict) or files.keys() != FILES.keys():
        raise ValueError("Manifest must list exactly the required installed files")
    for name, member in FILES.items():
        record = files[name]
        if not isinstance(record, dict) or (
            record.get("member") != member or
            record.get("url") != DISTRIBUTION_URL + member.removeprefix("package/")
        ):
            raise ValueError(f"Invalid manifest source for {name}")
        path = destination / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"Missing regular installed file: {name}")
        data = path.read_bytes()
        if len(data) != record.get("bytes") or digest(data) != record.get("sha256"):
            raise ValueError(f"Installed file failed integrity check: {name}")
    notices = [notice.decode("utf-8") for notice in re.findall(
        rb"/\*!.*?\*/", (destination / "basecoat.cdn.min.css").read_bytes(), re.S
    )]
    if manifest.get("retained_css_notices") != notices:
        raise ValueError("Manifest dependency notices do not match the installed CSS")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    importer = commands.add_parser("import", help="Import the pinned release from a local archive")
    importer.add_argument("--archive", type=Path, required=True)
    commands.add_parser("check", help="Verify installed files against the manifest, offline")
    args = parser.parse_args()
    try:
        if args.command == "import":
            import_archive(args.archive)
        else:
            check()
    except (OSError, ValueError, EOFError, tarfile.TarError) as error:
        parser.exit(1, f"Basecoat {args.command} failed: {error}\n")
    print(f"Basecoat {PACKAGE}@{VERSION}: {args.command} OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
