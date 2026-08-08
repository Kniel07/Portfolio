# Résumé version control

This folder is the source of truth for Kirk's résumé. It replaces the old
single static PDF in `assets/` with an editable Markdown source plus an
immutable, month-by-month archive of every published version.

## Layout

```
resume/
├── source/
│   └── resume.md          canonical, freely-editable draft
├── current/
│   ├── resume.md           mirror of the latest PUBLISHED version
│   ├── resume.pdf          mirror of the latest PUBLISHED version — this is
│   │                        what index.html's PDF download links to
│   └── resume.docx         mirror of the latest PUBLISHED version — this is
│                            what index.html's Word download links to
└── versions/
    └── <YEAR>/
        └── <YYYY-MM>/
            ├── resume.md    frozen snapshot of source at publish time
            ├── resume.pdf   the designed/exported PDF for this version
            ├── resume.docx  the designed/exported Word doc for this version
            ├── metadata.yml version, revision, status, created, base_version
            └── CHANGELOG.md what changed and why
```

## The rule: one immutable version per month

- `resume/versions/` is a historical archive. **Once a version folder is
  committed, its files are never edited, renamed, or deleted** — not by hand,
  not by an AI assistant. A GitHub Action
  (`.github/workflows/resume-immutability.yml`) enforces this on every pull
  request: it fails the build if any pre-existing file under
  `resume/versions/` is modified or removed. Only new files/folders may be
  added.
- Need to fix something you already published this month? Don't touch the
  existing folder — publish a same-month **revision** instead (see below).
  It sits alongside the original as `<YYYY-MM>-r02`, `-r03`, etc.
- `resume/current/` is the only mutable pointer. It always mirrors the most
  recently published version and is what the live site downloads.

## Workflow

1. **Edit** `resume/source/resume.md` whenever your experience changes.
   Nothing else is affected by this — no version is created yet.

2. **Publish a new version** when you're ready to snapshot the current
   month's résumé:

   ```
   scripts/resume_publish.sh new            # defaults to the current YYYY-MM
   scripts/resume_publish.sh new 2026-09     # or publish an explicit month
   ```

   This creates `resume/versions/<YEAR>/<YYYY-MM>/` with `resume.md`,
   `metadata.yml`, and a `CHANGELOG.md` template. It does **not** touch
   `resume/current/` yet.

3. **Fill in the changelog** in the new version's `CHANGELOG.md`
   (Added / Updated / Removed / Reason). Diffing against the previous
   version's `resume.md` is a good way to see exactly what changed.

4. **Add the PDF and Word doc.** This repo does not auto-render Markdown
   into a PDF or docx — the résumé has bespoke visual design that a plain
   converter wouldn't reproduce. Export/design both yourself and save them
   as `resume/versions/<YEAR>/<YYYY-MM>/resume.pdf` and
   `resume/versions/<YEAR>/<YYYY-MM>/resume.docx`.

5. **Promote it to current:**

   ```
   scripts/resume_publish.sh update-current 2026-09
   ```

   This refuses to run (and leaves `resume/current/` completely untouched)
   unless a real, non-empty `resume.pdf` **and** `resume.docx` already exist
   for that version — the live download links are never left broken or
   mismatched mid-publish.

### Same-month corrections

If you find a mistake in an already-published month, don't edit that
folder. Publish a revision instead:

```
scripts/resume_publish.sh new 2026-09 --revision   # creates 2026-09-r02
```

Then repeat steps 3–5 for the revision folder.

### Optional: tag a published version

Not automated, but if you want an extra anchor point:

```
git tag resume-2026-09
git push origin resume-2026-09
```

## Résumé design on the site

The site's "Download Résumé" button offers both formats (PDF and Word)
directly, using whichever résumé *design* is currently selected. There's
also a hidden design picker: 9 consecutive clicks/taps on the footer
copyright opens a "Résumé Design" sheet with a preview of each available
design, a radio control to select one, and an "Apply Design" button. The
selection is stored in the browser (`localStorage`) and applies to both
PDF and Word downloads from then on; visitors who never find it always get
the default design.

Two designs exist today, both built from the exact same content
(`resume/source/resume.md` / `resume/current/`) — only the visual layout
differs:

- **Modern — Current** — `resume/current/resume.pdf` /
  `resume/current/resume.docx`, kept in sync via `resume_publish.sh` as
  described above.
- **Classic / Executive** (default) — `resume/templates/classic/resume.pdf` /
  `resume/templates/classic/resume.docx`, an alternate single-column,
  ATS-style layout (navy/teal headings, hairline rules, bulleted
  experience) matching the hand-designed master résumé document. The
  `.docx` is that authored Word document directly — it already carries
  the current approved content, so it's used as-is rather than
  regenerated. `resume/templates/classic/build/resume.html` is a
  faithful HTML/CSS recreation of the same design, rendered to
  `resume.pdf` via headless Chromium so the PDF and docx stay visually
  identical. Both are updated by hand when `resume/source/resume.md`
  changes — this template is not wired into `resume_publish.sh`.

Content (`resume/source/`), template (the visual design), and export
format (PDF vs. Word) are kept as separate concerns, so more designs can
be added under `resume/templates/<name>/` later without touching the
versioning system above.

## Relationship to the rest of the portfolio

The résumé source is maintained independently of `index.html` and the rest
of the site's content. Updating the portfolio does not regenerate the
résumé, and publishing a résumé version does not touch the portfolio —
you decide by hand what belongs in each.
