# Sounmix — Product Requirements Document (PRD)

**Product:** Sounmix  
**Type:** Web App / SaaS  
**Status:** MVP  
**Target Platform:** Web  
**Primary Users:** Spotify & Apple Music users  
**Language:** English for public UI  
**Architecture:** React + Vite + TailwindCSS / Express + Prisma v4 / Supabase PostgreSQL

---

# 1. Product Overview

## 1.1 Product Description

**Sounmix** adalah platform untuk mengelola, membersihkan, memindahkan, dan mengorganisasi playlist musik lintas platform.

Versi MVP berfokus pada:

- Spotify ↔ Apple Music
- Transfer playlist
- Playlist import
- Track matching
- Duplicate detection/removal
- Memindahkan lagu berdasarkan artis
- Merge playlist
- Preview perubahan sebelum diterapkan

Sounmix bukan sekadar playlist transfer tool, tetapi **music library management toolbox**.

### Core Value Proposition

> **Move, clean, and organize your music.**

User dapat menghubungkan Spotify dan Apple Music, kemudian mengelola playlist mereka dari satu interface.

---

# 2. Goals

## 2.1 Primary Goals

1. Memindahkan playlist antara Spotify dan Apple Music dengan friction seminimal mungkin.
2. Mencocokkan lagu antar-platform dengan tingkat akurasi tinggi.
3. Mengidentifikasi duplicate tracks dalam playlist.
4. Memungkinkan user mengorganisasi playlist berdasarkan artist.
5. Memberikan preview sebelum perubahan dilakukan.
6. Tidak pernah melakukan perubahan destructive tanpa persetujuan user.
7. Membuat arsitektur yang dapat dengan mudah menambahkan platform musik lain di masa depan.

## 2.2 Secondary Goals

- Playlist merge
- Playlist cleanup
- Playlist backup
- Track filtering
- Music statistics
- Job history
- Operation history

---

# 3. Non-Goals — MVP

Fitur berikut TIDAK wajib untuk MVP:

- YouTube Music
- TIDAL
- Deezer
- Amazon Music
- Music streaming
- Music playback
- Download music
- Piracy-related functionality
- Lyrics
- Social network
- Public playlist marketplace
- Recommendation engine
- AI music recommendation

Arsitektur tetap harus memungkinkan penambahan platform tersebut di masa depan.

---

# 4. Target Users

## Persona A — Playlist Collector

User memiliki ratusan/ribuan lagu dan banyak playlist.

Pain point:

> "Gue mau pindahin playlist tapi males nyari lagunya satu-satu."

## Persona B — Platform Switcher

User pindah dari Spotify ke Apple Music atau sebaliknya.

Pain point:

> "Playlist gue udah bertahun-tahun, masa harus bikin ulang?"

## Persona C — Playlist Organizer

User memiliki playlist yang berantakan.

Pain point:

> "Gue punya 500 lagu dan mau mindahin semua lagu The Weeknd ke playlist tertentu."

## Persona D — Music Cleaner

User memiliki banyak duplicate tracks.

Pain point:

> "Gue nggak mau cari lagu duplicate satu-satu."

---

# 5. MVP Features

## 5.1 Authentication

User harus memiliki akun Sounmix.

Authentication dapat menggunakan:

- Email/password
- OAuth provider yang disediakan Supabase Auth

User account harus terpisah dari credential platform musik.

---

# 6. Music Platform Connections

## 6.1 Spotify Connection

User dapat menghubungkan Spotify.

Flow:

```text
Dashboard
    ↓
Connect Spotify
    ↓
Spotify Authorization
    ↓
Callback
    ↓
Backend validates authorization
    ↓
Encrypted credentials/token storage
    ↓
Spotify Connected
```

System harus mengambil permission minimum yang diperlukan.

Permission scope harus ditentukan berdasarkan API Spotify terbaru yang dipakai.

---

## 6.2 Apple Music Connection

User dapat menghubungkan Apple Music.

Flow:

```text
Dashboard
    ↓
Connect Apple Music
    ↓
Apple Music Authorization / MusicKit flow
    ↓
Backend verification
    ↓
Apple Music Connected
```

Implementasi authorization harus mengikuti mekanisme Apple Music API/MusicKit yang berlaku.

---

# 7. API Research Requirement

## IMPORTANT — AI AGENT RESEARCH TASK

