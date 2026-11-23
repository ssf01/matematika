import type { ReactNode } from 'react';
import { useGameStore } from '../stores/gameStore';
import { ScriptProvider } from '../i18n/ScriptContext';
import { ThemeProvider } from './themes/ThemeProvider';
import { ThemeShell } from './themes/ThemeBackground';
import { SetupWizard } from './setup/SetupWizard';
import { HandoverScreen } from './reveal/HandoverScreen';
import { PuzzleBoard } from './puzzle/PuzzleBoard';
import { MultiplicationTable } from './puzzle/MultiplicationTable';
import { PrintableWorksheet } from './print/PrintableWorksheet';
import { PinReveal } from './reveal/PinReveal';
import { TopBarLayout } from './ui/TopBar';

export default function App() {
  const currentStep = useGameStore((s) => s.currentStep);
  const theme = useGameStore((s) => s.theme);
  const mode = useGameStore((s) => s.mode);
  const puzzle = useGameStore((s) => s.puzzle);
  const multiplicationTableNumber = useGameStore((s) => s.multiplicationTableNumber);

  const content = (() => {
    if (currentStep === 'setup' || !theme) return <SetupWizard />;

    const themed = (node: ReactNode) => <ThemeProvider themeId={theme}>{node}</ThemeProvider>;

    switch (currentStep) {
      case 'handover':
        return themed(<HandoverScreen />);

      case 'playing':
        if (multiplicationTableNumber !== null) {
          return themed(<MultiplicationTable number={multiplicationTableNumber} />);
        }
        if (!puzzle) return <SetupWizard />;
        if (mode === 'print' || mode === 'meta-print') {
          return themed(<PrintableWorksheet puzzle={puzzle} />);
        }
        return themed(<PuzzleBoard puzzle={puzzle} />);

      case 'reveal':
        return themed(<PinReveal />);

      default:
        return <SetupWizard />;
    }
  })();

  return (
    <ScriptProvider>
      {/* The wizard adopts the chosen theme as soon as one is picked. */}
      <ThemeShell themeId={theme ?? 'default'}>
        <TopBarLayout>
          <main>{content}</main>
        </TopBarLayout>
      </ThemeShell>
    </ScriptProvider>
  );
}
