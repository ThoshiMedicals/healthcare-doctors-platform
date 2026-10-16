#!/bin/sh
# Builds a Cloudflare-only allow list for the VPS origin.
# Downloads the current ranges from Cloudflare. Does not change the firewall
# unless APPLY_ORIGIN_FIREWALL=yes and ADMIN_CIDR are both set.
#
#   sh deployment/cloudflare-origin-firewall.sh
#   ADMIN_CIDR=203.0.113.10/32 APPLY_ORIGIN_FIREWALL=yes sh deployment/cloudflare-origin-firewall.sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
out="deployment/nginx/cloudflare-allow.conf"
tmp=$(mktemp)
trap 'rm -f "$tmp" "$tmp.v4" "$tmp.v6"' EXIT

curl -fsS https://www.cloudflare.com/ips-v4 > "$tmp.v4"
curl -fsS https://www.cloudflare.com/ips-v6 > "$tmp.v6"
v4_count=$(grep -c . "$tmp.v4")
v6_count=$(grep -c . "$tmp.v6")
if [ "$v4_count" -lt 5 ] || [ "$v6_count" -lt 2 ]; then
  echo "Cloudflare did not return a usable address list." >&2
  exit 1
fi

{
  echo "# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) from https://www.cloudflare.com/ips-v4 and ips-v6."
  echo "# Include this file inside each public server block."
  echo "# Regenerate it when Cloudflare publishes new ranges. Do not edit by hand."
  echo "# Nginx can use this list only when Docker preserves the visitor address"
  echo "# (userland-proxy false). The host firewall is the control that blocks direct IP access."
  echo "real_ip_header CF-Connecting-IP;"
  while read -r cidr; do
    [ -n "$cidr" ] || continue
    echo "set_real_ip_from ${cidr};"
    echo "allow ${cidr};"
  done < "$tmp.v4"
  while read -r cidr; do
    [ -n "$cidr" ] || continue
    echo "set_real_ip_from ${cidr};"
    echo "allow ${cidr};"
  done < "$tmp.v6"
  echo "deny all;"
} > "$out"

echo "Wrote ${out} (${v4_count} IPv4, ${v6_count} IPv6)."
echo "Host firewall example, applied only with APPLY_ORIGIN_FIREWALL=yes:"
echo "  Ports 80 and 443 accept Cloudflare ranges and then drop everyone else."
echo "  SSH is unchanged. Set ADMIN_CIDR before restricting SSH yourself."

if [ "${APPLY_ORIGIN_FIREWALL:-}" != "yes" ]; then
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Refusing to change the firewall without root." >&2
  exit 1
fi

install_chain() {
  tool=$1
  list=$2
  chain=CF-ORIGIN
  if [ "$tool" = "ip6tables" ]; then
    chain=CF-ORIGIN6
  fi
  "$tool" -N "$chain" 2>/dev/null || "$tool" -F "$chain"
  "$tool" -F "$chain"
  while read -r cidr; do
    [ -n "$cidr" ] || continue
    "$tool" -A "$chain" -p tcp -m multiport --dports 80,443 -s "$cidr" -j RETURN
  done < "$list"
  "$tool" -A "$chain" -p tcp -m multiport --dports 80,443 -j DROP
  "$tool" -C DOCKER-USER -j "$chain" 2>/dev/null || "$tool" -I DOCKER-USER 1 -j "$chain"
}

install_chain iptables "$tmp.v4"
install_chain ip6tables "$tmp.v6"
echo "DOCKER-USER now jumps to CF-ORIGIN and CF-ORIGIN6."
echo "Confirm a Cloudflare request still reaches the site before closing this session."
