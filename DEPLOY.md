# ເປີດໃຊ້ PC SHOP ແບບໃຊ້ງານຈິງ — ຄູ່ມືທຸກຂັ້ນຕອນ

ຜົນລັບທີ່ຈະໄດ້: ເວັບ `https://ໂດເມນຂອງເຈົ້າ` ພ້ອມ HTTPS, ຖານຂໍ້ມູນທີ່ປິດຈາກອິນເຕີເນັດ, backup ອັດຕະໂນມັດທຸກວັນ, ແລະ ບັນຊີ Admin ທີ່ເຈົ້າຕັ້ງລະຫັດເອງ.

ເວລາທີ່ໃຊ້: ປະມານ 1 ຊົ່ວໂມງ (ບໍ່ລວມເວລາລໍຖ້າ DNS ແລະ ທະນາຄານ).
ຄ່າໃຊ້ຈ່າຍໂດຍປະມານ: ໂດເມນ .la ~€33/ປີ (ຫຼື .com ~$12/ປີ) + Server ~$12–24/ເດືອນ.

```
ລູກຄ້າ ──HTTPS──▶ Caddy (80/443) ──┬─ /api/* ──▶ Backend (Express)  ──▶ PostgreSQL
                                    └─ ອື່ນໆ  ──▶ Frontend (Next.js)        ▲
                                                               Backup ທຸກວັນ ┘ → ./backups
```

---

## ຂັ້ນຕອນ 1 — ຊື້ໂດເມນ

1. ເລືອກຊື່ ເຊັ່ນ `pcshop.la` ຫຼື `pcshop-laos.com`.
2. ຊື້ຜ່ານຜູ້ຈຳໜ່າຍໂດເມນ (registrar) ໃດກໍໄດ້. `.la` ເປີດໃຫ້ທຸກຄົນຈົດທະບຽນໄດ້ ບໍ່ຈຳເປັນຕ້ອງມີບໍລິສັດໃນລາວ. ຕົວຢ່າງ: INWX, Netim, EuroDNS (ສຳລັບ .la), ຫຼື Cloudflare / Namecheap (ສຳລັບ .com).
3. ເກັບລະຫັດເຂົ້າໜ້າຈັດການໂດເມນໄວ້ ເພາະຂັ້ນຕອນ 3 ຕ້ອງໃຊ້.

## ຂັ້ນຕອນ 2 — ເຊົ່າ Server (VPS)

1. ສະໝັກ DigitalOcean ຫຼື Vultr (ຈ່າຍດ້ວຍບັດ Visa/Mastercard).
2. ສ້າງ server:
   - **Region: Singapore** (ໃກ້ລາວທີ່ສຸດ, ເວັບໂຫຼດໄວ)
   - **OS: Ubuntu 24.04 LTS**
   - **ຂະໜາດ: 2 vCPU / 4 GB RAM** (~$24/ເດືອນ, ແນະນຳ). ເລີ່ມຕົ້ນດ້ວຍ 2 GB (~$12) ກໍໄດ້ ເພາະສະຄຣິບຕິດຕັ້ງຈະເພີ່ມ swap ໃຫ້.
   - ເປີດ **Backups** ຂອງຜູ້ໃຫ້ບໍລິການນຳ (ເພີ່ມປະມານ 20%) ເປັນຊັ້ນປ້ອງກັນທີສອງ.
   - Authentication: ໃຊ້ **SSH key** ຖ້າເຮັດໄດ້ ຫຼື ລະຫັດຜ່ານຍາວໆ.
3. ຈົດ **IP address** ຂອງ server ໄວ້ (ເຊັ່ນ `203.0.113.10`).

## ຂັ້ນຕອນ 3 — ຊີ້ໂດເມນມາຫາ Server (DNS)

ໃນໜ້າຈັດການໂດເມນ ເພີ່ມ 2 ລາຍການ:

| Type | Name / Host | Value | TTL |
|---|---|---|---|
| A | `@` | IP ຂອງ server | 300 |
| A | `www` | IP ຂອງ server | 300 |

ລໍຖ້າ 5–60 ນາທີ. ກວດໄດ້ທີ່ https://dnschecker.org: ຖ້າຂຶ້ນ IP ຂອງ server ແມ່ນພ້ອມແລ້ວ.

