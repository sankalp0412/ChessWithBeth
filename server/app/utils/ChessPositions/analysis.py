import pandas as pd
import numpy as np
import os

# Get current file's directory
current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, 'positions.csv')

chess_df = pd.read_csv(file_path)
print(chess_df.iloc[0])

# fetch out fen, score mate, opening.

  