import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Clock, Info } from 'lucide-react';
import { BubblePhase, BubbleData } from '../types';

interface Props {
  onExit: () => void;
}

// Helper to generate bubbles with +, -, x, /
const generateBubbles = (difficulty: number): BubbleData[] => {
    const bubbles: BubbleData[] = [];
    const usedValues = new Set<number>();

    // Helper to get random int between min and max (inclusive)
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Define available operation types
    // 0: Addition, 1: Subtraction, 2: Multiplication, 3: Division
    // We want 3 distinct types if possible.
    const opTypes = [0, 1, 2, 3];
    // Shuffle
    for (let i = opTypes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opTypes[i], opTypes[j]] = [opTypes[j], opTypes[i]];
    }

    // Generate 3 bubbles
    for(let i=0; i<3; i++) {
        let opType = opTypes[i]; // Use distinct type from shuffled array
        
        let val = 0;
        let disp = '';
        
        // Sometimes mix in a simple number if difficulty is low? 
        // Prompt asks for "multiplications, divisions, additions, substractions, any three".
        // So we strictly stick to operations for diversity.

        if (opType === 0) {
            // Addition
            const a = rand(2, 25);
            const b = rand(2, 25);
            val = a + b;
            disp = `${a}+${b}`;
        } else if (opType === 1) {
            // Subtraction (ensure positive result)
            const b = rand(2, 20);
            const a = rand(b + 1, b + 25); 
            val = a - b;
            disp = `${a}-${b}`;
        } else if (opType === 2) {
            // Multiplication (keep factors smaller for mental math)
            const a = rand(2, 12);
            const b = rand(2, 9);
            val = a * b;
            disp = `${a}×${b}`;
        } else {
            // Division (ensure integer result)
            const b = rand(2, 9); // divisor
            const res = rand(2, 12); // quotient
            const a = b * res; // dividend
            val = res;
            disp = `${a}÷${b}`;
        }

        // Avoid duplicate values to prevent sorting ambiguity
        // If value collision, retry this iteration
        if (usedValues.has(val)) {
            i--;
            continue;
        }
        
        usedValues.add(val);
        bubbles.push({ id: Math.random(), value: val, display: disp });
    }
    return bubbles;
};

