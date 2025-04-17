import GameStatus from "../GameComponents/gameStatus";
import CustomChessboard from "../GameComponents/customChessboard";
import { motion } from "framer-motion";

function App() {
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
        className="w-full max-w-7xl"
      >
        <div className="mb-8 flex flex-row justify-between items-start">
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Chess with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              BETH
            </span>
          </h1>
          <div className="mt-2">
            <GameStatus />
          </div>
        </div>

        <div className="w-full">
          <CustomChessboard />
        </div>
      </motion.div>
    </div>
  );
}

export default App;
