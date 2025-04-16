import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import ChatWidget from "./chatWidget";
import {
  useStartGameMutation,
  useEndGameMutation,
  useUndoMoveMutation,
  useVoiceToSanMutation,
} from "@/services/hooks";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"; // Import shadcn Alert
import useGameStore from "@/hooks/useGameStore";
// Define the props interface
interface GameControlsProps {
  errorStartingGame: boolean;
  setErrorStartingGame: React.Dispatch<React.SetStateAction<boolean>>;
  difyVoiceMove: string;
  setDifyVoiceMove: React.Dispatch<React.SetStateAction<string>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}

function GameControls({
  setErrorStartingGame,
  errorMessage, // Use errorMessage from props
  setErrorMessage,
  setDifyVoiceMove,
}: GameControlsProps) {
  const { mutate: startGame } = useStartGameMutation();
  const { mutate: endGame } = useEndGameMutation();
  const { mutate: undoMove } = useUndoMoveMutation();
  const { mutate: voiceToSan } = useVoiceToSanMutation();
  const {
    game,
    setGame,
    gameId,
    setGameId,
    gameStarted,
    setGameStarted,
    isGameOver,
    setIsGameOver,
  } = useGameStore();

  const [currentTranscript, setCurrentTranscript] = useState<string | null>(
    null
  ); // To store the transcript
  const [isMoveProcessing, setIsMoveProcessing] = useState(false);

  // ------------ Voice ------------------------

  const { isVoiceEnabled, toggleVoice, interimTranscript, isProcessing } =
    useVoiceRecognition((command) => {
      console.log("Voice command received:", command);
      setCurrentTranscript(command); // Set the transcript in the alert
      setIsMoveProcessing(true); // Show loading state

      voiceToSan(
        { voiceText: command, game_id: gameId },
        {
          onSuccess: (response) => {
            const dify_response = response.message;
            if (dify_response === "UNDO") {
              handleTakeback();
            } else if (dify_response === "RESET") {
              handleQuitGame();
            } else if (dify_response === "ILLEGAL") {
              console.log("Illegal Move :", dify_response);
              setErrorMessage("Illegal move. Please try again.");
            } else {
              console.log("Move to play :", dify_response);
              setErrorMessage(""); // Clear any previous error
              setDifyVoiceMove("");
              setDifyVoiceMove(dify_response);
            }
            setIsMoveProcessing(false); // Hide loading state
            setCurrentTranscript(null); // Clear the transcript after processing
          },
          onError: (error) => {
            console.error(`Error while Getting response from dify : ${error}`);
            setIsMoveProcessing(false); // Hide loading state
            setCurrentTranscript(null); // Clear the transcript
          },
        }
      );
    });

  // ---------------------------------- Game Actions -----------------------------------

  const handleStartGame = () => {
    const userEloRatingElement = document.getElementById(
      "userEloRating"
    ) as HTMLInputElement;
    let userEloRating = 1320; // default

    if (userEloRatingElement && userEloRatingElement.value.trim().length) {
      const inputElo = parseInt(userEloRatingElement.value, 10);

      // Validate input ELO
      if (!isNaN(inputElo) && inputElo >= 1320 && inputElo <= 3190) {
        userEloRating = inputElo;
      } else {
        console.warn("Invalid ELO input. Using default value of 1320.");
      }
    }

    startGame(userEloRating, {
      onSuccess: (data) => {
        const audio = new Audio("sounds/game-start.mp3");
        audio.play().catch((e) => {
          console.warn("Autoplay blocked:", e);
        });
        setGameStarted(true);
        setIsGameOver(false);
        setErrorStartingGame(false);
        setGameId(data.game_id);

        useGameStore.getState().updateLastActivity();
      },
      onError: (error) => {
        setErrorStartingGame(true);
        console.error("Error starting game:", error);
      },
    });
  };

  const handleQuitGame = () => {
    setGameStarted(false);
    setIsGameOver(false);

    endGame(gameId, {
      onSuccess: (data) => {
        console.log(`Game with game ID: ${gameId} ended successfully: ${data}`);
        const audio = new Audio("sounds/game-end.mp3");
        audio.play().catch((e) => {
          console.warn("Autoplay blocked:", e);
        });

        useGameStore.getState().resetGame();
      },
      onError: (error) => {
        console.error(`Error ending game : ${error}`);
      },
    });
  };

  const handleTakeback = () => {
    //Undo stockfish move
    game.undo();
    //Undo user move
    game.undo();

    const updatedGame = Object.assign(
      Object.create(Object.getPrototypeOf(game)),
      game
    );
    setGame(updatedGame);
    const audio = new Audio("/sounds/move-self.mp3");
    audio.play().catch((e) => {
      console.warn("Autoplay blocked:", e);
    });

    //API Call

    undoMove(gameId, {
      onSuccess: (data) => {
        console.log(`TakeBack Completed: ${data}`);
      },
      onError: (error) => {
        console.error(`Error while takeback:${error}`);
      },
    });
  };

  return (
    <motion.div className="space-y-4">
      <AnimatePresence>
        {!gameStarted && (
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.3 } }}
          >
            <Input
              placeholder="Add your ELO (Default/Minimum 1320)"
              className="text-white flex-1 min-w-[200px]"
              id="userEloRating"
            />
            <Button
              className="flex-1 min-w-max"
              variant="secondary"
              onClick={handleStartGame}
            >
              New Game
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {/* <ResizablePanelGroup direction="horizontal" className=""> */}
        {gameStarted && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
          >
            {game.history({ verbose: true }).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              >
                <Button
                  disabled={isGameOver}
                  className="w-full"
                  variant="secondary"
                  onClick={handleTakeback}
                >
                  Takeback
                </Button>
              </motion.div>
            )}

            <Button
              className={`w-full py-3 rounded-lg ${
                isVoiceEnabled
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-500 hover:bg-gray-600"
              } text-white font-medium flex items-center justify-center gap-2 transition-colors`}
              variant="secondary"
              onClick={() => {
                toggleVoice();
                setErrorMessage("");
              }}
              disabled={isGameOver}
            >
              {isVoiceEnabled ? (
                <>
                  <Mic size={20} /> Disable Voice
                </>
              ) : (
                <>
                  <MicOff size={20} /> Enable Voice
                </>
              )}
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleQuitGame}
            >
              {isGameOver ? "Reset" : "Resign"}
            </Button>
            {!isGameOver && (
              <div className="relative bottom-0 right-0">
                <ChatWidget />
              </div>
            )}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Voice Command
              </h2>
              <div className="space-y-3">
                {interimTranscript && !currentTranscript && !errorMessage && (
                  <Alert variant="default">
                    <AlertTitle>Listening...</AlertTitle>
                    <AlertDescription>
                      <span className="text-gray-600">{interimTranscript}</span>
                    </AlertDescription>
                  </Alert>
                )}
                {currentTranscript && !errorMessage && (
                  <Alert variant="default">
                    <AlertTitle>Processing Command</AlertTitle>
                    <AlertDescription>
                      {isMoveProcessing || isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="loader border-t-2 border-blue-500 rounded-full w-6 h-6 animate-spin"></div>
                          <span className="text-gray-600">
                            {currentTranscript}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600">
                          {currentTranscript}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      <span className="text-red-600">{errorMessage}</span>
                    </AlertDescription>
                  </Alert>
                )}
                {!interimTranscript && !currentTranscript && !errorMessage && (
                  <p className="text-gray-600">Speak a command to start!</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
        {/* </ResizablePanelGroup> */}
      </AnimatePresence>
    </motion.div>
  );
}

export default GameControls;
