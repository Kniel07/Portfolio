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
directly. There's also a hidden template picker: 9 consecutive clicks/taps
on the footer copyright opens a small "Résumé Design" sheet. Today it only
lists the one template that exists (`resume/current/`), but the sheet is
built so additional templates can be added as separate entries later
without changing this versioning system — content (`resume/source/`),
template (the exported PDF/docx design), and export format (PDF vs. Word)
are already kept as separate concerns.

## Relationship to the rest of the portfolio

The résumé source is maintained independently of `index.html` and the rest
of the site's content. Updating the portfolio does not regenerate the
résumé, and publishing a résumé version does not touch the portfolio —
you decide by hand what belongs in each.
