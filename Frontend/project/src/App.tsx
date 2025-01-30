import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Mic, MicOff, PlayCircle, XCircle, RotateCcw, Clock, Trophy } from 'lucide-react';
import { startGame, playUserMove } from "./services/chessServices";


function App() {
  const [game, setGame] = useState(new Chess());
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  async function makeStockfishMove(updatedFen: string) {
    const gameCopy = new Chess(updatedFen);
    setGame(gameCopy);
  }
  async function makeAMove(move: { from: string; to: string; promotion?: string }) {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      setGame(gameCopy);
      //Now we make API call to backend to play the user move
      // console.log(gameCopy.history()[0]);
      const response = await playUserMove(gameCopy.history({verbose:true})[0].lan);
      // Now we make the stockfish move in the front end using the fen returned by the backend
      const stockfish_move_fen = response.board_fen;
      console.log(response);
      makeStockfishMove(stockfish_move_fen);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
    
    return move !== null;
  }

  const resetGame = () => {
    setGame(new Chess());
    setGameStarted(false);
  };

  const startNewGame = async () => {
    setGameStarted(true);
    //Fetch the ELO rating from the input field
    const userEloRatingElement = document.getElementById('userEloRating') as HTMLInputElement;
    let userEloRating = 1200;
    if (userEloRatingElement.value.length){ 
      userEloRating = parseInt(userEloRatingElement.value);
    }
      //Now we make API call to backend to create chess object new game with stockfish rating as userEloRating
    const response = await startGame(userEloRating);
    console.log(response);
  };

  const quitGame = () => {
    if (window.confirm('Are you sure you want to quit the game?')) {
      resetGame();
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto flex gap-8">
        {/* Chess Board Section */}
        <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">React Chess</h1>
          <div className="aspect-square max-w-2xl mx-auto">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              boardWidth={560}
              customBoardStyle={{
                borderRadius: "4px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
              }}
            />
          </div>
        </div>

        {/* Game Controls Section */}
        <div className="w-80 space-y-6">
          {/* Game Status Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              Game Status
            </h2>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <Clock className="text-blue-500" />
                {game.isGameOver()
                  ? "Game Over!"
                  : `${game.turn() === "w" ? "White" : "Black"}'s turn`}
              </p>
              {game.isCheckmate() && (
                <p className="text-xl font-bold text-red-600">
                  Checkmate! {game.turn() === "w" ? "Black" : "White"} wins!
                </p>
              )}
              {game.isDraw() && (
                <p className="text-xl font-bold text-blue-600">Draw!</p>
              )}
            </div>
          </div>

          {/* Game Controls Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Game Controls
            </h2>
            <div className="space-y-3">
              <button
                onClick={gameStarted ? quitGame : startNewGame}
                className={`w-full py-3 rounded-lg ${
                  gameStarted
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                } text-white font-medium flex items-center justify-center gap-2 transition-colors`}
              >
                {gameStarted ? (
                  <>
                    <XCircle size={20} /> Quit Game
                  </>
                ) : (
                  <>
                    <PlayCircle size={20} /> Start Game
                  </>
                )}
              </button>
              <input
                id='userEloRating'
                type="text"
                className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-800 font-medium"
                placeholder="Enter your ELO rating (default: 1200)"
              ></input>
              <button
                onClick={resetGame}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={20} /> Reset Game
              </button>

              <button
                onClick={toggleVoice}
                className={`w-full py-3 rounded-lg ${
                  isVoiceEnabled
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white font-medium flex items-center justify-center gap-2 transition-colors`}
              >
                {isVoiceEnabled ? (
                  <>
                    <Mic size={20} /> Voice Enabled
                  </>
                ) : (
                  <>
                    <MicOff size={20} /> Voice Disabled
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;