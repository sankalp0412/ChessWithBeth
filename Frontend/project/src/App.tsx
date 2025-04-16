/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Square, Move } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";
import GameControls from "./GameComponents/gameControls";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePlayMoveMutation } from "./services/hooks";
import useGameStore, { InitilizeGameStore } from "./hooks/useGameStore";

function App() {
  const [showChessboard, setShowChessboard] = useState(false);
  const { game, setGame, gameId, gameStarted, setIsGameOver } = useGameStore();
  const [squareStyles, setSquareStyles] = useState({});
  const [alertGameNotStarted, setAlertGameNotStarted] = useState(false);
  const [errorStartingGame, setErrorStartingGame] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [difyVoiceMove, setDifyVoiceMove] = useState("");

  const { mutate: playUserMove, isPending } = usePlayMoveMutation();

  const resetSquareStyles = () => {
    setSquareStyles({});
  };

  const getMergedSquareStyles = () => {
    const checkStyles = getCustomSquareStyleInCheck();
    const lastMoveStyle = highlightLastMove();
    return { ...squareStyles, ...checkStyles, ...lastMoveStyle };
  };

  const getCustomSquareStyleInCheck = () => {
    if (!game.isCheck()) {
      return {}; // No check, return empty styles
    }

    const currentPlayerColor = game.turn(); // 'w' or 'b'
    let kingSquare = "";

    // Loop through all squares to find the current player's king
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    for (let rank = 1; rank <= 8; rank++) {
      for (const file of files) {
        const square = `${file}${rank}` as Square;
        const piece = game.get(square);
        if (piece?.type === "k" && piece.color === currentPlayerColor) {
          kingSquare = square;
          break;
        }
      }
      if (kingSquare) break; // Exit loop early if king is found
    }

    // Highlight the king's square in red
    return kingSquare
      ? {
          [kingSquare]: {
            backgroundColor: "rgba(255, 0, 0, 0.4)", // Semi-transparent red
          },
        }
      : {};
  };

  const highlightLastMove = () => {
    const moveStack = game.history({ verbose: true });

    if (moveStack.length === 0) return {};
    const lastMove = moveStack[moveStack.length - 1];
    console.log(lastMove);
    return {
      [lastMove.from as Square]: {
        backgroundColor: "rgba(182, 79, 79, 0.3)",
      },
      [lastMove.to as Square]: {
        backgroundColor: "rgba(249, 2, 2, 0.4)",
      },
    };
  };

  // -------------------------------------------- Game Actions --------------------------------
  const playSound = (game: Chess, result: Move) => {
    if (game.isCheckmate()) {
      const audio1 = new Audio("sounds/move-check.mp3");
      const audio2 = new Audio("sounds/game-end.mp3");
      audio1.play();
      audio2.play();
    } else if (game.isCheck()) {
      const audio = new Audio("sounds/move-check.mp3");
      audio.play();
    } else if (result.flags == "c") {
      const audio = new Audio("/sounds/capture.mp3");
      audio.play().catch((e) => {
        console.warn("Autoplay blocked:", e);
      });
    } else if (result.flags == "k" || result.flags == "q") {
      const audio = new Audio("/sounds/castle.mp3");
      audio.play().catch((e) => {
        console.warn("Autoplay blocked:", e);
      });
    } else {
      const audio = new Audio("/sounds/move-self.mp3");
      audio.play().catch((e) => {
        console.warn("Autoplay blocked:", e);
      });
    }
  };

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (!gameStarted) {
      setAlertGameNotStarted(true);
      return false;
    } //trigger alert
    setAlertGameNotStarted(false);
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
    resetSquareStyles(); // Reset square styles after move if color changed
    return move !== null;
  }
  const makeAMove = (
    move: string | { from: string; to: string; promotion?: string }
  ) => {
    const result = game.move(move);
    if (!result) return null;

    playSound(game, result);

    const updatedGame = game;
    setGame(updatedGame);

    if (game.isGameOver()) {
      setIsGameOver(true);
    }
    playUserMove(
      { userMove: result.san, game_id: gameId },
      {
        onSuccess: (data) => {
          console.log(`Played Move: ${data}`);
          if (data.is_game_over) {
            setIsGameOver(true);
            useGameStore.getState().updateLastActivity();
          }
          playStockFishMove(data.stockfish_san);
        },
        onError: (error) => {
          console.error(`Error while playing move: ${error}`);
        },
      }
    );
  };

  const playStockFishMove = (stockfish_san: string) => {
    const result = game.move(stockfish_san);
    if (!result) return null;

    playSound(game, result);

    const updatedGame = game;
    setGame(updatedGame);

    if (game.isGameOver()) {
      setIsGameOver(true);
    }
  };

  // ----------- UseEffects ---------------------------------------
  useEffect(() => {
    //Handle reset if Quit game was inititaed
    if (gameStarted) return;
    setGame(new Chess());

    // TODO: ADD API call to end game and game id update

    const userEloRatingElement = document.getElementById(
      "userEloRating"
    ) as HTMLInputElement;
    if (userEloRatingElement) userEloRatingElement.value = "";
    // setMoveHistory([]);
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;
    setAlertGameNotStarted(false);
  }, [gameStarted]);

  //Use effect to make Dify voice move on board

  useEffect(() => {
    if (!difyVoiceMove) return;
    console.log(game.moves());
    console.log("Dify Voice move in useEffect:", difyVoiceMove);

    // Check if difyVoiceMove is a valid move
    if (!game.moves().includes(difyVoiceMove)) {
      console.error("Invalid move:", difyVoiceMove);
      setErrorMessage("Illegal move. Please try again."); // Set error message
      return;
    }

    setErrorMessage(""); // Clear any previous error
    makeAMove(difyVoiceMove);
  }, [difyVoiceMove]);

  //Use effect for Reloading old game state

  useEffect(() => {
    InitilizeGameStore();
  }, []);

  // ---------------------------------- UI Data--------------------------------------

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        layout="position"
        transition={{
          duration: 1,
          ease: "easeOut",
          layout: {
            duration: 0.8,
            type: "tween",
          },
        }}
        className={`mb-8
          ${
            gameStarted
              ? "flex flex-row justify-between w-[1250px]"
              : "text-center"
          } 
          `}
      >
        <div>
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Chess with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              BETH
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Your AI-powered chess companion with voice controls
          </p>

          {!showChessboard && (
            <Button
              onClick={() => setShowChessboard(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 rounded-lg text-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              Start Playing
            </Button>
          )}
        </div>
        <AnimatePresence>
          {gameStarted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ duration: 0.8, ease: "easeIn", layout: true }}
              className="flex flex-col"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="text-yellow-500" />
                  <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Game Status
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="text-blue-500" />
                  <p className="text-lg font-medium text-gray-300">
                    {game.isGameOver()
                      ? "Game Over!"
                      : `${game.turn() === "w" ? "White" : "Black"}'s turn`}
                  </p>
                </div>

                {game.isCheckmate() && (
                  <p className="text-xl font-bold text-red-600">
                    Checkmate! {game.turn() === "w" ? "Black" : "White"} wins!
                  </p>
                )}

                {game.isDraw() && (
                  <p className="text-xl font-bold text-blue-600">Draw!</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showChessboard && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-7xl"
          >
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[600px] rounded-lg border border-gray-700"
            >
              <ResizablePanel defaultSize={50} minSize={50}>
                <Card className="relative h-full bg-gray-800/50 ">
                  <div className="flex items-center justify-center h-full p-6 border-gray-700">
                    <Chessboard
                      position={game.fen()}
                      boardWidth={600}
                      onPieceDrop={onDrop}
                      customSquareStyles={getMergedSquareStyles()}
                      customBoardStyle={{
                        borderRadius: "8px",
                        boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.2)",
                      }}
                      customDarkSquareStyle={{ backgroundColor: "#8363aa" }}
                      customLightSquareStyle={{ backgroundColor: "#EDE7F6" }}
                      arePremovesAllowed={true}
                      onSquareClick={() => resetSquareStyles()}
                    />
                  </div>
                </Card>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={28}>
                <Card className="h-full bg-gray-800/50 backdrop-blur-sm border-gray-700">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold  text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 ">
                      Game Controls
                    </h2>
                    <div className="mb-4">
                      <GameControls
                        errorStartingGame={errorStartingGame}
                        setErrorStartingGame={setErrorStartingGame}
                        setDifyVoiceMove={setDifyVoiceMove}
                        difyVoiceMove={difyVoiceMove}
                        errorMessage={errorMessage}
                        setErrorMessage={setErrorMessage}
                      />
                      <AnimatePresence>
                        {alertGameNotStarted && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            exit={{ opacity: 0, y: 10 }}
                          >
                            <Alert className="my-4" variant="destructive">
                              <Terminal className="h-4 w-4" />
                              <AlertTitle className="">Heads up!</AlertTitle>
                              <AlertDescription className="text-bold">
                                Click New Game to start Playing!
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {errorStartingGame && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            exit={{ opacity: 0, y: 10 }}
                          >
                            <Alert className="my-4" variant="destructive">
                              <Terminal className="h-4 w-4" />
                              <AlertTitle className="">Heads up!</AlertTitle>
                              <AlertDescription className="text-bold">
                                Sorry, there was an error while starting game,
                                please try again later.
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {isPending && (
                        <motion.div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white absolute bottom-2 right-2"></motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default App;
