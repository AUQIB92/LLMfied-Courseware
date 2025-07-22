"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
        </DialogHeader>
        {!isFinished ? (
          <div>
            <Progress value={progress} className="mb-4" />
            <p className="mb-4">{currentQuestion.question}</p>
            <RadioGroup onValueChange={(value) => handleAnswerSelect(parseInt(value))}>
              {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            <DialogFooter className="mt-4">
              <Button onClick={handleNext}>
                {currentQuestionIndex < quiz.questions.length - 1 ? 'Next' : 'Finish'}
            </Button>
            </DialogFooter>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold">Quiz Results</h3>
            <p>Your score: {score.toFixed(2)}%</p>
            <ul className="mt-4 space-y-4">
              {quiz.questions.map((question, index) => (
                <li key={index}>
                  <p className="font-semibold">{question.question}</p>
                  <p className={selectedAnswers[index] === question.correct ? 'text-green-600' : 'text-red-600'}>
                    Your answer: {question.options[selectedAnswers[index]]}
                    {selectedAnswers[index] === question.correct ? <CheckCircle className="inline ml-2" /> : <XCircle className="inline ml-2" />}
                  </p>
                  {selectedAnswers[index] !== question.correct && (
                    <p className="text-gray-500">Correct answer: {question.options[question.correct]}</p>
                  )}
                </li>
              ))}
            </ul>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
