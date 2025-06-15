'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import {
  Mic, MicOff, Zap, BrainCircuit, ShieldCheck, Telescope,
  LogOut, History, MessageSquare, DollarSign, Crown, X, Sparkles,
  FileText, ArrowRight, Store, Bot, ArrowLeft, Search, Settings, User as UserIcon, Star, Check
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc, setDoc, updateDoc, arrayUnion, runTransaction
} from 'firebase/firestore';
import AuthComponent from '../components/Auth';
import AdComponent from '../components/AdComponent';
import Link from 'next/link';


// --- Helper: Conditional Class Names ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// --- Data Interfaces & Configuration ---
interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  category: 'Productivity' | 'Companionship' | 'Creative' | 'Utility' | 'System';
  longDescription: string;
  examplePrompts: string[];
  isFeatured?: boolean;
  isPro: boolean;
  averageRating?: number;
  reviewCount?: number;
}
interface Review {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  createdAt: any;
}
interface Message { role: 'user' | 'agent'; text: string; }
interface Conversation { id: string; userId: string; agentId: string; agentName: string; createdAt: any; lastMessage: string; }
interface UserProfile {
  name: string;
  preferences?: string[];
  conversation_summaries?: { agentId: string; summary: string; timestamp: any }[];
  purchasedAgentIds?: string[];
}

const allAgents: Agent[] = [
  { id: 'welcome-bot', name: 'Aether AI Guide', description: "Welcome! I'm here to help you get started.", color: 'indigo-500', icon: Sparkles, category: 'System', longDescription: "I'm your personal guide to Aether AI. Ask me anything about how the app works!", examplePrompts: [], isPro: false },
  {
    id: 'USji2hEbVPYimRif3His',
    name: 'Travel Guide',
    description: "Explore the world's wonders.",
    color: 'red-500',
    icon: Telescope,
    category: 'Creative',
    longDescription: "Your personal guide to the world. Get custom itineraries, find hidden gems, and learn about the history and culture of any destination.",
    examplePrompts: ["Plan a 5-day trip to Italy.", "What are the best things to do in Tokyo?"],
    isFeatured: true,
    isPro: false
  },
  {
    id: 'placeholder-1',
    name: 'Girlfriend',
    description: "A caring and supportive virtual companion.",
    color: 'pink-500',
    icon: Crown,
    category: 'Companionship',
    longDescription: "Experience the warmth and support of a caring companion. Share your thoughts, celebrate your wins, and navigate life's challenges with a friend who is always there to listen.",
    examplePrompts: ["I had a tough day at work.", "Tell me something to make me smile."],
    isPro: true,
    isFeatured: true
  },
  {
    id: 'oYxMlLkXbNtZDS3zCikc',
    name: 'Mindfulness Coach',
    description: "Find calm and centeredness.",
    color: 'green-500',
    icon: BrainCircuit,
    category: 'Companionship',
    longDescription: "Navigate the stresses of daily life with a calm and centered mind. The Mindfulness Coach offers guided meditations, breathing exercises, and techniques to help you find your inner peace.",
    examplePrompts: ["Guide me through a 5-minute meditation.", "I'm feeling stressed, what can I do?"],
    isPro: true
  },
  {
    id: 'L4mP6VOSm5qn61IW4Hml',
    name: 'Sales Agent',
    description: "Your partner in closing deals.",
    color: 'purple-500',
    icon: DollarSign,
    category: 'Productivity',
    longDescription: "Hone your sales skills and close more deals. The Sales Agent can help you practice your pitch, handle objections, and develop winning strategies for any negotiation.",
    examplePrompts: ["Help me practice my sales pitch.", "What's a good way to handle the objection 'it's too expensive'?"],
    isPro: true
  },
  {
    id: 'TkvOiYUSHLZyVnFgBnJr',
    name: 'Support Agent',
    description: "Your friendly technical expert.",
    color: 'blue-500',
    icon: ShieldCheck,
    category: 'Utility',
    longDescription: "Get expert help with any technical issue. From software bugs to hardware setup, the Support Agent is your go-to guide for clear, step-by-step solutions.",
    examplePrompts: ["How do I fix a blue screen error?", "My Wi-Fi is not working, can you help?"],
    isPro: true
  },
  {
    id: 'obmk35jYzsvmFDtgiIfk',
    name: 'Game Master',
    description: "Embark on an epic quest.",
    color: 'yellow-500',
    icon: Zap,
    category: 'Creative',
    longDescription: "Your personal dungeon master for an epic role-playing adventure. Create a character, explore a fantasy world, and make choices that shape your story.",
    examplePrompts: ["Let's start a new fantasy adventure.", "I want to be an elf ranger, what happens next?"],
    isPro: true
  },
  {
    id: 'placeholder-2',
    name: 'Story Teller',
    description: "Weaves magical tales for all ages.",
    color: 'orange-500',
    icon: Bot,
    category: 'Creative',
    longDescription: "Journey to faraway lands and magical realms with the Story Teller. Perfect for bedtime stories or sparking your own imagination, this agent can create endless tales on any theme you choose.",
    examplePrompts: ["Tell me a story about a brave knight.", "Create a sci-fi story about a lost robot."],
    isPro: true
  },
  {
    id: 'placeholder-3',
    name: 'Fitness Coach',
    description: "Your personal trainer for a healthier life.",
    color: 'teal-500',
    icon: Zap,
    category: 'Productivity',
    longDescription: "Achieve your health and fitness goals with a personal coach in your pocket. Get custom workout plans, nutrition advice, and the motivation you need to stay on track.",
    examplePrompts: ["Create a 30-minute workout for me.", "What are some healthy snack ideas?"],
    isPro: true
  },
];

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

