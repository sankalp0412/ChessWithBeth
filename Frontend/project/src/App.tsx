import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Mic, MicOff, PlayCircle, XCircle, RotateCcw, Clock, Trophy } from 'lucide-react';

function App() {
  const [game, setGame] = useState(new Chess());
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  function makeAMove(move: { from: string; to: string; promotion?: string }) {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      setGame(gameCopy);
      return result;
    } catch (error) {
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

  const startGame = () => {
    setGameStarted(true);
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
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
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
                  : `${game.turn() === 'w' ? "White" : "Black"}'s turn`}
              </p>
              {game.isCheckmate() && (
                <p className="text-xl font-bold text-red-600">
                  Checkmate! {game.turn() === 'w' ? "Black" : "White"} wins!
                </p>
              )}
              {game.isDraw() && (
                <p className="text-xl font-bold text-blue-600">Draw!</p>
              )}
            </div>
          </div>

          {/* Game Controls Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Game Controls</h2>
            <div className="space-y-3">
              <button
                onClick={gameStarted ? quitGame : startGame}
                className={`w-full py-3 rounded-lg ${
                  gameStarted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
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
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-500 hover:bg-gray-600'
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