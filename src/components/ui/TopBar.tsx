import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ResetButton } from './ResetButton';
import { ScriptToggle } from './ScriptToggle';

const SlotContext = createContext<HTMLElement | null>(null);

/**
 * App-wide top bar: Home (left), a centre slot screens can fill via
 * <TopBarSlot>, and the script toggle (right). It is part of the page flow
 * (sticky), so it never overlaps content the way fixed corner buttons did.
 */
export function TopBarLayout({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <SlotContext.Provider value={slot}>
      <header
        // No backdrop-filter here: it would turn the bar into the containing block of
        // the (fixed) reset dialog rendered inside it.
        className="no-print sticky top-0 z-40 bg-page/92 border-b border-white/10
          shadow-[0_6px_20px_-12px_rgba(0,0,0,0.6)] pt-[env(safe-area-inset-top)]"
      >
        <div className="mx-auto max-w-3xl h-16 px-3 sm:px-4 grid grid-cols-[3rem_1fr_3rem] items-center gap-2">
          <div className="flex justify-start">
            <ResetButton />
          </div>
          <div ref={setSlot} className="flex justify-center min-w-0" />
          <div className="flex justify-end">
            <ScriptToggle />
          </div>
        </div>
      </header>
      {children}
    </SlotContext.Provider>
  );
}

/**
 * Renders its children in the top bar's centre slot. Outside a TopBarLayout
 * (e.g. in unit tests) it renders in place.
 */
export function TopBarSlot({ children }: { children: ReactNode }) {
  const slot = useContext(SlotContext);
  return slot ? createPortal(children, slot) : <>{children}</>;
}