Agent **WAJIB mencari dan mengevaluasi API/library secara mandiri** sebelum mengimplementasikan integration layer.

Jangan mengasumsikan nama library, endpoint, package, atau authentication flow.

## Research Sources

Prioritas:

1. GitHub
2. Official API documentation
3. Official SDK documentation
4. Package registry

GitHub harus digunakan untuk menemukan:

- active API wrappers
- maintained SDK
- TypeScript libraries
- Spotify clients
- Apple Music/MusicKit clients
- OAuth helpers
- community implementations
- known API limitations
- recent issues
- rate-limit handling

Agent harus mengecek:

- repository activity
- latest release/commit
- stars hanya sebagai signal, bukan faktor utama
- open issues
- API compatibility
- TypeScript support
- Node.js compatibility
- authentication support
- playlist manipulation support
- maintenance status

## Research Output

Sebelum coding integration layer, agent harus membuat file:

```text
docs/api-research.md
```

Dengan format:

```md
# Spotify API Research

## Candidate Libraries

### Library A
Repository:
Maintenance:
Last activity:
Advantages:
Disadvantages:
Playlist support:
Authentication:
Recommendation:

### Library B
...

## Selected Solution
...

# Apple Music API Research

...

# Final Architecture Decision

Spotify:
Apple Music:
Reason:
Known limitations:
```

Agent harus menggunakan official documentation untuk memvalidasi hasil research GitHub.

---

# 8. Playlist Import

Setelah account terhubung, user dapat melihat playlist mereka.

Example:

```text
Spotify

Your Playlists

Chill
247 tracks

Workout
183 tracks

Favorites
512 tracks
```

Data playlist yang diperlukan:

- platform
- platform playlist ID
- playlist name
- description
- cover image
- track count
- owner
- public/private status

---

# 9. Playlist Transfer

## 9.1 Supported Directions

MVP:

```text
Spotify → Apple Music
Apple Music → Spotify
```

## 9.2 Transfer Flow

```text
Select Source Platform
        ↓
Select Playlist
        ↓
Select Destination Platform
        ↓
Select/Create Destination Playlist
        ↓
Analyze Tracks
        ↓
Match Tracks
        ↓
Preview
        ↓
Confirm
        ↓
Queue Job
        ↓
Transfer
        ↓
Result
```

---

# 10. Track Matching Engine

Track matching merupakan core technology Sounmix.

System tidak boleh hanya melakukan exact title matching.

## 10.1 Track Metadata

Normalize metadata:

```text
title
artist
album
duration
ISRC
releaseDate
explicit
```

Jika platform menyediakan metadata tambahan, sistem dapat menggunakannya.

---

# 11. Matching Algorithm

Prioritas matching:

### Level 1 — ISRC

Jika kedua platform mempunyai ISRC yang sama:

```text
ISRC exact match
→ confidence 100%
```

### Level 2 — Exact normalized metadata

Compare:

```text
artist
title
album
duration
```

### Level 3 — Fuzzy matching

Normalization harus menangani:

```text
Official Video
Official Audio
Lyrics
Remastered
Remaster
Live
Radio Edit
Extended Mix
Deluxe
feat.
ft.
```

Namun system **tidak boleh menghapus suffix secara membabi buta**, karena beberapa suffix mengidentifikasikan track berbeda.

---

# 12. Match Confidence

Setiap matching result harus memiliki confidence score.

Example:

```text
95-100
Automatically matched

85-94
Likely match

70-84
Needs review

<70
Unmatched
```

Threshold dapat dikonfigurasi.

---

# 13. Match Preview

Sebelum transfer:

```text
Transfer Preview

247 tracks analyzed

✓ 239 matched
⚠ 5 uncertain
✕ 3 not found

Matched:
239

Needs Review:
5

Unavailable:
3

[Review]
[Cancel]

Transfer 239 Tracks
```

User harus mengetahui lagu mana yang gagal ditemukan.

---

# 14. Transfer Job System

Transfer tidak boleh dijalankan sebagai satu HTTP request panjang.

Gunakan asynchronous job architecture.

```text
Frontend
   ↓
POST /transfers
   ↓
Express API
   ↓
Create Job
   ↓
Queue
   ↓
Worker
   ↓
Spotify / Apple Music API
```

Status:

