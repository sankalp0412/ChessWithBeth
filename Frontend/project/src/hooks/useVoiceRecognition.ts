import { useState, useRef } from "react";

export function useVoiceRecognition(
  onCommandProcessed: (command: string) => void
) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isVoiceCaptured, setIsVoiceCaptured] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const debounce = (func, delay: number) => {
    let timer;
    return (...args: Parameters<typeof func>) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const processTranscript = debounce((text: string) => {
    // console.log("Processing transcript:", text);
    if (text) {
      processCommand(text); // Pass the command to the parent component
    } else {
      setIsVoiceCaptured(false);
    }
  }, 1000);

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    try {
      await onCommandProcessed(command);
    } finally {
      setIsProcessing(false);
    }
  };

  const initializeRecognition = () => {
    if (!window.webkitSpeechRecognition) {
      console.log("Speech Recognition is not supported in your browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.continuous = true;

    // Add chess grammar
    if ("webkitSpeechGrammarList" in window) {
      const grammar = `
        #JSGF V1.0; grammar chess; public <chess> =
        a | b | c | d | e | f | g | h | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 
        knight | rook | bishop | queen | king | pawn | castle | kingside | queenside |
        the | on | capture | check | checkmate | takes | draw | resign | undo | restart | quit;
      `;
      const speechRecognitionList = new window.webkitSpeechGrammarList();
      speechRecognitionList.addFromString(grammar, 1);
      recognition.grammars = speechRecognitionList;
    }

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }

      setTranscript(finalText);
      setInterimTranscript(interimText);
      processTranscript(finalText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setIsVoiceEnabled(false);
    };

    recognition.start();
    setIsVoiceEnabled(true);
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      initializeRecognition();
    } else {
      if (isVoiceEnabled) {
        recognitionRef.current.stop();
        setIsVoiceEnabled(false);
        recognitionRef.current = null;
      } else {
        initializeRecognition();
      }
    }
  };

  return {
    isVoiceEnabled,
    transcript,
    interimTranscript,
    isVoiceCaptured,
    isProcessing,
    toggleVoice,
  };
}