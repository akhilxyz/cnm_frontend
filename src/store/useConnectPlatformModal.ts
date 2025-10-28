import { create } from 'zustand';

interface ConnectPlatformModalState {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
}

export const useConnectPlatformModal = create<ConnectPlatformModalState>((set) => ({
  open: false,
  setOpen: (value) => set({ open: value }),
  toggle: () => set((state) => ({ open: !state.open })),
}));