## ຂັ້ນຕອນ 4 — ຕິດຕັ້ງລະບົບ

ເຂົ້າ server (Windows: ໃຊ້ PowerShell, Mac: Terminal):

```bash
ssh root@IP_ຂອງ_server
```

ດາວໂຫຼດໂຄດ ແລະ ຕິດຕັ້ງ:

```bash
apt update && apt install -y git
git clone https://github.com/lngslaonextgenfueling-eng/cp-lao.git
cd cp-lao
sudo ./install.sh
```

> repo ເປັນ private: ຕອນ `git clone` GitHub ຈະຖາມ username ແລະ password. ໃຫ້ໃສ່ username GitHub ແລະ **Personal Access Token** ແທນລະຫັດຜ່ານ (ສ້າງທີ່ GitHub → Settings → Developer settings → Fine-grained tokens, ໃຫ້ສິດ Contents: Read ສະເພາະ repo ນີ້).

ສະຄຣິບຈະເຮັດໃຫ້ເອງທັງໝົດ:
- ຕິດຕັ້ງ Docker ແລະ ເພີ່ມ swap ຖ້າ RAM ນ້ອຍ
- ເປີດ firewall ສະເພາະ SSH, 80, 443
- **ຖາມໂດເມນ** ແລ້ວສ້າງລະຫັດລັບແບບສຸ່ມ (JWT, ລະຫັດຖານຂໍ້ມູນ) ໃສ່ໄຟລ໌ `.env`
- ກວດວ່າ DNS ຊີ້ມາຖືກ server ແລ້ວບໍ່
- build ແລະ ເປີດລະບົບ (ຄັ້ງທຳອິດ 5–10 ນາທີ)
- **ຖາມອີເມວ ແລະ ລະຫັດຜ່ານ Admin** (ຢ່າງໜ້ອຍ 10 ຕົວ) ແລ້ວສ້າງບັນຊີ

ສຳເລັດແລ້ວ ເປີດ `https://ໂດເມນຂອງເຈົ້າ` ໄດ້ເລີຍ. ໃບຮັບຮອງ HTTPS ຈະອອກໃຫ້ອັດຕະໂນມັດພາຍໃນ 1 ນາທີ.

> ⚠️ ເກັບໄຟລ໌ `.env` ໄວ້ບ່ອນປອດໄພ (ເຊັ່ນ password manager). ຖ້າເສຍ ຈະກູ້ backup ຖານຂໍ້ມູນບໍ່ໄດ້ງ່າຍ. ຢ່າ commit ຂຶ້ນ GitHub (`.gitignore` ກັນໄວ້ແລ້ວ).

## ຂັ້ນຕອນ 5 — ຕັ້ງຄ່າໃນລະບົບ

1. ເຂົ້າ `https://ໂດເມນ/login` ດ້ວຍບັນຊີ Admin → ໄປ `/admin`.
2. **ຄູປອງ**: ສ້າງຄູປອງເປີດຕົວ (ລະບົບຈິງບໍ່ມີຄູປອງຕົວຢ່າງ).
3. **ຮ້ານທຳອິດ**: ສະໝັກສະມາຊິກໃໝ່ດ້ວຍອີເມວອື່ນ (ບັນຊີຮ້ານ) → “ເປີດຮ້ານຂາຍ” → ກັບມາ Admin ອະນຸມັດ → ຕັ້ງ % ຄ່າທຳນຽມ.
4. ຢູ່ໜ້າ `/seller` ຂອງຮ້ານ: ໃສ່ບັນຊີ BCEL ຮັບເງິນ, ລົງສິນຄ້າ ແລະ ສະຕັອກ.
5. ທົດລອງສັ່ງຊື້ 1 ອໍເດີຈິງ ຈົນຮອດສະຖານະ “ສຳເລັດ”.

## ຂັ້ນຕອນ 6 — Google Login (ບໍ່ບັງຄັບ)