```text
PENDING
ANALYZING
MATCHING
TRANSFERRING
COMPLETED
PARTIAL
FAILED
CANCELLED
```

Progress:

```text
147 / 239 tracks
61%
```

---

# 15. Duplicate Cleaner

User dapat memilih playlist dan menjalankan duplicate scan.

Example:

```text
Playlist: Favorites

512 tracks

Duplicates Found: 18
```

Duplicate grouping:

```text
Blinding Lights
├── Track #1
├── Track #2
└── Track #3

Starboy
├── Track #1
└── Track #2
```

System menampilkan:

- title
- artist
- album
- duration
- platform track ID
- duplicate reason

---

# 16. Duplicate Definition

Prioritas:

### Exact platform track ID

Jika ID sama → duplicate.

### ISRC

Jika ISRC sama → likely same recording.

### Metadata matching

Gunakan normalized:

```text
artist
title
duration
```

Untuk fuzzy duplicate detection.

System harus membedakan:

```text
Original
Remastered
Live
Acoustic
Radio Edit
Extended
Remix
```

jika memang merupakan recording berbeda.

---

# 17. Duplicate Cleanup

User dapat:

```text
Keep first
Keep newest
Keep oldest
Choose manually
```

MVP default:

> Keep first occurrence.

Sebelum execute:

```text
18 duplicate tracks will be removed.

Original library tracks will NOT be deleted.

[Cancel]
[Remove 18 Duplicates]
```

---

# 18. Artist Organizer

Fitur ini memungkinkan user memindahkan lagu berdasarkan artist.

Example:

```text
Playlist:
My Music

Artist:
The Weeknd

Found:
17 tracks

Destination:
The Weeknd Collection
```

Action:

```text
Move 17 tracks
```

Implementation:

```text
Add tracks to destination
        ↓
Verify success
        ↓
Remove tracks from source
```

Jika add gagal:

> Jangan hapus dari source.

---

# 19. Playlist Merge

User dapat memilih:

```text
Playlist A
+
Playlist B
```

Output:

```text
New Playlist
```

System dapat otomatis remove duplicates.

Example:

```text
Playlist A: 200
Playlist B: 150

Raw total: 350

Duplicates: 37

Final: 313
```

---

# 20. Playlist Operations

Architecture harus mendukung:

```text
TRANSFER
DUPLICATE_SCAN
DUPLICATE_REMOVE
MOVE_TRACKS
MERGE_PLAYLISTS
```

Semua operations harus tercatat sebagai jobs.

---

# 21. Dashboard

Dashboard utama:

```text
┌───────────────────────────────────────────────┐
│ Sounmix                            Profile   │
├───────────────┬───────────────────────────────┤
│               │                               │
│ Dashboard     │ Connected Services            │
│               │                               │
│ Transfer      │ Spotify       Connected       │
│               │ Apple Music   Connected       │
│ Organize      │                               │
│ Duplicates    │                               │
│               │ Recent Activity               │
│ History       │                               │
│ Settings      │ Transfer: Chill               │
│               │ 247 → 239 tracks              │
└───────────────┴───────────────────────────────┘
```

---

# 22. Transfer Page

```text
Transfer Music

FROM
[Spotify]

Playlist
[Chill ▼]

        ↓

TO
[Apple Music]

Playlist
[Create New ▼]

[Analyze Playlist]
```

---

# 23. Operation Result

```text
Transfer Complete

239 / 247 tracks transferred

✓ 239 matched
✕ 3 unavailable
⚠ 5 skipped

[View Details]
[Done]
```

---

# 24. Unmatched Tracks

Unmatched tracks harus dapat dilihat:

```text
Could not find:

01. Song A — Artist A
02. Song B — Artist B
03. Song C — Artist C
```

User dapat:

```text
Retry Matching
Manually Select
Skip
```

Manual selection dapat menjadi future enhancement jika terlalu kompleks untuk MVP.

---

# 25. History

Page:

```text
Operation History

Sep 1
Spotify → Apple Music
Chill
239 tracks
Completed

Aug 30
Duplicate Cleanup
Favorites
18 removed
Completed
```

Setiap operation menyimpan:

- type
- source
- destination
- startedAt
- completedAt
- status
- totalTracks
- successfulTracks
- failedTracks

---

# 26. Data Architecture

## Technology

### Frontend

