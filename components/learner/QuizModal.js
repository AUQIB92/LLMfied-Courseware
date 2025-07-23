"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';
import ContentDisplay from '@/components/ContentDisplay';

export default function QuizModal({ quiz, open, onOpenChange, onQuizComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!open) {
      // Reset state when the modal is closed
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setIsFinished(false);
      setScore(0);
    }
  }, [open]);

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateScore();
      setIsFinished(true);
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionIndex,
    });
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correctAnswers++;
      }
    });
    const finalScore = (correctAnswers / quiz.questions.length) * 100;
    setScore(finalScore);
    onQuizComplete(finalScore);
  };

  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            <ContentDisplay 
              content={quiz.title || "Quiz"}
              inline={true}
              renderingMode="safe"
              className="quiz-title"
            />
          </DialogTitle>
        </DialogHeader>
        
        {!isFinished ? (
          <div className="space-y-6">
            <Progress value={progress} className="mb-4" />
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="font-medium text-lg mb-4">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </div>
              
              <div className="quiz-question mb-6">
                <ContentDisplay 
                  content={currentQuestion.question}
                  renderingMode="math-optimized"
                  className="question-content text-lg"
                  showAnalytics={process.env.NODE_ENV === 'development'}
                />
              </div>
              
              <RadioGroup 
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                value={selectedAnswers[currentQuestionIndex]?.toString() || ""}
                className="space-y-4"
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`option-${index}`}
                      className="mt-1 flex-shrink-0"
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer"
                    >
                      <ContentDisplay 
                        content={option}
                        renderingMode="math-optimized"
                        className="option-content"
                        inline={false}
                      />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Quiz Complete!</h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {score.toFixed(1)}%
              </div>
              <p className="text-gray-600">
                You scored {Math.round((score / 100) * quiz.questions.length)} out of {quiz.questions.length} questions correctly
              </p>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Review Your Answers:</h4>
              
              {quiz.questions.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === question.correct;
                
                return (
                  <div key={index} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1">
                        <div className="font-medium mb-2">Question {index + 1}:</div>
                        <ContentDisplay 
                          content={question.question}
                          renderingMode="math-optimized"
                          className="question-review mb-3"
                        />
                      </div>
                    </div>
                    
                    <div className="ml-8 space-y-2">
                      <div className={`p-2 rounded ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className="text-sm font-medium text-gray-700 mb-1">Your Answer:</div>
                        <ContentDisplay 
                          content={question.options[userAnswer] || "No answer selected"}
                          renderingMode="math-optimized"
                          className="user-answer"
                          inline={false}
                        />
                      </div>
                      
                      {!isCorrect && (
                        <div className="p-2 rounded bg-green-100">
                          <div className="text-sm font-medium text-gray-700 mb-1">Correct Answer:</div>
                          <ContentDisplay 
                            content={question.options[question.correct]}
                            renderingMode="math-optimized"
                            className="correct-answer"
                            inline={false}
                          />
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="p-2 rounded bg-blue-50 border border-blue-200">
                          <div className="text-sm font-medium text-gray-700 mb-1">Explanation:</div>
                          <ContentDisplay 
                            content={question.explanation}
                            renderingMode="math-optimized"
                            className="explanation"
                            inline={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => onOpenChange(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                Close Quiz
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
