import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
const Home: React.FC = () => {
  const navigate = useNavigate();
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
        className="mb-8 text-center"
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
        </div>
        <Button
          onClick={() => navigate("/Game")}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 rounded-lg text-lg font-semibold transition-all duration-200 hover:scale-105"
        >
          Start Playing
        </Button>
      </motion.div>
    </div>
  );
};

export default Home;
