// store/navUiStore.ts
import { create } from 'zustand';

interface NavUiState {
  activeStackDepth: number;
  setActiveStackDepth: (depth: number) => void;
}

export const useNavUiStore = create<NavUiState>((set) => ({
  activeStackDepth: 1,
  setActiveStackDepth: (depth: number) => set({ activeStackDepth: depth }),
}));

// Note (see Step 8 caveat): if you want per-tab depth tracking instead of a
// single shared number, swap the shape for something like:
//
// interface NavUiState {
//   depthByTab: Record<string, number>;
//   setStackDepth: (tab: string, depth: number) => void;
// }