```text
React
Vite
TypeScript
TailwindCSS
```

### Backend

```text
Node.js
Express
TypeScript
Prisma v4
```

### Database

```text
Supabase
PostgreSQL
```

### Authentication

```text
Supabase Auth
```

### Deployment

Frontend:

```text
Vercel
```

Backend:

```text
Railway / Render / Fly.io / VPS
```

Deployment choice can be decided by agent.

---

# 27. Recommended Repository Structure

```text
Sounmix/
│
├── apps/
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── layouts/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── main.tsx
│   │   │
│   │   └── vite.config.ts
│   │
│   └── api/
│       ├── src/
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── providers/
│       │   │   ├── spotify/
│       │   │   ├── apple-music/
│       │   │   └── base/
│       │   ├── jobs/
│       │   ├── workers/
│       │   ├── middleware/
│       │   ├── utils/
│       │   ├── config/
│       │   └── app.ts
│       │
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── matching/
│   ├── shared/
│   └── types/
│
├── docs/
│   ├── api-research.md
│   ├── architecture.md
│   └── matching.md
│
└── README.md
```

---

# 28. Provider Architecture

Jangan membuat business logic khusus Spotify di seluruh application.

Gunakan abstraction:

```ts
interface MusicProvider {
  getPlaylists(): Promise<Playlist[]>

  getPlaylistTracks(
    playlistId: string
  ): Promise<Track[]>

  getTrack(
    trackId: string
  ): Promise<Track>

  searchTrack(
    query: TrackQuery
  ): Promise<Track[]>

  createPlaylist(
    input: CreatePlaylistInput
  ): Promise<Playlist>

  addTracks(
    playlistId: string,
    trackIds: string[]
  ): Promise<void>

  removeTracks(
    playlistId: string,
    trackIds: string[]
  ): Promise<void>
}
```

Spotify:

```text
SpotifyProvider implements MusicProvider
```

Apple Music:

```text
AppleMusicProvider implements MusicProvider
```

Tujuannya agar platform ketiga nantinya cukup membuat:

```text
YouTubeMusicProvider
TidalProvider
DeezerProvider
```

tanpa mengubah matching/business logic.

---

# 29. Prisma Database

Database harus menggunakan PostgreSQL di Supabase.

Recommended entities:

```text
User
MusicAccount
Playlist
Track
PlaylistTrack
TransferJob
TransferItem
Operation
```

Relationship:

```text
User
 ├── MusicAccounts
 ├── Playlists
 └── Operations

MusicAccount
 └── Playlists

Playlist
 └── PlaylistTracks
       └── Track

TransferJob
 └── TransferItems
```

---

# 30. Prisma Models — Initial Direction

Agent harus menyesuaikan schema setelah API research.

Contoh konsep:

```prisma
enum MusicPlatform {
  SPOTIFY
  APPLE_MUSIC
}

enum OperationStatus {
  PENDING
  RUNNING
  COMPLETED
  PARTIAL
  FAILED
  CANCELLED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  accounts  MusicAccount[]
  playlists Playlist[]
  operations Operation[]
}

model MusicAccount {
  id           String        @id @default(uuid())
  userId       String
  platform     MusicPlatform

  platformUserId String?

  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  playlists    Playlist[]

  @@unique([userId, platform])
}

model Playlist {
  id              String   @id @default(uuid())
  accountId       String
  platformId      String
  name            String
  description     String?
  imageUrl        String?
  trackCount      Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  account         MusicAccount   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  tracks          PlaylistTrack[]
}

model Track {
  id              String   @id @default(uuid())

  spotifyId       String?
  appleMusicId    String?

  isrc            String?
  title           String
  artist          String
  album           String?
  durationMs      Int?
  releaseDate     DateTime?

  normalizedTitle  String?
  normalizedArtist String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  playlists        PlaylistTrack[]
}

model PlaylistTrack {
  id         String   @id @default(uuid())
  playlistId String
  trackId    String
  position   Int

  playlist   Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  track      Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@unique([playlistId, trackId])
}

model Operation {
  id              String          @id @default(uuid())
  userId          String
  type            String
  status          OperationStatus

  sourcePlatform  MusicPlatform?
  destinationPlatform MusicPlatform?

  totalTracks     Int @default(0)
  successfulTracks Int @default(0)
  failedTracks    Int @default(0)

  startedAt       DateTime?
  completedAt     DateTime?

  createdAt       DateTime @default(now())

  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Important:** Agent boleh mengubah schema setelah melakukan API research dan merancang architecture final.

---

# 31. Backend API

REST API.

Base:

```text
/api/v1
```

## Authentication

```http
GET /api/v1/auth/me
```

## Accounts

```http
GET    /api/v1/accounts
POST   /api/v1/accounts/:platform/connect
DELETE /api/v1/accounts/:platform
```

## Playlists

```http
GET /api/v1/:platform/playlists
GET /api/v1/:platform/playlists/:playlistId
GET /api/v1/:platform/playlists/:playlistId/tracks
```

## Transfer

```http
POST /api/v1/transfers
GET  /api/v1/transfers/:id
POST /api/v1/transfers/:id/cancel
```

## Duplicate

```http
POST /api/v1/duplicates/scan
POST /api/v1/duplicates/remove
```

## Organizer

```http
POST /api/v1/organizer/artist/move
```

## Merge

```http
POST /api/v1/playlists/merge
```

## Operations

```http
GET /api/v1/operations
GET /api/v1/operations/:id
```

Agent harus menambahkan endpoint berdasarkan implementation requirements.

---

# 32. API Response Standard

Semua endpoint menggunakan format konsisten.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "PLAYLIST_NOT_FOUND",
    "message": "Playlist could not be found"
  }
}
```

