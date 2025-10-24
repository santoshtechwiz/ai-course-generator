#!/usr/bin/env bash
# git-release-flow.sh
# Interactive git-flow-like release script.
# Usage: ./git-release-flow.sh [feature-branch]
# If no branch supplied, script will use current branch (must be feature/*)

set -euo pipefail

# --- helpers
info()  { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
warn()  { printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
err()   { printf "\033[1;31m[ERROR]\033[0m %s\n" "$*"; exit 1; }
confirm(){ printf "\033[1;32m[?]\033[0m %s " "$*"; read -r REPLY; case "$REPLY" in [Yy]|[Yy][Ee][Ss]) return 0;; *) return 1;; esac; }

# --- configuration (edit if you use different branch names)
MAIN_BRANCH="main"
DEVELOP_BRANCH="develop"
RELEASE_PREFIX="release"
TAG_PREFIX="v"

# optional test command - set to empty to skip
TEST_COMMAND="" # e.g. "pnpm test" or "npm run test"

# ensure git exists
command -v git >/dev/null 2>&1 || err "git not found in PATH"

# --- ensure inside git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || err "Not inside a git repository."

# --- make sure working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  warn "Working tree has unstaged or staged changes."
  if ! confirm "Stash changes and continue? [y/N]"; then
    err "Please commit/stash your changes and re-run."
  else
    git stash push -m "pre-release-$(date +%s)" >/dev/null
    info "Working tree stashed."
    STASHED=true
  fi
fi

# --- determine feature branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
POSSIBLE_ARG="${1-}"
if [ -n "$POSSIBLE_ARG" ]; then
  FEATURE_BRANCH="$POSSIBLE_ARG"
else
  FEATURE_BRANCH="$CURRENT_BRANCH"
fi

# validate branch name
if [[ ! "$FEATURE_BRANCH" =~ ^feature/ ]]; then
  warn "Feature branch does not start with 'feature/'."
  if ! confirm "Continue anyway using '$FEATURE_BRANCH'? [y/N]"; then
    err "Aborting - feature branch must be provided or current branch must be feature/*."
  fi
fi

info "Feature branch: $FEATURE_BRANCH"

# fetch latest refs
info "Fetching origin..."
git fetch origin --prune

# ensure remote branches exist locally
for BR in "$MAIN_BRANCH" "$DEVELOP_BRANCH"; do
  if ! git show-ref --verify --quiet "refs/heads/$BR"; then
    if git ls-remote --exit-code --heads origin "$BR" >/dev/null 2>&1; then
      git branch --track "$BR" "origin/$BR" || true
      info "Created local tracking branch for origin/$BR"
    else
      err "Required branch '$BR' not found locally or on origin."
    fi
  fi
done

# update develop and main
info "Checking out and updating $DEVELOP_BRANCH..."
git checkout "$DEVELOP_BRANCH"
git pull origin "$DEVELOP_BRANCH"

info "Checking out and updating $MAIN_BRANCH..."
git checkout "$MAIN_BRANCH"
git pull origin "$MAIN_BRANCH"

# ensure feature branch exists locally (or on origin)
if ! git show-ref --verify --quiet "refs/heads/$FEATURE_BRANCH"; then
  if git ls-remote --exit-code --heads origin "$FEATURE_BRANCH" >/dev/null 2>&1; then
    git checkout -b "$FEATURE_BRANCH" "origin/$FEATURE_BRANCH"
    info "Checked out local $FEATURE_BRANCH from origin."
  else
    err "Feature branch '$FEATURE_BRANCH' not found locally or on origin."
  fi
fi

# show summary to user
info "Summary:"
printf "  Feature branch: %s\n" "$FEATURE_BRANCH"
printf "  Develop branch: %s\n" "$DEVELOP_BRANCH\n"
printf "  Main branch:    %s\n" "$MAIN_BRANCH"

if ! confirm "Proceed with release flow? [y/N]"; then
  err "Aborted by user."
fi

# --- merge feature into develop
info "Switching to $DEVELOP_BRANCH..."
git checkout "$DEVELOP_BRANCH"
git pull origin "$DEVELOP_BRANCH"

