<!--
Whitepaper La Tanda v2.1 — terjemahan Bahasa Indonesia.
Diterjemahkan dari es.md (sumber kanon berbahasa Spanyol), disinkronkan pada 2026-10-11 dengan v2.1.
Terjemahan awal v2.0 oleh kontributor komunitas; struktur dan isi diselaraskan kembali dengan es.md v2.1.
Jangan diubah kecuali untuk sinkronisasi dengan sumber kanon.
Terjemahan tersimpan dalam berkas-berkas terpisah: pt-br.md, id.md, dll.
-->

Dokumen desain, tidak menggambarkan produk yang sedang beroperasi.
Menyebut komponen yang tidak aktif (kontrak kustodi, modul rantai yang
direncanakan) dan sebuah prototipe EVM yang sudah dihentikan; La Tanda
tidak menyimpan dana pengguna dan tidak memberikan kredit.

La Tanda

Whitepaper Teknis v2.1

Februari 2026 (diperbarui 11 Oktober 2026) \| Ray-Banks LLC

## Daftar Isi

- [1. Ringkasan Eksekutif](#abstract)
- [2. Masalah](#problem)
- [3. Solusi](#solution)
- [4. Teknologi](#technology)
- [5. Tokenomics](#tokenomics)
- [6. Fitur](#features)
- [7. Keamanan](#security)
- [8. La Tanda Chain](#chain)
- [9. Roadmap](#roadmap)
- [10. Tim dan Legal](#team)

# 1. Ringkasan Eksekutif

La Tanda adalah platform Web3 yang mendigitalkan dan menyempurnakan
sistem tanda tradisional (arisan: kelompok tabungan dan kredit
bergilir) melalui teknologi blockchain, sehingga akses ke layanan
keuangan lebih terbuka bagi komunitas yang kurang terlayani.

**Misi:** Membangun platform keuangan Web3 yang paling mudah diakses di
dunia, dengan memadukan kepercayaan tanda tradisional dengan
transparansi dan keamanan blockchain.

1.7B

Orang tanpa akses perbankan

\$500B+

Pasar ROSCA global

Cosmos SDK

Rantai sendiri (testnet)

200M

LTD Token Supply

# 2. Masalah

## 2.1 Eksklusi Keuangan

Menurut Bank Dunia, 1,7 miliar orang dewasa tidak memiliki akses ke
layanan perbankan. Di Amerika Latin, 45% penduduk kurang terlayani bank
dan bergantung pada sistem informal untuk menabung dan meminjam.

## 2.2 Keterbatasan Tanda Tradisional

- **Kepercayaan:** Bergantung pada hubungan pribadi, sehingga
  jangkauannya terbatas
- **Transparansi:** Tidak ada catatan transaksi yang dapat diverifikasi
- **Skala:** Sulit berkembang di luar komunitas lokal
- **Keamanan:** Risiko gagal bayar tanpa jaminan
- **Akses:** Memerlukan kehadiran fisik dan koordinasi manual

## 2.3 Hambatan Web3

Solusi DeFi yang ada terlalu rumit bagi pengguna non-teknis, dengan
antarmuka yang mengintimidasi, biaya gas yang tidak terduga, dan risiko
keamanan.

# 3. Solusi: La Tanda

La Tanda menggabungkan yang terbaik dari dua dunia: keakraban dan
kepercayaan tanda tradisional dengan keamanan, transparansi, dan
jangkauan global blockchain.

## 3.1 Proposisi Nilai

| Karakteristik  | Tanda Tradisional      | La Tanda Web3            |
|----------------|------------------------|--------------------------|
| Jangkauan      | Lokal (10-20 orang)    | Global (tanpa batas)     |
| Transparansi   | Lisan/kertas           | Blockchain tidak berubah |
| Keamanan       | Kepercayaan pribadi    | Kontrak Pintar + KYC     |
| Pembayaran     | Tunai/bank             | Crypto + fiat            |
| Imbalan        | Tidak ada              | Token LTD                |

## 3.2 Cara Kerja

1.  **Membuat/Bergabung:** Pengguna membuat tanda atau bergabung dengan
    tanda yang sudah ada
2.  **Menyetor:** Setiap anggota menyerahkan setorannya (tunai atau
    transfer) dan koordinator mencatatnya di platform
3.  **Undian:** Sistem tombola langsung menentukan giliran
4.  **Menerima:** Anggota menerima dana terkumpul pada gilirannya
5.  **Mendapatkan:** Token LTD atas partisipasi dan ketepatan waktu

# 4. Arsitektur Teknis

## 4.1 Tumpukan Teknologi

| Lapisan                       | Teknologi                                                                              |
|-------------------------------|----------------------------------------------------------------------------------------|
| Frontend                      | HTML5, CSS3, JavaScript (Vanilla + PWA)                                                |
| Backend                       | Node.js (HTTP native), PM2 cluster                                                     |
| Basis Data                    | PostgreSQL 16                                                                          |
| Cache                         | Redis                                                                                  |
| Blockchain                    | La Tanda Chain (Cosmos SDK / CometBFT), testnet `latanda-testnet-1` sejak Februari 2026 |
| Modul rantai                  | Cosmos SDK (Go)                                                                        |
| Asisten AI                    | MIA (web dan Telegram)                                                                 |
| Historis (2025, dihentikan)   | Prototipe EVM di Polygon Amoy (Solidity)                                               |

## 4.2 API RESTful

API REST terdokumentasi di [latanda.online/docs](https://latanda.online/docs/) (Swagger).
Kategori utama:

- **Auth:** Login, registrasi, verifikasi email, token
- **Wallet:** Saldo LTD testnet dan riwayat
- **Groups/Tandas:** CRUD, anggota, giliran, tombola, pencatatan setoran
  dan pembayaran giliran
- **Admin:** Pengguna, moderasi, audit
- **Mining:** Imbalan harian, tier, pencapaian

## 4.3 Token LTD dan prototipe EVM (historis)

Saat ini LTD adalah token asli La Tanda Chain (`latanda-testnet-1`,
denominasi `ultd`). Ini adalah token testnet tanpa nilai moneter.

Pada 2025 dibangun sebuah prototipe EVM di Polygon Amoy (testnet)
dengan tiga kontrak: **TandaToken.sol** (ERC20), **TandaGroup.sol**
(grup dan setoran), dan **TandaEscrow.sol** (kustodi terjadwal).
Prototipe tersebut dihentikan saat beralih ke rantai sendiri pada
Februari 2026 dan tidak digunakan lagi.

Historis, tanpa nilai: 0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc
(ERC20 prototipe di Polygon Amoy, dihentikan)

# 5. Tokenomics

## 5.1 LTD Token

LTD (La Tanda Dollar) adalah token utilitas asli platform.

**Supply tetap + 0% inflasi riil.** Total supply 200M LTD tetap untuk
selamanya di mainnet (chain target `latanda-1`; target internal
Q1-2027, bergantung pada nasihat hukum; bukan komitmen). Imbalan untuk
validator dan penambang TIDAK berasal dari inflasi, melainkan dari pool
pra-cetak 40M LTD (Staking dan Validator), yang didistribusikan dalam
kurva ~5 tahun.  
  
**Testnet saat ini (`latanda-testnet-1`): inflasi 0% sejak GOV-004
(September 2026).** Antara April dan September 2026 testnet berjalan
dengan inflasi bootstrap 5% (GOV-003), sebuah mekanisme uji coba
sementara. Pada genesis mainnet,
`inflation_min = inflation_max = 0.0`. Spesifikasi lengkap: ITP-SPEC §6
(dokumen teknis sedang disiapkan).

200M

Total Supply

Native

Token rantai

La Tanda Chain

Blockchain (testnet)

## 5.2 Distribusi

| Kategori                     | %   | Token      | Vesting                                     |
|------------------------------|-----|------------|---------------------------------------------|
| Komunitas dan Penambangan    | 30% | 60,000,000 | Emisi selama 5 tahun melalui partisipasi    |
| Staking dan Validator        | 20% | 40,000,000 | Delegasi terjadwal + imbalan blok           |
| Dana Pengembangan            | 12% | 24,000,000 | Cliff 6 bulan, linear 3 tahun               |
| Tim dan Pendiri              | 12% | 24,000,000 | Cliff 1 tahun, linear 2 tahun               |
| Pemasaran dan Kemitraan      | 6%  | 12,000,000 | Triwulanan berdasarkan pencapaian           |
| **Seed Round**               | 5%  | 10,000,000 | Cliff 6 bulan, linear 18 bulan              |
| **Strategic / Private Sale** | 5%  | 10,000,000 | Cliff 3 bulan, linear 12 bulan              |
| Likuiditas Awal (TGE)        | 5%  | 10,000,000 | Tersedia saat TGE                           |
| Bug Bounty dan Hibah         | 3%  | 6,000,000  | Melalui proposal tata kelola                |
| Dana Asuransi                | 2%  | 4,000,000  | Hanya melalui pemungutan suara darurat      |

**Sirkulasi Awal (TGE):** 10,000,000 LTD (5% dari total). Sisa
190,000,000 dilepas secara bertahap sesuai jadwal vesting selama 5
tahun. Token Seed dan Strategic Round tunduk pada cliff dan vesting,
untuk melindungi harga pasca-TGE.

## 5.3 Utilitas Token

- **Staking:** Mengunci LTD untuk mendapatkan manfaat premium
- **Tata kelola:** Memberikan suara pada proposal platform
- **Diskon:** Pengurangan komisi saat membayar dengan LTD
- **Akses:** Fitur eksklusif untuk pemegang
- **Imbalan:** Mendapatkan LTD atas aktivitas di platform

# 6. Fitur

## 6.1 Sistem Tanda

- Membuat grup dengan konfigurasi fleksibel
- Beberapa posisi per anggota
- Tombola langsung dengan WebSocket
- Penguncian posisi oleh koordinator
- Komisi koordinator opsional (100% untuk koordinator; La Tanda tidak
  memungut komisi)

## 6.2 Sistem Penambangan

Setiap pengguna terdaftar dapat menambang LTD setiap hari. Imbalannya
bergantung pada tier yang dicapai melalui achievement points — poin
yang terkumpul dari aktivitas nyata di platform (verifikasi email,
ikut tanda, membayar tepat waktu, mengajak pengguna, dll.).

### 6.2.1 Tier Penambangan

| Tier     | Poin yang dibutuhkan | Imbalan dasar/hari | Bonus streak maks. |
|----------|----------------------|--------------------|--------------------|
| Perunggu | 0-49                 | 1.0 LTD            | +2.0 LTD           |
| Perak    | 50-149               | 3.0 LTD            | +4.0 LTD           |
| Emas     | 150-299              | 5.0 LTD            | +7.0 LTD           |
| Platinum | 300-499              | 8.0 LTD            | +10.0 LTD          |
| Berlian  | 500+                 | 12.0 LTD           | +15.0 LTD          |

### 6.2.2 Achievement Points

Poin terkumpul otomatis saat menyelesaikan pencapaian. Ada 20
pencapaian dalam 7 kategori:

- **Akun:** Email terverifikasi (10 pts)
- **Partisipasi:** Tanda pertama (20 pts), tanda selesai (25 pts)
- **Keuangan:** L.1000+ disetor (15 pts), L.10,000+ (40 pts), selalu
  tepat waktu (35 pts)
- **Sosial:** Posting pertama (10 pts), 10 pengikut (15 pts), referal
  (15-30 pts)
- **Marketplace:** Penjual bintang — 5+ penjualan dengan rating 4+ (30
  pts)
- **Verifikasi:** KYC dasar (25 pts), KYC lanjutan (50 pts)
- **Keterlibatan:** Streak 7 hari (10 pts), streak 30 hari (30 pts)

Pengguna biasa yang memverifikasi email, ikut satu tanda, dan menambang
7 hari berturut-turut mencapai Perak (50+ pts). Mencapai Emas atau lebih
tinggi membutuhkan keterlibatan berkelanjutan.

### 6.2.3 Emisi dan Batas

- **Batas harian global:** maksimum 500 LTD/hari untuk semua penambang
  (testnet)
- **Cooldown individu:** 24 jam antar klaim
- **Pool emisi:** 60M LTD (30% dari supply) didistribusikan selama 5
  tahun melalui partisipasi
- **Anti-penipuan:** IP tracking, rate limiting, fraud flags

### 6.2.4 Model Penskalaan Progresif

Imbalan berkurang secara bertahap seiring pertumbuhan ekosistem dan
meningkatnya nilai pasar LTD:

| Fase              | Pemicu                   | Pengali       | Batas harian |
|-------------------|--------------------------|---------------|--------------|
| Testnet (saat ini)| \<100 penambang aktif    | 1.0x (dasar)  | 500 LTD      |
| Pra-mainnet       | 100+ penambang aktif     | 0.5x          | 500 LTD      |
| Mainnet           | TGE / listing di bursa   | 0.25x         | 300 LTD      |
| Kematangan        | 5,000+ penambang aktif   | 0.1x          | 200 LTD      |

Setiap fase mengurangi emisi ~50%. Pengali diterapkan pada imbalan
dasar setiap tier. Transisi antar fase diatur oleh tim selama testnet,
dan oleh proposal tata kelola on-chain di mainnet.

### 6.2.5 Progresi Ekosistem

La Tanda dirancang sebagai tangga partisipasi di mana setiap tingkat
memberikan manfaat lebih besar:

1.  **Pengguna:** Mendaftar, menambang LTD harian (Perunggu, 1 LTD/hari)
2.  **Penambang aktif:** Naik tier melalui aktivitas dan streak
    (Perak/Emas, 3-5 LTD/hari)
3.  **Anggota Tanda:** Ikut menabung bersama, mendapatkan pencapaian +
    akses keuangan
4.  **Penjual:** Berjualan di marketplace, mendapatkan komisi +
    pencapaian penjual
5.  **Delegator:** Mendelegasikan LTD ke validator di La Tanda Chain,
    menerima imbalan blok + memberikan suara dalam tata kelola
6.  **Validator:** Mengoperasikan node, memvalidasi blok, menerima
    delegasi (2,000-5,000 LTD)
7.  **Investor:** Menyetor modal pra-TGE, memperoleh token dengan diskon
    dan vesting

# 7. Keamanan

## 7.1 Infrastruktur

- SSL/TLS 1.2+ wajib
- Rate limiting (nginx + fail2ban)
- Firewall UFW terkonfigurasi
- PostgreSQL/Redis hanya localhost

## 7.2 Aplikasi

- JWT dengan masa berlaku (24h/7d)
- Bcrypt untuk kata sandi (12 rounds)
- Sanitasi input (pencegahan XSS)
- Query berparameter (pencegahan SQL injection)
- CORS dibatasi

## 7.3 Header Keamanan

- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

## 7.4 Kepatuhan

- Alur verifikasi identitas (KYC) sudah dirancang, belum diaktifkan (0
  pengguna terverifikasi per 11-Okt-2026)
- Log audit untuk tindakan sensitif (login, perubahan akun, tindakan
  administrasi)

# 8. La Tanda Chain

La Tanda dimulai sebagai platform untuk mendigitalkan tanda. Kini
berkembang menjadi ekosistem keuangan yang lengkap: tabungan kelompok,
marketplace P2P, penambangan token, asisten AI, dan tata kelola
komunitas. La Tanda Chain adalah lapisan infrastruktur yang menyatukan
layanan-layanan ini dalam jaringan yang terdesentralisasi dan
berdaulat.

**Saat ini (sejak Februari 2026):** La Tanda Chain — blockchain
berdaulat yang dibangun dengan Cosmos SDK / CometBFT, di mana LTD adalah
token asli untuk gas, staking, dan tata kelola. Berjalan sebagai testnet
(`latanda-testnet-1`); LTD testnet tidak memiliki nilai moneter.  
**Sebelumnya (2025):** prototipe EVM di Polygon Amoy (testnet),
dihentikan.

## 8.1 Arsitektur Rantai

La Tanda Chain menggunakan **CometBFT** (sebelumnya Tendermint) sebagai
mesin konsensus, yang memberikan toleransi kesalahan Bizantium,
finalitas instan, dan Delegated Proof of Stake (DPoS).

5s

Waktu blok

1,000+

Target TPS

BFT

Konsensus

IBC

Interoperabilitas

### Modul asli rantai

| Modul            | Fungsi                                                                                                                |
|------------------|-----------------------------------------------------------------------------------------------------------------------|
| **x/ltd**        | Token asli — transfer, burn, fee. Supply tetap 200M (0% inflasi). Imbalan melalui treasury pra-cetak                  |
| **x/tanda**      | Siklus tanda, setoran, pembayaran, hasil undian. Multi-sig untuk distribusi                                           |
| **x/mercado**    | Escrow marketplace, reputasi penjual, arbitrase sengketa                                                              |
| **x/mineria**    | Imbalan aktivitas, tier, anti-sybil, distribusi terjadwal dari treasury                                               |
| **x/gobernanza** | Proposal, pemungutan suara (1 LTD = 1 suara, 1.5x jika staking \>180d), kuorum 33%                                    |

### On-chain vs Off-chain

| On-chain (La Tanda Chain)             | Off-chain (PostgreSQL + Redis)                        |
|---------------------------------------|-------------------------------------------------------|
| Transfer dan saldo LTD                | Profil pengguna, PII, KYC                             |
| Pembuatan tanda, aturan, pembayaran   | Feed sosial, komentar, chat                           |
| Escrow marketplace                    | Percakapan dengan MIA (AI)                            |
| Bukti RNG untuk undian                | Pencatatan setoran dan pembayaran giliran (saat ini)  |
| Staking, tata kelola, penambangan     | Sesi, analitik, UI                                    |

## 8.2 Peserta Jaringan

### Node

Setiap mesin yang menjalankan perangkat lunak La Tanda Chain. Node
menyimpan salinan state dan meneruskan transaksi.

| Jenis          | Peran                                                          | Operator                             |
|----------------|----------------------------------------------------------------|--------------------------------------|
| Full Node      | Riwayat lengkap, memvalidasi transaksi, melayani kueri         | Ray-Banks, mitra, pengembang         |
| Validator Node | Full node + ikut konsensus (mengusulkan dan menandatangani blok) | Validator yang memenuhi syarat       |
| Archive Node   | Full node + menyimpan seluruh state historis                   | Penjelajah blok, analitik            |
| Light Client   | Memverifikasi header, mengkueri state melalui full node        | Dompet seluler, integrasi            |

### Validator

Operator node yang diterima dalam set aktif dan berpartisipasi dalam
produksi blok.

| Persyaratan    | Detail                                                          |
|----------------|-----------------------------------------------------------------|
| Stake minimum  | Self-delegation minimum 1 LTD (testnet: delegasi dari proyek)   |
| Riwayat        | Aktif 6+ bulan di La Tanda                                      |
| Verifikasi     | KYC/KYB selesai                                                 |
| Uptime         | 99.5%+ per epoch (10,000 blok)                                  |
| Tata kelola    | Memberikan suara pada 75%+ proposal                             |

**Set validator (perluasan bertahap):**

| Fase                                 | Validator | Seleksi                                                 |
|--------------------------------------|-----------|---------------------------------------------------------|
| Fase 1 — Genesis (selesai)           | 7+        | Selesai: 7+ validator aktif, tata kelola on-chain       |
| Fase 2 — Trusted Set (berjalan)      | 15-25     | Testnet berinsentif: validator + infra partner          |
| Fase 3 — Pertumbuhan                 | 50        | Pendaftaran terbuka, berdasarkan stake                  |
| Fase 4 — Kematangan                  | 100       | Tanpa izin, berdasarkan stake                           |
| Fase 5 — Terbuka                     | 150+      | Tanpa batas, pasar bebas                                |

### Kondisi Slashing

| Pelanggaran                                            | Sanksi                                       |
|--------------------------------------------------------|----------------------------------------------|
| Tanda tangan ganda (2 blok pada ketinggian yang sama)  | 5% dari stake + jail permanen                |
| Downtime berkepanjangan (500+ blok terlewat)           | 0.1% dari stake + jail sementara (24h)       |
| Pelanggaran dalam tanda (gagal distribusi)             | 10% dari bonus koordinator + pencopotan      |
| Abstain dalam tata kelola (\<50% suara dalam 3 bulan)  | Peringatan → slash 0.05% jika berulang       |

### Delegator

Setiap pemegang LTD yang melakukan staking token ke validator, berbagi
imbalan dan risiko.

1.  Delegator memilih validator berdasarkan reputasi, komisi, dan uptime
2.  Melakukan staking LTD melalui transaksi `MsgDelegate`
3.  LTD yang di-stake menambah bobot validator
4.  Delegator memperoleh imbalan proporsional, dikurangi komisi
    validator
5.  Dapat mendelegasikan ulang ke validator lain (periode unbonding: 21
    hari)

**Delegasi dalam konteks ekosistem:**  
Bergabung dengan grup tanda = delegasi implisit kepada
koordinator-validator.  
Membeli di marketplace = delegasi kepercayaan sementara.  
Staking ke validator = delegasi ekonomi eksplisit jangka panjang.

## 8.3 Migrasi Token: dari prototipe EVM ke La Tanda Chain

Migrasi sudah terjadi: LTD meninggalkan prototipe ERC20 di Polygon Amoy
(2025, dihentikan, tanpa nilai) dan sejak Februari 2026 menjadi token
asli testnet sendiri `latanda-testnet-1`. Rute selanjutnya:

1.  **Testnet Aktif (sejak Februari 2026, berjalan):** La Tanda Chain
    testnet (`latanda-testnet-1`) memproduksi blok sejak Februari 2026,
    dengan validator aktif, tata kelola on-chain, dan testnet
    berinsentif
2.  **Putaran formal + Tim (tanggal belum ditentukan):** putaran
    investasi setelah pendirian C-Corp di Delaware, perekrutan tim inti,
    audit keamanan
3.  **Mainnet + TGE (target internal Q1-2027, bukan komitmen):**
    Migrasi dari testnet ke mainnet, Token Generation Event, IBC
    diaktifkan
4.  **Ekspansi (tanpa tanggal yang dijanjikan):** ekspansi regional
    (Guatemala, El Salvador), modul asli aktif

## 8.4 Ekonomi Validator

| Sumber Pendapatan                                         | Distribusi                                       |
|-----------------------------------------------------------|--------------------------------------------------|
| Fee transaksi (0.01 LTD dasar)                            | Validator 80% \| Treasury 15% \| Burn 5%         |
| Komisi tanda (opsional, disepakati tiap grup)             | Koordinator 100% (La Tanda tidak memungut komisi) |
| Fee marketplace                                           | Arbiter 50% \| Treasury 30% \| Burn 20%          |
| Fee bridge (0.1%)                                         | Validator 60% \| Treasury 30% \| Burn 10%        |

**Imbalan staking:** tidak ada angka imbal hasil yang dipublikasikan;
bervariasi sesuai komisi validator dan aktivitas jaringan, dan tidak
dijamin. Sumber: fee transaksi + distribusi terjadwal dari treasury
pra-cetak (40M LTD dialokasikan untuk staking/validator). Tanpa inflasi
— supply tetap 200M.

## 8.5 Interoperabilitas

- **IBC (Cosmos):** Koneksi dengan Osmosis (DEX), Noble (USDC asli),
  Cosmos Hub
- **Jembatan ke jaringan lain:** interoperabilitas (IBC/jembatan), tanpa
  tanggal
- **Jalur Fiat:** transfer bank / uang seluler, sedang dijajaki dengan
  mitra berlisensi; belum ada yang dikontrak, tanpa tanggal

## 8.6 Keamanan Rantai

- **Konsensus:** CometBFT menoleransi \<1/3 validator Bizantium.
  Finalitas ~5-6 detik
- **Staking:** Delegasi dari proyek selama testnet. Mainnet akan
  mensyaratkan stake signifikan sebagai disinsentif ekonomi
- **Bridge:** Verifikasi light client IBC (tanpa perantara). Rate
  limit: maks. 1M LTD/24h. Jeda darurat melalui tata kelola
- **Privasi:** Nilai on-chain hanya terlihat oleh peserta dan validator
  yang ditugaskan. ZK-SNARKs direncanakan untuk Fase 4
- **Audit:** Akan diaudit oleh firma eksternal sebelum mainnet
  (direncanakan)

# 9. Roadmap Integral

## Selesai (2024-2025)

- Infrastruktur inti dan API REST
- Sistem tanda dengan WebSocket dan tombola langsung
- Prototipe EVM LTD di Polygon Amoy (ERC20, dihentikan pada 2026)
- Sistem penambangan, gamifikasi, dan marketplace
- MIA — asisten keuangan AI

## 2026 — Platform (dalam produksi)

- Pencatatan tanda: setoran dan pembayaran giliran dicatat di platform
  dan dikonfirmasi oleh koordinator (per 11-Okt-2026: 5 tanda dibuat, 3
  aktif; 3 dengan pembayaran giliran selesai; 47 pembayaran giliran
  selesai)
- 95 pengguna terdaftar per 11-Okt-2026 (akun dibuat; tidak
  diverifikasi KYC)
- Login dengan Google dan pemulihan akun
- Chat grup secara real-time
- Tim dan jadwal kerja untuk usaha: jadwal tim, shift terbuka,
  pengingat, dan pencatatan kehadiran
- Agenda janji temu untuk layanan: ketersediaan, penjadwalan ulang,
  pengingat, dan undangan kalender
- Paket usaha gratis (Mi Negocio): penagihan, laporan, pengeluaran, dan
  pembuat dokumen
- MIA, asisten AI (web dan Telegram)

## 2026 — Testnet Aktif (berjalan)

- La Tanda Chain testnet (`latanda-testnet-1`) memproduksi blok sejak
  genesis Februari 2026: lebih dari 3,5 juta blok per 11-Okt-2026
- 51 validator terdaftar di rantai, 35 di antaranya dalam set aktif
  (per 11-Okt-2026)
- Tata kelola on-chain: 4 proposal disetujui (GOV-001 sampai GOV-004,
  Mar-Sep 2026)
- Testnet berinsentif dengan tier delegasi (Validator 2K, Infra Partner
  5K LTD)
- Bug bounty dan hibah untuk kontributor
- Perangkat lunak node dan dokumentasi open-source

Angka per 11-Okt-2026; angka langsung:
[latanda.online/api/public/metrics](https://latanda.online/api/public/metrics)

## 2026 — Institusional

- Dalam pembicaraan dengan Hub Inovasi Keuangan CNBS (Honduras), sejak
  September 2026
- C-Corp di Delaware: sedang dipersiapkan (belum didirikan)
- Putaran investasi formal: tanggal belum ditentukan

## Langkah berikutnya (tanpa tanggal yang dijanjikan)

- Audit keamanan (rantai + platform)
- Perekrutan tim inti
- Aplikasi seluler
- Hash anchor pembayaran (SHA-256 untuk migrasi on-chain di masa depan)
  dan dual-write PostgreSQL + chain testnet

## Target internal Q1-2027 (bukan komitmen) — Mainnet + TGE

- Migrasi dari testnet ke mainnet
- Token Generation Event (TGE — 10M LTD beredar)
- IBC diaktifkan, staking delegator dibuka
- Rantai menjadi sumber kebenaran

## Ekspansi (tanpa tanggal yang dijanjikan)

- 50 validator aktif di 10+ negara
- SDK La Tanda untuk pengembang pihak ketiga
- Tanda lintas negara (settlement dalam LTD atau USDC melalui IBC)
- Peran khusus: validator tanda, arbiter marketplace, oracle
- Koneksi IBC: Osmosis (DEX), Noble (USDC)

## Visi jangka panjang, tanpa tanggal maupun komitmen — Kematangan

- 100+ validator, masuk tanpa izin
- Treasury DAO aktif — fee protokol dikendalikan komunitas
- Dana asuransi operasional
- Integrasi DeFi (posisi tanda sebagai jaminan)
- API perusahaan: bank dan lembaga keuangan mikro mengintegrasikan
  tanda-as-a-service
- Yayasan La Tanda didirikan

## Visi jangka panjang, tanpa tanggal maupun komitmen — Protokol Terbuka

- 150+ validator, tanpa batas
- Rantai satelit regional terhubung melalui IBC (Afrika, Asia)
- Dukungan multi-model: chit fund (India), susu (Afrika), hui (Vietnam),
  paluwagan (Filipina)
- Interoperabilitas dengan keuangan tradisional (kartu, remitansi)
- DAO sepenuhnya otonom dengan dewan terpilih untuk keadaan darurat

[Lihat roadmap terperinci →](roadmap.html)

# 10. Tim dan Legal

## 10.1 Entitas Hukum

**Ray-Banks LLC**  
New Mexico Limited Liability Company  
EIN: 37-2158338  
Beroperasi sebagai: Latanda Financial Services

## 10.2 Tim Pendiri

La Tanda dikembangkan oleh tim terdistribusi yang dipimpin oleh pendiri,
dengan peran-peran kunci yang sedang aktif direkrut melalui program
bounty dan komunitas Cosmos.

| Peran                                   | Status        | Alokasi (Pool Tim) |
|-----------------------------------------|---------------|--------------------|
| **Pendiri / Arsitek**                   | Aktif         | 8,000,000 LTD      |
| **Pemimpin Infrastruktur**              | Merekrut      | 2,500,000 LTD      |
| **Pengembang Frontend**                 | Merekrut      | 2,500,000 LTD      |
| **Komunitas / Pertumbuhan**             | Merekrut      | 2,000,000 LTD      |
| **Pengembang Mobile**                   | Pasca-Seed    | 2,500,000 LTD      |
| **CTO / Pengembang Backend+Chain**      | Pasca-Seed    | 4,000,000 LTD      |
| **Desainer / UX**                       | 2027          | 1,500,000 LTD      |
| **Cadangan**                            | \-            | 1,000,000 LTD      |

**Vesting:** Semua peran tim memiliki cliff 1 tahun dan vesting linear 2
tahun. Total pool Tim: 24,000,000 LTD (12% dari supply).

**Bergabunglah dengan tim:** Kontributor terbaik dari [program
bounty](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)
diundang ke peran tim. Kami juga menerima lamaran langsung untuk peran
khusus. Kontak: <contact@latanda.online>

## 10.3 Validator dan Mitra Infrastruktur

| Operator                         | Status | Sejak          |
|----------------------------------|--------|----------------|
| **Ray-Banks** (genesis)          | Aktif  | Februari 2026  |
| **PRO Delegators** (Nuxian Labs) | Aktif  | Maret 2026     |

## 10.4 Kontak

- **Website:** [latanda.online](https://latanda.online)
- **Corporate:** [raybanks.org](https://raybanks.org)
- **Email:** contact@latanda.online
- **GitHub:**
  [INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web)
- **Twitter:** @TandaWeb3
- **Investors:** [latanda.online/invest](/invest.html) \|
  <invest@latanda.online>

## 10.5 Disclaimer

Dokumen ini hanya untuk tujuan informasi dan bukan merupakan nasihat
keuangan, hukum, atau investasi. Token LTD saat ini beroperasi di
testnet dan tidak memiliki nilai moneter. Berinvestasi dalam mata uang
kripto mengandung risiko yang signifikan. Konsultasikan dengan
profesional sebelum mengambil keputusan keuangan.

### Riwayat versi

**Oktober 2026 (v2.1):** Fitur-fitur yang tidak lagi menjadi bagian dari
platform publik telah dihapus dari dokumen ini. Prototipe EVM di Polygon
Amoy dijelaskan sebagai historis (dihentikan). Klaim tanpa dasar
(evaluasi PCI-DSS, jumlah tabel dan endpoint) dihapus, kembalinya
inflasi testnet ke 0% (GOV-004) dicatat, dan angka-angka diperbarui per 11-Okt-2026 dari sumber publik.

**September 2026:** Versi ini menggantikan versi sebelumnya. Versi
sebelumnya memuat perkiraan imbal hasil (APY) untuk staking; perkiraan
itu telah ditarik dan tidak berlaku lagi. Selama jaringan masih di
testnet, kami tidak memublikasikan angka imbal hasil: imbalan staking
akan bergantung pada komisi validator dan aktivitas jaringan, dan tidak
dijamin. Roadmap (bagian 9) juga diperbarui dengan status per September
2026.

2024-2026 Ray-Banks LLC. Semua hak dilindungi.

[Roadmap](roadmap.html) \| [Privasi](privacy-policy.html) \|
[Ketentuan](terms-of-service.html) \| [API
Docs](https://latanda.online/docs)
