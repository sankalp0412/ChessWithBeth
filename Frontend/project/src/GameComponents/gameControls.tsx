import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import ChatWidget from "./chatWidget";
import {
  useStartGameMutation,
  useEndGameMutation,
  useUndoMoveMutation,
} from "@/services/hooks";
import { Chess } from "chess.js";
// Define the props interface
interface GameControlsProps {
  setGameStarted: React.Dispatch<React.SetStateAction<boolean>>;
  gameStarted: boolean;
  isGameOver: boolean;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  gameIdRef: React.MutableRefObject<string>;
  game: Chess;
  setGame: React.Dispatch<React.SetStateAction<Chess>>;
}

function GameControls({
  setGameStarted,
  gameStarted,
  isGameOver,
  setIsGameOver,
  gameIdRef,
  game,
  setGame,
}: GameControlsProps) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const { mutate: startGame } = useStartGameMutation();
  const { mutate: endGame } = useEndGameMutation();
  const { mutate: undoMove } = useUndoMoveMutation();

  const handleStartGame = () => {
    setGameStarted(true);
    setIsGameOver(false);
    console.log("GAme STarted");
    const audio = new Audio("sounds/game-start.mp3");
    audio.play().catch((e) => {
      console.warn("Autoplay blocked:", e);
    });
    const userEloRatingElement = document.getElementById(
      "userEloRating"
    ) as HTMLInputElement;
    let userEloRating = 1200; //default
    if (userEloRatingElement && userEloRatingElement.value.length) {
      userEloRating = parseInt(userEloRatingElement.value);
    }
    startGame(userEloRating, {
      onSuccess: (data) => {
        console.log("Game started successfully:", data);
        gameIdRef.current = data.game_id;
      },
      onError: (error) => {
        console.error("Error starting game:", error);
      },
    });
  };

  const handleQuitGame = () => {
    setGameStarted(false);
    setIsGameOver(false);
    const audio = new Audio("sounds/game-end.mp3");
    audio.play().catch((e) => {
      console.warn("Autoplay blocked:", e);
    });

    endGame(gameIdRef.current, {
      onSuccess: (data) => {
        console.log(
          `Game with game ID: ${gameIdRef.current} ended successfully: ${data}`
        );
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

    undoMove(gameIdRef.current, {
      onSuccess: (data) => {
        console.log(`TakeBack Completed: ${data}`);
      },
      onError: (error) => {
        console.error(`Error while takeback:${error}`);
      },
    });
  };
  const handleVoiceCommands = () => {
    setIsVoiceEnabled((prev) => !prev);
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
              placeholder="Add your ELO (Default 1200)"
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
              onClick={handleVoiceCommands}
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
          </motion.div>
        )}
        {/* </ResizablePanelGroup> */}
      </AnimatePresence>
    </motion.div>
  );
}

export default GameControls;