// --- App Controller ---
export default function AppController() {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleProfileUpdate = (newProfileData: Partial<UserProfile>) => {
    setUserProfile(prev => prev ? { ...prev, ...newProfileData } : null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        setIsPro(userDocSnap.exists() && !!userDocSnap.data().isPro);

        const profileDocRef = doc(db, "users", currentUser.uid, "profile", "main");
        const profileDocSnap = await getDoc(profileDocRef);
        if (profileDocSnap.exists()) {
          setUserProfile(profileDocSnap.data() as UserProfile);
        } else {
          // Create profile if it doesn't exist (e.g., first social login)
          const newProfile: UserProfile = { name: currentUser.displayName || 'Friend', preferences: [], purchasedAgentIds: [] };
          await setDoc(profileDocRef, newProfile);
          setUserProfile(newProfile);

          // Add a welcome bot message for brand new users
          const welcomeBotMessage = "Welcome to Aether AI! I'm here to help you get started. You can browse all available agents in the 'Store' tab. Feel free to ask me anything!";
          await addDoc(collection(db, "conversations"), {
              userId: currentUser.uid,
              agentId: 'welcome-bot',
              agentName: 'Aether AI Guide',
              lastMessage: welcomeBotMessage,
              createdAt: serverTimestamp(),
          });
        }

        setUser(currentUser);
      } else {
        setUser(null);
        setIsPro(false);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return loading
    ? <div className="w-full h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>
    : user && userProfile
      ? <AetherAI user={user} isPro={isPro} setIsPro={setIsPro} userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />
      : <AuthComponent />;
}

// --- Main Application ---
function AetherAI({
  user, isPro, setIsPro, userProfile, onProfileUpdate
}: {
  user: User;
  isPro: boolean;
  setIsPro: (isPro: boolean) => void;
  userProfile: UserProfile;
  onProfileUpdate: (data: Partial<UserProfile>) => void;
}) {
  const [activeChat, setActiveChat] = useState<{ agent: Agent, history?: Conversation } | null>(null);
  const [view, setView] = useState<'chats' | 'history' | 'store'>('chats');
  const [showTranscript, setShowTranscript] = useState(false);
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
  const [purchaseModalAgent, setPurchaseModalAgent] = useState<Agent | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [storeDetailAgent, setStoreDetailAgent] = useState<Agent | null>(null);
  const [agentsWithRatings, setAgentsWithRatings] = useState<Agent[]>(allAgents);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState<Agent | null>(null);
  const [overlayDetailAgent, setOverlayDetailAgent] = useState<Agent | null>(null);

  const fetchAgentRatings = useCallback(async () => {
    const metaCollection = collection(db, 'agent_meta');
    const metaSnapshot = await getDocs(metaCollection);
    const ratingsData = metaSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {} as { [key: string]: any });

    const updatedAgents = allAgents.map(agent => ({
      ...agent,
      averageRating: ratingsData[agent.id]?.averageRating || 0,
      reviewCount: ratingsData[agent.id]?.reviewCount || 0,
    }));
    setAgentsWithRatings(updatedAgents);
  }, []);

  useEffect(() => {
    fetchAgentRatings();
  }, [fetchAgentRatings]);

  const fetchChatHistory = useCallback(async () => {
    if (!user) return;
    const q = query(
      collection(db, "conversations"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
    setChatHistory(history);
  }, [user]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  const handleSelectChat = (agent: Agent, historyItem?: Conversation) => {
    setStoreDetailAgent(null); // Ensure store view is closed
    setActiveChat({ agent, history: historyItem });
  };

  const handleStartChatFromStore = (agent: Agent) => {
    if (!agent.isPro || isPro || userProfile.purchasedAgentIds?.includes(agent.id)) {
      setStoreDetailAgent(null);
      setActiveChat({ agent });
    } else {
      setPurchaseModalAgent(agent);
    }
  };

  const handlePurchase = async (planId: string, amount: number) => {
    setPurchaseModalAgent(null);
    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, planId, amount }),
      });

      const sessionData = await response.json();
      if (sessionData.error || !sessionData.order_id) {
        alert(`Error: ${sessionData.error || "Could not create payment session."}`);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: sessionData.amount,
        currency: sessionData.currency,
        name: "Aether AI",
        description: `Purchase for plan: ${planId}`,
        order_id: sessionData.order_id,
        handler: async function (response: any) {
          alert("Payment successful! Your purchase is complete.");

          if (planId.startsWith('pro_')) {
            await updateDoc(doc(db, "users", user.uid), { isPro: true });
            setIsPro(true);
          } else {
            const agentId = planId.split('_')[0];
            const profileRef = doc(db, "users", user.uid, "profile", "main");
            await updateDoc(profileRef, {
              purchasedAgentIds: arrayUnion(agentId)
            });
            onProfileUpdate({ purchasedAgentIds: [...(userProfile.purchasedAgentIds || []), agentId] });
          }
        },
        prefill: { name: user.displayName || "Aether User", email: user.email },
        theme: { color: "#0f172a" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Purchase error:", error);
      alert("An error occurred during the purchase process.");
    }
  };

  const accessibleAgents = useMemo(() => {
    if (isPro) return agentsWithRatings.filter(a => a.category !== 'System');
    const freeAgents = agentsWithRatings.filter(agent => !agent.isPro);
    const purchasedAgents = agentsWithRatings.filter(agent => userProfile.purchasedAgentIds?.includes(agent.id));
    return [...freeAgents, ...purchasedAgents];
  }, [isPro, userProfile.purchasedAgentIds, agentsWithRatings]);
  
  return (
    <div className="w-full h-screen bg-[#020617] text-white flex font-sans overflow-hidden">
        {purchaseModalAgent && <PurchaseModal agent={purchaseModalAgent} onClose={() => setPurchaseModalAgent(null)} onPurchase={handlePurchase} />}
        {isSettingsModalOpen && <SettingsModal user={user} userProfile={userProfile} onClose={() => setIsSettingsModalOpen(false)} onSave={onProfileUpdate} />}
        {isRatingModalOpen && <RatingModal agent={isRatingModalOpen} user={user} onClose={() => setIsRatingModalOpen(null)} onReviewSubmit={fetchAgentRatings} />}
        {overlayDetailAgent && <AgentDetailView agent={overlayDetailAgent} onBack={() => setOverlayDetailAgent(null)} onStartChat={() => { setOverlayDetailAgent(null); handleStartChatFromStore(overlayDetailAgent); }} isPro={isPro} isOverlay={true} />}

        <aside className={cn( "w-full lg:w-96 h-full flex flex-col bg-[#0f172a] border-r border-white/10", activeChat || storeDetailAgent ? "hidden lg:flex" : "flex" )}>
            <ListPanelHeader view={view} setView={setView} onSettingsClick={() => setIsSettingsModalOpen(true)} />
            <div className="flex-1 overflow-y-auto">
                {view === 'chats' && <div className="p-2">{accessibleAgents.map(agent => (<ChatListItem key={agent.id} agent={agent} lastMessage={agent.description} onSelect={() => handleSelectChat(agent)} />))}</div>}
                {view === 'history' && <div className="p-2">{chatHistory.length > 0 ? chatHistory.map(convo => { const agent = agentsWithRatings.find(a => a.id === convo.agentId); return agent ? <ChatListItem key={convo.id} agent={agent} lastMessage={convo.lastMessage} onSelect={() => handleSelectChat(agent, convo)} /> : null}) : <p className="text-center text-sm text-white/40 p-4">No conversation history.</p>}</div>}
                {view === 'store' && 
                    <AgentStore 
                        agents={agentsWithRatings} 
                        onAgentSelect={(agent: Agent) => {
                            setActiveChat(null);
                            setStoreDetailAgent(agent);
                        }} 
                    />
                }
            </div>
        </aside>

        <main className={cn("flex-1 flex-col h-full", activeChat || storeDetailAgent ? "flex" : "hidden lg:flex")}>
            {activeChat ? (
                activeChat.agent.id === 'welcome-bot' ? (
                    <WelcomeBotChat agent={activeChat.agent} history={activeChat.history} onBack={() => setActiveChat(null)} />
                ) : (
                    <ConversationManager
                        key={activeChat.agent.id}
                        user={user}
                        activeChat={activeChat}
                        showTranscript={showTranscript}
                        isPro={isPro}
                        onConversationEnd={(agent: Agent) => { fetchChatHistory(); setIsRatingModalOpen(agent); }}
                        setShowUpgradeModal={() => setPurchaseModalAgent(activeChat.agent)}
                        setShowTranscript={setShowTranscript}
                        onBack={() => setActiveChat(null)}
                        onHeaderClick={() => setOverlayDetailAgent(activeChat.agent)}
                        userProfile={userProfile}
                    />
                )
            ) : storeDetailAgent ? (
                <AgentDetailView agent={storeDetailAgent} onBack={() => setStoreDetailAgent(null)} onStartChat={() => handleStartChatFromStore(storeDetailAgent)} isPro={isPro} />
            ) : <WelcomeScreen />}
        </main>
    </div>
  );
}


// --- UI COMPONENTS ---
const ListPanelHeader = ({ view, setView, onSettingsClick }: any) => (
  <header className="p-4 border-b border-white/10 flex-shrink-0">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">Aether AI</h1>
      <div className="flex items-center gap-2">
        <button onClick={onSettingsClick} className="p-2 rounded-full hover:bg-white/10"><Settings size={20} /></button>
        <button onClick={() => auth.signOut()} className="p-2 rounded-full hover:bg-white/10"><LogOut size={20} /></button>
      </div>
    </div>
    <div className="flex p-1 bg-black/20 rounded-md">
      <button onClick={() => setView('chats')} className={cn('flex-1 py-2 text-sm rounded', view === 'chats' ? 'bg-indigo-600' : 'hover:bg-white/10')}>Chats</button>
      <button onClick={() => setView('history')} className={cn('flex-1 py-2 text-sm rounded', view === 'history' ? 'bg-indigo-600' : 'hover:bg-white/10')}>History</button>
      <button onClick={() => setView('store')} className={cn('flex-1 py-2 text-sm rounded', view === 'store' ? 'bg-indigo-600' : 'hover:bg-white/10')}>Store</button>
    </div>
  </header>
);

const ChatListItem = ({ agent, lastMessage, onSelect }: any) => (
  <button onClick={onSelect} className="w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors hover:bg-white/5">
    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', `bg-${agent.color}/20 text-${agent.color}`)}>
      <agent.icon className="w-7 h-7" />
    </div>
    <div className="flex-1 truncate">
      <p className="font-semibold">{agent.name}</p>
      <p className="text-xs text-white/60 truncate">{lastMessage}</p>
    </div>
  </button>
);

const WelcomeScreen = () => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center bg-black/30 p-4">
    <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center border-2 border-indigo-500/20 mb-6">
      <Bot size={64} className="text-indigo-400"/>
    </div>
    <h3 className="text-2xl font-bold">Welcome to Your AI Universe</h3>
    <p className="text-white/50 max-w-sm mt-2">Select a chat to continue a conversation, or explore the Store to discover new AI companions.</p>
  </div>
);

