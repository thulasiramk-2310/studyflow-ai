import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import type { Flashcard } from "../../services/session.service";

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl border-surface-300 bg-surface-50 text-surface-500">
        <p>No flashcards available in this deck.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  
  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, flashcards.length - 1));
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, 150);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto mt-6">
      <div className="flex justify-between w-full mb-4 text-sm font-medium text-surface-500">
        <span>Card {currentIndex + 1} of {flashcards.length}</span>
        {currentCard.difficulty && (
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            currentCard.difficulty.toLowerCase() === 'easy' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
            currentCard.difficulty.toLowerCase() === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
            'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}>
            {currentCard.difficulty}
          </span>
        )}
      </div>

      {/* Card Container */}
      <div 
        className="relative w-full h-[300px] cursor-pointer group perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-card border shadow-md backface-hidden rounded-2xl border-border">
            <span className="absolute top-4 left-4 text-xs font-semibold tracking-wider uppercase text-muted-foreground">Question</span>
            <h3 className="text-xl font-medium leading-relaxed text-card-foreground">{currentCard.front}</h3>
            <p className="absolute text-sm bottom-4 text-muted-foreground opacity-60">Click to flip</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-primary-soft/30 border shadow-md backface-hidden rounded-2xl border-primary/20 rotate-y-180">
            <span className="absolute top-4 left-4 text-xs font-semibold tracking-wider uppercase text-primary">Answer</span>
            <p className="text-lg leading-relaxed text-foreground">{currentCard.back}</p>
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between w-full mt-8">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg text-muted-foreground hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {isFlipped && (
          <div className="flex items-center gap-3 animate-[sfFade_0.3s_ease]">
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 transition-colors bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              <XCircle className="w-4 h-4" />
              Need Practice
            </button>
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors border bg-emerald-50 border-emerald-200 rounded-lg hover:bg-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4" />
              Known
            </button>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg text-surface-600 hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
