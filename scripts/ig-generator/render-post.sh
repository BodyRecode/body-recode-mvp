#!/usr/bin/env bash
# Render a single Body Recode IG post (1080x1350 PNG, 4:5 portrait) from a JSON spec piped on stdin.
# Usage: cat post.json | scripts/ig-generator/render-post.sh
# Or:    scripts/ig-generator/render-post.sh < post.json
#
# Asset spec: 1080x1350 (4:5). 96px safe zone on every edge — no important
# copy/logo/CTA inside the outer 96px ring. See social-asset-spec.md.
#
# Spec fields (all strings unless noted):
#   slug          required  output filename basename (no extension)
#   type          required  authority | contrarian | pattern | coach | diagnostic | reel_cover | carousel
#   label         optional  small-caps eyebrow (default derived from type)
#   hook_1        required  primary hook line 1
#   hook_2        optional  hook line 2 (recommended)
#   hook_2_blue   optional  "true" to render hook_2 in Signal Blue
#   hook_3        optional  hook line 3 (contrarian only)
#   hook_3_blue   optional  "true" to render hook_3 in Signal Blue (contrarian default)
#   sub_1         optional  sub-copy line 1
#   sub_2         optional  sub-copy line 2
#   photo         optional  integer 1-8 (required for coach/diagnostic/reel_cover)
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
# Larger logo pair for the ad template (cold ad creative reads at thumbnail scale)
LOGO_W_AD="$TMP/logo-w-240.png"
LOGO_B_AD="$TMP/logo-b-240.png"
[ ! -f "$LOGO_W_AD" ] && magick "$LOGO_BLACK" -fill white -colorize 100 -resize 240x "$LOGO_W_AD"
[ ! -f "$LOGO_B_AD" ] && magick "$LOGO_BLACK" -resize 240x "$LOGO_B_AD"

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
    CMD+=( -size 1080x1350 xc:white )
    CMD+=( "$LOGO_B_180" -gravity northwest -geometry +96+96 -compose over -composite )
    CMD+=( -fill "#1B6DFC" -draw "rectangle 96,515 160,523" )
    CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#1B6DFC" -annotate +176+537 "$LABEL" )
    CMD+=( -font "$SANS_BOLD" -pointsize 68 -fill "#1A1A1A" -annotate +96+655 "$HOOK1" )
    [ -n "$HOOK2" ] && CMD+=( -font "$SANS_BOLD" -pointsize 68 -fill "#1A1A1A" -annotate +96+755 "$HOOK2" )
    [ -n "$SUB1"  ] && CMD+=( -font "$SANS"      -pointsize 36 -fill "#3A3A3A" -annotate +96+855 "$SUB1" )
    [ -n "$SUB2"  ] && CMD+=( -font "$SANS"      -pointsize 36 -fill "#3A3A3A" -annotate +96+910 "$SUB2" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "#7C7C7C" -gravity south -annotate +0+96 "$HANDLE" )
    ;;

  contrarian)
    H2_COLOR="white"
    [ "$HOOK2_BLUE" = "true" ] && H2_COLOR="#1B6DFC"
    H3_COLOR="#1B6DFC"
    [ "$HOOK3_BLUE" = "false" ] && H3_COLOR="white"

    CMD+=( -size 1080x1350 xc:'#0F0F0F' )
    CMD+=( "$LOGO_W_180" -gravity northwest -geometry +96+96 -compose over -composite )
    if [ -n "$HOOK3" ]; then
      CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill white       -gravity center -annotate +0-120 "$HOOK1" )
      CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill "$H2_COLOR" -gravity center -annotate +0-10  "$HOOK2" )
      CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill "$H3_COLOR" -gravity center -annotate +0+100 "$HOOK3" )
    else
      CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill white       -gravity center -annotate +0-60 "$HOOK1" )
      [ -n "$HOOK2" ] && CMD+=( -font "$SANS_BOLD" -pointsize 96 -fill "$H2_COLOR" -gravity center -annotate +0+50 "$HOOK2" )
    fi
    [ -n "$SUB1" ] && CMD+=( -font "$SANS" -pointsize 36 -fill "rgba(255,255,255,0.88)" -gravity center -annotate +0+260 "$SUB1" )
    [ -n "$SUB2" ] && CMD+=( -font "$SANS" -pointsize 36 -fill "rgba(255,255,255,0.88)" -gravity center -annotate +0+310 "$SUB2" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.55)" -gravity south -annotate +0+96 "$HANDLE" )
    ;;

  pattern)
    CMD+=( -size 1080x1350 xc:white )
    CMD+=( "$LOGO_B_180" -gravity northwest -geometry +96+96 -compose over -composite )
    CMD+=( -fill "#1B6DFC" -draw "rectangle 96,495 160,503" )
    CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#1B6DFC" -annotate +176+517 "$LABEL" )
    CMD+=( -font "$GEORGIA_BOLD" -pointsize 58 -fill "#1A1A1A" -annotate +96+625 "$HOOK1" )
    [ -n "$HOOK2" ] && CMD+=( -font "$GEORGIA_BOLD_ITALIC" -pointsize 58 -fill "#1A1A1A" -annotate +96+695 "$HOOK2" )

    LIST_COUNT="$(echo "$SPEC" | jq -r '.list // [] | length')"
    Y=805
    for i in $(seq 0 $((LIST_COUNT - 1))); do
      ITEM="$(echo "$SPEC" | jq -r ".list[$i]")"
      CMD+=( -font "$SANS_BOLD" -pointsize 32 -fill "#1B6DFC" -annotate "+96+${Y}" "→" )
      CMD+=( -font "$SANS"      -pointsize 32 -fill "#2A2A2A" -annotate "+160+${Y}" "$ITEM" )
      Y=$((Y + 60))
    done
    # Soft CTA (optional): Signal Blue line below the list.
    [ -n "$SOFT_CTA" ] && CMD+=( -font "$SANS_BOLD" -pointsize 28 -fill "#1B6DFC" -annotate "+96+$((Y + 28))" "$SOFT_CTA" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "#7C7C7C" -gravity south -annotate +0+96 "$HANDLE" )
    ;;

  coach)
    # Quote marks (open " on hook_1, close " on the LAST filled line) are added
    # automatically. hook_1/hook_2 render in italic, sub_1/sub_2 in bold-italic.
    # Each post can use 1-4 lines; the closing quote attaches to whichever line
    # is last so short pull-quotes don't end with an unclosed quote.
    [ -z "$PHOTO" ] && { echo "coach template requires .photo" >&2; exit 1; }
    PF="$(photo_path "$PHOTO")"
    CMD+=( "$PF" -resize 1080x1350^ -gravity center -extent 1080x1350 -colorspace gray -colorspace sRGB )
    CMD+=( '(' -size 1080x1350 radial-gradient:'rgba(0,0,0,0)-rgba(0,0,0,0.62)' ')' -compose multiply -composite )
    # Bottom dark slab covers the text region (proportionally taller than the 1080² version)
    CMD+=( -fill "rgba(0,0,0,0.48)" -draw "rectangle 0,900 1080,1350" )
    CMD+=( "$LOGO_W_180" -gravity northwest -geometry +96+96 -compose over -composite )

    # Build the line list with their fonts, then close the quote on the last one
    LINES=()
    [ -n "$HOOK1" ] && LINES+=( "italic|$HOOK1" )
    [ -n "$HOOK2" ] && LINES+=( "italic|$HOOK2" )
    [ -n "$SUB1"  ] && LINES+=( "bold|$SUB1"   )
    [ -n "$SUB2"  ] && LINES+=( "bold|$SUB2"   )
    LAST_IDX=$(( ${#LINES[@]} - 1 ))

    # Vertical offsets from the bottom (gravity southwest): +46 vs the 1080² version
    # so the lowest line clears the 96px bottom safe zone.
    OFFSETS=( 336 271 206 141 )
    for idx in "${!LINES[@]}"; do
      entry="${LINES[$idx]}"
      font_kind="${entry%%|*}"
      text="${entry#*|}"
      [ "$idx" -eq 0 ] && text="\"$text"
      [ "$idx" -eq "$LAST_IDX" ] && text="${text}\""
      if [ "$font_kind" = "italic" ]; then F="$GEORGIA_ITALIC"; else F="$GEORGIA_BOLD_ITALIC"; fi
      CMD+=( -font "$F" -pointsize 52 -fill white -gravity southwest -annotate "+96+${OFFSETS[$idx]}" "$text" )
    done

    # Soft CTA (optional): small Signal Blue caps line at top-right, doesn't crowd the pull-quote.
    [ -n "$SOFT_CTA" ] && CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#1B6DFC" -gravity northeast -annotate +96+121 "$SOFT_CTA" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.7)" -gravity southwest -annotate +96+96 "$HANDLE" )
    ;;

  diagnostic)
    [ -z "$PHOTO" ] && { echo "diagnostic template requires .photo" >&2; exit 1; }
    PF="$(photo_path "$PHOTO")"
    [ -z "$CTA_EYEBROW" ] && CTA_EYEBROW="FREE · 2 MINUTES"
    [ -z "$CTA_TEXT"    ] && CTA_TEXT="→ Link in bio"

    CMD+=( "$PF" -resize 1080x1350^ -gravity center -extent 1080x1350 -colorspace gray -colorspace sRGB )
    # Gradient at the bottom — covers ~625px from bottom edge (proportional scale of original 500/1080)
    CMD+=( '(' -size 1080x625 gradient:'rgba(0,0,0,0)-rgba(0,0,0,0.82)' ')' -geometry +0+725 -compose over -composite )
    CMD+=( "$LOGO_W_180" -gravity northwest -geometry +96+96 -compose over -composite )
    CMD+=( -fill "#1B6DFC" -draw "rectangle 96,855 160,863" )
    CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#1B6DFC" -gravity northwest -annotate +176+849 "$CTA_EYEBROW" )
    CMD+=( -font "$SANS_BOLD" -pointsize 56 -fill white -gravity northwest -annotate +96+895 "$HOOK1" )
    [ -n "$HOOK2" ] && CMD+=( -font "$SANS_BOLD" -pointsize 56 -fill white -gravity northwest -annotate +96+963 "$HOOK2" )
    [ -n "$SUB1"  ] && CMD+=( -font "$SANS"      -pointsize 36 -fill "rgba(255,255,255,0.92)" -gravity northwest -annotate +96+1045 "$SUB1" )
    [ -n "$SUB2"  ] && CMD+=( -font "$SANS"      -pointsize 36 -fill "rgba(255,255,255,0.92)" -gravity northwest -annotate +96+1095 "$SUB2" )
    CMD+=( -fill "#1B6DFC" -draw "roundrectangle 96,1140 396,1192 8,8" )
    CMD+=( -font "$SANS_BOLD" -pointsize 22 -fill white -gravity northwest -annotate +126+1154 "$CTA_TEXT" )
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.6)" -gravity southeast -annotate +96+96 "$HANDLE" )
    ;;

  reel_cover)
    # Placeholder cover frame for an Amanda-produced HeyGen reel. 1080x1350
    # (4:5 portrait — grid-visible crop of the 9:16 reel; central band per
    # social-asset-spec.md). Greyscale photo BG + heavy gradient + on-screen
    # hook lines + REEL badge top-right + logo top-left + handle bottom.
    # Swapped for Amanda's MP4 cover frame when the reel itself ships.
    [ -z "$PHOTO" ] && { echo "reel_cover template requires .photo" >&2; exit 1; }
    PF="$(photo_path "$PHOTO")"
    CMD+=( "$PF" -resize 1080x1350^ -gravity center -extent 1080x1350 -colorspace gray -colorspace sRGB )
    # Heavier gradient than coach — reel covers compete with motion in feed
    CMD+=( '(' -size 1080x1350 gradient:'rgba(0,0,0,0.55)-rgba(0,0,0,0.85)' ')' -compose multiply -composite )
    # Top-left logo
    CMD+=( "$LOGO_W_180" -gravity northwest -geometry +96+96 -compose over -composite )
    # Top-right REEL badge (Signal Blue chip) — pushed in to clear right safe zone
    CMD+=( -fill "#1B6DFC" -draw "roundrectangle 834,96 984,144 6,6" )
    CMD+=( -font "$SANS_BOLD" -pointsize 22 -fill white -gravity northeast -annotate +109+109 "REEL  ▷" )
    # Centered on-screen hook lines (italic serif for pull-quote feel)
    CMD+=( -font "$GEORGIA_BOLD_ITALIC" -pointsize 64 -fill white -gravity center -annotate +0-100 "$HOOK1" )
    [ -n "$HOOK2" ] && CMD+=( -font "$GEORGIA_BOLD_ITALIC" -pointsize 64 -fill white -gravity center -annotate +0-10 "$HOOK2" )
    [ -n "$HOOK3" ] && CMD+=( -font "$GEORGIA_BOLD_ITALIC" -pointsize 64 -fill white -gravity center -annotate +0+80 "$HOOK3" )
    # Handle bottom
    CMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.7)" -gravity south -annotate +0+96 "$HANDLE" )
    ;;

  carousel)
    # Multi-slide swipe-through post. Reads .slides[] from spec and writes
    # one PNG per slide named {slug}_01.png ... {slug}_NN.png. Each slide
    # 1080x1350 (4:5 portrait) with 96px safe zone.
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
        SCMD+=( -size 1080x1350 xc:'#0F0F0F' )
        SCMD+=( "$LOGO_W_180" -gravity northwest -geometry +96+96 -compose over -composite )
        SCMD+=( -font "$SANS_BOLD" -pointsize 70 -fill white -gravity center -annotate +0-120 "$S_HOOK" )
        [ -n "$S_HOOK2" ] && SCMD+=( -font "$SANS_BOLD" -pointsize 70 -fill white -gravity center -annotate +0-30 "$S_HOOK2" )
        [ -n "$S_SUB"   ] && SCMD+=( -font "$SANS" -pointsize 36 -fill "rgba(255,255,255,0.92)" -gravity center -annotate +0+90 "$S_SUB" )
        # CTA pill (centered horizontally, shifted down for taller canvas)
        SCMD+=( -fill "#1B6DFC" -draw "roundrectangle 360,1090 720,1142 8,8" )
        SCMD+=( -font "$SANS_BOLD" -pointsize 22 -fill white -gravity north -annotate +0+1102 "$S_CTA_TXT" )
        # Slide counter top-right + handle bottom
        SCMD+=( -font "$SANS_BOLD" -pointsize 16 -fill "rgba(255,255,255,0.5)" -gravity northeast -annotate +96+121 "$S_DISPLAY" )
        SCMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "rgba(255,255,255,0.55)" -gravity south -annotate +0+96 "$HANDLE" )
      else
        # White content slide
        SCMD+=( -size 1080x1350 xc:white )
        SCMD+=( "$LOGO_B_180" -gravity northwest -geometry +96+96 -compose over -composite )
        if [ "$S_BLUE" = "true" ]; then HC="#1B6DFC"; else HC="#1A1A1A"; fi
        SCMD+=( -font "$SANS_BOLD" -pointsize 76 -fill "$HC" -gravity center -annotate +0-60 "$S_HOOK" )
        [ -n "$S_HOOK2" ] && SCMD+=( -font "$SANS_BOLD" -pointsize 76 -fill "$HC" -gravity center -annotate +0+40 "$S_HOOK2" )
        [ -n "$S_SUB"   ] && SCMD+=( -font "$SANS" -pointsize 36 -fill "#3A3A3A" -gravity center -annotate +0+170 "$S_SUB" )
        SCMD+=( -font "$SANS_BOLD" -pointsize 16 -fill "#7C7C7C" -gravity northeast -annotate +96+121 "$S_DISPLAY" )
        SCMD+=( -font "$SANS_BOLD" -pointsize 18 -fill "#7C7C7C" -gravity south -annotate +0+96 "$HANDLE" )
      fi

      SCMD+=( "$S_OUT" )
      "${SCMD[@]}"
      echo "$S_OUT"
    done
    exit 0
    ;;

  ad)
    # Cold-paid Meta ad creative. 4:5 portrait. Offer-first hierarchy:
    # the FREE 14-Day Challenge banner is the loudest visual element.
    # Hook below in plain buyer language. Promise line. No coach doctrine.
    #
    # Fields:
    #   hook_1, hook_2 (optional)  - buyer-language hook
    #   sub_1                       - one-line promise (default: "Find out why in 14 days. Free.")
    #   photo (optional 1-8)        - if provided, photo variant; else statement variant
    OFFER_HEADLINE="${LABEL:-FREE · 14-DAY BODY DECODE CHALLENGE}"
    OFFER_SUB="${SOFT_CTA:-Find your pattern in 14 days. No payment.}"
    PROMISE="${SUB1:-Find out why in 14 days. Free.}"
    CTA_PILL="${CTA_TEXT:-Start the free 14-day Challenge}"
    HOOK1_LEN=${#HOOK1}
    HOOK2_LEN=${#HOOK2}

    if [ -n "$PHOTO" ]; then
      # PHOTO VARIANT — kade portrait fills top (760px), dark slab below carries
      # blue offer banner + hook + promise + CTA pill. Photo shrunk vs the
      # statement variant to give the lower 590px room to breathe.
      PF="$(photo_path "$PHOTO")"
      CMD+=( "$PF" -resize 1080x760^ -gravity north -extent 1080x760 -colorspace gray -colorspace sRGB )
      # Extend canvas with a black bottom panel
      CMD+=( -background "#0F0F0F" -gravity north -extent 1080x1350 )
      # Signal Blue offer strip directly under the photo (120px tall)
      CMD+=( -fill "#1B6DFC" -draw "rectangle 0,755 1080,890" )
      # FREE headline stays stroke-bold; sub line reverts to regular weight.
      CMD+=( -font "$SANS_BOLD" -pointsize 38 -fill white -stroke white -strokewidth 1 -gravity north -annotate +0+795 "$OFFER_HEADLINE" +stroke )
      CMD+=( -font "$SANS" -pointsize 26 -fill "rgba(255,255,255,0.92)" -gravity north -annotate +0+852 "$OFFER_SUB" )
      # Logo top-left (over the photo, safe zone)
      CMD+=( "$LOGO_W_AD" -gravity northwest -geometry +96+96 -compose over -composite )
      # Hook in the dark panel — auto-shrink for long hooks (bumped one size)
      _maxlen=$HOOK1_LEN; [ ${HOOK2_LEN:-0} -gt $_maxlen ] && _maxlen=$HOOK2_LEN
      PH_PT=54
      [ "$_maxlen" -gt 26 ] && PH_PT=46
      [ "$_maxlen" -gt 30 ] && PH_PT=40
      [ "$_maxlen" -gt 36 ] && PH_PT=36
      PH_GAP=$(( PH_PT + (PH_PT / 3) ))
      PH_HOOK2_Y=$(( 925 + PH_GAP ))
      CMD+=( -font "$SANS_BOLD" -pointsize $PH_PT -fill white -gravity north -annotate +0+925 "$HOOK1" )
      [ -n "$HOOK2" ] && CMD+=( -font "$SANS_BOLD" -pointsize $PH_PT -fill white -gravity north -annotate "+0+${PH_HOOK2_Y}" "$HOOK2" )
      # Promise — uses `caption:` so long subs wrap to 2 lines
      # at a consistent readable size instead of shrinking.
      CMD+=( \( -background "#0F0F0F" -fill "rgba(255,255,255,0.86)" -font "$SANS" -pointsize 30 -size 888x -gravity center caption:"$PROMISE" \) -gravity north -geometry +0+1075 -composite )
      # CTA pill — Signal Blue, centred lower-mid (taller for bigger CTA text). Regular weight.
      CMD+=( -fill "#1B6DFC" -draw "roundrectangle 220,1165 860,1245 12,12" )
      CMD+=( -font "$SANS_BOLD" -pointsize 28 -fill white -gravity north -annotate +0+1187 "$CTA_PILL" )
      CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "rgba(255,255,255,0.6)" -gravity south -annotate +0+50 "$HANDLE" )
    else
      # STATEMENT VARIANT — Signal Blue offer banner at top, hook large mid, promise below
      CMD+=( -size 1080x1350 xc:white )
      # Logo top-left
      CMD+=( "$LOGO_B_AD" -gravity northwest -geometry +96+96 -compose over -composite )
      # BIG offer banner — Signal Blue strip, ~230px tall, centred under the logo
      CMD+=( -fill "#1B6DFC" -draw "rectangle 0,230 1080,460" )
      # FREE headline stays stroke-bold; sub line reverts to regular weight.
      CMD+=( -font "$SANS_BOLD" -pointsize 46 -fill white -stroke white -strokewidth 1 -gravity north -annotate +0+282 "$OFFER_HEADLINE" +stroke )
      CMD+=( -font "$SANS" -pointsize 28 -fill "rgba(255,255,255,0.92)" -gravity north -annotate +0+362 "$OFFER_SUB" )
      # Hook in dark grey, larger for thumbnail impact.
      # Auto-shrink for long hooks so text never overflows the 888px usable
      # width (1080 canvas - 96px safe zone × 2).
      _maxlen=$HOOK1_LEN; [ ${HOOK2_LEN:-0} -gt $_maxlen ] && _maxlen=$HOOK2_LEN
      HOOK_PT=92
      [ "$_maxlen" -gt 22 ] && HOOK_PT=82
      [ "$_maxlen" -gt 26 ] && HOOK_PT=72
      [ "$_maxlen" -gt 30 ] && HOOK_PT=62
      [ "$_maxlen" -gt 36 ] && HOOK_PT=54
      # Line gap scales with point size (~1.4× line-height)
      HOOK_GAP=$(( HOOK_PT + (HOOK_PT / 3) ))
      HOOK2_Y=$(( 550 + HOOK_GAP ))
      CMD+=( -font "$SANS_BOLD" -pointsize $HOOK_PT -fill "#1A1A1A" -gravity north -annotate +0+550 "$HOOK1" )
      [ -n "$HOOK2" ] && CMD+=( -font "$SANS_BOLD" -pointsize $HOOK_PT -fill "#1A1A1A" -gravity north -annotate "+0+${HOOK2_Y}" "$HOOK2" )
      # Promise line below hook — uses `caption:` so long subs wrap to 2 lines
      # at a consistent readable size instead of shrinking. Wraps inside the
      # 888px usable width (1080 − 96 × 2 safe zones).
      CMD+=( \( -background white -fill "#5C5C5C" -font "$SANS" -pointsize 38 -size 888x -gravity center caption:"$PROMISE" \) -gravity north -geometry +0+870 -composite )
      # Subtle Signal Blue accent rule — bridges promise to CTA without adding words
      CMD+=( -fill "#1B6DFC" -draw "rectangle 510,1010 570,1018" )
      # CTA pill — Signal Blue, centred lower-mid (taller for bigger CTA text). Regular weight.
      CMD+=( -fill "#1B6DFC" -draw "roundrectangle 220,1130 860,1220 12,12" )
      CMD+=( -font "$SANS_BOLD" -pointsize 28 -fill white -gravity north -annotate +0+1156 "$CTA_PILL" )
      # Handle bottom (one size up)
      CMD+=( -font "$SANS_BOLD" -pointsize 20 -fill "#7C7C7C" -gravity south -annotate +0+50 "$HANDLE" )
    fi
    ;;

  story)
    # 9:16 IG Story (1080×1920). 96px safe zone from all edges.
    # Categories (set via .category field): countdown | hook | pattern |
    # inside_challenge | quote | photo_overlay | disqualifier | launch_reveal.
    # Mirrors brand DNA from `ad` template: Pure White/Graphite Black/Signal
    # Blue (#1B6DFC), Helvetica stack, logo top-left, @body_recode_ bottom.
    CATEGORY="$(JN '.category')"
    PHOTO="$(JN '.photo')"
    COUNTDOWN="$(JN '.countdown')"      # e.g. "13" for "13 days to go"
    PATTERN_NAME="$(JN '.pattern_name')" # e.g. "Stress-Stored Pattern"

    # Top of file shared infrastructure: 240px logo for stories so it reads
    # at thumbnail scale in the Story tray.
    LOGO_W_STORY="$TMP/logo-w-260.png"
    LOGO_B_STORY="$TMP/logo-b-260.png"
    [ ! -f "$LOGO_W_STORY" ] && magick "$LOGO_BLACK" -fill white -colorize 100 -resize 260x "$LOGO_W_STORY"
    [ ! -f "$LOGO_B_STORY" ] && magick "$LOGO_BLACK" -resize 260x "$LOGO_B_STORY"

    case "$CATEGORY" in
      countdown)
        # Dark hero card. Massive countdown number + "DAYS TO GO" + Challenge name + date.
        # Sizes bumped 2026-06-29 for accessibility (Kade flagged copy was too small).
        CMD+=( -size 1080x1920 xc:'#0F0F0F' )
        # Signal Blue glow top-right
        CMD+=( \( -size 1080x1920 xc:none -fill 'rgba(27,109,252,0.3)' -draw 'circle 780,400 780,180' -blur 0x90 \) -compose over -composite )
        CMD+=( "$LOGO_W_STORY" -gravity northwest -geometry +96+96 -compose over -composite )
        # Massive countdown number (centred high)
        CMD+=( -font "$SANS_BOLD" -pointsize 420 -fill white -gravity center -annotate +0-280 "$COUNTDOWN" )
        CMD+=( -font "$SANS_BOLD" -pointsize 56 -fill "#7BB3FF" -gravity center -annotate +0-40 "DAYS TO GO" )
        # Locked sub
        CMD+=( -font "$SANS_BOLD" -pointsize 72 -fill white -gravity center -annotate +0+160 "14-Day Body Decode" )
        CMD+=( -font "$SANS_BOLD" -pointsize 72 -fill "#1B6DFC" -gravity center -annotate +0+250 "Challenge" )
        CMD+=( -font "$SANS_BOLD" -pointsize 44 -fill white -gravity center -annotate +0+400 "Opens Monday 13 July" )
        # Handle bottom (bumped)
        CMD+=( -font "$SANS_BOLD" -pointsize 30 -fill "#7C7C7C" -gravity south -annotate +0+120 "$HANDLE" )
        ;;
      hook)
        # White card. Big bold hook in centre. State-language for organic.
        # Sizes bumped 2026-06-29 for accessibility.
        CMD+=( -size 1080x1920 xc:white )
        # Signal Blue accent strip top
        CMD+=( -fill "#1B6DFC" -draw "rectangle 0,0 1080,12" )
        CMD+=( "$LOGO_B_STORY" -gravity northwest -geometry +96+96 -compose over -composite )
        # Eyebrow + headline + sub via caption: auto-wrap
        CMD+=( -font "$SANS_BOLD" -pointsize 36 -fill "#1B6DFC" -gravity center -annotate +0-460 "$LABEL" )
        CMD+=( \( -background white -fill "#1A1A1A" -font "$SANS_BOLD" -pointsize 108 -size 888x -gravity center caption:"$HOOK1" \) -gravity center -geometry +0-100 -composite )
        [ -n "$SUB1" ] && CMD+=( \( -background white -fill "#3A3A3A" -font "$SANS_BOLD" -pointsize 46 -size 888x -gravity center caption:"$SUB1" \) -gravity center -geometry +0+260 -composite )
        CMD+=( -font "$SANS_BOLD" -pointsize 30 -fill "#7C7C7C" -gravity south -annotate +0+120 "$HANDLE" )
        ;;
      pattern)
        # Dark hero card with pattern name. State language.
        # Sizes bumped 2026-06-29 for accessibility.
        PATTERN_COLOR="$(JN '.pattern_color')"
        [ -z "$PATTERN_COLOR" ] && PATTERN_COLOR="#1B6DFC"
        CMD+=( -size 1080x1920 xc:'#0F0F0F' )
        CMD+=( "$LOGO_W_STORY" -gravity northwest -geometry +96+96 -compose over -composite )
        # Pattern badge eyebrow
        CMD+=( -font "$SANS_BOLD" -pointsize 36 -fill "$PATTERN_COLOR" -gravity center -annotate +0-500 "PATTERN $LABEL" )
        # Pattern name big
        CMD+=( \( -background '#0F0F0F' -fill white -font "$SANS_BOLD" -pointsize 96 -size 888x -gravity center caption:"$PATTERN_NAME" \) -gravity center -geometry +0-280 -composite )
        # Hook body
        CMD+=( \( -background '#0F0F0F' -fill white -font "$SANS_BOLD" -pointsize 50 -size 888x -gravity center caption:"$HOOK1" \) -gravity center -geometry +0+60 -composite )
        [ -n "$SUB1" ] && CMD+=( \( -background '#0F0F0F' -fill "#7BB3FF" -font "$SANS_BOLD" -pointsize 42 -size 888x -gravity center caption:"$SUB1" \) -gravity center -geometry +0+380 -composite )
        CMD+=( -font "$SANS_BOLD" -pointsize 30 -fill "#7C7C7C" -gravity south -annotate +0+120 "$HANDLE" )
        ;;
      inside_challenge)
        # Day X / Day Y card. White background, Signal Blue numbered badge.
        # Sizes bumped 2026-06-29 for accessibility.
        # Label auto-scales 2026-07-08 so longer labels ("The Work") fit
        # inside the badge without clipping.
        DAY_NUM="$(JN '.day_num')"  # "Day 1", "Day 7", "Day 14", "The Work" etc
        CMD+=( -size 1080x1920 xc:white )
        CMD+=( "$LOGO_B_STORY" -gravity northwest -geometry +96+96 -compose over -composite )
        # Eyebrow
        CMD+=( -font "$SANS_BOLD" -pointsize 36 -fill "#1B6DFC" -gravity center -annotate +0-560 "INSIDE THE CHALLENGE" )
        # Auto-size the badge + label: short labels get the punchy sizing;
        # longer ones (> 6 chars) get a wider box + smaller font so nothing
        # clips out of the badge.
        DN_LEN=${#DAY_NUM}
        if [ "$DN_LEN" -le 6 ]; then
          BOX_L=340; BOX_R=740; LABEL_PT=100
        elif [ "$DN_LEN" -le 9 ]; then
          BOX_L=260; BOX_R=820; LABEL_PT=76
        else
          BOX_L=200; BOX_R=880; LABEL_PT=60
        fi
        # Day badge (larger)
        CMD+=( -fill "#1B6DFC" -draw "roundrectangle $BOX_L,460 $BOX_R,660 18,18" )
        CMD+=( -font "$SANS_BOLD" -pointsize "$LABEL_PT" -fill white -gravity center -annotate +0-360 "$DAY_NUM" )
        # Hook
        CMD+=( \( -background white -fill "#1A1A1A" -font "$SANS_BOLD" -pointsize 88 -size 888x -gravity center caption:"$HOOK1" \) -gravity center -geometry +0+40 -composite )
        # Sub
        [ -n "$SUB1" ] && CMD+=( \( -background white -fill "#3A3A3A" -font "$SANS_BOLD" -pointsize 46 -size 888x -gravity center caption:"$SUB1" \) -gravity center -geometry +0+360 -composite )
        CMD+=( -font "$SANS_BOLD" -pointsize 30 -fill "#7C7C7C" -gravity south -annotate +0+120 "$HANDLE" )
        ;;
      quote)
        # White card with large quoted text + attribution.
        # Sizes bumped 2026-06-29 for accessibility.
        CMD+=( -size 1080x1920 xc:white )
        CMD+=( "$LOGO_B_STORY" -gravity northwest -geometry +96+96 -compose over -composite )
        # Big quote mark accent
        CMD+=( -font "$SANS_BOLD" -pointsize 280 -fill "#1B6DFC" -gravity center -annotate +0-460 "\"" )
        # Quote body
        CMD+=( \( -background white -fill "#1A1A1A" -font "$SANS_BOLD" -pointsize 78 -size 888x -gravity center caption:"$HOOK1" \) -gravity center -geometry +0-20 -composite )
        # Attribution
        CMD+=( -font "$SANS_BOLD" -pointsize 40 -fill "#1A1A1A" -gravity center -annotate +0+380 "Kade Dunstone" )
        CMD+=( -font "$SANS" -pointsize 30 -fill "#5C5C5C" -gravity center -annotate +0+440 "Body Recode Founder" )
        CMD+=( -font "$SANS_BOLD" -pointsize 30 -fill "#7C7C7C" -gravity south -annotate +0+120 "$HANDLE" )
        ;;
      photo_overlay)
        # Photo bleeds top 2/3, dark slab bottom 1/3 with overlay text.
        # Sizes bumped 2026-06-29 for accessibility.
        PHOTO_FILE="$(photo_path "$PHOTO")"
        CMD+=( -size 1080x1920 xc:'#0F0F0F' )
        # Photo at top (cover, top-aligned to preserve face). Greyscale
        # to match the BR photo treatment used in every other photo-based
        # category (authority, contrarian, coach, diagnostic).
        CMD+=( \( "$PHOTO_FILE" -resize 1080x1180^ -gravity north -crop 1080x1180+0+0 +repage -colorspace gray -colorspace sRGB \) -gravity north -compose over -composite )
        # Dark gradient overlay at bottom for legibility
        CMD+=( \( -size 1080x320 gradient:'rgba(15,15,15,0)-rgba(15,15,15,1)' \) -gravity north -geometry +0+860 -compose over -composite )
        CMD+=( "$LOGO_W_STORY" -gravity northwest -geometry +96+96 -compose over -composite )
        # Overlay text in bottom slab
        CMD+=( \( -background '#0F0F0F' -fill white -font "$SANS_BOLD" -pointsize 78 -size 888x -gravity center caption:"$HOOK1" \) -gravity south -geometry +0+380 -composite )
        [ -n "$SUB1" ] && CMD+=( \( -background '#0F0F0F' -fill "#7BB3FF" -font "$SANS_BOLD" -pointsize 42 -size 888x -gravity center caption:"$SUB1" \) -gravity south -geometry +0+240 -composite )
        CMD+=( -font "$SANS_BOLD" -pointsize 30 -fill "#7C7C7C" -gravity south -annotate +0+120 "$HANDLE" )
        ;;
      launch_reveal)
        # Big "OPENS [DATE]" hero. Signal Blue background, white type.
        # Sizes bumped 2026-06-29 for accessibility.
        DATE_LINE="$(JN '.date_line')"  # "Monday 13 July" or "TOMORROW" or "TODAY"
        CMD+=( -size 1080x1920 xc:'#1B6DFC' )
        # Subtle vignette top-left for depth
        CMD+=( \( -size 1080x1920 xc:none -fill 'rgba(255,255,255,0.08)' -draw 'circle 200,200 200,0' -blur 0x100 \) -compose over -composite )
        CMD+=( "$LOGO_W_STORY" -gravity northwest -geometry +96+96 -compose over -composite )
        CMD+=( -font "$SANS_BOLD" -pointsize 44 -fill white -gravity center -annotate +0-460 "$LABEL" )
        # Massive OPENS
        CMD+=( -font "$SANS_BOLD" -pointsize 240 -fill white -gravity center -annotate +0-200 "OPENS" )
        # Date line
        CMD+=( \( -background '#1B6DFC' -fill white -font "$SANS_BOLD" -pointsize 100 -size 888x -gravity center caption:"$DATE_LINE" \) -gravity center -geometry +0-20 -composite )
        # Hook + sub
        [ -n "$HOOK1" ] && CMD+=( \( -background '#1B6DFC' -fill white -font "$SANS_BOLD" -pointsize 60 -size 888x -gravity center caption:"$HOOK1" \) -gravity center -geometry +0+240 -composite )
        [ -n "$SUB1" ]  && CMD+=( \( -background '#1B6DFC' -fill white -font "$SANS_BOLD" -pointsize 42 -size 888x -gravity center caption:"$SUB1" \) -gravity center -geometry +0+420 -composite )
        CMD+=( -font "$SANS_BOLD" -pointsize 30 -fill white -gravity south -annotate +0+120 "$HANDLE" )
        ;;
      disqualifier)
        # Two-panel card. Top "This is NOT for you" in muted, bottom "This IS for you" in Signal Blue.
        # Sizes bumped 2026-06-29 for accessibility.
        NOT_LINE="$(JN '.not_line')"
        IS_LINE="$(JN '.is_line')"
        CMD+=( -size 1080x1920 xc:white )
        CMD+=( "$LOGO_B_STORY" -gravity northwest -geometry +96+96 -compose over -composite )
        # Top half - NOT
        CMD+=( -font "$SANS_BOLD" -pointsize 38 -fill "#999999" -gravity center -annotate +0-420 "THIS IS NOT FOR YOU IF" )
        CMD+=( \( -background white -fill "#3A3A3A" -font "$SANS_BOLD" -pointsize 58 -size 888x -gravity center caption:"$NOT_LINE" \) -gravity center -geometry +0-200 -composite )
        # Divider rule
        CMD+=( -fill "#E5E5E5" -draw "rectangle 96,1000 984,1004" )
        # Bottom half - IS
        CMD+=( -font "$SANS_BOLD" -pointsize 38 -fill "#1B6DFC" -gravity center -annotate +0+140 "THIS IS FOR YOU IF" )
        CMD+=( \( -background white -fill "#1A1A1A" -font "$SANS_BOLD" -pointsize 64 -size 888x -gravity center caption:"$IS_LINE" \) -gravity center -geometry +0+360 -composite )
        CMD+=( -font "$SANS_BOLD" -pointsize 30 -fill "#7C7C7C" -gravity south -annotate +0+120 "$HANDLE" )
        ;;
      *)
        echo "unknown story category: $CATEGORY (need one of: countdown|hook|pattern|inside_challenge|quote|photo_overlay|launch_reveal|disqualifier)" >&2
        exit 1
        ;;
    esac
    ;;

  *)
    echo "unknown type: $TYPE" >&2
    exit 1
    ;;
esac

CMD+=( "$OUT" )
"${CMD[@]}"
echo "$OUT"
