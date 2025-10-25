#!/bin/bash
set -e

RESULT_FILE="knip-results.json"
ARCHIVE_DIR="archive"
LOG_FILE="archive-log.txt"

echo "🧹 Running Knip to detect unused files..."
npx knip --reporter=json > "$RESULT_FILE"

if [ ! -f "$RESULT_FILE" ]; then
  echo "❌ Error: Knip did not generate $RESULT_FILE."
  exit 1
fi

echo "📖 Reading Knip result..."
UNUSED_FILES=$(jq -r '.files.unused[]?' "$RESULT_FILE")

if [ -z "$UNUSED_FILES" ]; then
  echo "✅ No unused files found."
  exit 0
fi

echo "🚚 Archiving unused files to: $ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR"

COUNT=0
for FILE in $UNUSED_FILES; do
  if [ -f "$FILE" ]; then
    DEST="$ARCHIVE_DIR/$FILE.bk"
    mkdir -p "$(dirname "$DEST")"
    mv "$FILE" "$DEST"
    echo "📦 Moved: $FILE → $DEST"
    echo "$FILE" >> "$LOG_FILE"
    COUNT=$((COUNT+1))
  fi
done

echo "✅ Total archived: $COUNT"
echo "📝 Log saved to $LOG_FILE"
