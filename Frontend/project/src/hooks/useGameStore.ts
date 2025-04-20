import { create } from 'zustand'
import { Chess, Move } from 'chess.js'
import { persist } from 'zustand/middleware'
import { endGame } from '@/services/chessServices'

interface GameState {
  game: Chess;
  gameId: string;
  gameStarted: boolean;
  isGameOver: boolean;
  createdAt: number;
  lastActivity: number;
}


interface GameStore extends GameState {
  setGame: (game: Chess) => void;
  setGameId: (gId: string) => void;
  setGameStarted: (v: boolean) => void;
  setIsGameOver: (v: boolean) => void;
  updateLastActivity: () => void;
  resetGame: () => void
}

const initialState: GameState = {
  game: new Chess(),
  gameId: "",
  gameStarted: false,
  isGameOver: false,
  createdAt: Date.now(),
  lastActivity: Date.now()
}

const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      setGameId: (gId) => set({
        gameId: gId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      }),

      setGame: (g: Chess) => set({
        game: g,
        lastActivity: Date.now()
      }),

      setGameStarted: (v: boolean) => set({
        gameStarted: v,
        lastActivity: Date.now()
      }),

      setIsGameOver: (v: boolean) => set({
        isGameOver: v,
        lastActivity: Date.now()
      }),

      updateLastActivity: () => set({
        lastActivity: Date.now()
      }),

      resetGame: () => set(initialState)
    }),
    {
      name: 'chess-game-storage',
      partialize: (state) => ({
        gameId: state.gameId,
        gameStarted: state.gameStarted,
        isGameOver: state.isGameOver,
        createdAt: state.createdAt,
        lastActivity: state.lastActivity,

        //Store fen and set of moves History:
        fenPos: state.game.fen(),
        moveHistory: state.game.history()
      })
    }
  )
)

const hydrateStore = () => {
  const storedState = JSON.parse(localStorage.getItem('chess-game-storage') || '{}');

  if (storedState && storedState.state) {
    const { fenPos, moveHistory, gameId, gameStarted , isGameOver} = storedState.state;

    if (fenPos) {
      //Create game
      const game = new Chess()
      try {
        moveHistory.forEach((move: Move) => {
          game.move(move)
        })
      }
      catch (error) {
        console.error(`Failed to load saved position: ${error}`)
      }

      useGameStore.setState({game: game, gameId: gameId, gameStarted: gameStarted,isGameOver:isGameOver })
    }
  }
}


export const InitilizeGameStore = () => {
  hydrateStore();
  //Check for old games 
  const state = useGameStore.getState()
  const oneHourAgo = Date.now() - 60 * 30 * 1000 //close stale games after half an hour of inactivity

  if(state.gameStarted && state.lastActivity < oneHourAgo){
    //detel this game
    cleaupOldGame(state.gameId);
    useGameStore.setState(initialState)
  }

}

export const cleaupOldGame = async (gameId: string) =>  {
  if (!gameId) return;


  try{
    const response = await endGame(gameId)
    console.log(`Stale game ended : ${response}`)
  }
  catch(error) {
    console.error(`Error while ending stale game: ${error}`)
  }
}
 
export default useGameStore;