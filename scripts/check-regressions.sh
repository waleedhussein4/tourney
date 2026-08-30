#!/usr/bin/env bash
# Regression gates.
#
# Every bug and vulnerability fixed during the rewrite has a behavioural test;
# these are the textual tripwires that stop one creeping back in. Each gate must
# find nothing.
#
#   npm run check:regressions

cd "$(dirname "$0")/.." || exit 1

fail=0
gate() {
  local name="$1"; shift
  local out
  out="$("$@" 2>/dev/null)"
  if [ -n "$out" ]; then
    echo "  FAIL  $name"
    echo "$out" | head -5 | sed 's/^/          /'
    fail=1
  else
    echo "  PASS  $name"
  fi
}

S=server

echo "Regression gates"

gate "no Access-Control-* headers set by hand" \
  grep -rn "Access-Control-" $S/src $S/scripts

gate "no /api/tournement typo anywhere" \
  grep -rn "tournement" $S/src $S/scripts client/src

# src/index.js is the process entrypoint; its two startup lines are the server's
# console, and are the only place `no-console` is disabled.
gate "no console.log outside the process entrypoint" \
  grep -rn --include=*.js --exclude=index.js "console\.log" $S/src

gate "no legacy server directories left" \
  find $S/controller $S/routes $S/models $S/middleware -type f

gate "no jsdom, init, or mongodb driver dependency" \
  grep -n "\"jsdom\"\|\"init\"\|\"mongodb\"" $S/package.json

gate "no dotenv or uuid in the client bundle" \
  grep -n "\"dotenv\"\|\"uuid\"" client/package.json

# Shipped code only: the test suite names these dead routes on purpose, to
# assert they answer 404.
gate "no removeEarn or subHostEarninhgs" \
  grep -rn "removeEarn\|subHostEarninhg" $S/src $S/scripts client/src --include=*.js --include=*.jsx

gate "no raw Set-Cookie header" \
  grep -rn "setHeader('Set-Cookie'\|setHeader(\"Set-Cookie\"" $S/src

gate "no process.env read outside config/env.js" \
  grep -rn --include=*.js "process\.env\." $S/src/app.js $S/src/models $S/src/modules $S/src/middleware $S/src/utils $S/src/db

gate "no Jaro-Winkler implementation left" \
  grep -rni "jarowinkler" $S/src client/src

gate "no hotlinked third-party images" \
  grep -rn "m.media-amazon.com\|redbull.com\|epicgames.com\|britannica.com\|displate.com" $S/src client/src

gate "no plaintext password in localStorage" \
  grep -rn "rememberedPassword" client/src

gate "no card fields sent to the server" \
  grep -rn "creditCardNumber," client/src

gate "no committed seed passwords" \
  grep -rEn "password: ['\"][A-Za-z0-9!@#$%^&*_]+['\"]" $S/scripts

gate "no authReducer dead code" \
  grep -rn "authReducer" client/src

gate "no checkMember middleware" \
  grep -rn "checkMember" $S/src $S/scripts client/src --include=*.js --include=*.jsx

gate "no prompt/confirm/alert in the pages the server rewrite touched" \
  grep -rn "window\.prompt\|[^.]\bprompt(" client/src/pages/manage/Manage.jsx client/src/pages/tournament/Tournament.jsx

# The original reloaded the whole SPA after almost every mutation, which threw
# away the cache and re-authenticated on the way back. React Query invalidation
# replaced it. The leading [^*/]* keeps the gate off comment lines: a couple of
# files explain what they replaced, and naming the old bug is not committing it.
gate "no full-page reloads in the client" \
  grep -rnE "^[^*/]*(navigate\(0\)|window\.location\.reload)" client/src

gate "no VITE_BACKEND_URL left in the client" \
  grep -rn "VITE_BACKEND_URL" client/src

gate ".gitignore covers env files" \
  bash -c 'grep -q "^\.env$" .gitignore && grep -q "^\.env\.\*$" .gitignore || echo "missing"'

gate "no env file is tracked by git" \
  bash -c 'git ls-files | grep -E "\.env$|\.env\.(development|production|local)$"'

gate "no secret ever entered git history" \
  bash -c 'git log --all --diff-filter=A --name-only --pretty=format: | grep -E "(^|/)\.env(\.|$)" | grep -v example'

echo
if [ $fail -eq 0 ]; then echo "all gates pass"; else echo "SOME GATES FAILED"; fi
exit $fail
