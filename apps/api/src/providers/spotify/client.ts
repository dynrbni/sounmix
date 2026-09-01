export class SpotifyApiClient {
  constructor(private token: string) {}
  async getPlaylist(id: string) { return { id, name: 'Demo Playlist' } }
}
