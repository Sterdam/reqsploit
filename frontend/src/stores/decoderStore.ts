import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

export type EncodingType = 'url' | 'base64' | 'html' | 'hex' | 'unicode';
export type HashType = 'md5' | 'sha1' | 'sha256' | 'sha512';
export type OperationType = 'encode' | 'decode' | 'hash';

/**
 * History Entry
 */
export interface DecoderHistoryEntry {
  id: string;
  operation: OperationType;
  encoding?: EncodingType;
  hash?: HashType;
  input: string;
  output: string;
  timestamp: string;
}

/**
 * Decoder Store State
 */
interface DecoderState {
  // State
  input: string;
  output: string;
  selectedEncoding: EncodingType;
  selectedHash: HashType;
  detectedEncoding: EncodingType | null;
  history: DecoderHistoryEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions - Input/Output
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  clearInput: () => void;
  clearOutput: () => void;
  swapInputOutput: () => void;

  // Actions - Encoding/Decoding
  setSelectedEncoding: (encoding: EncodingType) => void;
  encode: (encoding?: EncodingType) => Promise<void>;
  decode: (encoding?: EncodingType) => Promise<void>;
  autoDetect: () => Promise<void>;

  // Actions - Hashing
  setSelectedHash: (hash: HashType) => void;
  hash: (algorithm?: HashType) => Promise<void>;

  // Actions - History
  addToHistory: (entry: Omit<DecoderHistoryEntry, 'id' | 'timestamp'>) => void;
  loadFromHistory: (entryId: string) => void;
  clearHistory: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const useDecoderStore = create<DecoderState>()(
  persist(
    (set, get) => ({
      // Initial state
      input: '',
      output: '',
      selectedEncoding: 'url',
      selectedHash: 'md5',
      detectedEncoding: null,
      history: [],
      isLoading: false,
      error: null,

      // Set input
      setInput: (input: string) => {
        set({ input, error: null });
      },

      // Set output
      setOutput: (output: string) => {
        set({ output });
      },

      // Clear input
      clearInput: () => {
        set({ input: '', error: null });
      },

      // Clear output
      clearOutput: () => {
        set({ output: '', error: null, detectedEncoding: null });
      },

      // Swap input/output
      swapInputOutput: () => {
        const { input, output } = get();
        set({ input: output, output: input });
      },

      // Set selected encoding
      setSelectedEncoding: (encoding: EncodingType) => {
        set({ selectedEncoding: encoding });
      },

      // Encode
      encode: async (encoding?: EncodingType) => {
        const { input, selectedEncoding } = get();
        const encodingToUse = encoding || selectedEncoding;

        if (!input.trim()) {
          set({ error: 'Input is empty' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const token = useAuthStore.getState().accessToken;
          const response = await fetch(`${BACKEND_URL}/api/decoder/encode`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              input,
              encoding: encodingToUse,
            }),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || 'Encoding failed');
          }

          set({
            output: data.data.output,
            isLoading: false,
          });

          // Add to history
          get().addToHistory({
            operation: 'encode',
            encoding: encodingToUse,
            input,
            output: data.data.output,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Encoding failed',
          });
        }
      },

      // Decode
      decode: async (encoding?: EncodingType) => {
        const { input, selectedEncoding } = get();
        const encodingToUse = encoding || selectedEncoding;

        if (!input.trim()) {
          set({ error: 'Input is empty' });
          return;
        }

        set({ isLoading: true, error: null, detectedEncoding: null });

        try {
          const token = useAuthStore.getState().accessToken;
          const response = await fetch(`${BACKEND_URL}/api/decoder/decode`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              input,
              encoding: encodingToUse,
            }),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || 'Decoding failed');
          }

          set({
            output: data.data.output,
            detectedEncoding: data.data.encoding,
            isLoading: false,
          });

          // Add to history
          get().addToHistory({
            operation: 'decode',
            encoding: data.data.encoding,
            input,
            output: data.data.output,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Decoding failed',
          });
        }
      },

      // Auto-detect and decode
      autoDetect: async () => {
        const { input } = get();

        if (!input.trim()) {
          set({ error: 'Input is empty' });
          return;
        }

        set({ isLoading: true, error: null, detectedEncoding: null });

        try {
          const token = useAuthStore.getState().accessToken;
          const response = await fetch(`${BACKEND_URL}/api/decoder/decode`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              input,
              encoding: 'auto',
            }),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || 'Auto-detection failed');
          }

          set({
            output: data.data.output,
            detectedEncoding: data.data.encoding,
            isLoading: false,
          });

          // Add to history
          get().addToHistory({
            operation: 'decode',
            encoding: data.data.encoding,
            input,
            output: data.data.output,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Auto-detection failed',
          });
        }
      },

      // Set selected hash
      setSelectedHash: (hash: HashType) => {
        set({ selectedHash: hash });
      },

      // Hash
      hash: async (algorithm?: HashType) => {
        const { input, selectedHash } = get();
        const algorithmToUse = algorithm || selectedHash;

        if (!input.trim()) {
          set({ error: 'Input is empty' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const token = useAuthStore.getState().accessToken;
          const response = await fetch(`${BACKEND_URL}/api/decoder/hash`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              input,
              algorithm: algorithmToUse,
            }),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error?.message || 'Hashing failed');
          }

          set({
            output: data.data.output,
            isLoading: false,
          });

          // Add to history
          get().addToHistory({
            operation: 'hash',
            hash: algorithmToUse,
            input,
            output: data.data.output,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Hashing failed',
          });
        }
      },

      // Add to history
      addToHistory: (entry) => {
        const newEntry: DecoderHistoryEntry = {
          ...entry,
          id: `entry-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          history: [newEntry, ...state.history].slice(0, 50), // Keep last 50
        }));
      },

      // Load from history
      loadFromHistory: (entryId: string) => {
        const entry = get().history.find((e) => e.id === entryId);
        if (entry) {
          set({
            input: entry.input,
            output: entry.output,
            detectedEncoding: entry.encoding || null,
          });
        }
      },

      // Clear history
      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: 'decoder-storage',
      partialize: (state) => ({
        history: state.history,
        selectedEncoding: state.selectedEncoding,
        selectedHash: state.selectedHash,
      }),
    }
  )
);
