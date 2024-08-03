import chess
from inputMove import transcribe_audio

board = chess.Board()
usersMove = transcribe_audio()

print(usersMove)

# if (usersMove not in board.legal_moves):
#     print('Illegal move')
# else:
#     print ('Move Played')
