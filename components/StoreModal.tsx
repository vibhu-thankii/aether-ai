'use client';

import React, { useState } from 'react';
import { ShoppingCart, Star, Users, X } from 'lucide-react';

// --- Helper: Conditional Class Names ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// --- Main Store Modal Component ---
export default function StoreModal({ onClose, onUpgrade }: { onClose: () => void, onUpgrade: (planId: string, price: number) => void }) {
  const [activeTab, setActiveTab] = useState<'agents' | 'bundles'>('agents');

  // TODO: Replace these with your actual Plan IDs and prices from your Razorpay Dashboard
  const proBundlePlanId = "plan_QgF1YLl09814zT";
  const proBundlePrice = 399;
  
  const creatorsPackPlanId = "plan_QgFISIzGPm8cQn";
  const creatorsPackPrice = 599;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-[#0f172a] border border-white/10 rounded-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold">Aether AI Store</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="p-2 flex justify-center">
            <div className="flex p-1 bg-black/20 rounded-md my-2">
                <button onClick={() => setActiveTab('agents')} className={cn('px-8 py-2 rounded text-sm', activeTab === 'agents' ? 'bg-white/10' : 'hover:bg-white/5')}>Individual Agents</button>
                <button onClick={() => setActiveTab('bundles')} className={cn('px-8 py-2 rounded text-sm', activeTab === 'bundles' ? 'bg-white/10' : 'hover:bg-white/5')}>Bundles</button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {activeTab === 'agents' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StoreItem title="Mindfulness Coach" description="Find calm and centeredness." price="₹199/mo" onBuy={() => alert('Individual agent purchases coming soon!')} rating={4.8} users="12k" />
                <StoreItem title="Sales Agent" description="Your partner in closing deals." price="₹199/mo" onBuy={() => alert('Individual agent purchases coming soon!')} rating={4.9} users="8k" />
                <StoreItem title="Game Master" description="Embark on an epic quest." price="₹199/mo" onBuy={() => alert('Individual agent purchases coming soon!')} rating={4.7} users="15k" />
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StoreItem title="Pro Agent Bundle" description="Unlock all Pro agents with one subscription." price={`₹${proBundlePrice}/mo`} onBuy={() => onUpgrade(proBundlePlanId, proBundlePrice)} featured rating={5.0} users="25k" />
                <StoreItem title="Creator's Pack" description="Advanced tools and agents for content creators." price={`₹${creatorsPackPrice}/mo` } onBuy={() => onUpgrade(creatorsPackPlanId, creatorsPackPrice)} rating={4.9} users="5k" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Individual Store Item Component ---
const StoreItem = ({ title, description, price, onBuy, featured = false, rating, users }: any) => (
    <div className={cn("bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col", featured && "border-indigo-400/50 shadow-lg shadow-indigo-500/10")}>
        {featured && <div className="text-xs text-indigo-400 font-bold mb-2 tracking-wider">BEST VALUE</div>}
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-white/60 mt-1 flex-grow">{description}</p>
        <div className="flex items-center gap-4 text-xs text-white/50 mt-4">
            <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" /> {rating}</div>
            <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {users} users</div>
        </div>
        <div className="mt-6 flex items-center justify-between">
            <p className="text-2xl font-bold">{price}</p>
            <button onClick={onBuy} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Buy
            </button>
        </div>
    </div>
);