---

# 33. Error Handling

System harus menangani:

- OAuth failure
- expired token
- revoked permission
- API rate limit
- network errors
- missing tracks
- playlist unavailable
- destination permission errors
- duplicate operation
- partial transfer
- provider downtime

Jangan expose provider access token ke frontend.

---

# 34. Security

## Token Security

Provider credentials harus:

- encrypted at rest
- tidak dikirim ke frontend
- tidak masuk application logs
- tidak masuk error response
- tidak disimpan dalam browser localStorage

## OAuth

Gunakan PKCE jika provider flow mendukungnya.

## Backend

Implement:

- authentication middleware
- authorization
- request validation
- rate limiting
- CORS
- secure HTTP headers
- input sanitization

---

# 35. Privacy

Sounmix hanya mengambil data yang diperlukan untuk menjalankan fitur user.

User harus dapat:

```text
Disconnect Spotify
Disconnect Apple Music
Delete Sounmix account
Delete synchronized metadata
```

Jangan menganggap Sounmix memiliki ownership terhadap user's music.

---

# 36. Rate Limit Strategy

Provider API memiliki rate limits.

System harus:

- respect provider rate limits
- queue requests
- retry transient failures
- exponential backoff
- stop retrying permanent errors
- track failed items

Example:

```text
429
 ↓
Retry after provider-defined delay
 ↓
Retry
 ↓
Success
```

Tidak boleh melakukan aggressive polling.

---

# 37. Frontend UX

Design principles:

- clean
- modern
- minimal
- fast
- desktop-first
- responsive
- accessible

Visual direction:

```text
Modern SaaS
+
Music app
+
Clean dashboard
```

Jangan membuat UI terasa seperti clone Spotify.

---

# 38. Required UI Pages

```text
/
├── Landing Page
├── Login
├── Register
│
└── Dashboard
    ├── Overview
    ├── Transfer
    ├── Organize
    ├── Duplicates
    ├── History
    └── Settings
```

---

# 39. Landing Page

Hero:

```text
Move your music.
Clean your playlists.
Sounmix.
```

CTA:

```text
Get Started
```

Sections:

1. How it works
2. Supported platforms
3. Features
4. Security/privacy
5. Pricing — future
6. FAQ

---

# 40. Responsive Design

Must work on:

- desktop
- tablet
- mobile

However, playlist management tables should prioritize desktop usability.

---

# 41. Loading States

Every async operation harus memiliki loading state.

Example:

```text
Analyzing playlist...

██████████░░░░░ 68%

163 / 239 tracks
```

---

# 42. Empty States

Example:

```text
No Spotify account connected.

Connect Spotify to start managing
your playlists.

[Connect Spotify]
```

---

# 43. Confirmation Rules

Operations yang mengubah playlist harus memiliki confirmation.

Example:

```text
You're about to move 17 tracks.

From:
My Music

To:
The Weeknd

The tracks will be removed from the
source playlist after they are added
successfully.

[Cancel]
[Move Tracks]
```

