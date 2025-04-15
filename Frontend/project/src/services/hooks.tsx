import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  startGame,
  playUserMove,
  endGame,
  undoMove,
  voiceToSan,
  aiAnalysis,
} from "../services/chessServices";

export function useStartGameMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["startGame"],
    mutationFn: (userElo: number) => startGame(userElo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game"] });
    },
  });
}

export function usePlayMoveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["playMove"],
    mutationFn: ({
      userMove,
      game_id,
    }: {
      userMove: string;
      game_id: string;
    }) => playUserMove(userMove, game_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moves"] });
    },
  });
}

export function useEndGameMutation() {
  return useMutation({
    mutationKey: ["endGame"],
    mutationFn: (game_id: string) => endGame(game_id),
  });
}

export function useUndoMoveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["undoMove"],
    mutationFn: (game_id: string) => undoMove(game_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moves"] });
    },
  });
}

export function useVoiceToSanMutation() {
  return useMutation({
    mutationKey: ["voiceToSan"],
    mutationFn: ({
      voiceText,
      game_id,
    }: {
      voiceText: string;
      game_id: string;
    }) => voiceToSan(voiceText, game_id),
  });
}

export function useAiAnalysisMutation() {
  return useMutation({
    mutationKey: ["aiAnalysis"],
    mutationFn: ({ game_id }: { game_id: string }) => aiAnalysis(game_id),
  });
}