const AgentStore = ({ agents, onAgentSelect }: any) => {
  const proAgents = agents.filter((a: Agent) => a.isPro);
  const categories = Array.from(new Set(proAgents.map((a: Agent) => a.category))) as string[];
  const featuredAgents = proAgents.filter((a: Agent) => a.isFeatured);
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 px-2 flex items-center gap-2"><Star className="text-yellow-400" /> Featured Agents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {featuredAgents.map((agent: Agent) => (
            <StoreItem key={agent.id} agent={agent} onSelect={() => onAgentSelect(agent)} />
          ))}
        </div>
      </div>
      {categories.map((category: string) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-bold mb-4 px-2">{category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {proAgents.filter((a: Agent) => a.category === category && !a.isFeatured).map((agent: Agent) => (
              <StoreItem key={agent.id} agent={agent} onSelect={() => onAgentSelect(agent)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const StoreItem = ({ agent, onSelect }: any) => (
  <button onClick={onSelect} className="bg-white/5 p-4 rounded-lg flex gap-4 text-left hover:bg-white/10 transition-colors w-full">
    <div className={cn('w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0', `bg-${agent.color}/20 text-${agent.color}`)}>
      <agent.icon className="w-8 h-8"/>
    </div>
    <div>
      <h4 className="font-bold flex items-center gap-2">{agent.name} {agent.isPro && <Crown size={14} className="text-yellow-400" />}</h4>
      <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
        <Star size={12} className="text-yellow-400"/>
        <span>{agent.averageRating?.toFixed(1) || 'New'} ({agent.reviewCount || 0})</span>
      </div>
      <p className="text-xs text-white/60 mt-1">{agent.description}</p>
    </div>
  </button>
);

const AgentDetailView = ({ agent, onBack, onStartChat, isPro, isOverlay = false }: { agent: Agent; onBack: () => void; onStartChat: () => void; isPro: boolean; isOverlay?: boolean; }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    const fetchReviews = async () => {
      const q = query(collection(db, 'agent_reviews'), where('agentId', '==', agent.id), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setReviews(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    };
    fetchReviews();
  }, [agent.id]);

  return (
    <div className={cn("w-full h-full flex flex-col bg-black/30", isOverlay && "fixed inset-0 z-30 bg-[#0f172a]/95 backdrop-blur-sm")}>
      <header className="p-4 border-b border-white/10 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2"><ArrowLeft /></button>
        <h2 className="text-xl font-bold">Agent Details</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-8 text-center flex flex-col items-center">
        <div className={cn('w-32 h-32 rounded-full flex items-center justify-center mb-6', `bg-${agent.color}/20 text-${agent.color}`)}>
          <agent.icon className="w-16 h-16"/>
        </div>
        <h3 className="text-3xl font-bold">{agent.name}</h3>
        <p className="text-white/60 mt-2 max-w-md">{agent.longDescription}</p>
        <div className="my-8 w-full max-w-md">
          <h4 className="font-bold text-left mb-3">Example Prompts:</h4>
          <div className="space-y-3">
            {agent.examplePrompts.map((prompt, i) => (
              <div key={i} className="bg-white/5 p-3 rounded-md text-left text-sm text-white/80">
                "{prompt}"
              </div>
            ))}
          </div>
        </div>
        <div className="my-8 w-full max-w-md">
          <h4 className="font-bold text-left mb-3">Recent Reviews</h4>
          {reviews.length > 0 ? reviews.map(review => (
            <div key={review.id} className="bg-white/5 p-3 rounded-md text-left mb-2">
              <div className="flex items-center mb-1">
                {Array.from({length: 5}).map((_, i) => (<Star key={i} size={14} className={i < review.rating ? 'text-yellow-400' : 'text-white/20'}/>))}
                <p className="ml-2 text-xs font-bold">{review.authorName}</p>
              </div>
              <p className="text-sm text-white/80 italic">"{review.text}"</p>
            </div>
          )) : <p className="text-sm text-white/50 text-center">No reviews yet.</p>}
        </div>
        <button onClick={onStartChat} className="mt-auto w-full max-w-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2">
          {agent.isPro && !isPro ? <><Crown size={16} className="mr-2"/> Unlock with Pro</> : `Chat with ${agent.name}`}
        </button>
      </div>
    </div>
  );
};

const SettingsModal = ({ user, userProfile, onClose, onSave }: { user: User; userProfile: UserProfile; onClose: () => void; onSave: (data: Partial<UserProfile>) => void; }) => {
  const [name, setName] = useState(userProfile.name);
  const [preferences, setPreferences] = useState((userProfile.preferences || []).join('\n'));
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    const profileRef = doc(db, "users", user.uid, "profile", "main");
    const updatedData = { name: name, preferences: preferences.split('\n').filter(p => p.trim() !== '') };
    try {
      await updateDoc(profileRef, updatedData);
      onSave(updatedData);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 rounded-2xl flex flex-col shadow-lg">
        <header className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3"><UserIcon className="w-6 h-6 text-white/70" /><h2 className="text-xl font-bold">Your Profile</h2></div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">Your Name</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="preferences" className="block text-sm font-medium text-white/80 mb-2">Your Interests & Preferences</label>
            <textarea id="preferences" value={preferences} onChange={e => setPreferences(e.target.value)} rows={4} placeholder="e.g., I enjoy discussing technology and history.&#10;I prefer a formal tone." className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            <p className="text-xs text-white/50 mt-1">List each preference on a new line. The AI will use this to personalize your conversations.</p>
          </div>
        </div>
        <footer className="p-6 border-t border-white/10 flex justify-end gap-4">
          <button onClick={onClose} className="py-2 px-4 text-sm font-semibold rounded-md hover:bg-white/10">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="py-2 px-4 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed">
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const ConversationManager = ({ user, activeChat, showTranscript, isPro, onConversationEnd, setShowUpgradeModal, setShowTranscript, onBack, userProfile, onHeaderClick }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { agent } = activeChat;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    // On chat start, Pro users can toggle transcripts, free users cannot.
    setShowTranscript(isPro ? false : false);
  }, [activeChat, isPro, setShowTranscript]);

  const { status, startSession, endSession, isSpeaking } = useConversation({
    apiKey: ELEVENLABS_API_KEY,
    agentId: agent.id,
    onMessage: (msg: { message: string }) => {
      const newMsg: Message = { role: 'agent', text: msg.message };
      // Pro users get messages added to state to power transcripts.
      if (isPro) {
        setMessages(prev => [...prev, newMsg]);
      }
      updateLastMessage(newMsg.text);
    },
    onUserMessage: (msg: string) => {
      const newMsg: Message = { role: 'user', text: msg };
       // Pro users get messages added to state to power transcripts.
      if (isPro) {
        setMessages(prev => [...prev, newMsg]);
      }
    }
  });

  const getAgentContext = () => {
    let context = `You are speaking with ${userProfile.name}.`;
    if(userProfile.preferences?.length) {
      context += ` Preferences: ${userProfile.preferences.join(', ')}.`;
    }
    const relevantSummaries = userProfile.conversation_summaries?.filter((s: { agentId: string; summary: string; timestamp: any }) => s.agentId === agent.id).slice(-3);
    if(relevantSummaries?.length) {
      context += " Recent conversation summaries: ";
      relevantSummaries.forEach((s: { agentId: string; summary: string; timestamp: any }) => {
        context += `'${s.summary}' `;
      });
    }
    return context;
  };

  const startConversationWithContext = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = getAgentContext();
      console.log("Starting conversation with context:", context);
      startSession();
    } catch (error) {
      console.error("Microphone permission denied", error);
      alert("Microphone access is required.");
    }
  };

  const stopConversationAndSummarize = async () => {
    if (isPro) {
      const conversationToSummarize = messages.slice(-10).map(m => `${m.role}: ${m.text}`).join('\n');
      if (conversationToSummarize.length > 50) {
        try {
          const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationText: conversationToSummarize }),
          });
          if (!response.ok) throw new Error('Failed to get summary');
          const { summary } = await response.json();
          const profileRef = doc(db, "users", user.uid, "profile", "main");
          await updateDoc(profileRef, {
            conversation_summaries: arrayUnion({ agentId: agent.id, summary: summary, timestamp: new Date() })
          });
        } catch (error) {
          console.error("Failed to summarize conversation:", error);
        }
      }
    }
    endSession();
    setMessages([]);
    onConversationEnd(agent);
  };

  const updateLastMessage = async (text: string) => {
    const convoRef = collection(db, "conversations");
    const q = query(convoRef, where("userId", "==", user.uid), where("agentId", "==", agent.id));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      await updateDoc(doc(db, "conversations", querySnapshot.docs[0].id), { lastMessage: text, createdAt: serverTimestamp() });
    } else {
      await addDoc(convoRef, { userId: user.uid, agentId: agent.id, agentName: agent.name, lastMessage: text, createdAt: serverTimestamp() });
    }
  };

  const handleTranscriptToggle = () => {
    if (isPro) {
      setShowTranscript(!showTranscript);
    } else {
      setShowUpgradeModal(true);
    }
  };
  
  const isFreeTierChat = !isPro && !agent.isPro;
  
  return (
    <div className="w-full h-full flex flex-col bg-black/30">
      <header onClick={onHeaderClick} className="p-4 border-b border-white/10 flex items-center gap-4 flex-shrink-0 hover:bg-white/5 transition-colors cursor-pointer">
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-2 -ml-2"><ArrowLeft /></button>
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', `bg-${agent.color}/20 text-${agent.color}`)}><agent.icon className="w-6 h-6" /></div>
        <h3 className="font-bold">{agent.name}</h3>
      </header>
      
      {/* Banner Ad for Free Users */}
      {isFreeTierChat && (
        <div className="p-2 bg-black/20 border-b border-white/10">
          <AdComponent />
        </div>
      )}

      <div ref={scrollRef} className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4">
        {/* Pro users with transcript enabled */}
        {isPro && showTranscript && messages.map((msg, index) => (
          <div key={index} className={cn('flex items-end gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'agent' && (
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 self-start', `bg-${agent.color}/20 text-${agent.color}`)}>
                <agent.icon className="w-5 h-5" />
              </div>
            )}
            <div className={cn('max-w-md md:max-w-xl p-3 rounded-2xl text-white', msg.role === 'user' ? 'bg-indigo-600 rounded-br-none' : 'bg-white/10 rounded-bl-none')}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {/* Pro users with transcript disabled */}
        {isPro && !showTranscript && (
           <div className="text-center text-white/60 p-8 bg-white/5 rounded-lg h-full flex flex-col justify-center items-center">
             <FileText className="mx-auto mb-4" size={48} />
             <h3 className="font-bold text-lg">Transcripts Hidden</h3>
             <p className="text-sm mt-2">Press the transcript button below to show the conversation.</p>
           </div>
        )}

        {/* Free users - Voice only mode */}
        {isFreeTierChat && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            <Mic className="w-24 h-24 text-indigo-400/50 mb-6 animate-pulse" />
            <h3 className="text-2xl font-bold">Voice-Only Mode</h3>
            <p className="text-white/50 max-w-sm mt-2">
              Your conversation with {agent.name} is in progress.
            </p>
            <button onClick={() => setShowUpgradeModal(true)} className="mt-6 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg">
              Upgrade to Pro to View Transcripts
            </button>
          </div>
        )}
      </div>
      
      <footer className="border-t border-white/10 p-4 flex items-center gap-4 bg-black/20 flex-shrink-0">
        <button onClick={handleTranscriptToggle} className={cn('p-4 rounded-full transition-colors', isPro && showTranscript ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20')}>
          <MessageSquare className="w-5 h-5"/>
        </button>
        <div className="flex-grow text-center">
          {status !== 'connected' ? 
            <button onClick={startConversationWithContext} className="bg-green-600 hover:bg-green-700 text-white font-bold p-4 rounded-full transition-all transform hover:scale-110"><Mic/></button> 
            : 
            <button onClick={stopConversationAndSummarize} className="bg-red-600 hover:bg-red-700 text-white font-bold p-4 rounded-full transition-all"><MicOff/></button>
          }
        </div>
        <p className={cn('text-sm transition-all w-24 text-right', status === 'connected' ? 'text-green-400' : 'text-yellow-400')}>{isSpeaking ? 'Speaking...' : status}</p>
      </footer>
    </div>
  );
}


const WelcomeBotChat = ({ agent, history, onBack }: { agent: Agent, history?: Conversation, onBack: () => void; }) => {
  const initialMessages: Message[] = [
    { role: 'agent', text: history?.lastMessage || agent.description }
  ];
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const prompts = [
    { question: "What is Aether AI Pro?", answer: "Aether AI Pro gives you access to all of our premium agents, conversation transcripts, and an ad-free experience. You can unlock it from the Store!" },
    { question: "How do I use the Store?", answer: "The 'Store' tab lets you discover new Pro agents. You can view their details and decide to purchase access to them individually or subscribe to Pro for all-access." },
    { question: "How does the AI remember me?", answer: "Our AI uses your profile details and summaries of past chats (a Pro feature!) to provide a personalized experience. You can manage this in your Settings." },
  ];
  const handlePromptClick = (question: string, answer: string) => {
    setMessages(prev => [ ...prev, { role: 'user', text: question }, { role: 'agent', text: answer } ]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black/30">
      <header className="p-4 border-b border-white/10 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2"><ArrowLeft /></button>
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', `bg-${agent.color}/20 text-${agent.color}`)}>
          <agent.icon className="w-6 h-6" />
        </div>
        <h3 className="font-bold">{agent.name}</h3>
      </header>
      <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={cn('flex items-end gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'agent' && (
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', `bg-${agent.color}/20 text-${agent.color}`)}>
                <agent.icon className="w-5 h-5" />
              </div>
            )}
            <div className={cn('max-w-md p-3 rounded-2xl text-white', msg.role === 'user' ? 'bg-indigo-600' : 'bg-white/10')}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <footer className="border-t border-white/10 p-4 bg-black/20 flex-shrink-0">
        <p className="text-sm font-semibold mb-3 text-center text-white/70">Tap a question to learn more</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {prompts.map(p => (
            <button key={p.question} onClick={() => handlePromptClick(p.question, p.answer)} className="bg-white/5 p-3 rounded-lg text-sm text-left hover:bg-white/10 transition-colors">
              {p.question}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

const PurchaseModal = ({ agent, onClose, onPurchase }: { agent: Agent | null; onClose: () => void; onPurchase: (planId: string, amount: number) => void; }) => {
  const [planType, setPlanType] = useState<'monthly' | 'annually'>('monthly');
  const proPrices = { monthly: 399, annually: 3990 };
  const singleAgentPrices = { monthly: 99, annually: 990 };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 rounded-2xl flex flex-col shadow-lg">
        <header className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3"><Sparkles className="w-6 h-6 text-indigo-400" /><h2 className="text-xl font-bold">Upgrade Your Experience</h2></div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="flex p-1 bg-black/20 rounded-full">
              <button onClick={() => setPlanType('monthly')} className={cn('px-6 py-2 text-sm font-semibold rounded-full', planType === 'monthly' ? 'bg-indigo-600 text-white' : 'text-white/70')}>Monthly</button>
              <button onClick={() => setPlanType('annually')} className={cn('px-6 py-2 text-sm font-semibold rounded-full relative', planType === 'annually' ? 'bg-indigo-600 text-white' : 'text-white/70')}>
                Annually
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">SAVE 20%</span>
              </button>
            </div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-6 mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Crown className="text-yellow-400"/> Aether AI Pro</h3>
            <p className="text-sm text-white/70 mt-1 mb-4">Get unlimited access to all current and future agents, transcripts, and premium features.</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold">₹{planType === 'monthly' ? proPrices.monthly : proPrices.annually}</p>
                <p className="text-xs text-white/50">per {planType === 'monthly' ? 'month' : 'year'}</p>
              </div>
              <button onClick={() => onPurchase('pro_' + planType, proPrices[planType])} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg">Subscribe</button>
            </div>
          </div>
          {agent && ( <div className="text-center my-4 text-white/50 text-sm">OR</div> )}
          {agent && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', `bg-${agent.color}/20 text-${agent.color}`)}><agent.icon className="w-4 h-4"/></div>
                Just {agent.name}
              </h3>
              <p className="text-sm text-white/70 mt-1 mb-4">Get lifetime access to this single agent.</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">₹{planType === 'monthly' ? singleAgentPrices.monthly : singleAgentPrices.annually}</p>
                  <p className="text-xs text-white/50">per {planType === 'monthly' ? 'month' : 'year'}</p>
                </div>
                <button onClick={() => onPurchase(agent.id + '_' + planType, singleAgentPrices[planType])} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg">Buy Now</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RatingModal = ({ agent, user, onClose, onReviewSubmit }: { agent: Agent; user: User; onClose: () => void; onReviewSubmit: () => void; }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'agent_reviews'), {
        agentId: agent.id,
        userId: user.uid,
        authorName: user.displayName || 'Anonymous',
        rating,
        text: reviewText,
        createdAt: serverTimestamp(),
      });

      const metaRef = doc(db, 'agent_meta', agent.id);
      await runTransaction(db, async (transaction) => {
        const metaDoc = await transaction.get(metaRef);
        if (!metaDoc.exists()) {
          transaction.set(metaRef, { averageRating: rating, reviewCount: 1 });
        } else {
          const newCount = metaDoc.data().reviewCount + 1;
          const oldRatingTotal = metaDoc.data().averageRating * metaDoc.data().reviewCount;
          const newAverage = (oldRatingTotal + rating) / newCount;
          transaction.update(metaRef, {
            reviewCount: newCount,
            averageRating: newAverage,
          });
        }
      });
      onReviewSubmit();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 rounded-2xl flex flex-col shadow-lg">
        <header className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Rate Your Conversation</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-8 space-y-6">
          <p className="text-center text-white/70">How was your conversation with {agent.name}?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
                <Star size={32} className={cn("transition-colors", (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-white/20')} />
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="review" className="block text-sm font-medium text-white/80 mb-2">Leave a review (optional)</label>
            <textarea id="review" value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} placeholder="Tell us what you think..." className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>
        </div>
        <footer className="p-6 border-t border-white/10 flex justify-end">
          <button onClick={handleSubmit} disabled={isSubmitting || rating === 0} className="w-full py-3 px-4 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </footer>
      </div>
    </div>
  );
};