const BubbleSortGame: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<BubblePhase>(BubblePhase.Intro);
  const [currentBubbles, setCurrentBubbles] = useState<BubbleData[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [qIndex, setQIndex] = useState(1);
  const [totalQ, setTotalQ] = useState(1);
  const [timer, setTimer] = useState(15);

  useEffect(() => {
    if (phase === BubblePhase.Intro) {
        // Mock data for intro
        setCurrentBubbles([
            { id: 1, value: 5, display: '2+3' },
            { id: 2, value: 6, display: '6' },
            { id: 3, value: 8, display: '' } // blank as per description
        ]);
    }
  }, [phase]);

  const handleNextQuestion = useCallback(() => {
    setSelectedIds([]);
    setTimer(15);
    
    if (phase === BubblePhase.Practice) {
        if (qIndex < 2) {
            setQIndex(prev => prev + 1);
            setCurrentBubbles(generateBubbles(1));
        } else {
            setPhase(BubblePhase.PracticeEnd);
        }
    } else if (phase === BubblePhase.Assessment) {
        if (qIndex < 2) {
            setQIndex(prev => prev + 1);
            setCurrentBubbles(generateBubbles(2));
        } else {
            setPhase(BubblePhase.Complete);
        }
    }
  }, [phase, qIndex]);

  // Timer logic for assessment
  useEffect(() => {
      if (phase === BubblePhase.Assessment) {
          const t = setInterval(() => {
              setTimer(prev => {
                  if (prev <= 1) {
                      handleNextQuestion(); // Auto advance on timeout
                      return 15; // Reset logic handles visual sync
                  }
                  return prev - 1;
              });
          }, 1000);
          return () => clearInterval(t);
      }
  }, [phase, handleNextQuestion]);

  const handleBubbleClick = (id: number) => {
    if (phase === BubblePhase.Intro || phase === BubblePhase.PracticeInfo) return; // Disable interaction during intro

    if (selectedIds.includes(id)) {
        // Deselect
        setSelectedIds(prev => prev.filter(sid => sid !== id));
    } else {
        // Select
        const newSelection = [...selectedIds, id];
        setSelectedIds(newSelection);
        
        // Auto Advance check
        if (newSelection.length === 3) {
            // Save logic would go here (record order)
            setTimeout(() => {
                handleNextQuestion();
            }, 300); // Small delay for visual feedback
        }
    }
  };

  const startPractice = () => {
      setPhase(BubblePhase.Practice);
      setQIndex(1);
      setTotalQ(2);
      setCurrentBubbles(generateBubbles(1));
  };

  const startAssessment = () => {
      setPhase(BubblePhase.Assessment);
      setQIndex(1);
      setTotalQ(2);
      setTimer(15);
      setCurrentBubbles(generateBubbles(2));
  };

  // --- RENDER HELPERS ---

  const renderBubbles = () => (
      <div className="relative w-full h-80 max-w-md mx-auto mt-10">
          {/* Hardcoded positions for 3 bubbles in a triangle roughly */}
          {currentBubbles.map((b, i) => {
              const isSelected = selectedIds.includes(b.id);
              // Position styles
              const styles = [
                  { top: '10%', left: '50%', transform: 'translateX(-50%)' },
                  { top: '60%', left: '20%' },
                  { top: '60%', right: '20%' }
              ];
              
              return (
                  <button
                    key={b.id}
                    onClick={() => handleBubbleClick(b.id)}
                    style={styles[i]}
                    className={`
                        absolute w-28 h-28 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 shadow-md border-4
                        ${isSelected ? 'bg-gray-800 text-white border-gray-900 scale-105' : 'bg-gray-100 text-gray-800 border-gray-200 hover:border-gray-300'}
                    `}
                  >
                      {b.display}
                  </button>
              );
          })}
      </div>
  );

  // --- MAIN RENDER ---

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-800 relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
                 <button 
                    onClick={onExit} 
                    className="flex items-center text-gray-400 hover:text-gray-800 transition-colors"
                    aria-label="Back to Menu"
                 >
                    <ArrowLeft size={24} />
                 </button>
                 <div className="flex items-center gap-2 font-bold text-xl text-purple-600">
                    <span>&gt;</span> accenture
                </div>
            </div>
            
            {phase === BubblePhase.Assessment && (
                 <div className="bg-black text-white px-4 py-2 text-sm font-bold w-full max-w-md absolute left-1/2 -translate-x-1/2 top-0">
                     Question {qIndex} of {totalQ}
                 </div>
            )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center relative">
            
            {/* Intro Modal */}
            {phase === BubblePhase.Intro && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded shadow-xl max-w-lg text-center">
                        <h2 className="text-xl font-bold mb-4">Instructions</h2>
                        <p className="mb-6">
                            You can deselect a bubble by clicking on it again. However, you will automatically advance to the next question after the third bubble is selected.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={() => setPhase(BubblePhase.PracticeInfo)} 
                                className="bg-gray-800 text-white px-6 py-3 rounded font-bold"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Practice Info Modal */}
            {phase === BubblePhase.PracticeInfo && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded shadow-xl max-w-lg text-center">
                        <h2 className="text-xl font-bold mb-4">Practice Mode</h2>
                        <p className="mb-6">
                            The practice exercise will have 4 questions in total. The first two questions will be ones you can replay.
                        </p>
                        <button onClick={startPractice} className="bg-black text-white px-8 py-3 rounded font-bold">PRACTICE</button>
                    </div>
                </div>
            )}

             {/* Practice End Modal */}
             {phase === BubblePhase.PracticeEnd && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded shadow-xl max-w-lg text-center">
                        <h2 className="text-xl font-bold mb-4">Practice Complete</h2>
                        <p className="mb-6">
                            You completed the first two practice items. To repeat the instructions, select REPLAY. To continue to the assessment, select START.
                        </p>
                        <div className="flex gap-4 justify-center">
                             <button onClick={startPractice} className="bg-gray-200 text-black px-6 py-3 rounded font-bold">REPLAY</button>
                             <button onClick={startAssessment} className="bg-black text-white px-6 py-3 rounded font-bold">START</button>
                        </div>
                    </div>
                </div>
            )}

             {/* Complete Screen */}
             {phase === BubblePhase.Complete && (
                <div className="flex flex-col items-center justify-center h-full max-w-md text-center p-8">
                    <h2 className="text-2xl font-bold mb-4">Thank you.</h2>
                    <p className="mb-8">This step in the process is complete and your responses have been saved.</p>
                    <button onClick={onExit} className="bg-black text-white px-8 py-3 rounded font-bold self-end">CONTINUE</button>
                </div>
            )}

            {/* Game Canvas */}
            {(phase === BubblePhase.Practice || phase === BubblePhase.Assessment) && (
                <div className="w-full flex-1 flex flex-col items-center">
                    {renderBubbles()}

                    <div className="absolute bottom-10 left-10 flex flex-col items-center">
                         <div className="relative">
                            <Clock size={48} className="text-gray-400" />
                            <span className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                                {phase === BubblePhase.Assessment ? timer : '--'}
                            </span>
                         </div>
                    </div>

                    <div className="absolute bottom-10 right-10 max-w-xs text-right text-sm text-gray-500">
                        Select the bubbles in order from the <br/>
                        <strong className="text-black">LOWEST</strong> to the <strong className="text-black">HIGHEST</strong> value.
                    </div>
                    
                    <div className="absolute bottom-2 text-xs text-gray-400">
                        Section {phase === BubblePhase.Practice ? '1' : '2'} of 2
                    </div>
                </div>
            )}
            
            {/* Show dummy layout behind modals */}
            {(phase === BubblePhase.Intro || phase === BubblePhase.PracticeInfo || phase === BubblePhase.PracticeEnd) && (
                 <div className="opacity-20 pointer-events-none w-full flex-1">
                     {renderBubbles()}
                 </div>
            )}
        </div>
    </div>
  );
};

export default BubbleSortGame;