"use client";
import { useState, ReactNode } from "react";

export type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabbedLayoutProps = {
  tabs: Tab[];
  defaultTab?: string;
};

export default function TabbedLayout({ tabs, defaultTab }: TabbedLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-white/50 text-white"
                : "border-transparent text-white/60 hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

