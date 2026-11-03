"""Offline importer regressions using isolated synthetic archives."""

import io
import json
import os
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

import basecoat


class BasecoatTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.destination = self.root / "vendor/basecoat"
        self.archive = self.root / "release.tgz"

    def make_archive(self, *, metadata=None, missing=None, nonregular=None,
                     extra=(), css=b"/*! dependency | MIT License */\n.btn{color:red}"):
        files = {
            basecoat.METADATA_MEMBER: json.dumps(metadata if metadata is not None else {
                "name": "basecoat-css", "version": "1.1.0", "license": "MIT",
            }).encode(),
            basecoat.FILES["basecoat.cdn.min.css"]: css,
            basecoat.FILES["LICENSE.md"]: b"MIT License\nCopyright synthetic fixture\n",
        }
        with tarfile.open(self.archive, "w:gz") as archive:
            for name, data in files.items():
                if name == missing:
                    continue
                member = tarfile.TarInfo(name)
                if name == nonregular:
                    member.type = tarfile.SYMTYPE
                    member.linkname = "../../outside"
                    archive.addfile(member)
                else:
                    member.size = len(data)
                    archive.addfile(member, io.BytesIO(data))
            for name, data in extra:
                member = tarfile.TarInfo(name)
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))
        return self.archive

    def install(self):
        basecoat.import_archive(self.make_archive(), self.destination)
        basecoat.check(self.destination)

    def installed_bytes(self):
        return {path.name: path.read_bytes() for path in self.destination.iterdir()}

    def assert_rejected_without_changes(self, archive):
        previous = self.installed_bytes()
        with self.assertRaises((ValueError, tarfile.TarError, OSError)):
            basecoat.import_archive(archive, self.destination)
        self.assertEqual(previous, self.installed_bytes())
        basecoat.check(self.destination)

    def test_wrong_package_version_or_license_preserves_installation(self):
        self.install()
        for field, value in (("name", "other"), ("version", "9.0.0"), ("license", "ISC")):
            with self.subTest(field=field):
                metadata = {"name": "basecoat-css", "version": "1.1.0", "license": "MIT"}
                metadata[field] = value
                self.assert_rejected_without_changes(self.make_archive(metadata=metadata))

    def test_every_required_member_is_preflighted(self):
        self.install()
        for name in (basecoat.METADATA_MEMBER, *basecoat.FILES.values()):
            for kind in ("missing", "nonregular"):
                with self.subTest(member=name, kind=kind):
                    self.assert_rejected_without_changes(self.make_archive(**{kind: name}))

    def test_duplicate_required_members_are_rejected(self):
        self.install()
        self.assert_rejected_without_changes(self.make_archive(extra=[
            (basecoat.FILES["basecoat.cdn.min.css"], b"ambiguous duplicate"),
        ]))

    def test_malformed_archive_preserves_installation(self):
        self.install()
        self.archive.write_bytes(b"not a tarball")
        self.assert_rejected_without_changes(self.archive)

    def test_malformed_metadata_preserves_installation(self):
        self.install()
        self.assert_rejected_without_changes(self.make_archive(metadata=["unexpected array"]))

    def test_empty_required_output_preserves_installation(self):
        self.install()
        self.assert_rejected_without_changes(self.make_archive(css=b""))

    def test_unallowlisted_paths_cannot_escape_or_add_outputs(self):
        outside = self.root / "outside"
        outside.write_bytes(b"untouched")
        archive = self.make_archive(extra=[
            ("../../outside", b"relative escape"),
            (str(outside), b"absolute escape"),
            ("package/templates/unsafe.html", b"template not shipped"),
            ("package/dist/all.min.js", b"script not shipped"),
            ("package/dist/../../../outside", b"nested escape"),
        ])
        basecoat.import_archive(archive, self.destination)
        basecoat.check(self.destination)
        self.assertEqual(outside.read_bytes(), b"untouched")
        self.assertEqual(set(self.installed_bytes()), {*basecoat.FILES, basecoat.MANIFEST})
        self.assertFalse((self.destination.parent / "outside").exists())

    def test_damaged_or_missing_installed_inputs_fail_check(self):
        self.install()
        for name in (*basecoat.FILES, basecoat.MANIFEST):
            path = self.destination / name
            original = path.read_bytes()
            for damage in ("corrupt", "missing"):
                with self.subTest(file=name, damage=damage):
                    if damage == "corrupt":
                        path.write_bytes(b"corrupted")
                    else:
                        path.unlink()
                    with self.assertRaises((ValueError, OSError)):
                        basecoat.check(self.destination)
                    path.write_bytes(original)

    def test_manifest_cannot_omit_or_redirect_required_files(self):
        self.install()
        path = self.destination / basecoat.MANIFEST
        original = json.loads(path.read_bytes())
        for change in ("omit", "redirect", "version", "archive"):
            with self.subTest(change=change):
                manifest = json.loads(json.dumps(original))
                if change == "omit":
                    del manifest["files"]["LICENSE.md"]
                elif change == "redirect":
                    manifest["files"]["basecoat.cdn.min.css"]["member"] = "../../elsewhere"
                elif change == "version":
                    manifest["package"]["version"] = "2.0.0"
                else:
                    manifest["archive"]["sha256"] = "not a digest"
                path.write_text(json.dumps(manifest))
                with self.assertRaises(ValueError):
                    basecoat.check(self.destination)

    def test_symlink_installed_file_fails_check(self):
        self.install()
        path = self.destination / "basecoat.cdn.min.css"
        outside = self.root / "outside.css"
        outside.write_bytes(path.read_bytes())
        path.unlink()
        path.symlink_to(outside)
        with self.assertRaises(ValueError):
            basecoat.check(self.destination)

    def test_symlink_destination_cannot_redirect_import(self):
        self.install()
        actual = self.root / "actual"
        self.destination.rename(actual)
        self.destination.symlink_to(actual, target_is_directory=True)
        previous = {path.name: path.read_bytes() for path in actual.iterdir()}
        with self.assertRaises(ValueError):
            basecoat.import_archive(self.make_archive(css=b"changed"), self.destination)
        self.assertEqual(previous, {path.name: path.read_bytes() for path in actual.iterdir()})

    def test_staging_failure_leaves_installation_unchanged(self):
        self.install()
        previous = self.installed_bytes()
        archive = self.make_archive(css=b"updated CSS")
        with patch.object(Path, "write_bytes", side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                basecoat.import_archive(archive, self.destination)
        self.assertEqual(previous, self.installed_bytes())
        basecoat.check(self.destination)

    def test_publication_failure_restores_previous_distribution(self):
        self.install()
        previous = self.installed_bytes()
        replace = os.replace

        def fail_publication(source, destination):
            if Path(source).name == "new":
                raise OSError("publication failed")
            return replace(source, destination)

        with patch.object(basecoat.os, "replace", side_effect=fail_publication):
            with self.assertRaises(OSError):
                basecoat.import_archive(self.make_archive(css=b"updated CSS"), self.destination)
        self.assertEqual(previous, self.installed_bytes())
        basecoat.check(self.destination)

    def test_successful_refresh_publishes_new_distribution(self):
        self.install()
        previous = self.installed_bytes()["basecoat.cdn.min.css"]
        basecoat.import_archive(self.make_archive(css=b"body{color:blue}"), self.destination)
        basecoat.check(self.destination)
        self.assertNotEqual(previous, self.installed_bytes()["basecoat.cdn.min.css"])


if __name__ == "__main__":
    unittest.main()
