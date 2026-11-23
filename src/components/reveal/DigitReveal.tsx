interface DigitRevealProps {
  digit: string;
  index: number;
  revealed: boolean;
}

export function DigitReveal({ digit, revealed }: DigitRevealProps) {
  return (
    <div
      className={`num w-16 h-24 sm:w-24 sm:h-32 rounded-2xl sm:rounded-3xl flex items-center justify-center
        text-6xl sm:text-8xl font-black border-2 transition-colors duration-300 ${
          revealed
            ? 'accent-gradient text-on-accent border-white/40 shadow-[0_12px_40px_-8px_var(--th-accent)] animate-digit-reveal'
            : 'bg-white/10 border-white/20 text-white/60'
        }`}
    >
      {revealed ? digit : '?'}
    </div>
  );
}
