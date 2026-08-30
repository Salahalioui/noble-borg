"use client";

import React from "react";
import { useTradingStore } from "@/store/useTradingStore";
import TradingViewChart from "@/components/charts/TradingViewChart";
import OrderBookWidget from "@/components/widgets/OrderBookWidget";
import AICopilotWidget from "@/components/widgets/AICopilotWidget";
import NewsSentimentWidget from "@/components/widgets/NewsSentimentWidget";
import MacroRadarWidget from "@/components/widgets/MacroRadarWidget";
import WhaleRadarWidget from "@/components/widgets/WhaleRadarWidget";
import PaperPortfolioWidget from "@/components/widgets/PaperPortfolioWidget";
import ZenTradeWidget from "@/components/widgets/ZenTradeWidget";
import OpportunityRadarWidget from "@/components/widgets/OpportunityRadarWidget";
import DiscoveryWidget from "@/components/widgets/DiscoveryWidget";
import DiagnosticsModal from "@/components/modals/DiagnosticsModal";
import CompoundGrowthModal from "@/components/modals/CompoundGrowthModal";

export default function GridContainer() {
  const { activePreset, isCompoundModalOpen, setCompoundModalOpen } = useTradingStore();

  return (
    <div className="w-full max-w-[1920px] mx-auto relative">
      <DiagnosticsModal />
      <CompoundGrowthModal
        isOpen={isCompoundModalOpen}
        onClose={() => setCompoundModalOpen(false)}
      />

      {activePreset === "zen" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-[calc(100vh-4rem)]">
          {/* Main 60 FPS Chart (8 cols) */}
          <div className="lg:col-span-8 h-[550px] lg:h-[calc(100vh-5rem)]">
            <TradingViewChart />
          </div>
          {/* Zen Executive AI Action Card & Execution (4 cols) */}
          <div className="lg:col-span-4 h-[550px] lg:h-[calc(100vh-5rem)]">
            <ZenTradeWidget />
          </div>
        </div>
      )}

      {activePreset === "scalper" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-[calc(100vh-4rem)]">
          {/* Main Fast-Execution Chart (7 cols) */}
          <div className="lg:col-span-7 h-[580px] lg:h-[calc(100vh-5rem)]">
            <TradingViewChart />
          </div>
          {/* Scalper Command Deck (5 cols): L2 Order Depth + Spacious Scalp Sandbox */}
          <div className="lg:col-span-5 flex flex-col space-y-3 h-[580px] lg:h-[calc(100vh-5rem)]">
            <div className="h-[46%] min-h-[260px]">
              <OrderBookWidget />
            </div>
            <div className="h-[54%] min-h-[300px]">
              <PaperPortfolioWidget />
            </div>
          </div>
        </div>
      )}

      {activePreset === "ai_focus" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-[calc(100vh-4rem)]">
          <div className="lg:col-span-6 h-[580px] lg:h-[calc(100vh-5rem)]">
            <TradingViewChart />
          </div>
          <div className="lg:col-span-6 h-[580px] lg:h-[calc(100vh-5rem)] flex flex-col space-y-3">
            <div className="h-[58%]">
              <ZenTradeWidget />
            </div>
            <div className="h-[42%] grid grid-cols-2 gap-3">
              <OpportunityRadarWidget />
              <NewsSentimentWidget />
            </div>
          </div>
        </div>
      )}

      {activePreset === "discovery" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-[calc(100vh-4rem)]">
          <div className="lg:col-span-7 h-[580px] lg:h-[calc(100vh-5rem)]">
            <TradingViewChart />
          </div>
          <div className="lg:col-span-5 h-[580px] lg:h-[calc(100vh-5rem)] flex flex-col space-y-3">
            <div className="h-[55%]">
              <DiscoveryWidget />
            </div>
            <div className="h-[45%]">
              <AICopilotWidget />
            </div>
          </div>
        </div>
      )}

      {activePreset === "macro" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-[calc(100vh-4rem)]">
          <div className="lg:col-span-6 flex flex-col space-y-3 h-[calc(100vh-5rem)]">
            <div className="h-[55%]">
              <TradingViewChart />
            </div>
            <div className="h-[45%]">
              <MacroRadarWidget />
            </div>
          </div>
          <div className="lg:col-span-3 h-[calc(100vh-5rem)]">
            <WhaleRadarWidget />
          </div>
          <div className="lg:col-span-3 h-[calc(100vh-5rem)]">
            <ZenTradeWidget />
          </div>
        </div>
      )}

      {activePreset === "standard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-[calc(100vh-4rem)]">
          {/* Main Chart + Order Book (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-3 h-[calc(100vh-5rem)]">
            <div className="h-[62%]">
              <TradingViewChart />
            </div>
            <div className="h-[38%] grid grid-cols-2 gap-3">
              <OrderBookWidget />
              <NewsSentimentWidget />
            </div>
          </div>
          {/* Right Zen AI & Execution (4 cols) */}
          <div className="lg:col-span-4 h-[calc(100vh-5rem)]">
            <ZenTradeWidget />
          </div>
        </div>
      )}
    </div>
  );
}
