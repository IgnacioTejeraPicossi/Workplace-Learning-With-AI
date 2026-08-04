import { createContext, useContext } from 'react';

/**
 * Shared context for the Babel Library tabs (Fase 3 deep refactor).
 *
 * BabelLibrary.jsx remains the single owner of all state and handlers; it just
 * *provides* the pieces the large Catalog / AI-Search tabs need through this
 * context, so those tabs can be their own components without prop-drilling 20+
 * props. Consume it with `useBabel()`.
 */
export const BabelContext = createContext(null);

export const useBabel = () => {
  const ctx = useContext(BabelContext);
  if (ctx === null) {
    throw new Error('useBabel must be used within a BabelContext.Provider');
  }
  return ctx;
};
