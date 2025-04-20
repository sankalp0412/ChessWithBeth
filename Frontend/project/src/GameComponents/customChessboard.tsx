/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Square, Move } from "chess.js";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import GameControls from "./gameControls";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayMoveMutation } from "../services/hooks";
import useGameStore, { InitilizeGameStore } from "../hooks/useGameStore";
import { Terminal } from "lucide-react";

const CustomChessboard: React.FC = () => {
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
    // console.log(lastMove);
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
          // console.log(`Played Move: ${data}`);
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

  // /---------------------------------------- use Effects --------------------------
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

    // Check if difyVoiceMove is a valid move
    if (!game.moves().includes(difyVoiceMove)) {
      // console.error("Invalid move:", difyVoiceMove);
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
  return (
    <div>
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
                // arePremovesAllowed={true}
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
                          Sorry, there was an error while starting game, please
                          try again later.
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
    </div>
  );
};

export default CustomChessboard;
