import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import ChatWidget from "./chatWidget";
import { ResizablePanelGroup } from "@/components/ui/resizable";

// Define the props interface
interface GameControlsProps {
  setGameStarted: React.Dispatch<React.SetStateAction<boolean>>;
  gameStarted: boolean;
  isGameOver: boolean;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
}

function GameControls({
  setGameStarted,
  gameStarted,
  isGameOver,
  setIsGameOver,
}: GameControlsProps) {
  const [openAIChat, setOpenAIChat] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
    setIsGameOver(false);
    console.log("GAme STarted");
    //Handle elo TODO:
  };

  const handleQuitGame = () => {
    setGameStarted(false);
    setIsGameOver(false);
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
            <Button
              disabled={isGameOver}
              className="w-full"
              variant="secondary"
            >
              Takeback
            </Button>
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
            <div className="relative bottom-0 right-0">
              <ChatWidget />
            </div>
          </motion.div>
        )}
        {/* </ResizablePanelGroup> */}
      </AnimatePresence>
    </motion.div>
  );
}

export default GameControls;
