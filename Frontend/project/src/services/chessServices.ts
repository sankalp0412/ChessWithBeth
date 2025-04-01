import api from "./api";  // Import the Axios instance

// Define a TypeScript type for the API response
interface StartGameResponse {
  message: string; // Optional field
  game_id: string
}

interface moveResponse {
  message: string,
  user_move: string,
  stockfish_move: string,
  stockfish_san: string,
  board_fen: string,
  game_id: string,
  is_game_over: boolean,
  winner: string
}
interface endGameResponse {
  message: string
}

interface undoMoveResponse {
  message: string,
  board_fen_after_undo: string,
  game_id: string
}

interface voiceToSanResponse {
  message: string,
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


export const playUserMove = async (userMove: string, game_id: string): Promise<moveResponse> => {
  try {
    const response = await api.post<moveResponse>(`/play_move/?game_id=${game_id}`, { move: userMove });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error playing user move:", error);
    throw error;
  }
}

export const endGame = async(game_id: string): Promise<endGameResponse> => {
  try {
    const response = await api.post<endGameResponse>(`/end_game/?game_id=${game_id}`);
    return response.data;
  } catch (error) {
    console.error("Error ending game:", error);
    throw error;
  }
}


export const undoMove = async(game_id: string): Promise<undoMoveResponse> => {
  try{
    const response = await api.post<undoMoveResponse>(`/undo_move/?game_id=${game_id}`);
    return response.data;
  }
  catch (error) {
    console.error("Error undoing move:", error);
    throw error;
  }
}

export const voiceToSan = async(voiceText: string, game_id: string): Promise<voiceToSanResponse> => {
  try{
    const response = await api.post<voiceToSanResponse>(`/voice_to_move_san/?user_input=${voiceText}&game_id=${game_id}`);
    return response.data;
  }
  catch (error) {
    console.error("Error converting voice to SAN:", error);
    throw error;
  }
}