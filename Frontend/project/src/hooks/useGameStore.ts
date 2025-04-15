import {create} from 'zustand'
import { Chess } from 'chess.js'

interface GameStore {
    game: Chess;
    setGame: (game: Chess) => void;
    gameId: string,
    setGameId: (gId: string) => void;
  }

const useGameStore = create<GameStore>((set) => ({
    game: new Chess(),
    setGame: (g: Chess) => set({ game: g }),
    gameId: "",
    setGameId:(gId) => set({gameId: gId})
  }));
  export default useGameStore;