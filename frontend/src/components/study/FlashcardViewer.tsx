import { useState } from "react";
import { useTerms } from "../../hooks/useTerms";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import type { Flashcard } from "../../services/session.service";

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const terms = useTerms();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl border-border bg-muted text-muted-foreground">
        <p>No {terms.flashcards.toLowerCase()} available yet.</p>
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
      <div className="flex justify-between w-full mb-4 text-sm font-medium text-muted-foreground">
        <span>Card {currentIndex + 1} of {flashcards.length}</span>
        {currentCard.difficulty && (
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            currentCard.difficulty.toLowerCase() === 'easy' ? 'bg-success-soft dark:bg-success/20 text-success dark:text-success' :
            currentCard.difficulty.toLowerCase() === 'hard' ? 'bg-danger-soft dark:bg-danger/20 text-danger dark:text-danger' :
            'bg-warning-soft dark:bg-warning/20 text-warning dark:text-warning'
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
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-surface border shadow-float backface-hidden rounded-xl border-border">
            <span className="absolute top-4 left-4 text-xs font-semibold tracking-wider uppercase text-muted-foreground">Question</span>
            <h3 className="font-serif text-xl leading-snug text-foreground">{currentCard.front}</h3>
            <p className="absolute text-sm bottom-4 text-muted-foreground opacity-60">Click to flip</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-primary-soft border shadow-float backface-hidden rounded-xl border-primary/20 rotate-y-180">
            <span className="absolute top-4 left-4 text-xs font-semibold tracking-wider uppercase text-primary-text">Answer</span>
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger transition-colors bg-danger-soft border border-danger rounded-lg hover:bg-danger-soft"
            >
              <XCircle className="w-4 h-4" />
              Need Practice
            </button>
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-success transition-colors border bg-success-soft border-success rounded-lg hover:bg-success-soft"
            >
              <CheckCircle2 className="w-4 h-4" />
              Known
            </button>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
