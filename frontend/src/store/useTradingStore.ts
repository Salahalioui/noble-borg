import { create } from "zustand";

export interface WatchlistItem {
  symbol: string;
  name: string;
  isCrypto: boolean;
  price: number;
  change24h: number;
}

export type LayoutPreset = "standard" | "scalper" | "macro" | "ai_focus" | "zen" | "discovery";

interface TradingStore {
  activeSymbol: string;
  isCrypto: boolean;
  timeframe: string;
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  
  watchlist: WatchlistItem[];
  activePreset: LayoutPreset;
  zenMode: boolean;
  isDiagnosticsOpen: boolean;
  isCompoundModalOpen: boolean;
  aiDebateResult: any | null;
  isDebatingAI: boolean;
  backendConnected: boolean;

  setActiveSymbol: (symbol: string, isCrypto?: boolean) => void;
  setTimeframe: (tf: string) => void;
  updateTickerPrice: (price: number, change24h: number, high?: number, low?: number, vol?: number) => void;
  setActivePreset: (preset: LayoutPreset) => void;
  toggleZenMode: () => void;
  setDiagnosticsOpen: (val: boolean) => void;
  setCompoundModalOpen: (val: boolean) => void;
  setAIDebateResult: (res: any) => void;
  setIsDebatingAI: (val: boolean) => void;
  setBackendConnected: (val: boolean) => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  activeSymbol: "BTCUSDT",
  isCrypto: true,
  timeframe: "1h",
  currentPrice: 65420.0,
  change24h: 2.45,
  high24h: 66100.0,
  low24h: 64200.0,
  volume24h: 1850000000,

  watchlist: [
    { symbol: "BTCUSDT", name: "Bitcoin", isCrypto: true, price: 65420, change24h: 2.45 },
    { symbol: "ETHUSDT", name: "Ethereum", isCrypto: true, price: 3450, change24h: 1.82 },
    { symbol: "SOLUSDT", name: "Solana", isCrypto: true, price: 154.2, change24h: 5.12 },
    { symbol: "NVDA", name: "NVIDIA Corp", isCrypto: false, price: 128.5, change24h: 3.10 },
    { symbol: "AAPL", name: "Apple Inc", isCrypto: false, price: 226.4, change24h: -0.45 },
    { symbol: "TSLA", name: "Tesla Inc", isCrypto: false, price: 218.0, change24h: 1.25 },
    { symbol: "SPY", name: "S&P 500 ETF", isCrypto: false, price: 562.1, change24h: 0.65 },
  ],

  activePreset: "standard",
  zenMode: false,
  isDiagnosticsOpen: false,
  isCompoundModalOpen: false,
  aiDebateResult: null,
  isDebatingAI: false,
  backendConnected: false,

  setActiveSymbol: (symbol, isCrypto = true) => {
    const sym = symbol.toUpperCase();
    set((state) => {
      const match = state.watchlist.find((w) => w.symbol === sym);
      return {
        activeSymbol: sym,
        isCrypto,
        currentPrice: match ? match.price : 0,
        change24h: match ? match.change24h : 0,
        aiDebateResult: null,
      };
    });
  },
  setTimeframe: (timeframe) => set({ timeframe }),
  updateTickerPrice: (price, change24h, high, low, vol) =>
    set((state) => ({
      currentPrice: price,
      change24h,
      high24h: high !== undefined ? high : state.high24h,
      low24h: low !== undefined ? low : state.low24h,
      volume24h: vol !== undefined ? vol : state.volume24h,
    })),
  setActivePreset: (activePreset) => set({ activePreset, zenMode: activePreset === "zen" }),
  toggleZenMode: () => set((state) => ({ zenMode: !state.zenMode })),
  setDiagnosticsOpen: (isDiagnosticsOpen) => set({ isDiagnosticsOpen }),
  setCompoundModalOpen: (isCompoundModalOpen) => set({ isCompoundModalOpen }),
  setAIDebateResult: (aiDebateResult) => set({ aiDebateResult }),
  setIsDebatingAI: (isDebatingAI) => set({ isDebatingAI }),
  setBackendConnected: (backendConnected) => set({ backendConnected }),
}));
