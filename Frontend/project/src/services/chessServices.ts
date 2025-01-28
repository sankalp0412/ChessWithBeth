import api from "./api";  // Import the Axios instance

// Define a TypeScript type for the API response
interface StartGameResponse {
  message: string; // Optional field
}

// Function to start a game
export const startGame = async (userElo: number): Promise<StartGameResponse> => {
  try {
    const response = await api.post<StartGameResponse>("/home/start_game/", { user_elo: userElo });
    return response.data;
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;  // Ensure error is handled by caller
  }
};
