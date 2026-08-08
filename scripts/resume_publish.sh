#!/usr/bin/env bash
# Publish helper for resume/. Two deliberate steps, never automatic:
#
#   resume_publish.sh new [YYYY-MM] [--revision]
#       Freezes resume/source/resume.md into a new, immutable version folder
#       under resume/versions/<YEAR>/<YYYY-MM>/ (or a same-month revision
#       folder <YYYY-MM>-rNN with --revision). Does NOT touch resume/current/.
#
#   resume_publish.sh update-current <YYYY-MM|YYYY-MM-rNN>
#       Promotes an already-published version to resume/current/, but only
#       after confirming that version has a real resume.pdf. Fails safely:
#       if anything is missing, resume/current/ is left completely untouched.
#
# resume/versions/ is treated as an immutable archive: this script only ever
# creates new files there, never edits or removes existing ones.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_MD="$ROOT/resume/source/resume.md"
VERSIONS_DIR="$ROOT/resume/versions"
CURRENT_DIR="$ROOT/resume/current"

usage() {
  cat <<'EOF'
Usage:
  resume_publish.sh new [YYYY-MM] [--revision]
  resume_publish.sh update-current <YYYY-MM|YYYY-MM-rNN>
EOF
  exit 1
}

[ $# -ge 1 ] || usage
cmd="$1"; shift

latest_existing_version() {
  # Most recent existing version folder (by name, which sorts chronologically),
  # excluding the one currently being created.
  local exclude="$1"
  find "$VERSIONS_DIR" -mindepth 2 -maxdepth 2 -type d 2>/dev/null \
    | xargs -n1 basename 2>/dev/null \
    | grep -v "^${exclude}\$" \
    | sort \
    | tail -n1 || true
}

cmd_new() {
  local month="" revision_flag=0
  for arg in "$@"; do
    case "$arg" in
      --revision) revision_flag=1 ;;
      *) month="$arg" ;;
    esac
  done
  [ -n "$month" ] || month="$(date +%Y-%m)"
  [[ "$month" =~ ^[0-9]{4}-[0-9]{2}$ ]] || { echo "error: expected YYYY-MM, got '$month'" >&2; exit 1; }

  [ -f "$SOURCE_MD" ] || { echo "error: $SOURCE_MD not found" >&2; exit 1; }

  local year="${month:0:4}"
  local base_dir="$VERSIONS_DIR/$year/$month"
  local dest="$base_dir"
  local revision=1
  local folder_name="$month"

  if [ "$revision_flag" -eq 1 ]; then
    [ -d "$base_dir" ] || { echo "error: no published $month version yet — run without --revision first" >&2; exit 1; }
    local n=2
    while [ -d "$VERSIONS_DIR/$year/${month}-r$(printf '%02d' "$n")" ]; do
      n=$((n + 1))
    done
    revision="$n"
    folder_name="${month}-r$(printf '%02d' "$n")"
    dest="$VERSIONS_DIR/$year/$folder_name"
  else
    if [ -d "$dest" ]; then
      echo "error: $month is already published at $dest" >&2
      echo "       resume/versions/ is immutable — published versions are never overwritten." >&2
      echo "       For a same-month correction, run: $(basename "$0") new $month --revision" >&2
      exit 1
    fi
  fi

  local base_version
  base_version="$(latest_existing_version "$folder_name")"

  mkdir -p "$dest"
  cp "$SOURCE_MD" "$dest/resume.md"

  {
    echo "version: \"$folder_name\""
    echo "revision: $revision"
    echo "status: published"
    echo "created: \"$(date +%Y-%m-%d)\""
    if [ -n "$base_version" ]; then
      echo "base_version: \"$base_version\""
    else
      echo "base_version: null"
    fi
  } > "$dest/metadata.yml"

  cat > "$dest/CHANGELOG.md" <<EOF
# Resume Version — $folder_name

## Added

## Updated

## Removed

## Reason

_Tip: \`diff resume/versions/$year/${base_version:-<previous>}/resume.md $dest/resume.md\` to see what changed from the base version._
EOF

  echo "Created $dest"
  echo "resume/current/ has NOT been updated yet."
  echo "Next steps:"
  echo "  1. Fill in $dest/CHANGELOG.md"
  echo "  2. Export/design the PDF for this version and save it as $dest/resume.pdf"
  echo "  3. Run: $(basename "$0") update-current $folder_name"
}

cmd_update_current() {
  local folder_name="${1:-}"
  [ -n "$folder_name" ] || usage
  [[ "$folder_name" =~ ^([0-9]{4})-[0-9]{2}(-r[0-9]{2})?$ ]] || { echo "error: expected YYYY-MM or YYYY-MM-rNN, got '$folder_name'" >&2; exit 1; }
  local year="${BASH_REMATCH[1]}"
  local dest="$VERSIONS_DIR/$year/$folder_name"

  [ -d "$dest" ] || { echo "error: $dest does not exist — run 'new' first" >&2; exit 1; }
  [ -s "$dest/resume.md" ] || { echo "error: $dest/resume.md is missing or empty" >&2; exit 1; }
  [ -s "$dest/resume.pdf" ] || { echo "error: $dest/resume.pdf is missing or empty — add the exported PDF before promoting to current" >&2; exit 1; }

  # Stage first so a failure never leaves resume/current/ partially updated.
  local staging
  staging="$(mktemp -d)"

  cp "$dest/resume.md" "$staging/resume.md"
  cp "$dest/resume.pdf" "$staging/resume.pdf"

  mkdir -p "$CURRENT_DIR"
  mv -f "$staging/resume.md" "$CURRENT_DIR/resume.md"
  mv -f "$staging/resume.pdf" "$CURRENT_DIR/resume.pdf"
  rmdir "$staging"

  echo "resume/current/ now points to $folder_name"
}

case "$cmd" in
  new) cmd_new "$@" ;;
  update-current) cmd_update_current "$@" ;;
  *) usage ;;
esac
