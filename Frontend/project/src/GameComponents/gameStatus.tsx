import React from "react";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import { Trophy, Clock } from "lucide-react"; // For icons
import useGameStore from "@/hooks/useGameStore";

const GameStatus: React.FC = () => {
  const { game, gameStarted } = useGameStore();
  return (
    <div>
      <motion.div>
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
    </div>
  );
};

export default GameStatus;
