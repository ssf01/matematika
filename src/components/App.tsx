import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { ScriptProvider } from '../i18n/ScriptContext';
import { ThemeProvider } from './themes/ThemeProvider';
import { ThemeBackground } from './themes/ThemeBackground';
import { SetupWizard } from './setup/SetupWizard';
import { HandoverScreen } from './reveal/HandoverScreen';
import { PuzzleBoard } from './puzzle/PuzzleBoard';
import { MultiplicationTable } from './puzzle/MultiplicationTable';
import { PrintableWorksheet } from './print/PrintableWorksheet';
import { PinReveal } from './reveal/PinReveal';
import { ScriptToggle } from './ui/ScriptToggle';

export default function App() {
  const currentStep = useGameStore((s) => s.currentStep);
  const theme = useGameStore((s) => s.theme);
  const mode = useGameStore((s) => s.mode);
  const puzzle = useGameStore((s) => s.puzzle);
  const multiplicationTableNumber = useGameStore((s) => s.multiplicationTableNumber);

  const content = (() => {
    switch (currentStep) {
      case 'setup':
        return <SetupWizard />;

      case 'handover':
        if (theme) {
          return (
            <ThemeProvider themeId={theme}>
              <ThemeBackground />
              <HandoverScreen />
            </ThemeProvider>
          );
        }
        return <SetupWizard />;

      case 'playing':
        if (!theme) return <SetupWizard />;

        // Multiplication table mode
        if (multiplicationTableNumber !== null) {
          return (
            <ThemeProvider themeId={theme}>
              <ThemeBackground />
              <MultiplicationTable number={multiplicationTableNumber} />
            </ThemeProvider>
          );
        }

        // Print mode
        if (mode === 'print' && puzzle) {
          return (
            <ThemeProvider themeId={theme}>
              <PrintableWorksheet puzzle={puzzle} />
            </ThemeProvider>
          );
        }

        // Digital mode
        if (puzzle) {
          return (
            <ThemeProvider themeId={theme}>
              <ThemeBackground />
              <PuzzleBoard puzzle={puzzle} />
            </ThemeProvider>
          );
        }
        return <SetupWizard />;

      case 'reveal':
        if (theme) {
          return (
            <ThemeProvider themeId={theme}>
              <ThemeBackground />
              <PinReveal />
            </ThemeProvider>
          );
        }
        return <SetupWizard />;

      default:
        return <SetupWizard />;
    }
  })();

  return (
    <ScriptProvider>
      <div className="min-h-dvh">
        <ScriptToggle />
        {content}
      </div>
    </ScriptProvider>
  );
}
