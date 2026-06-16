#!/usr/bin/env bash
# Render a single Body Recode IG post (1080x1080 PNG) from a JSON spec piped on stdin.
# Usage: cat post.json | scripts/ig-generator/render-post.sh
# Or:    scripts/ig-generator/render-post.sh < post.json
#
# Spec fields (all strings unless noted):
#   slug          required  output filename basename (no extension)
#   type          required  authority | contrarian | pattern | coach | diagnostic
#   label         optional  small-caps eyebrow (default derived from type)
#   hook_1        required  primary hook line 1
#   hook_2        optional  hook line 2 (recommended)
#   hook_2_blue   optional  "true" to render hook_2 in Signal Blue
#   hook_3        optional  hook line 3 (contrarian only)
#   hook_3_blue   optional  "true" to render hook_3 in Signal Blue (contrarian default)
#   sub_1         optional  sub-copy line 1
#   sub_2         optional  sub-copy line 2
#   photo         optional  integer 1-8 (required for coach/diagnostic)
#   list          optional  JSON array of bullet strings (pattern only)
#   cta_text      optional  CTA button label (diagnostic only)
#   cta_eyebrow   optional  eyebrow text on diagnostic (default "FREE · 2 MINUTES")
#   out_dir       required  output directory (no trailing slash)
#
# Stdout: absolute path to the rendered PNG.

set -euo pipefail

PUBLIC=~/body-recode-mvp/public
TMP=/tmp/br-ig-gen
mkdir -p "$TMP"

GEORGIA_BOLD="/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
GEORGIA_ITALIC="/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
GEORGIA_BOLD_ITALIC="/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf"
SANS="/System/Library/Fonts/HelveticaNeue.ttc"
SANS_BOLD="/System/Library/Fonts/Helvetica.ttc"
LOGO_BLACK="$PUBLIC/logo-black.png"

LOGO_W_180="$TMP/logo-w-180.png"
LOGO_B_180="$TMP/logo-b-180.png"
[ ! -f "$LOGO_W_180" ] && magick "$LOGO_BLACK" -fill white -colorize 100 -resize 180x "$LOGO_W_180"
[ ! -f "$LOGO_B_180" ] && magick "$LOGO_BLACK" -resize 180x "$LOGO_B_180"

HANDLE="@body_recode_"

SPEC="$(cat)"
J()  { echo "$SPEC" | jq -r "$1"; }
JN() { echo "$SPEC" | jq -r "$1 // empty"; }

SLUG="$(J '.slug')"
TYPE="$(J '.type')"
OUT_DIR="$(J '.out_dir')"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/$SLUG.png"

HOOK1="$(JN '.hook_1')"
HOOK2="$(JN '.hook_2')"
HOOK2_BLUE="$(JN '.hook_2_blue')"
HOOK3="$(JN '.hook_3')"
HOOK3_BLUE="$(JN '.hook_3_blue')"
SUB1="$(JN '.sub_1')"
SUB2="$(JN '.sub_2')"
PHOTO="$(JN '.photo')"
LABEL="$(JN '.label')"
CTA_TEXT="$(JN '.cta_text')"
CTA_EYEBROW="$(JN '.cta_eyebrow')"
SOFT_CTA="$(JN '.soft_cta')"

if [ -z "$LABEL" ]; then
  case "$TYPE" in
    authority)  LABEL="AUTHORITY" ;;
    contrarian) LABEL="CONTRARIAN" ;;
    pattern)    LABEL="PATTERN RECOGNITION" ;;
    coach)      LABEL="COACH" ;;
    diagnostic) LABEL="DIAGNOSTIC" ;;
  esac
fi

photo_path() { echo "$PUBLIC/kade-${1}.jpg"; }

CMD=( magick )

