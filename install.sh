#!/usr/bin/env bash
# PC SHOP — one-time installer for a fresh Ubuntu 22.04/24.04 server.
#   sudo ./install.sh
set -euo pipefail
cd "$(dirname "$0")"

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "ກະລຸນາຣັນດ້ວຍ sudo:  sudo ./install.sh"

# 1) Docker
if ! command -v docker >/dev/null 2>&1; then
  say "ກຳລັງຕິດຕັ້ງ Docker…"
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || die "Docker Compose ບໍ່ພ້ອມໃຊ້"

# 1b) Swap — building the website needs ~2 GB RAM; small servers fail without it
if [ "$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)" -lt 3500 ] && [ "$(awk '/SwapTotal/{print $2}' /proc/meminfo)" -eq 0 ]; then
  say "ເພີ່ມ swap 2GB (RAM ນ້ອຍ)…"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 2) Firewall: only SSH + web
if command -v ufw >/dev/null 2>&1; then
  say "ຕັ້ງ firewall (ເປີດສະເພາະ SSH, 80, 443)…"
  ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw allow 443/udp >/dev/null
  ufw --force enable >/dev/null
fi

# 3) .env with random secrets
if [ ! -f .env ]; then
  read -rp "ໃສ່ໂດເມນຂອງເວັບ (ເຊັ່ນ pcshop.la): " DOMAIN
  DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"
  [ -n "$DOMAIN" ] || die "ຕ້ອງໃສ່ໂດເມນ"
  cat > .env <<ENV
DOMAIN=$DOMAIN
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_USER=pcshop
POSTGRES_PASSWORD=$(openssl rand -hex 24)
POSTGRES_DB=pcshop
GOOGLE_CLIENT_ID=
ENV
  chmod 600 .env
  say "ສ້າງ .env ແລ້ວ (ລະຫັດລັບສຸ່ມໃໝ່)"
else
  say "ພົບ .env ເກົ່າ — ໃຊ້ຄ່າເດີມ"
fi
DOMAIN=$(grep '^DOMAIN=' .env | cut -d= -f2)

# 4) DNS check (HTTPS certificate needs the domain to point here)
IP=$(curl -fsS https://api.ipify.org || true)
DNS=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)
if [ -n "$IP" ] && [ "$DNS" != "$IP" ]; then
  echo "⚠️  $DOMAIN ຊີ້ໄປ '${DNS:-ບໍ່ພົບ}' ແຕ່ server ນີ້ແມ່ນ $IP."
  echo "   ຕັ້ງ DNS A record ຂອງ $DOMAIN (ແລະ www) ໃຫ້ເປັນ $IP ກ່ອນ, ບໍ່ດັ່ງນັ້ນ HTTPS ຈະຍັງບໍ່ເຮັດວຽກ."
  read -rp "   ດຳເນີນການຕໍ່ບໍ? [y/N] " ok; [ "${ok:-n}" = "y" ] || exit 1
fi

# 5) Build + start
mkdir -p backups
say "ກຳລັງ build ແລະ ເປີດລະບົບ (ຄັ້ງທຳອິດໃຊ້ເວລາ 5–10 ນາທີ)…"
docker compose up -d --build

say "ລໍຖ້າ API ພ້ອມ…"
for i in $(seq 1 60); do
  docker compose exec -T backend node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null && break
  sleep 3
done

# 6) Admin account
if [ ! -f .admin-created ]; then
  say "ສ້າງບັນຊີ Admin"
  read -rp "ອີເມວ Admin: " AEMAIL
  while true; do
    read -rsp "ລະຫັດຜ່ານ Admin (ຢ່າງໜ້ອຍ 10 ຕົວ): " APASS; echo
    [ ${#APASS} -ge 10 ] && break; echo "ສັ້ນເກີນໄປ"
  done
  docker compose exec -T backend npm run --silent create-admin -- "$AEMAIL" "$APASS" Admin
  touch .admin-created
fi

say "ສຳເລັດ! ເປີດ https://$DOMAIN"
echo "   Admin: https://$DOMAIN/admin"
echo "   ອັບເດດ: ./update.sh   ·   Backup: ./backups/   ·   Log: docker compose logs -f"
