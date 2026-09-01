import { useState } from 'react'
export function usePlaylists() {
  const [playlists, setPlaylists] = useState([])
  return { playlists, loading: false }
}
