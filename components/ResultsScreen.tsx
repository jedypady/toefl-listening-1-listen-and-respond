import React, { useState, useCallback } from 'react';
import { TestQuestion } from '../types';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { CheckIcon, XIcon, SpeakerIcon } from './IconComponents';
import Spinner from './Spinner';

interface ResultsScreenProps {
  questions: TestQuestion[];
  userAnswers: (number | null)[];
  onRestart: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ questions, userAnswers, onRestart }) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [audioErrors, setAudioErrors] = useState<Record<number, string | null>>({});

  const correctAnswersCount = questions.reduce((acc, question, index) => {
    return acc + (userAnswers[index] === question.correctOptionIndex ? 1 : 0);
  }, 0);

  const scorePercentage = Math.round((correctAnswersCount / questions.length) * 100);

  const playAudio = useCallback(async (question: TestQuestion, index: number) => {
    setPlayingIndex(index);
    setAudioErrors(prev => ({...prev, [index]: null}));
    try {
      const base64Audio = await generateSpeech(question.question, question.voice);
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContext.destination);
      source.start();
      source.onended = () => {
         setPlayingIndex(null);
      };
    } catch (err) {
      console.error(err);
      setAudioErrors(prev => ({...prev, [index]: "Couldn't play audio."}));
      setPlayingIndex(null);
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-100">Test Complete!</h2>
        <p className="text-xl text-slate-300 mt-2">Your Score</p>
        <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 my-2">
          {scorePercentage}%
        </p>
        <p className="text-slate-400">
          You answered {correctAnswersCount} out of {questions.length} questions correctly.
        </p>
      </div>

      <div className="space-y-6 max-h-80 overflow-y-auto pr-4">
        {questions.map((question, index) => {
          const userAnswer = userAnswers[index];
          const isCorrect = userAnswer === question.correctOptionIndex;
          const audioError = audioErrors[index];

          return (
            <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-300 flex-1 pr-2">
                  <span className="font-bold text-slate-100">Question {index + 1}:</span> {question.question}
                </p>
                <button
                  onClick={() => playAudio(question, index)}
                  disabled={playingIndex !== null}
                  className="p-2 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                  aria-label={`Play audio for question ${index + 1}`}
                >
                  {playingIndex === index ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <SpeakerIcon className="w-5 h-5 text-slate-300" />
                  )}
                </button>
              </div>

              {audioError && <p className="text-red-400 text-sm mt-2">{audioError}</p>}

              <div className="space-y-2 mt-2">
                {question.options.map((option, optionIndex) => {
                  const isUserAnswer = userAnswer === optionIndex;
                  const isCorrectAnswer = question.correctOptionIndex === optionIndex;
                  
                  let itemClass = 'flex items-start p-2 rounded-md text-sm ';
                  if (isCorrectAnswer) {
                    itemClass += 'bg-green-500/20 text-green-300';
                  } else if (isUserAnswer && !isCorrect) {
                    itemClass += 'bg-red-500/20 text-red-300';
                  } else {
                    itemClass += 'text-slate-400';
                  }

                  return (
                    <div key={optionIndex} className={itemClass}>
                      <div className="mr-2 pt-1 flex-shrink-0">
                        {isCorrectAnswer && <CheckIcon className="w-4 h-4 text-green-400" />}
                        {isUserAnswer && !isCorrect && <XIcon className="w-4 h-4 text-red-400" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-600">
                <p className="text-sm text-slate-400">
                  <span className="font-semibold text-slate-200">Explanation: </span>
                  {question.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;