#!/bin/bash
# Opens the Incident Investigation Toolkit in Google Chrome or Microsoft Edge (or the default browser)
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -d "/Applications/Google Chrome.app" ]; then open -a "Google Chrome" "$DIR/START HERE.html"
elif [ -d "/Applications/Microsoft Edge.app" ]; then open -a "Microsoft Edge" "$DIR/START HERE.html"
else open "$DIR/START HERE.html"; fi
