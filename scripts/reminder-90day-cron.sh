#!/bin/zsh
# Self-destructing launchd wrapper: sends the 90-Day Extension reminder once at
# 5pm 2026-07-16, then unloads + removes itself so it never fires again.
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$HOME/body-recode-mvp" || exit 1
set -a
source .env.local
set +a
/opt/homebrew/bin/npx tsx scripts/send-reminder-90day-extension.ts >> /tmp/reminder-90day.log 2>&1

# Self-destruct: only after the (single) target date has passed. Guard on date
# so a launchd catch-up on a later wake doesn't re-fire, and clean up.
PLIST="$HOME/Library/LaunchAgents/au.bodyrecode.reminder90day.plist"
launchctl bootout gui/$(id -u)/au.bodyrecode.reminder90day 2>/dev/null
rm -f "$PLIST"