1. https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID → Web application.
2. Authorized JavaScript origins: `https://ໂດເມນຂອງເຈົ້າ`
3. ເອົາ Client ID ໃສ່ `.env` ເປັນ `GOOGLE_CLIENT_ID=...` ແລ້ວຣັນ `docker compose up -d --build`.

## ຂັ້ນຕອນ 7 — ຮັບເງິນອັດຕະໂນມັດດ້ວຍ BCEL OnePay (ເມື່ອພ້ອມ)

ຕອນນີ້ລະບົບສະແດງເລກບັນຊີຂອງຮ້ານ ແລະ ຮ້ານກົດຢືນຢັນເອງວ່າ “ຊຳລະແລ້ວ”. ວິທີນີ້ໃຊ້ງານໄດ້ຕັ້ງແຕ່ມື້ທຳອິດ. ການຢືນຢັນອັດຕະໂນມັດຕ້ອງສະໝັກເປັນ merchant ກັບ BCEL ກ່ອນ:

1. ຂໍແບບຟອມ **Membership Application for BCEL's E-Commerce Products** (Payment Gateway, ເລືອກ BCEL OnePay QR) ທີ່ສາຂາ BCEL ຫຼື ເວັບ bcel.com.la.
2. ເອກະສານທີ່ຕ້ອງໃຊ້ (ຕາມແບບຟອມ):
   - ໃບທະບຽນວິສາຫະກິດ / ໃບອະນຸຍາດດຳເນີນທຸລະກິດ
   - ໃບທະບຽນອາກອນ, ເລກປະຈຳຕົວຜູ້ເສຍອາກອນ ແລະ ໃບຢັ້ງຢືນການເສຍອາກອນຫຼ້າສຸດ
   - ບັດປະຈຳຕົວ / ສຳມະໂນຄົວ / Passport ຂອງເຈົ້າຂອງ
   - ບັນຊີ BCEL (ກີບ ແລະ/ຫຼື USD) ສຳລັບຮັບເງິນ
   - ຂໍ້ກຳນົດ ແລະ ນະໂຍບາຍການສັ່ງຊື້ຂອງເວັບ, ແຜນທີ່ຫ້ອງການ
   - ຂໍ້ມູນເວັບ: ໂດເມນ (ຂັ້ນຕອນ 1), ຜູ້ພັດທະນາ, ປະເພດສິນຄ້າ, ຍອດຂາຍຄາດໝາຍຕໍ່ເດືອນ
3. ເຊັນສັນຍາ Membership Agreement (ມີຄ່າບຳລຸງລາຍເດືອນ ແລະ ຄ່າທຳນຽມຕໍ່ລາຍການ ຕາມທີ່ທະນາຄານກຳນົດ).
4. ເມື່ອໄດ້ merchant ID ແລະ ເອກະສານ API ຈາກທະນາຄານແລ້ວ, ສົ່ງໃຫ້ຂ້ອຍ (Claude) ເພື່ອເຊື່ອມລະບົບໃຫ້ອໍເດີປ່ຽນເປັນ “ຊຳລະແລ້ວ” ອັດຕະໂນມັດ.

> ໝາຍເຫດ: ຖ້າໃຊ້ merchant ດຽວຂອງແພລດຟອມ, ເງິນລູກຄ້າຈະເຂົ້າບັນຊີແພລດຟອມກ່ອນ ແລ້ວແພລດຟອມໂອນໃຫ້ແຕ່ລະຮ້ານ (ຫັກຄ່າທຳນຽມ). ຖ້າແຕ່ລະຮ້ານມີ merchant ຂອງຕົນເອງ, ເງິນເຂົ້າຮ້ານໂດຍກົງຄືເກົ່າ. ຄວນຖາມ BCEL ວ່າຮອງຮັບແບບໃດ.

---

## ການດູແລປະຈຳວັນ

