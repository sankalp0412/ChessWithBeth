import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";

// Define the props interface
interface GameControlsProps {
  setGameStarted: React.Dispatch<React.SetStateAction<boolean>>;
  gameStarted: boolean;
}

function GameControls({ setGameStarted, gameStarted }: GameControlsProps) {
  const [openAIChat, setOpenAIChat] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
    console.log("GAme STarted");
    //Handle elo TODO:
  };

  const handleQuitGame = () => {
    setGameStarted(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {!gameStarted && (
          <Input
            placeholder="Add your ELO (Default 1200)"
            className="text-white flex-1 min-w-[200px]"
          ></Input>
        )}
        {!gameStarted && (
          <Button
            className="flex-1 min-w-max"
            variant="secondary"
            onClick={handleStartGame}
          >
            New Game
          </Button>
        )}
      </div>
      {gameStarted && (
        <Button className="w-full" variant="secondary">
          Takeback
        </Button>
      )}
      {gameStarted && (
        <Button
          className="w-full"
          variant="destructive"
          onClick={handleQuitGame}
        >
          Resign
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          setOpenAIChat((current) => !current);
          if (openAIChat) {
            console.log("Opened chat for analysis");
          } else {
            console.log("Closed chat");
          }
        }}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

export default GameControls;