---

# 44. Transaction Safety

Untuk operasi move:

```text
1. Resolve source tracks
2. Add to destination
3. Verify destination
4. Remove from source
```

Never:

```text
Remove source
↓
Add destination
```

karena bisa menyebabkan kehilangan playlist entries apabila destination operation gagal.

---

# 45. Idempotency

Transfer operation harus aman untuk di-retry.

Contoh:

```text
Transfer job failed at 137/239
```

Retry tidak boleh menghasilkan:

```text
duplicate tracks
```

System harus dapat menentukan tracks yang sudah berhasil ditambahkan.

---

# 46. Logging

Backend logging harus mencatat:

```text
requestId
userId
operationId
platform
operation
status
duration
errorCode
```

Jangan log:

```text
accessToken
refreshToken
authorizationCode
```

---

# 47. Observability

Future-ready:

```text
Sentry
OpenTelemetry
structured logging
```

MVP minimal harus memiliki error logging.

---

# 48. Testing

## Unit Test

Wajib untuk:

- track normalizer
- duplicate detection
- matching scoring
- confidence calculation
- provider abstraction
- operation state machine

## Integration Test

Wajib untuk:

- database
- OAuth callback
- provider API integration
- transfer job

## E2E

Test:

```text
Login
→ Connect Spotify
→ Import playlist
→ Analyze
→ Match
→ Transfer
→ Result
```

---

# 49. Track Normalization Tests

Example input:

```text
Blinding Lights (Official Audio)
Blinding Lights - The Weeknd
BLINDING LIGHTS
```

Expected normalized core:

```text
blinding lights
```

Artist:

```text
the weeknd
```

Namun system harus tetap menyimpan original metadata.

---

# 50. Acceptance Criteria — Transfer

Feature dianggap selesai jika:

- User dapat connect Spotify.
- User dapat connect Apple Music.
- User dapat melihat playlist source.
- User dapat memilih destination.
- System dapat menganalisis track.
- System dapat menunjukkan matched/unmatched tracks.
- User dapat preview result.
- User dapat memulai transfer.
- Progress dapat dilihat.
- Transfer berhasil menangani partial failure.
- User dapat melihat hasil akhir.
- Unmatched tracks dilaporkan.
- Retry tidak menciptakan duplicate entries.

---

# 51. Acceptance Criteria — Duplicate Cleaner

Feature dianggap selesai jika:

- User dapat memilih playlist.
- System dapat scan duplicate tracks.
- System mengelompokkan duplicate.
- User dapat melihat alasan duplicate.
- User dapat memilih tracks.
- System menghapus duplicate entry dari playlist.
- Track library tidak ikut terhapus.
- Operation tercatat dalam history.

---

# 52. Acceptance Criteria — Artist Organizer

Feature dianggap selesai jika:

- User dapat memilih playlist.
- User dapat memilih artist.
- System menunjukkan jumlah track.
- User dapat memilih destination playlist.
- System menambahkan tracks ke destination.
- System memverifikasi keberhasilan.
- Source tracks hanya dihapus setelah add berhasil.
- Operation tercatat.

---

# 53. Future Features

## Platform Expansion

```text
YouTube Music
TIDAL
Deezer
Amazon Music
```

## Advanced Organization

```text
Filter by:
artist
album
genre
year
duration
explicit
```

## Smart Rules

Contoh:

```text
IF artist = The Weeknd
THEN move to The Weeknd
```

## Automatic Sync

```text
Spotify Playlist
      ↕
Apple Music Playlist
```

## Backup

Export:

```text
JSON
CSV
TXT
```

## Statistics

```text
Top Artists
Top Albums
Release Years
Genre distribution
```

---

# 54. Monetization — Future

Free tier:

```text
Limited transfers
Limited operations
```

Pro:

```text
Unlimited transfers
Unlimited duplicate cleanup
Advanced organizer
Backup
Multiple accounts
```

Potential pricing:

```text
$4.99/month
$39/year
```

Pricing harus divalidasi setelah MVP.

---

# 55. Product Metrics

Track:

### Acquisition

```text
Visitors
Signups
Connected Spotify accounts
Connected Apple Music accounts
```

### Activation

North Star activation:

> User successfully completes first playlist transfer.

### Engagement