| ຕ້ອງການ | ຄຳສັ່ງ (ຢູ່ໃນໂຟນເດີ `cp-lao`) |
|---|---|
| ເບິ່ງວ່າລະບົບເຮັດວຽກບໍ່ | `docker compose ps` |
| ເບິ່ງ log / ຫາຂໍ້ຜິດພາດ | `docker compose logs -f backend` |
| ອັບເດດເປັນໂຄດໃໝ່ (backup ໃຫ້ກ່ອນອັດຕະໂນມັດ) | `./update.sh` |
| ລາຍການ backup | `ls -lh backups/` |
| ກູ້ຂໍ້ມູນຈາກ backup | `./restore.sh backups/pcshop-YYYYMMDD-HHMM.sql.gz` |
| ລືມລະຫັດ Admin / ສ້າງ Admin ໃໝ່ | `docker compose exec backend npm run create-admin -- email@x.la ລະຫັດໃໝ່` |
| ຣີສະຕາດທັງລະບົບ | `docker compose restart` |

**Backup:** ລະບົບ backup ຖານຂໍ້ມູນທຸກ 24 ຊົ່ວໂມງ ເກັບໄວ້ 14 ວັນໃນ `backups/`. ແນະນຳໃຫ້ copy ອອກຈາກ server ອາທິດລະຄັ້ງ:
```bash
# ຣັນຢູ່ເຄື່ອງຂອງເຈົ້າ (ບໍ່ແມ່ນ server)
scp root@IP_ຂອງ_server:cp-lao/backups/*.sql.gz ./
```

## ແກ້ບັນຫາທີ່ພົບເລື້ອຍ

| ອາການ | ສາເຫດ / ວິທີແກ້ |
|---|---|
| ເປີດເວັບບໍ່ໄດ້ ຫຼື ແຈ້ງ certificate ຜິດ | DNS ຍັງບໍ່ຊີ້ມາ server: ກວດ dnschecker.org ແລ້ວ `docker compose restart caddy` |
| build ຢຸດກາງທາງ (killed) | RAM ບໍ່ພໍ: ກວດ `free -h` ວ່າມີ swap; ຫຼື ເພີ່ມ server ເປັນ 4 GB |
| “ກະລຸນາເຂົ້າສູ່ລະບົບ” ຕະຫຼອດ | ໂດເມນໃນ `.env` ບໍ່ກົງກັບທີ່ເປີດ (www ຫຼື ບໍ່ມີ www): ໃຊ້ໂດເມນດຽວກັບ `DOMAIN` |
| ລອງ login ຫຼາຍເທື່ອແລ້ວຖືກບລັອກ | ຈຳກັດ 10 ຄັ້ງ / 15 ນາທີ: ລໍຖ້າ ຫຼື `docker compose restart backend` |
| API ບໍ່ເປີດ, log ແຈ້ງ JWT_SECRET | `.env` ຂາດ `JWT_SECRET`: ຣັນ `openssl rand -hex 32` ແລ້ວໃສ່ |

## ລາຍການກວດກ່ອນເປີດໃຫ້ລູກຄ້າ

- [ ] ເປີດ `https://` ໄດ້ ແລະ ມີຮູບກະແຈໃນ browser
- [ ] Admin ໃຊ້ອີເມວຈິງ ແລະ ລະຫັດຜ່ານຍາວ
- [ ] ມີຮ້ານຢ່າງໜ້ອຍ 1 ຮ້ານ ທີ່ໃສ່ບັນຊີ BCEL ຖືກຕ້ອງ
- [ ] ທົດລອງສັ່ງຊື້, ຢືນຢັນຊຳລະ, ຈັດສົ່ງ, ສຳເລັດ ແລະ ຍົກເລີກ ຄົບ 1 ຮອບ
- [ ] ມີໄຟລ໌ໃນ `backups/` ແລະ ທົດລອງ `./restore.sh` ຢູ່ server ທົດລອງ 1 ຄັ້ງ
- [ ] ເກັບ `.env` ໄວ້ບ່ອນປອດໄພນອກ server
- [ ] ອ່ານ ແລະ ແກ້ໜ້າ `/policy` ໃຫ້ກົງກັບທຸລະກິດ (ໂດຍສະເພາະອີເມວ/ເບີຕິດຕໍ່ ໃນ `frontend/app/policy/page.tsx`: ແກ້ຢູ່ໜ້າ GitHub ດ້ວຍປຸ່ມ ✏️) ແລ້ວຣັນ `./update.sh` ຢູ່ server. BCEL ຕ້ອງການໜ້ານີ້ຕອນສະໝັກ merchant
