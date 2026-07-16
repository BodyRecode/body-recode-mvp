#!/bin/zsh
# Wrapper for launchd: runs the Day 0 scorecard completion check + emails Kade.
# launchd gives a minimal PATH, so we set an explicit one and use absolute dirs.
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$HOME/body-recode-mvp" || exit 1
set -a
source .env.local
set +a
/opt/homebrew/bin/npx tsx scripts/day0-completion-check.ts >> /tmp/day0-scorecard-check.log 2>&1