```text
Transfers/user
Duplicates cleaned/user
Operations/user
Playlists managed/user
```

### Reliability

```text
Transfer success rate
Track match rate
Unmatched rate
API failure rate
```

---

# 56. Initial Success Targets

MVP internal target:

```text
>95% provider API operation success
>90% automatic track matching
<5% duplicate false positive
<1% destructive operation failure
```

Target tersebut merupakan engineering goals awal dan harus divalidasi menggunakan real-world data.

---

# 57. Agent Implementation Rules

AI coding agent harus mengikuti aturan:

1. Jangan mengarang API endpoint.
2. Jangan mengarang package API.
3. Research GitHub terlebih dahulu.
4. Validasi dengan official documentation.
5. Catat keputusan di `docs/api-research.md`.
6. Gunakan provider abstraction.
7. Jangan menaruh provider-specific logic di generic business logic.
8. Jangan expose OAuth credentials ke frontend.
9. Jangan membuat synchronous long-running HTTP transfer.
10. Semua transfer besar menggunakan job/queue.
11. Semua destructive operation membutuhkan confirmation.
12. Semua operations harus idempotent.
13. Semua external API failures harus graceful.
14. Semua provider-specific limitation harus didokumentasikan.

---

# 58. Recommended Development Sequence

## Phase 0 — Research

```text
GitHub research
Spotify API research
Apple Music API research
OAuth research
Rate-limit research
Playlist mutation research
```

Output:

```text
docs/api-research.md
docs/architecture.md
```

## Phase 1 — Foundation

```text
Monorepo
React + Vite
TailwindCSS
Express
Prisma v4
Supabase
Authentication
```

## Phase 2 — Providers

```text
Provider interface
Spotify provider
Apple Music provider
```

## Phase 3 — Playlist

```text
playlist sync
track sync
track normalization
```

## Phase 4 — Matching

```text
ISRC matching
exact matching
fuzzy matching
confidence score
```

## Phase 5 — Transfer

```text
transfer jobs
progress
retry
partial failure
```

## Phase 6 — Management

```text
duplicate cleaner
artist organizer
merge
```

## Phase 7 — Polish

```text
error states
empty states
responsive UI
accessibility
analytics
monitoring
```

---

# 59. Definition of Done

MVP dianggap selesai ketika seorang user baru dapat:

```text
Create Sounmix account
        ↓
Connect Spotify
        ↓
Connect Apple Music
        ↓
Select Spotify playlist
        ↓
Select Apple Music destination
        ↓
Analyze tracks
        ↓
Review matching result
        ↓
Start transfer
        ↓
Watch progress
        ↓
See completed result
        ↓
Open duplicate cleaner
        ↓
Remove duplicates
        ↓
Open organizer
        ↓
Move tracks by artist
```

Semua flow harus dapat dilakukan tanpa developer intervention.

---

# 60. Final Architecture

```text
                    ┌────────────────────┐
                    │   Sounmix Web     │
                    │ React + Vite       │
                    │ TailwindCSS        │
                    └─────────┬──────────┘
                              │
                              │ REST API
                              ▼
                    ┌────────────────────┐
                    │   Express API      │
                    │   TypeScript       │
                    └─────────┬──────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
      ┌────────────┐   ┌──────────────┐   ┌────────────┐
      │  Provider  │   │   Matching   │   │   Jobs     │
      │   Layer    │   │    Engine    │   │ / Worker   │
      └─────┬──────┘   └──────────────┘   └─────┬──────┘
            │                                    │
       ┌────┴─────┐                              │
       ▼          ▼                              │
  ┌─────────┐ ┌──────────┐                      │
  │ Spotify │ │  Apple   │                      │
  │   API   │ │  Music   │                      │
  └─────────┘ └──────────┘                      │
                                                │
                                                ▼
                                      ┌──────────────────┐
                                      │     Prisma v4    │
                                      │                  │
                                      │ PostgreSQL       │
                                      │ Supabase         │
                                      └──────────────────┘
```

---

# 61. Core Product Principle

Sounmix harus terasa seperti:

> **“Gue punya semua playlist gue di sini, dan gue bisa melakukan apa aja terhadap playlist tersebut tanpa harus ribet buka platform satu-satu.”**

Transfer adalah entry point.

**Management adalah product.**

**Matching engine adalah moat.**