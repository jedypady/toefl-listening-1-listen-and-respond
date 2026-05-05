
import React, { useState, useCallback } from 'react';
import { GameState, TestQuestion } from './types';
import { generateTestData } from './services/geminiService';
import StartScreen from './components/StartScreen';
import QuestionScreen from './components/QuestionScreen';
import ResultsScreen from './components/ResultsScreen';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleStartTest = useCallback(async () => {
    setGameState(GameState.LOADING_QUESTIONS);
    setError(null);
    try {
      const testData = await generateTestData();
      setQuestions(testData);
      setUserAnswers(new Array(testData.length).fill(null));
      setCurrentQuestionIndex(0);
      setGameState(GameState.IN_PROGRESS);
    } catch (err) {
      console.error(err);
      setError('Failed to generate test questions. Please try again.');
      setGameState(GameState.ERROR);
    }
  }, []);

  const handleAnswerSelect = (optionIndex: number) => {
    setUserAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[currentQuestionIndex] = optionIndex;
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      setGameState(GameState.SHOWING_RESULTS);
    }
  };

  const handleRestart = () => {
    setGameState(GameState.START);
    setQuestions([]);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setError(null);
  };

  const renderContent = () => {
    switch (gameState) {
      case GameState.START:
        return <StartScreen onStart={handleStartTest} />;
      case GameState.LOADING_QUESTIONS:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
            <p className="mt-4 text-lg text-slate-300">Generating your test...</p>
          </div>
        );
      case GameState.IN_PROGRESS:
        if (questions.length > 0) {
          return (
            <QuestionScreen
              question={questions[currentQuestionIndex]}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onAnswerSelect={handleAnswerSelect}
              onNext={handleNextQuestion}
              selectedAnswer={userAnswers[currentQuestionIndex]}
            />
          );
        }
        return null;
      case GameState.SHOWING_RESULTS:
        return (
          <ResultsScreen
            questions={questions}
            userAnswers={userAnswers}
            onRestart={handleRestart}
          />
        );
       case GameState.ERROR:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-red-400 text-xl mb-4">{error}</p>
            <button
              onClick={handleStartTest}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Listen & Respond
          </h1>
          <p className="text-slate-400 mt-2">Test your listening comprehension with AI-powered questions.</p>
        </header>
        <main className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 min-h-[400px] flex flex-col justify-center">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
