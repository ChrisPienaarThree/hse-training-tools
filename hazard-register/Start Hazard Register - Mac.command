#!/bin/bash
cd "$(dirname "$0")"
F="$(pwd)/Hazard Register.html"
if [ -d "/Applications/Google Chrome.app" ]; then open -a "Google Chrome" "$F"
elif [ -d "/Applications/Microsoft Edge.app" ]; then open -a "Microsoft Edge" "$F"
else open "$F"; fi
