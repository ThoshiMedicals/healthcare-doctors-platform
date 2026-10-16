#!/bin/sh
# Production smoke checks. Usage: sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au
set -eu
base=${1:-http://localhost:8080}
base=${base%/}
fail=0

check() {
  path=$1
  expect=$2
  needle=$3
  body=$(mktemp)
  code=$(curl -sS -o "$body" -w "%{http_code}" --max-time 30 "${base}${path}")
  if [ "$code" != "$expect" ]; then
    echo "FAIL ${path} status ${code}, expected ${expect}"
    fail=1
  elif [ -n "$needle" ] && ! grep -q "$needle" "$body"; then
    echo "FAIL ${path} missing ${needle}"
    fail=1
  else
    echo "OK   ${path}"
  fi
  rm -f "$body"
}

check / 200 "Book Appointment"
check / 200 "hotdoc-widgets.min.js"
check / 200 'role="group" aria-label="Practice contact and location"'
check /doctors/dr-anand-singh.html 200 "data-practitioner-image"
check /knowledge/index.html 200 "Knowledge Centre"
check /about-us.html 200 "About Woolloongabba Medical Centre"
check /patient-information.html 200 "Patient Information"
check /contact.html 200 "468 Vulture Street"
check /privacy-confidentiality.html 200 "Privacy"
check /does-not-exist.html 404 'aria-level="2"'
check /robots.txt 200 "Sitemap:"
check /sitemap.xml 200 "gabbamedicalcentre.com.au"
check /admin/login 200 "Sign in"

if [ "$fail" -ne 0 ]; then
  exit 1
fi
