#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "       BUILDING AGENTSFLOW NATIVE ANDROID APK             "
echo "==========================================================\n"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ANDROID_DIR="$PROJECT_ROOT/android"
BUILDS_DIR="$PROJECT_ROOT/builds"

mkdir -p "$BUILDS_DIR" "$ANDROID_DIR/gen" "$ANDROID_DIR/obj"

ANDROID_JAR="$ANDROID_DIR/lib/android.jar"
if [ ! -f "$ANDROID_JAR" ]; then
  echo "❌ Error: android.jar not found at $ANDROID_JAR"
  echo "Please wait for download to finish or check network."
  exit 1
fi

echo "▶ [STEP 1/6] Compiling Android Resources with aapt2..."
rm -f "$ANDROID_DIR/compiled_res.zip"
aapt2 compile --dir "$ANDROID_DIR/res" -o "$ANDROID_DIR/compiled_res.zip"
echo "  ✓ Resources compiled to compiled_res.zip"

echo "▶ [STEP 2/6] Linking Resources & Generating R.java..."
rm -rf "$ANDROID_DIR/gen/"*
rm -f "$ANDROID_DIR/unsigned_unaligned.apk"
aapt2 link -I "$ANDROID_JAR" "$ANDROID_DIR/compiled_res.zip" \
  -A "$ANDROID_DIR/assets" \
  --manifest "$ANDROID_DIR/AndroidManifest.xml" \
  --java "$ANDROID_DIR/gen" \
  -o "$ANDROID_DIR/unsigned_unaligned.apk"
echo "  ✓ Linked APK skeleton with bundled standalone assets and generated R.java"

echo "▶ [STEP 3/6] Compiling Java Sources (javac)..."
rm -rf "$ANDROID_DIR/obj/"*
javac -source 8 -target 8 \
  -bootclasspath "$ANDROID_JAR" \
  -cp "$ANDROID_JAR:$ANDROID_DIR/gen" \
  -d "$ANDROID_DIR/obj" \
  "$ANDROID_DIR/gen/com/agentsflow/chatbot/R.java" \
  "$ANDROID_DIR/src/com/agentsflow/chatbot/MainActivity.java"
echo "  ✓ Compiled MainActivity.class and R.class"

echo "▶ [STEP 4/6] Converting to Android DEX Bytecode (d8)..."
rm -f "$ANDROID_DIR/classes.dex"
d8 --release --min-api 24 \
  --lib "$ANDROID_JAR" \
  --output "$ANDROID_DIR" \
  "$ANDROID_DIR/obj/com/agentsflow/chatbot/"*.class
echo "  ✓ Generated classes.dex"

echo "▶ [STEP 5/6] Packaging DEX into APK..."
cd "$ANDROID_DIR"
jar uf unsigned_unaligned.apk classes.dex
echo "  ✓ classes.dex packaged into unsigned_unaligned.apk"

echo "▶ [STEP 6/6] Signing and Verifying APK (apksigner)..."
OUTPUT_APK="$BUILDS_DIR/agentsflow-ai.apk"
rm -f "$OUTPUT_APK"
apksigner sign \
  --ks "$ANDROID_DIR/release.keystore" \
  --ks-pass pass:agentsflow2026 \
  --key-pass pass:agentsflow2026 \
  --out "$OUTPUT_APK" \
  "$ANDROID_DIR/unsigned_unaligned.apk"

echo "  ✓ APK signed with release keystore"

echo "▶ Verifying APK Signature..."
apksigner verify --verbose "$OUTPUT_APK"

APK_SIZE=$(du -h "$OUTPUT_APK" | awk '{print $1}')
echo ""
echo "=========================================================="
echo "🎉 SUCCESS: NATIVE ANDROID APK BUILT!"
echo "   File: $OUTPUT_APK ($APK_SIZE)"
echo "   Package: com.agentsflow.chatbot"
echo "   To Install: termux-open $OUTPUT_APK"
echo "=========================================================="
