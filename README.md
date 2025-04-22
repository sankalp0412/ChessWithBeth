# Chess with Beth

## About
Chess with Beth is an interactive chess platform that combines voice command functionality with an AI chess assistant named Beth. Inspired by "The Queen's Gambit," this project introduces us to an AI assistant "Beth", named after the the chess prodigy protagonist Beth Harmon.

It makes chess more accessible and engaging while providing real-time position analysis and advice from an AI chess master. Just like the fictional Beth Harmon, our AI assistant analyzes chess positions with remarkable skill and offers grandmaster-level advice.

## Try It Out
[Checkout the project](https://chess-with-beth.vercel.app/) ♟️ 🚀

## Features
- Play chess using natural voice commands ("pawn to e4", "knight to c3", etc.)
- AI assistant "Beth" that analyzes your position and suggests optimal moves
- Real-time board visualization
- Game state tracking and legal move validation
- Sound effects for moves, captures, and special events
- Support for castling, en passant, and other special chess rules

## Technologies Used
- **Frontend**: React, TypeScript, Tailwind CSS, Vite, Zustand, ShadCN
- **Backend**: FastAPI (Python), MongoDB, Redis, DIFY 
- **Chess Logic**: Stockfish, chess.js and python-chess
- **Voice Recognition**: Web Speech API, DIFY
- **AI Assistant**: Google Gemini LLM integration using DIFY for position analysis

## My Learnings
- **Microservices Architecture**: Designed a full-stack application with Docker containerization for both frontend and backend services, orchestrated with Docker Compose
- **React TypeScript Frontend**: Implemented a type-safe frontend using React 18, TypeScript, and Vite with advanced UI components from Radix UI and ShadCN
- **State Management**: Used Zustand for global state management with optimized re-rendering patterns for chess game state and UI controls
- **Real-time Voice Processing**: Integrated Web Speech API and react-speech-recognition to process natural language chess commands with real-time feedback
- **FastAPI Backend**: Built a high-performance Python backend with FastAPI utilizing asynchronous request handling and Pydantic for data validation
- **Chess Engine Integration**: Interfaced with Stockfish engine (via python-stockfish) and chess.js for move validation, position analysis, and legal move generation
- **Database Architecture**: Designed a multi-database solution with MongoDB (via motor) for persistent storage and Redis for high-speed caching of game states
- **LLM Integration**: Connected Google Gemini LLM through DIFY API to provide contextual chess analysis and natural language responses
- **Query Management**: Implemented efficient data fetching patterns with TanStack React Query for optimistic updates and caching
- **Animation and UI/UX**: Created smooth transitions and interactive elements with Framer Motion and tailwindcss-animate for enhanced user experience

## Ask Beth for help anytime during your game - she'll analyze your position and suggest the best tactics like having a grandmaster by your side!


##UI

<img width="1427" alt="image" src="https://github.com/user-attachments/assets/9e4add34-d262-4e80-a58e-acdfb883c705" />

<img width="1407" alt="image" src="https://github.com/user-attachments/assets/37a2f094-e06b-4bd5-b59f-6907bf1962c1" />


<img width="1387" alt="image" src="https://github.com/user-attachments/assets/4bd8aabd-196b-4f67-95fb-be97bb2fd139" />


<img width="1371" alt="image" src="https://github.com/user-attachments/assets/7af388fd-84f9-4b3e-98dd-5551a5b9be13" />







