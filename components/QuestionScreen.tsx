import React, { useState, useEffect, useCallback } from 'react';
import { TestQuestion } from '../types';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import Spinner from './Spinner';
import { SpeakerIcon } from './IconComponents';

interface QuestionScreenProps {
  question: TestQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSelect: (optionIndex: number) => void;
  onNext: () => void;
  selectedAnswer: number | null;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswerSelect,
  onNext,
  selectedAnswer,
}) => {
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [hasAudioBeenPlayed, setHasAudioBeenPlayed] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when question changes
    setHasAudioBeenPlayed(false);
    setAudioError(null);
  }, [question]);

  const playAudio = useCallback(async () => {
    setIsFetchingAudio(true);
    setAudioError(null);
    try {
      const base64Audio = await generateSpeech(question.question, question.voice);
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContext.destination);
      source.start();
      source.onended = () => {
        setHasAudioBeenPlayed(true);
      };
    } catch (err) {
      console.error(err);
      setAudioError("Couldn't play audio. Please try again.");
    } finally {
      setIsFetchingAudio(false);
    }
  }, [question.question, question.voice]);

  return (
    <div className="flex flex-col h-full">
      <div className="text-right text-slate-400 mb-4">
        Question {questionNumber} / {totalQuestions}
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center">
        {!hasAudioBeenPlayed && (
            <button
            onClick={playAudio}
            disabled={isFetchingAudio}
            className="flex items-center justify-center w-32 h-32 bg-blue-600 rounded-full text-white shadow-lg transition-transform transform hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
            {isFetchingAudio ? <Spinner /> : <SpeakerIcon className="w-16 h-16" />}
            </button>
        )}
        
        {audioError && <p className="text-red-400 mt-4">{audioError}</p>}

        {hasAudioBeenPlayed && (
          <div className="w-full animate-fade-in">
            <p className="text-center text-slate-300 mb-6">Select the best response:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                return (
                  <button
                    key={index}
                    onClick={() => onAnswerSelect(index)}
                    className={`p-4 rounded-lg text-left transition-all border-2
                      ${isSelected 
                        ? 'bg-blue-500 border-blue-400 text-white' 
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'}`
                    }
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + index)}. </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onNext}
          disabled={selectedAnswer === null}
          className="w-full md:w-auto px-10 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {questionNumber === totalQuestions ? 'Show Results' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default QuestionScreen;