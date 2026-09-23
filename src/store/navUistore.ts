import { create } from 'zustand';

interface NavUiState {
  activeStackDepth: number;
  setActiveStackDepth: (depth: number) => void;
}

export const useNavUiStore = create<NavUiState>((set) => ({
  activeStackDepth: 1,
  setActiveStackDepth: (depth: number) => set({ activeStackDepth: depth }),
}));