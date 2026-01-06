import { create } from 'zustand';

export const useStore = create<StoreState>((set) => ({
  aiassistantName: "",
  setAiassistantName: (name) => set({ aiassistantName: name }),
}));

interface StoreState {
  aiassistantName: string;
  setAiassistantName: (name: string) => void;
}