info "Merging $FEATURE_BRANCH into $DEVELOP_BRANCH..."
if git merge --no-ff --no-edit "$FEATURE_BRANCH"; then
  info "Merged $FEATURE_BRANCH into $DEVELOP_BRANCH."
else
  warn "Merge conflict or other merge issue detected. Please resolve manually."
  err "Merge halted. Resolve conflicts, commit, then re-run script or continue manually."
fi

# --- prompt for version/tag
default_version="$(date +%Y.%m.%d)-$(git rev-parse --short HEAD)"
read -rp "Enter release version (e.g. 1.2.0) or press ENTER to use '$default_version': " RELEASE_VERSION
RELEASE_VERSION=${RELEASE_VERSION:-$default_version}
TAG_NAME="${TAG_PREFIX}${RELEASE_VERSION}"
RELEASE_BRANCH="${RELEASE_PREFIX}/${RELEASE_VERSION}"

info "Release branch will be: $RELEASE_BRANCH"
info "Tag to create: $TAG_NAME"

if ! confirm "Continue and create release branch '$RELEASE_BRANCH' and tag '$TAG_NAME'? [y/N]"; then
  err "Aborted by user."
fi

# --- create release branch from develop
info "Creating release branch $RELEASE_BRANCH from $DEVELOP_BRANCH..."
git checkout -b "$RELEASE_BRANCH" "$DEVELOP_BRANCH"

# optional: run tests
if [ -n "$TEST_COMMAND" ]; then
  info "Running tests: $TEST_COMMAND"
  if ! eval "$TEST_COMMAND"; then
    warn "Tests failed. Do you want to continue anyway?"
    if ! confirm "Continue despite failed tests? [y/N]"; then
      err "Tests failed. Aborting."
    fi
  fi
else
  info "No test command configured (TEST_COMMAND is empty)."
fi

# --- merge release into main
info "Checking out $MAIN_BRANCH..."
git checkout "$MAIN_BRANCH"
git pull origin "$MAIN_BRANCH"

info "Merging $RELEASE_BRANCH into $MAIN_BRANCH..."
if git merge --no-ff --no-edit "$RELEASE_BRANCH"; then
  info "Merged $RELEASE_BRANCH into $MAIN_BRANCH."
else
  warn "Merge to main failed. Resolve and re-run."
  err "Merge halted. Resolve conflicts manually."
fi

# --- create annotated tag
info "Creating annotated tag $TAG_NAME..."
git tag -a "$TAG_NAME" -m "Release $TAG_NAME"

# --- push branches and tag
if confirm "Push $DEVELOP_BRANCH, $MAIN_BRANCH, $RELEASE_BRANCH and tag $TAG_NAME to origin now? [y/N]"; then
  info "Pushing $DEVELOP_BRANCH..."
  git push origin "$DEVELOP_BRANCH"

  info "Pushing $MAIN_BRANCH..."
  git push origin "$MAIN_BRANCH"

  info "Pushing $RELEASE_BRANCH..."
  git push -u origin "$RELEASE_BRANCH"

  info "Pushing tags..."
  git push origin "$TAG_NAME"

  info "Push completed."
else
  warn "Skipped push. Local changes remain. You can push manually later."
fi

# --- optional cleanup: delete release branch
if confirm "Delete local and remote release branch '$RELEASE_BRANCH'? [y/N]"; then
  info "Deleting local release branch..."
  git branch -d "$RELEASE_BRANCH" || warn "Local delete failed (maybe not merged?)"

  if confirm "Also delete remote branch origin/$RELEASE_BRANCH? [y/N]"; then
    info "Deleting remote release branch..."
    git push origin --delete "$RELEASE_BRANCH" || warn "Remote delete failed (maybe already removed)."
  fi
fi

# --- optional: return to original branch or develop
if confirm "Checkout back to develop '$DEVELOP_BRANCH'? [y/N]"; then
  git checkout "$DEVELOP_BRANCH"
fi

# --- pop stash if we stashed earlier
if [ "${STASHED-}" = true ]; then
  if confirm "Pop previously stashed changes? [y/N]"; then
    git stash pop || warn "git stash pop failed (resolve manually)."
  else
    info "Stash kept. Use 'git stash list' to inspect."
  fi
fi

info "Release flow complete. Tag: $TAG_NAME"
exit 0
