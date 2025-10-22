#!/bin/bash
set -e

echo "🌿 Welcome to the Interactive Git Branch & Release Manager"
echo "------------------------------------------------------------"

# Ensure repo is clean
if [[ -n $(git status --porcelain) ]]; then
  echo "⚠️  Uncommitted changes detected. Please commit or stash them first."
  exit 1
fi

# Make sure repo is up to date
git fetch --all --prune

# Get current main branch
MAIN_BRANCH="main"
DEVELOP_BRANCH="develop"

# Check if develop branch exists
if ! git show-ref --verify --quiet refs/heads/$DEVELOP_BRANCH; then
  echo "🌿 No 'develop' branch found. Creating one from main..."
  git checkout $MAIN_BRANCH
  git pull origin $MAIN_BRANCH
  git checkout -b $DEVELOP_BRANCH
  git push -u origin $DEVELOP_BRANCH
else
  echo "✅ Found existing develop branch."
fi

echo ""
echo "📋 Choose an action:"
echo "1️⃣  Create a new feature branch"
echo "2️⃣  Create a new release branch"
echo "3️⃣  Create a hotfix branch"
echo "4️⃣  Tag current main branch as a release"
echo "5️⃣  Exit"
read -rp "Enter your choice [1-5]: " CHOICE
echo ""

# -------------------------------------------------------------------
# FEATURE BRANCH FLOW
# -------------------------------------------------------------------
if [[ "$CHOICE" == "1" ]]; then
  read -rp "Enter feature name (e.g. video-progress-fix): " FEATURE_NAME
  git checkout $DEVELOP_BRANCH
  git pull origin $DEVELOP_BRANCH
  git checkout -b feature/$FEATURE_NAME
  echo "✅ Created and switched to feature/$FEATURE_NAME"
  echo "💡 Tip: Run 'git push -u origin feature/$FEATURE_NAME' after first commit."
  exit 0
fi

# -------------------------------------------------------------------
# RELEASE BRANCH FLOW
# -------------------------------------------------------------------
if [[ "$CHOICE" == "2" ]]; then
  read -rp "Enter release version (e.g. v1.1.0): " RELEASE_VERSION
  git checkout $DEVELOP_BRANCH
  git pull origin $DEVELOP_BRANCH

  # Detect existing 'release' branch conflicts
  if git show-ref --verify --quiet refs/heads/release; then
    echo "⚠️  Detected old 'release' branch. Renaming it to 'old-release'..."
    git branch -m release old-release
    git push origin :release || true
    git push origin old-release
  fi

  if git ls-remote --heads origin release | grep release >/dev/null; then
    git push origin --delete release || true
  fi

  git checkout -b release/$RELEASE_VERSION
  echo "$RELEASE_VERSION" > VERSION.txt
  git add VERSION.txt
  git commit -m "chore(release): prepare $RELEASE_VERSION"
  git push -u origin release/$RELEASE_VERSION

  echo ""
  echo "🚧 Release branch 'release/$RELEASE_VERSION' created."
  echo "Next steps:"
  echo "  1. Test your build and fix issues on this branch."
  echo "  2. When ready, run this script again and choose option 4 to tag and finalize release."
  exit 0
fi

# -------------------------------------------------------------------
# HOTFIX FLOW
# -------------------------------------------------------------------
if [[ "$CHOICE" == "3" ]]; then
  read -rp "Enter hotfix name (e.g. fix-login-crash): " HOTFIX_NAME
  git checkout $MAIN_BRANCH
  git pull origin $MAIN_BRANCH
  git checkout -b hotfix/$HOTFIX_NAME
  echo "✅ Created and switched to hotfix/$HOTFIX_NAME"
  echo "💡 Tip: Commit and push when fix is done, then merge to main + develop."
  exit 0
fi

# -------------------------------------------------------------------
# TAG RELEASE FLOW
# -------------------------------------------------------------------
if [[ "$CHOICE" == "4" ]]; then
  read -rp "Enter release version to tag (e.g. v1.1.0): " RELEASE_VERSION

  # Merge release → main
  git checkout $MAIN_BRANCH
  git pull origin $MAIN_BRANCH

  if git show-ref --verify --quiet refs/heads/release/$RELEASE_VERSION; then
    echo "🔁 Merging release/$RELEASE_VERSION → main"
    git merge --no-ff release/$RELEASE_VERSION -m "chore(release): $RELEASE_VERSION"
  else
    echo "⚠️  No release/$RELEASE_VERSION branch found. Tagging current main directly."
  fi

  # Generate changelog
  echo "🧾 Generating CHANGELOG.md..."
  echo "# Changelog" > CHANGELOG.md
  echo "" >> CHANGELOG.md
  echo "## $RELEASE_VERSION – $(date +'%Y-%m-%d')" >> CHANGELOG.md
  echo "" >> CHANGELOG.md
  git log --pretty=format:"- %s (%an)" -20 >> CHANGELOG.md
  echo "" >> CHANGELOG.md

  git add CHANGELOG.md
  git commit -m "docs(changelog): update for $RELEASE_VERSION" || true
  git push origin $MAIN_BRANCH

  # Tag and push
  echo "🏷️ Tagging main as $RELEASE_VERSION"
  TAG_MESSAGE=$(awk 'NR>1 {print}' CHANGELOG.md)
  git tag -a $RELEASE_VERSION -m "Release $RELEASE_VERSION"$'\n\n'"$TAG_MESSAGE"
  git push origin main --tags

  # Merge back to develop
  git checkout $DEVELOP_BRANCH
  git merge --no-ff $MAIN_BRANCH -m "merge: release/$RELEASE_VERSION into develop"
  git push origin $DEVELOP_BRANCH

  # Cleanup
  git branch -D release/$RELEASE_VERSION 2>/dev/null || true
  git push origin --delete release/$RELEASE_VERSION 2>/dev/null || true

  echo "✅ Release $RELEASE_VERSION finalized and tagged!"
  exit 0
fi

# -------------------------------------------------------------------
# EXIT
# -------------------------------------------------------------------
if [[ "$CHOICE" == "5" ]]; then
  echo "👋 Exiting."
  exit 0
fi

echo "❌ Invalid choice. Try again."
