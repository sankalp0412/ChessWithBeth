import api from "./api";  // Import the Axios instance

// Define a TypeScript type for the API response
interface StartGameResponse {
  message: string; // Optional field
}

interface moveResponse {
  message: string,
  user_move: string,
  stockfish_move: string,
  board_fen: string,
}
interface endGameResponse {
  message: string
}
// Function to start a game
export const startGame = async (userElo: number): Promise<StartGameResponse> => {
  try {
    const response = await api.post<StartGameResponse>(`/start_game/?user_elo=${userElo}`);
    return response.data;
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;  // Ensure error is handled by caller
  }
};


export const playUserMove = async (userMove: string): Promise<moveResponse> => {
  try {
    const response = await api.post<moveResponse>("/play_move/", { move: userMove });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error playing user move:", error);
    throw error;
  }
}

export const endGame = async(): Promise<endGameResponse> => {
  try {
    const response = await api.post<endGameResponse>("/end_game/");
    return response.data;
  } catch (error) {
    console.error("Error ending game:", error);
    throw error;
  }
}