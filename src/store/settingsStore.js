import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  theme: 'dark',
  fontSize: 14,
  tabSize: 4,
  autoSave: true,
  pushServerPort: 8976,
  map3DChunkSize: 64,

  updateSetting: (key, value) => set(state => ({
    ...state,
    [key]: value,
  })),
}));

export default useSettingsStore;
