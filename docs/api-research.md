# Sounmix API Research: Spotify Web API & Apple Music API

## 1. Spotify Web API Research

### Evaluated Approaches & Libraries
1. **Official REST API with Native Fetch / Token Management (Selected)**
   - Endpoint Base: `https://api.spotify.com/v1`
   - Authorization: `https://accounts.spotify.com/authorize`
   - Token Endpoint: `https://accounts.spotify.com/api/token`
   - Scopes required:
     - `playlist-read-private`
     - `playlist-read-collaborative`
     - `playlist-modify-public`
     - `playlist-modify-private`
     - `user-library-read`
     - `user-library-modify`
     - `user-read-private`
     - `user-read-email`
   - Advantages: Zero bloated native dependencies, lightweight in ES modules / TypeScript, full control over exponential backoff on HTTP 429 (`Retry-After`), seamless token refresh logic.
   - Playlist support: Full CRUD (`/me/playlists`, `/playlists/{id}`, `/playlists/{id}/tracks`).
   - Track searching & ISRC matching: `/search?q=isrc:{isrc}&type=track` and `/search?q=track:{title}%20artist:{artist}&type=track`.

2. **`@spotify/web-api-ts-sdk` (Candidate)**
   - Official TypeScript SDK from Spotify team.
   - Advantages: Typed models.
   - Disadvantages: Frequent breaking changes with Node ESM vs Browser Bundlers, bundling issues with polyfills.

### Selected Solution for Spotify
Custom high-performance TypeScript client using standard `fetch` with automated token refresh, rate-limit retry (`Retry-After` header), and comprehensive DTO validation.

---

## 2. Apple Music API & MusicKit Research

### Evaluated Approaches
1. **Apple MusicKit API + Developer Token & Music User Token (Selected)**
   - Developer Token: JWT signed using Apple Developer Team ID, Key ID, and MusicKit Private Key (ES256).
   - Music User Token: User authorization token generated via MusicKit JS `MusicKit.getInstance().authorize()`.
   - Endpoint Base: `https://api.music.apple.com/v1`
   - Key Endpoints:
     - User Storefront: `GET /v1/me/storefront`
     - User Playlists: `GET /v1/me/library/playlists`
     - Playlist Tracks: `GET /v1/me/library/playlists/{id}/tracks`
     - Search Catalog: `GET /v1/catalog/{storefront}/search?term={query}&types=songs`
     - Create Library Playlist: `POST /v1/me/library/playlists`
     - Add Tracks: `POST /v1/me/library/playlists/{id}/tracks`
   - Advantages: Compliant with Apple Developer Guidelines, supports direct library manipulation and ISRC catalog search (`/v1/catalog/{storefront}/songs?filter[isrc]={isrc}`).

---

## 3. Architecture & Integration Plan

1. **OAuth & Token Persistence**:
   - In-memory & cookie-backed/session storage for authenticated users with encryption at rest.
   - Automatic refresh token rotation for Spotify.
2. **Real Data Ingestion**:
   - `spotifyService.ts`: Real calls to Spotify Web API for user profile, playlists, tracks, catalog search, playlist creation, track addition/deletion.
   - `appleMusicService.ts`: Real calls to Apple Music API with MusicKit JS integration.
3. **Execution Engine**:
   - `transferEngine.ts`: Real end-to-end matching and transfer.
   - `duplicateEngine.ts`: Real duplicate scanning and removal via platform APIs.
   - `organizerEngine.ts`: Real artist extraction and migration.
   - `mergeEngine.ts`: Real multi-playlist merge.
