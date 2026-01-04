import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceInput = ({ onResult, onEnd, disabled }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = false; // Stop after one sentence/pause
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'pt-BR';

        recognitionInstance.onstart = () => {
            setIsListening(true);
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
            if (onEnd) onEnd();
        };

        recognitionInstance.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript && onResult) {
                onResult(transcript);
            }
        };

        recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        setRecognition(recognitionInstance);
    }, [onResult, onEnd]);

    const toggleListening = () => {
        if (!isSupported) {
            alert("Seu navegador não suporta reconhecimento de voz.");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (error) {
                console.error("Error starting speech recognition:", error);
            }
        }
    };

    if (!isSupported) return null;

    return (
        <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`p-2 rounded-full transition-all flex items-center justify-center ${isListening
                ? 'bg-red-100 text-red-600 animate-pulse border border-red-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            title="Digitar por voz"
        >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
    );
};

export default VoiceInput;
