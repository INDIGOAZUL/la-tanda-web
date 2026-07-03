<!--
Whitepaper La Tanda v2.0 — sumber kanon dalam Bahasa Indonesia.
Diterjemahkan dari es.md.
Tidak Perlu Di UBAH kecuali untuk sinkronisasi dengan sumber kanon.
Terjemahan tersimpan dalam berkas-berkas terpisah: pt-br.md, en.md, dll.
-->

La Tanda

Whitepaper Teknis v2.0

Februari 2026 \| Ray-Banks LLC

## Contenido

-   [1. Ringkasan Eksekutif](#abstract)
-   [2. Permasalahan](#problem)
-   [3. Solusi](#solution)
-   [4. Teknologi](#technology)
-   [5. Tokenomics](#tokenomics)
-   [6. Fungsionalitas](#features)
-   [7. Keamanan](#security)
-   [8. La Tanda Chain](#chain)
-   [9. Peta Jalan](#roadmap)
-   [10. Tim dan Hukum](#team)

# 1. Ringkasan Eksekutif

La Tanda adalah platform Web3 yang mendigitalisasi dan meningkatkan sistem 
tanda tradisional (sistem tabungan dan kredit bergilir)
melalui teknologi blockchain, mendemokratisasi akses ke layanan
keuangan bagi komunitas yang kurang terlayani.

**Misi:** Membangun platform keuangan Web3 paling mudah diakses
di dunia, menggabungkan kepercayaan tanda tradisional dengan
transparansi dan keamanan blockchain.

1.7B

Orang tanpa akses perbankan

$500B+

Pasar ROSCAs global

140+

Endpoints API

200M

LTD Token Supply

# 2. Permasalahan

## 2.1 Pengucilan Keuangan

Menurut Bank Dunia, 1,7 miliar orang dewasa tidak memiliki akses
ke layanan perbankan. Di Amerika Latin, 45% populasi mengalami
underbanked, bergantung pada sistem informal untuk tabungan dan
kredit.

## 2.2 Keterbatasan dari Pendekatan Tradisional

-   **Kepercayaan:** Bergantung pada hubungan pribadi, membatasi 
    jangkauan
-   **Transparansi:** Tanpa catatan transaksi yang dapat diverifikasi
-   **Skala:** Sulit berkembang di luar komunitas lokal
-   **Keamanan:** Risiko gagal bayar tanpa jaminan
-   **Akses:** Memerlukan kehadiran fisik dan koordinasi manual

## 2.3 Hambatan Web3

Solusi DeFi yang ada terlalu kompleks bagi pengguna 
non-teknis, dengan antarmuka yang menakutkan, biaya gas yang tidak dapat diprediksi, 
dan risiko keamanan.

# 3. Solusi: La Tanda

La Tanda menggabungkan yang terbaik dari kedua dunia: keakraban dan kepercayaan
tanda tradisional dengan keamanan, transparansi, dan jangkauan 
blockchain global.

## 3.1 Proposisi Nilai

| Caracteristica | Tanda Tradisional      | La Tanda Web3         |
|----------------|------------------------|-----------------------|
| Jangkauan      | Lokal (10-20 orang)    | Global (tanpa batas)  |
| Transparansi   | Lisan/kertas           | Blockchain permanen   |
| Keamanan       | Kepercayaan pribadi    | Kontrak Pintar + KYC  |
| Pembayaran     | Tunai/bank             | Kripto + fiat         |
| Hadiah         | Tidak ada              | Token LTD             |

## 3.2 Cara Kerjanya

1.  **Buat/Bergabung:** Pengguna membuat tanda atau bergabung dengan yang sudah ada
2.  **Berkontribusi:** Pembayaran berkala otomatis atau manual
3.  **Undian:** Sistem lotre langsung menentukan giliran
4.  **Terima:** Anggota menerima pot sesuai gilirannya
5.  **Menang:** Token LTD untuk partisipasi dan kepatuhan

# 4. Teknologi

## 4.1 Arsitektur Teknologi

| Tingkat             | Teknologi                               |
|---------------------|-----------------------------------------|
| Frontend            | HTML5, CSS3, JavaScript (Vanilla + PWA) |
| Backend             | Node.js (HTTP native), PM2 cluster      |
| Basis Data          | PostgreSQL 16 (25 tabel)                |
| Cache               | Redis                                   |
| Blockchain (Fase 1) | Polygon (Amoy testnet → PoS mainnet)    |
| Blockchain (Fase 2) | La Tanda Chain (Cosmos SDK / CometBFT)  |
| Smart Contracts     | Solidity + Modul Cosmos SDK (Go)        |
| ML/AI               | Python, XGBoost, scikit-learn           |

## 4.2 API RESTful

140+ endpoints yang diatur dalam kategori:

-   **Auth (12):** Login, registrasi, verifikasi, token
-   **Wallet (15):** Saldo, deposit, penarikan, riwayat
-   **Groups/Tandas (18):** CRUD, anggota, giliran, lotre
-   **Admin (12):** Pengguna, KYC, pembayaran, audit
-   **Lottery (15):** Prediksi ML, langganan, statistik
-   **Mining (7):** Hadiah harian, tingkatan, pencapaian

## 4.3 Smart Contracts

LTD Token: 0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc (Polygon Amoy)

-   **TandaToken.sol:** Token ERC20 dengan fungsi tata kelola (governance)
-   **TandaGroup.sol:** Logika grup dan kontribusi
-   **TandaEscrow.sol:** Penitipan dana dengan pelepasan terjadwal

# 5. Tokenomics

## 5.1 LTD Token

LTD (La Tanda Dollar) adalah token utilitas asli ekosistem La 
Tanda. Saat ini ada dalam dua bentuk: sebagai token ERC20 di Polygon 
Amoy testnet (Fase 1, legacy) dan sebagai token asli **La Tanda Chain** 
(Fase 2, testnet aktif). Lihat Bagian 8 untuk detail migrasi.

200M

Total Supply Tetap

0%

Inflasi

Cosmos SDK

La Tanda Chain

## 5.2 Distribusi

| Kategori                     | %   | Token      | Vesting                                       |
|------------------------------|-----|------------|-----------------------------------------------|
| Komunitas dan Mining         | 30% | 60.000.000 | Emisi selama 5 tahun via partisipasi          |
| Staking dan Validator        | 20% | 40.000.000 | Delegasi terjadwal + hadiah blok              |
| Dana Pengembangan            | 12% | 24.000.000 | 6 bulan cliff, 3 tahun linear                 |
| Tim dan Pendiri              | 12% | 24.000.000 | 1 tahun cliff, 2 tahun linear                 |
| Pemasaran dan Aliansi        | 6%  | 12.000.000 | Triwulanan berdasarkan milestone              |
| **Seed Round**               | 5%  | 10.000.000 | 6 bulan cliff, 18 bulan linear                |
| **Strategic / Private Sale** | 5%  | 10.000.000 | 3 bulan cliff, 12 bulan linear                |
| Likuiditas Awal (TGE)        | 5%  | 10.000.000 | Tersedia saat TGE                             |
| Bug Bounty dan Grants        | 3%  | 6.000.000  | Via proposal tata kelola                      |
| Dana Asuransi                | 2%  | 4.000.000  | Hanya via pemungutan suara darurat            |

**Supply Awal yang Beredar (TGE):** 10.000.000 LTD (5% dari total). 
190.000.000 sisanya akan dirilis secara bertahap sesuai jadwal 
vesting selama 5 tahun. Token Seed dan Strategic Round 
tunduk pada cliff dan vesting, melindungi harga pasca-TGE.

## 5.3 Utilitas Token

-   **Staking:** Mengunci LTD untuk mendapatkan manfaat premium
-   **Tata Kelola (Governance):** Memilih proposal platform
-   **Diskon:** Pengurangan biaya saat membayar dengan LTD
-   **Akses:** Fitur eksklusif untuk pemegang
-   **Hadiah:** Mendapatkan LTD melalui aktivitas di platform

## 5.4 Keberlanjutan Pasca-Staking Pool

Pool **Staking dan Validator** (40M LTD, 20% dari supply) 
dirancang untuk menopang APY validator selama sekitar 8 
tahun distribusi terjadwal. Karena LTD memiliki **supply tetap 
200M tanpa inflasi**, ketika pool ini habis, jaringan harus menopang 
keamanan melalui mekanisme alternatif. Berbeda dengan Bitcoin 
(yang hanya bergantung pada biaya transaksi pasca block-subsidy), La 
Tanda memiliki **enam sumber redundan** untuk menopang 
validator secara abadi:

1.  **Biaya transaksi (diaktifkan di genesis):** Dengan min_gas_price 
0.001 ultd, chain dengan penggunaan nyata (puluhan ribu pengguna 
yang melakukan kontribusi harian ke tanda, booking marketplace, 
interaksi sosial on-chain) menghasilkan biaya yang cukup 
untuk menopang jaringan validator profesional. Berbeda dengan 
Bitcoin, LTD adalah chain *ekonomi produktif*, bukan hanya 
store-of-value.
2.  **Komisi marketplace → validator (Tahun 1):** 
Micro-komisi (contoh: 0,5% dari GMV marketplace) dirutekan secara 
otomatis ke fee pool validator di setiap blok. Dengan 
marketplace yang memproses volume nyata, ini menambahkan arus pendapatan 
yang signifikan yang tidak ada di Bitcoin maupun chain 
store-of-value murni.
3.  **Mekanisme burn (sudah aktif):** 5-20% dari setiap jenis fee 
dibakar (lihat Bagian 8.4). Ini mengurangi supply yang beredar seiring 
waktu, membuat LTD yang tersisa bernilai lebih proporsional. 
Efek majemuk tahun demi tahun, mirip Ethereum pasca-EIP-1559.
4.  **Subsidi treasury (Tahun 8+ jika diperlukan):** Pool *Dana 
Pengembangan* (24M), *Bug Bounty* (6M), dan *Dana Asuransi* (4M) 
dapat mensubsidi validator selama 10+ tahun tambahan melalui proposal 
tata kelola, tanpa menyentuh supply tetap 200M.
5.  **Re-alokasi pool yang diatur komunitas:** Komunitas dapat memilih 
untuk mengalokasikan ulang token yang tidak digunakan dari pool yang matang 
(contoh: Likuiditas Awal yang sudah dieksekusi) ke insentif keamanan. Ini TIDAK 
melanggar cap 200M, hanya memindahkan LTD antar pool.
6.  **Tanda network fee (opsional, sumber terakhir):** Biaya 
jaringan kecil atas kontribusi tanda (bukan merupakan komisi 
platform), hanya diaktifkan jika lima sumber lain 
tidak cukup. Mempertahankan pitch *0% komisi di tanda* karena ini 
adalah fee blockchain, bukan fee La Tanda sebagai platform.

**Dibandingkan dengan Bitcoin:** Bitcoin hanya bergantung pada biaya 
transaksi setelah habisnya block subsidi (diproyeksikan 
\~2140), model yang belum teruji jangka panjang. La Tanda memiliki **enam 
mekanisme redundan** dan ekonomi produktif nyata (tanda, 
marketplace, sosial) yang menghasilkan fee sejak hari pertama. 
Selain itu, tata kelola on-chain memungkinkan aktivasi mekanisme darurat 
jika diperlukan — sesuatu yang mustahil di Bitcoin.

# 6. Fungsionalitas

## 6.1 Sistem Tanda

-   Membuat grup dengan konfigurasi fleksibel
-   Beberapa posisi per anggota
-   Tombola langsung dengan WebSocket
-   Penguncian posisi untuk koordinator
-   Sistem komisi 90/10

## 6.2 Prediktor Lotre

Sistem ML untuk prediksi "La Diaria" Honduras:

-   Model XGBoost per jadwal (11am, 3pm, 9pm)
-   Presisi Top-1 42% (42x lebih baik dari acak)
-   Sistem freemium (Gratis/Premium/Diamante)
-   Gamifikasi: pencapaian, poin, peringkat

## 6.3 Sistem Penambangan

Setiap pengguna terdaftar dapat mining LTD setiap hari. Hadiah bergantung 
pada tier yang dicapai melalui achievement points — poin yang terkumpul 
dari aktivitas nyata di platform (verifikasi email, 
berpartisipasi dalam tanda, membayar tepat waktu, merujuk pengguna lain, dll.).

### 6.3.1 Tingkat Penambangan

| Tier     | Poin Diperlukan | Reward dasar/hari | Streak bonus maks |
|----------|-----------------|-------------------|-------------------|
| Perunggu | 0-49            | 1.0 LTD           | +2.0 LTD          |
| Perak    | 50-149          | 3.0 LTD           | +4.0 LTD          |
| Emas     | 150-299         | 5.0 LTD           | +7.0 LTD          |
| Platinum | 300-499         | 8.0 LTD           | +10.0 LTD         |
| Berlian  | 500+            | 12.0 LTD          | +15.0 LTD         |

### 6.3.2 Achievement Points

Poin terkumpul secara otomatis saat menyelesaikan pencapaian. Ada 20 
pencapaian dalam 7 kategori:

-   **Akun:** Email terverifikasi (10 pts)
-   **Partisipasi:** Tanda pertama (20 pts), tanda selesai (25 pts)
-   **Keuangan:** L.1000+ dikontribusikan (15 pts), L.10.000+ (40 pts), 
ketepatan waktu sempurna (35 pts)
-   **Sosial:** Post pertama (10 pts), 10 pengikut (15 pts), referral 
(15-30 pts)
-   **Marketplace:** Penjual bintang — 5+ penjualan dengan rating 4+ (30 
pts)
-   **Verifikasi:** KYC dasar (25 pts), KYC lanjutan (50 pts)
-   **Keterlibatan:** Streak 7 hari (10 pts), streak 30 hari (30 pts)

Pengguna biasa yang memverifikasi email, berpartisipasi dalam satu tanda, dan mining 7 hari 
berturut-turut mencapai Perak (50+ pts). Mencapai Emas atau lebih tinggi memerlukan 
keterlibatan berkelanjutan.

### 6.3.3 Emisi dan Batas

-   **Cap harian global:** Maksimal 500 LTD/hari di antara semua miner 
(testnet)
-   **Cooldown individu:** 24 jam antar claim
-   **Pool emisi:** 60M LTD (30% dari supply) didistribusikan dalam 5 tahun 
via partisipasi
-   **Anti-penipuan:** Pelacakan IP, rate limiting, flag penipuan

### 6.3.4 Model Scaling Progresif

Hadiah berkurang secara bertahap seiring pertumbuhan ekosistem dan 
nilai pasar LTD:

| Fase               | Trigger                  | Multiplier | Cap harian |
|--------------------|--------------------------|------------|------------|
| Testnet (saat ini) | <100 miner aktif         | 1.0x (base)| 500 LTD    |
| Pre-mainnet        | 100+ miner aktif         | 0.5x       | 500 LTD    |
| Mainnet            | TGE / listing exchange   | 0.25x      | 300 LTD    |
| Kematangan         | 5.000+ miner aktif       | 0.1x       | 200 LTD    |

Setiap fase mengurangi emisi ~50%. Multiplier diterapkan pada 
reward dasar setiap tier. Transisi antar fase diatur oleh 
tim selama testnet, dan oleh proposal tata kelola on-chain 
di mainnet.

### 6.3.5 Progres Ekosistem

La Tanda dirancang sebagai tangga partisipasi di mana setiap 
level menawarkan manfaat lebih besar:

1.  **Pengguna:** Mendaftar, mining LTD harian (Perunggu, 1 LTD/hari)
2.  **Miner aktif:** Naik tier melalui aktivitas dan streak (Perak/Emas, 
3-5 LTD/hari)
3.  **Anggota Tanda:** Berpartisipasi dalam tabungan kelompok, dapatkan 
pencapaian + akses keuangan
4.  **Penjual:** Jual di marketplace, dapatkan komisi + pencapaian 
seller
5.  **Delegator:** Bridge LTD ke chain, delegasikan ke validator, 
dapatkan block reward + voting tata kelola
6.  **Validator:** Operasikan node, validasi blok, terima delegasi 
(2.000-5.000 LTD)
7.  **Investor:** Menyediakan modal pra-TGE, dapatkan token dengan diskon dan 
vesting

## 6.4 Langganan

| Plan     | Harga   | Manfaat                                |
|----------|---------|----------------------------------------|
| Gratis   | $0      | 1 spin/hari, jadwal 9pm                |
| Premium  | $25/bln | 3 spin/hari, semua jadwal, riwayat     |
| Berlian  | $49/bln | Tak terbatas, 5 angka, akses API       |

# 7. Keamanan

## 7.1 Infrastruktur

-   SSL/TLS 1.2+ wajib
-   Rate limiting (nginx + fail2ban)
-   Firewall UFW terkonfigurasi
-   PostgreSQL/Redis hanya localhost

## 7.2 Aplikasi

-   JWT dengan masa berlaku (24j/7h)
-   Bcrypt untuk password (12 round)
-   Sanitasi input (pencegahan XSS)
-   Query terparameterisasi (pencegahan SQL injection)
-   CORS dibatasi

## 7.3 Header Keamanan

-   Strict-Transport-Security (HSTS)
-   Content-Security-Policy (CSP)
-   X-Frame-Options: DENY
-   X-Content-Type-Options: nosniff

## 7.4 Kepatuhan

-   KYC/AML untuk verifikasi identitas
-   Evaluasi PCI-DSS selesai
-   Log audit yang tidak dapat diubah

# 8. La Tanda Chain

La Tanda dimulai sebagai platform untuk mendigitalisasi tanda. Telah 
berkembang menjadi ekosistem keuangan lengkap: tabungan kelompok, 
marketplace P2P, prediksi dengan ML, mining token, asisten AI, dan 
tata kelola komunitas. La Tanda Chain adalah lapisan infrastruktur yang 
menyatukan layanan ini di bawah jaringan terdesentralisasi dan berdaulat.

**Fase 1:** LTD sebagai ERC20 di Polygon (saat ini)  
**Fase 2:** La Tanda Chain — blockchain berdaulat yang dibangun dengan Cosmos 
SDK / CometBFT di mana LTD adalah token asli untuk gas, staking, dan 
tata kelola.

## 8.1 Arsitektur Chain

La Tanda Chain menggunakan **CometBFT** (sebelumnya Tendermint) sebagai mesin 
konsensus, menyediakan toleransi terhadap kegagalan Byzantine, finality 
instan, dan Delegated Proof of Stake (DPoS).

5s

Waktu blok

1.000+

Target TPS

BFT

Konsensus

IBC

Interoperabilitas

### Modul asli chain

| Modul            | Fungsi                                                                                                                |
|------------------|-----------------------------------------------------------------------------------------------------------------------|
| **x/ltd**        | Token asli — transfer, burn, fee. Supply tetap 200M (0% inflasi). Hadiah via treasury pra-minting                     |
| **x/tanda**      | Siklus tanda, kontribusi, pembayaran, hasil undian. Multi-sig untuk distribusi                                        |
| **x/mercado**    | Escrow marketplace, reputasi penjual, arbitrase perselisihan                                                          |
| **x/loteria**    | RNG yang dapat diverifikasi (commit-reveal), penjadwalan undian, pasar prediksi                                       |
| **x/mineria**    | Hadiah berdasarkan aktivitas, tier, anti-sybil, distribusi terjadwal dari treasury                                    |
| **x/gobernanza** | Proposal, pemungutan suara (1 LTD = 1 suara, 1.5x jika staking >180 hari), kuorum 33%                                 |

### On-chain vs Off-chain

| On-chain (La Tanda Chain)           | Off-chain (PostgreSQL + Redis) |
|-------------------------------------|--------------------------------|
| Transfer dan saldo LTD              | Profil pengguna, PII, KYC      |
| Pembuatan tanda, aturan, pembayaran | Feed sosial, komentar, chat    |
| Escrow marketplace                  | Percakapan dengan MIA (AI)     |
| Pengujian RNG untuk undian          | Model ML prediksi              |
| Staking, tata kelola, mining        | Sesi, analitik, UI             |

## 8.2 Peserta Jaringan

### Node

Setiap mesin yang menjalankan perangkat lunak La Tanda Chain. Node menyimpan 
salinan state dan meneruskan transaksi.

| Jenis          | Peran                                                                 | Operator                           |
|----------------|-----------------------------------------------------------------------|------------------------------------|
| Full Node      | Riwayat lengkap, validasi transaksi, melayani query                   | Ray-Banks, mitra, developer        |
| Validator Node | Full node + berpartisipasi dalam konsensus (usul & tanda tangan blok) | Validator terverifikasi            |
| Archive Node   | Full node + menyimpan seluruh state historis                          | Blockchain explorer, analitik      |
| Light Client   | Verifikasi header, query state via full node                          | Wallet mobile, integrasi           |

### Validator

Operator node yang diterima ke set aktif yang berpartisipasi dalam 
produksi blok.

| Persyaratan   | Detail                                                          |
|---------------|-----------------------------------------------------------------|
| Stake minimum | 1 LTD self-delegation minimum (testnet: delegasi proyek)        |
| Riwayat       | 6+ bulan aktif di La Tanda                                      |
| Verifikasi    | KYC/KYB selesai                                                 |
| Uptime        | 99,5%+ per epoch (10.000 blok)                                  |
| Tata Kelola   | Memilih di 75%+ proposal                                        |

**Set validator (ekspansi progresif):**

| Fase                                   | Validator | Seleksi                                                 |
|----------------------------------------|-----------|---------------------------------------------------------|
| Fase 1 — Genesis (selesai)             | 7+        | Selesai: 7+ validator aktif, tata kelola on-chain       |
| Fase 2 — Trusted Set (sedang berjalan) | 15-25     | Testnet berinsentif: validator + mitra infra            |
| Fase 3 — Pertumbuhan                   | 50        | Aplikasi terbuka, berdasarkan stake                     |
| Fase 4 — Kematangan                    | 100       | Tanpa izin, berdasarkan stake                           |
| Fase 5 — Terbuka                       | 150+      | Tanpa batas, pasar bebas                                |

### Kondisi Slashing

| Pelanggaran                                             | Sanksi                                    |
|---------------------------------------------------------|-------------------------------------------|
| Double signing (tanda tangan 2 blok di ketinggian sama) | 5% stake + jail permanen                  |
| Downtime berkepanjangan (500+ blok hilang)              | 0,1% stake + jail sementara (24 jam)      |
| Perilaku buruk di tanda (gagal distribusi)              | 10% bonus koordinator + pemberhentian     |
| Absen tata kelola (<50% suara dalam 3 bulan)            | Peringatan → 0,05% slash pada pengulangan |

### Delegator

Setiap pemegang LTD yang staking token ke validator, berbagi 
hadiah dan risiko.

1.  Delegator memilih validator berdasarkan reputasi, komisi, dan uptime
2.  Staking LTD via transaksi `MsgDelegate`
3.  LTD yang distaking berkontribusi pada bobot validator
4.  Delegator mendapatkan hadiah proporsional, dikurangi komisi 
validator
5.  Dapat redelegasi ke validator lain (periode unbonding: 21 hari)

**Delegasi dalam konteks ekosistem:**  
Bergabung dengan grup tanda = delegasi implisit ke 
koordinator-validator.  
Membeli di marketplace = delegasi kepercayaan sementara.  
Staking ke validator = delegasi ekonomi eksplisit jangka panjang.

## 8.3 Migrasi Token: Polygon → La Tanda Chain

LTD saat ini ada sebagai ERC20 di Polygon Amoy testnet. Migrasi 
ke token asli La Tanda Chain mengikuti rute ini:

1.  **Testnet Aktif (Q1-Q2 2026):** La Tanda Chain testnet 
beroperasi dengan 10+ validator, tata kelola on-chain, testnet 
berinsentif (lihat 8.3.1)
2.  **Seed Round + Tim (Q2-Q3 2026):** Penutupan seed round, 
perekrutan tim inti, audit keamanan
3.  **Mainnet Launch + TGE (Q1-Q2 2027):** Mainnet diluncurkan sebagai chain baru 
dengan genesis independen, Token Generation Event, listing 
DEX pertama, IBC diaktifkan
4.  **Ekspansi (Q3-Q4 2027):** Listing CEX, ekspansi regional 
(Guatemala, El Salvador), modul asli aktif

### 8.3.1 Strategi Testnet → Mainnet

Testnet (`latanda-testnet-1`) dan mainnet (`latanda-1`, pending) adalah 
chain yang secara teknis terpisah. Strategi resmi adalah sebagai berikut:

-   **Testnet mempertahankan parameter saat ini:** 5% inflasi 
    blok (warisan genesis eksperimental) dipertahankan sebagai 
    sandbox pengembangan. Tidak akan ada proposal tata kelola 
    untuk mengubah parameter testnet — mengubah aturan di tengah 
    jalan menimbulkan gesekan yang tidak perlu dengan validator aktif.
-   **Mainnet lahir bersih dengan model resmi:** 200M tetap, 0% 
    inflasi nyata, hadiah dari pool Staking dan Validator 
    pra-minting. Testnet dapat terus berjalan paralel 
    pasca-launch atau dibongkar sesuai kebutuhan komunitas.
-   **Token testnet tidak bermigrasi secara otomatis:** ini adalah play money 
    untuk pengembangan, tidak diwariskan ke genesis mainnet.

### 8.3.2 Program Testnet Berinsentif

Validator, node, dan kontributor aktif selama testnet menerima 
kompensasi dalam LTD *nyata* di genesis mainnet, didanai dari 
pool **Komunitas dan Mining**. Pekerjaan mereka di testnet langsung 
menjadi partisipasi di mainnet:

| Tier                 | Slot    | LTD per slot | Total         | Persyaratan                                         |
|----------------------|---------|--------------|---------------|-----------------------------------------------------|
| **Infra Partner**    | 5       | 5.000        | 25.000        | RPC/API publik, explorer, statesync, panduan teknis |
| **Validator**        | 10      | 2.000        | 20.000        | Uptime >95%, voting tata kelola, tanpa jail         |
| **Full Node**        | 20      | 500          | 10.000        | Node tersinkronisasi, relay transaksi               |
| **Bug Reporter**     | Terbuka | 100-1.000    | ~10.000       | Laporan terverifikasi via GitHub issue              |
| **Buffer tambahan**  | —       | —            | ~35.000       | Cadangan untuk peserta baru hingga mainnet          |
| **TOTAL**            |         |              | **~100.000**  | 0,05% dari total supply                             |

Program ini menggantikan kebutuhan mengubah parameter testnet 
via tata kelola. Validator eksternal yang berkontribusi pada 
bootstrap jaringan menerima kompensasi di mainnet sebagai pengakuan 
eksplisit atas nilai yang diberikan, bukan bergantung pada hadiah 
inflasioner testnet yang tidak memiliki nilai ekonomi 
nyata.

## 8.4 Ekonomi Validator

| Sumber Pendapatan                   | Distribusi                                    |
|-------------------------------------|-----------------------------------------------|
| Biaya transaksi (0,01 LTD dasar)    | Validator 80% \| Treasury 15% \| Burn 5%      |
| Komisi tanda                        | Koordinator 85% \| Treasury 10% \| Burn 5%    |
| Biaya marketplace                   | Arbitrator 50% \| Treasury 30% \| Burn 20%    |
| Langganan loteria                   | Treasury 70% \| Oracle 20% \| Burn 10%        |
| Biaya bridge (0,1%)                 | Validator 60% \| Treasury 30% \| Burn 10%     |

**APY estimasi:** Validator 15-25% \| Delegator 10-20% (berubah sesuai 
komisi validator dan aktivitas jaringan). Sumber: biaya 
transaksi + distribusi terjadwal dari treasury pra-minting (40M LTD 
dialokasikan untuk staking/validator). Tanpa inflasi — supply tetap 
200M.

## 8.5 Interoperabilitas

-   **IBC (Cosmos):** Koneksi dengan Osmosis (DEX), Noble (USDC asli), 
    Cosmos Hub
-   **Polygon Bridge:** Komposabilitas DeFi, listing di exchange, 
    integrasi legacy
-   **Ramp Fiat:** Transfer bank / uang seluler ↔ LTD via 
    mitra yang diatur di Honduras dan LATAM

## 8.6 Keamanan Chain

-   **Konsensus:** CometBFT mentolerir <1/3 validator Byzantine. 
    Finality 5 detik
-   **Staking:** Delegasi proyek selama testnet. Mainnet 
    akan memerlukan stake signifikan sebagai disinsentif ekonomi
-   **Bridge:** Verifikasi light client IBC (tanpa perantara). Rate 
    limit: maks 1M LTD/24 jam. Pause darurat via tata kelola
-   **Privasi:** Jumlah on-chain terlihat hanya untuk peserta dan 
    validator yang ditugaskan. ZK-SNARKs direncanakan untuk Fase 4
-   **Audit:** Smart contract dan modul diaudit oleh 2+ firma 
    independen sebelum setiap fase

# 9. Peta Jalan

## Selesai (2024-2025)

-   Infrastruktur inti dan API (140+ endpoint)
-   Sistem tanda dengan WebSocket dan tombola langsung
-   Token LTD di Polygon Amoy (ERC20)
-   Predictor loteria dengan ML (XGBoost, presisi 42%)
-   Sistem mining, gamifikasi, dan marketplace
-   MIA — asisten AI keuangan

## Q1-Q2 2026 — Platform

-   OAuth (Google, Apple, Telegram)
-   Integrasi pembayaran (Stripe)
-   Aplikasi mobile (React Native)
-   Audit smart contract
-   Hash anchor pembayaran (SHA-256 untuk migrasi on-chain mendatang)
-   Sistem reputasi on-platform

## Q1-Q2 2026 — Testnet Aktif (sedang berjalan)

-   La Tanda Chain testnet dengan 10+ validator aktif
-   Testnet berinsentif dengan tier delegasi (Validator 2K, Infra 
    Partner 5K LTD)
-   Tata kelola on-chain aktif (GOV-001, GOV-002 disetujui)
-   Bug bounty dan grants untuk kontributor
-   Perangkat lunak node dan dokumentasi open-source

## Q2-Q3 2026 — Seed Round + Tim

-   Penutupan seed round ($500K, FDV $5M)
-   Perekrutan tim inti (5 orang)
-   Audit keamanan (chain + platform)
-   25+ validator di testnet
-   Dual-write: PostgreSQL + chain testnet secara paralel

## Q1-Q2 2027 — Mainnet Launch + TGE

-   Migrasi dari testnet ke mainnet
-   Token Generation Event (TGE — 10M LTD beredar)
-   Listing DEX pertama (Osmosis atau serupa)
-   IBC diaktifkan, staking delegator dibuka
-   Chain menjadi sumber kebenaran

## Q3-Q4 2027 — Ekspansi

-   50 validator aktif di 10+ negara
-   SDK La Tanda untuk developer pihak ketiga
-   Tanda lintas batas (settlement di LTD atau USDC via IBC)
-   Peran khusus: validator tanda, arbitrator 
    marketplace, oracle
-   Koneksi IBC: Osmosis (DEX), Noble (USDC)

## 2028 — Fase 4: Kematangan

-   100+ validator, masuk tanpa izin
-   Treasury DAO aktif — fee protokol dikendalikan 
    komunitas
-   Dana asuransi operasional
-   Integrasi DeFi (posisi tanda sebagai kolateral)
-   API perusahaan: bank dan lembaga mikrofinansial mengintegrasikan 
    tanda-as-a-service
-   Yayasan La Tanda didirikan

## 2029+ — Fase 5: Protokol Terbuka

-   150+ validator, tanpa batas
-   Chain satelit regional terhubung via IBC (Afrika, Asia)
-   Dukungan multi-model: chit funds (India), susu (Afrika), hui 
(Vietnam), paluwagan (Filipina)
-   Interoperabilitas dengan keuangan tradisional (kartu, remitansi)
-   DAO sepenuhnya otonom dengan dewan terpilih untuk keadaan darurat

[Ver roadmap detallado →](roadmap.html)

# 10. Tim dan Hukum

## 10.1 Entidad Legal

**Ray-Banks LLC**  
New Mexico Limited Liability Company  
EIN: 37-2158338  
Beroperasi sebagai: Latanda Financial Services

## 10.2 Tim Pendiri

La Tanda dikembangkan oleh tim terdistribusi yang dipimpin oleh 
pendiri, dengan peran kunci yang sedang direkrut secara aktif 
melalui program bounty dan komunitas Cosmos.

| Peran                                 | Status     | Alokasi (Pool Tim) |
|---------------------------------------|------------|--------------------|
| **Pendiri / Arsitek**                 | Aktif      | 8.000.000 LTD      |
| **Pemimpin Infrastruktur**            | Merekrut   | 2.500.000 LTD      |
| **Developer Frontend**                | Merekrut   | 2.500.000 LTD      |
| **Komunitas / Pertumbuhan**           | Merekrut   | 2.000.000 LTD      |
| **Developer Mobile**                  | Pasca-Seed | 2.500.000 LTD      |
| **CTO / Developer Backend+Chain**     | Pasca-Seed | 4.000.000 LTD      |
| **Desainer / UX**                     | 2027       | 1.500.000 LTD      |
| **Cadangan**                          | -          | 1.000.000 LTD      |

**Vesting:** Semua peran tim memiliki 1 tahun cliff dan 2 tahun 
vesting linear. Total pool Tim: 24.000.000 LTD (12% dari 
supply).

**Bergabung dengan tim:** Kontributor terbaik dari [program 
bounty](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty) 
diundang ke peran tim. Kami juga menerima lamaran langsung 
untuk peran khusus. Kontak: <contact@latanda.online>

## 10.3 Validator dan Mitra Infrastruktur

| Operator                         | Status | Sejak         |
|----------------------------------|--------|---------------|
| **Ray-Banks** (genesis)          | Aktif  | Februari 2026 |
| **PRO Delegators** (Nuxian Labs) | Aktif  | Maret 2026    |

## 10.4 Kontak

-   **Website:** [latanda.online](https://latanda.online)
-   **Corporate:** [raybanks.org](https://raybanks.org)
-   **Email:** contact@latanda.online
-   **GitHub:** 
    [INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web)
-   **Twitter:** @TandaWeb3
-   **Investor:** [latanda.online/invest](/invest.html) \| 
    <invest@latanda.online>

## 10.5 Disclaimer

Dokumen ini hanya untuk tujuan informasi dan bukan merupakan 
nasihat keuangan, hukum, atau investasi. Token LTD saat ini 
beroperasi di testnet dan tidak memiliki nilai moneter. Investasi 
dalam kriptocurrency melibatkan risiko signifikan. Konsultasikan 
dengan profesional sebelum mengambil keputusan keuangan.

2024-2026 Ray-Banks LLC. Hak cipta dilindungi undang-undang.

[Roadmap](roadmap.html) \| [Privasi](privacy-policy.html) \|
[Termin](terms-of-service.html) \| [API 
Docs](https://latanda.online/docs)
