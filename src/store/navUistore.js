import { create } from 'zustand';

export const useNavUiStore = create((set) => ({
  activeStackDepth: 1,
  setActiveStackDepth: (depth) => set({ activeStackDepth: depth }),
}));