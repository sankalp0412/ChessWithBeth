import {create} from 'zustand'
import { Chess } from 'chess.js'

interface GameStore {
    game: Chess;
    gameId: string,
    gameStarted: boolean,
    isGameOver: boolean;
    setGame: (game: Chess) => void;
    setGameId: (gId: string) => void;
    setGameStarted: (v: boolean) => void;
    setIsGameOver: (v: boolean) => void;
  }

const useGameStore = create<GameStore>((set) => ({
    game: new Chess(),
    gameId: "",
    gameStarted: false,
    isGameOver: false,

    setGameId: (gId) => set({ gameId: gId }),
    setGame: (g: Chess) => set({ game: g }),
    setGameStarted: (v: boolean) => set({ gameStarted: v }),
    setIsGameOver: (v: boolean) => set({ isGameOver: v })
}));
  export default useGameStore;