case "$TYPE" in
  authority)
    CMD+=( -size 1080x1080 xc:white )
    CMD+=( "$LOGO_B_180" -gravity northwest -geometry +60+60 -compose over -composite )
    CMD+=( -fill "#1B6DFC" -draw "rectangle 80,380 144,388" )
    CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#1B6DFC" -annotate +160+402 "$LABEL" )
    CMD+=( -font "$SANS_BOLD" -pointsize 68 -fill "#1A1A1A" -annotate +80+520 "$HOOK1" )
    [ -n "$HOOK2" ] && CMD+=( -font "$SANS_BOLD" -pointsize 68 -fill "#1A1A1A" -annotate +80+620 "$HOOK2" )
    [ -n "$SUB1"  ] && CMD+=( -font "$SANS"      -pointsize 26 -fill "#5C5C5C" -annotate +80+720 "$SUB1" )
    [ -n "$SUB2"  ] && CMD+=( -font "$SANS"      -pointsize 26 -fill "#5C5C5C" -annotate +80+762 "$SUB2" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "#7C7C7C" -gravity south -annotate +0+50 "$HANDLE" )
    ;;

  contrarian)
    H2_COLOR="white"
    [ "$HOOK2_BLUE" = "true" ] && H2_COLOR="#1B6DFC"
    H3_COLOR="#1B6DFC"
    [ "$HOOK3_BLUE" = "false" ] && H3_COLOR="white"

    CMD+=( -size 1080x1080 xc:'#0F0F0F' )
    CMD+=( "$LOGO_W_180" -gravity northwest -geometry +60+60 -compose over -composite )
    if [ -n "$HOOK3" ]; then
      CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill white       -gravity center -annotate +0-120 "$HOOK1" )
      CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill "$H2_COLOR" -gravity center -annotate +0-10  "$HOOK2" )
      CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill "$H3_COLOR" -gravity center -annotate +0+100 "$HOOK3" )
    else
      CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill white       -gravity center -annotate +0-60 "$HOOK1" )
      [ -n "$HOOK2" ] && CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill "$H2_COLOR" -gravity center -annotate +0+50 "$HOOK2" )
    fi
    [ -n "$SUB1" ] && CMD+=( -font "$SANS" -pointsize 26 -fill "rgba(255,255,255,0.7)" -gravity center -annotate +0+250 "$SUB1" )
    [ -n "$SUB2" ] && CMD+=( -font "$SANS" -pointsize 26 -fill "rgba(255,255,255,0.7)" -gravity center -annotate +0+290 "$SUB2" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.55)" -gravity south -annotate +0+50 "$HANDLE" )
    ;;

  pattern)
    CMD+=( -size 1080x1080 xc:white )
    CMD+=( "$LOGO_B_180" -gravity northwest -geometry +60+60 -compose over -composite )
    CMD+=( -fill "#1B6DFC" -draw "rectangle 80,360 144,368" )
    CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#1B6DFC" -annotate +160+382 "$LABEL" )
    CMD+=( -font "$GEORGIA_BOLD" -pointsize 58 -fill "#1A1A1A" -annotate +80+490 "$HOOK1" )
    [ -n "$HOOK2" ] && CMD+=( -font "$GEORGIA_BOLD_ITALIC" -pointsize 58 -fill "#1A1A1A" -annotate +80+560 "$HOOK2" )

    LIST_COUNT="$(echo "$SPEC" | jq -r '.list // [] | length')"
    Y=670
    for i in $(seq 0 $((LIST_COUNT - 1))); do
      ITEM="$(echo "$SPEC" | jq -r ".list[$i]")"
      CMD+=( -font "$SANS_BOLD" -pointsize 26 -fill "#1B6DFC" -annotate "+80+${Y}" "→" )
      CMD+=( -font "$SANS"      -pointsize 24 -fill "#2A2A2A" -annotate "+130+${Y}" "$ITEM" )
      Y=$((Y + 50))
    done
    # Soft CTA (optional): small Signal Blue italic line below the list.
    [ -n "$SOFT_CTA" ] && CMD+=( -font "$SANS_BOLD" -pointsize 22 -fill "#1B6DFC" -annotate "+80+$((Y + 20))" "$SOFT_CTA" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "#7C7C7C" -gravity south -annotate +0+50 "$HANDLE" )
    ;;

  coach)
    # Quote marks (open " on hook_1, close " on the LAST filled line) are added
    # automatically. hook_1/hook_2 render in italic, sub_1/sub_2 in bold-italic.
    # Each post can use 1-4 lines; the closing quote attaches to whichever line
    # is last so short pull-quotes don't end with an unclosed quote.
    [ -z "$PHOTO" ] && { echo "coach template requires .photo" >&2; exit 1; }
    PF="$(photo_path "$PHOTO")"
    CMD+=( "$PF" -resize 1080x1080^ -gravity center -extent 1080x1080 -colorspace gray -colorspace sRGB )
    CMD+=( '(' -size 1080x1080 radial-gradient:'rgba(0,0,0,0)-rgba(0,0,0,0.85)' ')' -compose multiply -composite )
    CMD+=( -fill "rgba(0,0,0,0.55)" -draw "rectangle 0,720 1080,1080" )
    CMD+=( "$LOGO_W_180" -gravity northwest -geometry +60+60 -compose over -composite )

    # Build the line list with their fonts, then close the quote on the last one
    LINES=()
    [ -n "$HOOK1" ] && LINES+=( "italic|$HOOK1" )
    [ -n "$HOOK2" ] && LINES+=( "italic|$HOOK2" )
    [ -n "$SUB1"  ] && LINES+=( "bold|$SUB1"   )
    [ -n "$SUB2"  ] && LINES+=( "bold|$SUB2"   )
    LAST_IDX=$(( ${#LINES[@]} - 1 ))

    # Vertical offsets from the bottom (gravity southwest): 290 / 225 / 160 / 95
    OFFSETS=( 290 225 160 95 )
    for idx in "${!LINES[@]}"; do
      entry="${LINES[$idx]}"
      font_kind="${entry%%|*}"
      text="${entry#*|}"
      [ "$idx" -eq 0 ] && text="\"$text"
      [ "$idx" -eq "$LAST_IDX" ] && text="${text}\""
      if [ "$font_kind" = "italic" ]; then F="$GEORGIA_ITALIC"; else F="$GEORGIA_BOLD_ITALIC"; fi
      CMD+=( -font "$F" -pointsize 52 -fill white -gravity southwest -annotate "+80+${OFFSETS[$idx]}" "$text" )
    done

    # Soft CTA (optional): small Signal Blue caps line at top-right, doesn't crowd the pull-quote.
    [ -n "$SOFT_CTA" ] && CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#1B6DFC" -gravity northeast -annotate +60+85 "$SOFT_CTA" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.7)" -gravity southwest -annotate +80+35 "$HANDLE" )
    ;;

  diagnostic)
    [ -z "$PHOTO" ] && { echo "diagnostic template requires .photo" >&2; exit 1; }
    PF="$(photo_path "$PHOTO")"
    [ -z "$CTA_EYEBROW" ] && CTA_EYEBROW="FREE · 2 MINUTES"
    [ -z "$CTA_TEXT"    ] && CTA_TEXT="→ Link in bio"

    CMD+=( "$PF" -resize 1080x1080^ -gravity center -extent 1080x1080 -colorspace gray -colorspace sRGB )
    CMD+=( '(' -size 1080x500 gradient:'rgba(0,0,0,0)-rgba(0,0,0,0.95)' ')' -geometry +0+580 -compose over -composite )
    CMD+=( "$LOGO_W_180" -gravity northwest -geometry +60+60 -compose over -composite )
    CMD+=( -fill "#1B6DFC" -draw "rectangle 80,720 144,728" )
    CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#1B6DFC" -gravity northwest -annotate +160+714 "$CTA_EYEBROW" )
    CMD+=( -font "$SANS_BOLD" -pointsize 56 -fill white -gravity northwest -annotate +80+760 "$HOOK1" )
    [ -n "$HOOK2" ] && CMD+=( -font "$SANS_BOLD" -pointsize 56 -fill white -gravity northwest -annotate +80+828 "$HOOK2" )
    [ -n "$SUB1"  ] && CMD+=( -font "$SANS"      -pointsize 28 -fill "rgba(255,255,255,0.88)" -gravity northwest -annotate +80+910 "$SUB1" )
    [ -n "$SUB2"  ] && CMD+=( -font "$SANS"      -pointsize 28 -fill "rgba(255,255,255,0.88)" -gravity northwest -annotate +80+950 "$SUB2" )
    CMD+=( -fill "#1B6DFC" -draw "roundrectangle 80,1000 380,1052 8,8" )
    CMD+=( -font "$SANS_BOLD" -pointsize 22 -fill white -gravity northwest -annotate +110+1014 "$CTA_TEXT" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.6)" -gravity southeast -annotate +80+40 "$HANDLE" )
    ;;

  reel_cover)
    # Placeholder cover frame for an Amanda-produced HeyGen reel. 1080x1080
    # square (the grid-visible crop of the 9:16 reel). Greyscale photo BG +
    # heavy gradient + on-screen hook lines + REEL badge top-right + logo
    # top-left + handle bottom. Swapped for Amanda's MP4 cover frame when
    # the reel itself ships.
    [ -z "$PHOTO" ] && { echo "reel_cover template requires .photo" >&2; exit 1; }
    PF="$(photo_path "$PHOTO")"
    CMD+=( "$PF" -resize 1080x1080^ -gravity center -extent 1080x1080 -colorspace gray -colorspace sRGB )
    # Heavier gradient than coach — reel covers compete with motion in feed
    CMD+=( '(' -size 1080x1080 gradient:'rgba(0,0,0,0.55)-rgba(0,0,0,0.85)' ')' -compose multiply -composite )
    # Top-left logo
    CMD+=( "$LOGO_W_180" -gravity northwest -geometry +60+60 -compose over -composite )
    # Top-right REEL badge (Signal Blue chip)
    CMD+=( -fill "#1B6DFC" -draw "roundrectangle 870,70 1020,118 6,6" )
    CMD+=( -font "$SANS_BOLD" -pointsize 22 -fill white -gravity northeast -annotate +80+82 "REEL  ▷" )
    # Centered on-screen hook lines (italic serif for pull-quote feel)
    CMD+=( -font "$GEORGIA_BOLD_ITALIC" -pointsize 64 -fill white -gravity center -annotate +0-100 "$HOOK1" )
    [ -n "$HOOK2" ] && CMD+=( -font "$GEORGIA_BOLD_ITALIC" -pointsize 64 -fill white -gravity center -annotate +0-10 "$HOOK2" )
    [ -n "$HOOK3" ] && CMD+=( -font "$GEORGIA_BOLD_ITALIC" -pointsize 64 -fill white -gravity center -annotate +0+80 "$HOOK3" )
    # Handle bottom
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.7)" -gravity south -annotate +0+50 "$HANDLE" )
    ;;

  carousel)
    # Multi-slide swipe-through post. Reads .slides[] from spec and writes
    # one PNG per slide named {slug}_01.png ... {slug}_NN.png.
    # Each slide: { hook, hook_2?, sub?, blue?, is_cta?, cta_text? }
    #   - hook/hook_2: centered sans-bold text, big
    #   - sub: smaller, lower-contrast support line
    #   - blue: hook renders in Signal Blue (use for punchline emphasis)
    #   - is_cta: marks final slide; renders on dark BG with Signal Blue CTA pill
    SLIDE_COUNT="$(echo "$SPEC" | jq -r '.slides | length')"
    for i in $(seq 0 $((SLIDE_COUNT - 1))); do
      SLIDE="$(echo "$SPEC" | jq ".slides[$i]")"
      S_HOOK="$(echo "$SLIDE" | jq -r '.hook // empty')"
      S_HOOK2="$(echo "$SLIDE" | jq -r '.hook_2 // empty')"
      S_SUB="$(echo "$SLIDE" | jq -r '.sub // empty')"
      S_BLUE="$(echo "$SLIDE" | jq -r '.blue // false')"
      S_CTA="$(echo "$SLIDE" | jq -r '.is_cta // false')"
      S_CTA_TXT="$(echo "$SLIDE" | jq -r '.cta_text // "→ Take Scorecard"')"
      S_NUM="$(printf '%02d' $((i + 1)))"
      S_DISPLAY="$((i + 1))/${SLIDE_COUNT}"
      S_OUT="$OUT_DIR/${SLUG}_${S_NUM}.png"

      SCMD=( magick )

      if [ "$S_CTA" = "true" ]; then
        # Dark CTA slide (visual punch at the end of the swipe)
        SCMD+=( -size 1080x1080 xc:'#0F0F0F' )
        SCMD+=( "$LOGO_W_180" -gravity northwest -geometry +60+60 -compose over -composite )
        SCMD+=( -font "$SANS_BOLD" -pointsize 70 -fill white -gravity center -annotate +0-120 "$S_HOOK" )
        [ -n "$S_HOOK2" ] && SCMD+=( -font "$SANS_BOLD" -pointsize 70 -fill white -gravity center -annotate +0-30 "$S_HOOK2" )
        [ -n "$S_SUB"   ] && SCMD+=( -font "$SANS" -pointsize 26 -fill "rgba(255,255,255,0.75)" -gravity center -annotate +0+80 "$S_SUB" )
        # CTA pill
        SCMD+=( -fill "#1B6DFC" -draw "roundrectangle 360,820 720,872 8,8" )
        SCMD+=( -font "$SANS_BOLD" -pointsize 22 -fill white -gravity north -annotate +0+832 "$S_CTA_TXT" )
        # Slide counter top-right + handle bottom
        SCMD+=( -font "$SANS_BOLD" -pointsize 16 -fill "rgba(255,255,255,0.5)" -gravity northeast -annotate +60+85 "$S_DISPLAY" )
        SCMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.55)" -gravity south -annotate +0+50 "$HANDLE" )
      else
        # White content slide
        SCMD+=( -size 1080x1080 xc:white )
        SCMD+=( "$LOGO_B_180" -gravity northwest -geometry +60+60 -compose over -composite )
        if [ "$S_BLUE" = "true" ]; then HC="#1B6DFC"; else HC="#1A1A1A"; fi
        SCMD+=( -font "$SANS_BOLD" -pointsize 76 -fill "$HC" -gravity center -annotate +0-60 "$S_HOOK" )
        [ -n "$S_HOOK2" ] && SCMD+=( -font "$SANS_BOLD" -pointsize 76 -fill "$HC" -gravity center -annotate +0+40 "$S_HOOK2" )
        [ -n "$S_SUB"   ] && SCMD+=( -font "$SANS" -pointsize 28 -fill "#5C5C5C" -gravity center -annotate +0+150 "$S_SUB" )
        SCMD+=( -font "$SANS_BOLD" -pointsize 16 -fill "#7C7C7C" -gravity northeast -annotate +60+85 "$S_DISPLAY" )
        SCMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "#7C7C7C" -gravity south -annotate +0+50 "$HANDLE" )
      fi

      SCMD+=( "$S_OUT" )
      "${SCMD[@]}"
      echo "$S_OUT"
    done
    exit 0
    ;;

  *)
    echo "unknown type: $TYPE" >&2
    exit 1
    ;;
esac

CMD+=( "$OUT" )
"${CMD[@]}"
echo "$OUT"
