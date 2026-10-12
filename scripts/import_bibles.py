"""Build the offline WEB and KJV assets from pinned eBible VPL archives.

Run: python scripts/import_bibles.py
The input archives are downloaded only at build time, never by the app.
"""

from __future__ import annotations

import hashlib
import argparse
import json
import re
import urllib.request
import zipfile
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public" / "bibles"

BOOKS = [
    ("GEN", "Genesis"), ("EXO", "Exodus"), ("LEV", "Leviticus"),
    ("NUM", "Numbers"), ("DEU", "Deuteronomy"), ("JOS", "Joshua"),
    ("JDG", "Judges"), ("RUT", "Ruth"), ("1SA", "1 Samuel"),
    ("2SA", "2 Samuel"), ("1KI", "1 Kings"), ("2KI", "2 Kings"),
    ("1CH", "1 Chronicles"), ("2CH", "2 Chronicles"), ("EZR", "Ezra"),
    ("NEH", "Nehemiah"), ("EST", "Esther"), ("JOB", "Job"),
    ("PSA", "Psalms"), ("PRO", "Proverbs"), ("ECC", "Ecclesiastes"),
    ("SOL", "Song of Solomon"), ("ISA", "Isaiah"), ("JER", "Jeremiah"),
    ("LAM", "Lamentations"), ("EZE", "Ezekiel"), ("DAN", "Daniel"),
    ("HOS", "Hosea"), ("JOE", "Joel"), ("AMO", "Amos"),
    ("OBA", "Obadiah"), ("JON", "Jonah"), ("MIC", "Micah"),
    ("NAH", "Nahum"), ("HAB", "Habakkuk"), ("ZEP", "Zephaniah"),
    ("HAG", "Haggai"), ("ZEC", "Zechariah"), ("MAL", "Malachi"),
    ("MAT", "Matthew"), ("MAR", "Mark"), ("LUK", "Luke"),
    ("JOH", "John"), ("ACT", "Acts"), ("ROM", "Romans"),
    ("1CO", "1 Corinthians"), ("2CO", "2 Corinthians"),
    ("GAL", "Galatians"), ("EPH", "Ephesians"), ("PHI", "Philippians"),
    ("COL", "Colossians"), ("1TH", "1 Thessalonians"),
    ("2TH", "2 Thessalonians"), ("1TI", "1 Timothy"),
    ("2TI", "2 Timothy"), ("TIT", "Titus"), ("PHM", "Philemon"),
    ("HEB", "Hebrews"), ("JAM", "James"), ("1PE", "1 Peter"),
    ("2PE", "2 Peter"), ("1JO", "1 John"), ("2JO", "2 John"),
    ("3JO", "3 John"), ("JUD", "Jude"), ("REV", "Revelation"),
]

SOURCES = {
    "web": {
        "url": "https://ebible.org/Scriptures/engwebp_vpl.zip",
        "sha256": "552e5a3e6dec9bfda4f95c2b1e86a2add1ba50b6f727609dff925de61e36e74b",
        "member": "engwebp_vpl.txt",
        "edition": "World English Bible (engwebp)",
        "expected_verses": 31103,
    },
    "kjv": {
        "url": "https://ebible.org/Scriptures/eng-kjv_vpl.zip",
        "sha256": "970b0564b6816737928ebfb2fec910b96586e242c6311927f3b6c507b76418f3",
        "member": "eng-kjv_vpl.txt",
        "edition": "King James Version (eng-kjv, 1769 text; 66-book canon)",
        "expected_verses": 31102,
    },
}

VERSE = re.compile(r"^([1-4]?[A-Z]{2,3}) (\d+):(\d+) ?(.*)$")


def build(translation: str, meta: dict[str, str | int], archive_dir: Path | None) -> None:
    archive_name = str(meta["member"]).replace(".txt", ".zip")
    if archive_dir is not None:
        archive = (archive_dir / archive_name).read_bytes()
    else:
        request = urllib.request.Request(
            str(meta["url"]),
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Accept": "*/*",
            },
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            archive = response.read()
    digest = hashlib.sha256(archive).hexdigest()
    if digest != meta["sha256"]:
        raise ValueError(f"{translation}: source archive changed ({digest})")

    with zipfile.ZipFile(BytesIO(archive)) as package:
        lines = package.read(str(meta["member"])).decode("utf-8-sig").splitlines()

    names = dict(BOOKS)
    result = {code: {"code": code, "name": name, "chapters": []} for code, name in BOOKS}
    total = 0
    for line in lines:
        match = VERSE.match(line)
        if not match:
            raise ValueError(f"{translation}: unrecognized VPL line: {line[:100]}")
        code, chapter_raw, verse_raw, text = match.groups()
        text = text.lstrip("¶ ")
        if code not in names:
            # The KJV source also contains Deuterocanon/Apocrypha. MVP uses
            # the same 66-book navigation for both editions.
            continue
        chapter, verse = int(chapter_raw), int(verse_raw)
        chapters = result[code]["chapters"]
        while len(chapters) < chapter:
            chapters.append([])
        if chapters[chapter - 1] and chapters[chapter - 1][-1][0] >= verse:
            raise ValueError(f"{translation}: verses out of order at {code} {chapter}:{verse}")
        chapters[chapter - 1].append([verse, text])
        total += 1

    if total != meta["expected_verses"] or any(not x["chapters"] for x in result.values()):
        raise ValueError(f"{translation}: incomplete canon ({total} verses)")

    output = {
        "translation": translation,
        "edition": meta["edition"],
        "source": meta["url"],
        "books": list(result.values()),
        "verseCount": total,
    }
    DEST.mkdir(parents=True, exist_ok=True)
    path = DEST / f"{translation}.json"
    path.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{translation}: {total} verses -> {path} ({path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive-dir", type=Path, help="Directory containing the pinned VPL ZIP files")
    args = parser.parse_args()
    for key, source in SOURCES.items():
        build(key, source, args.archive_dir)
