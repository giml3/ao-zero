import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, Info, Settings, Database, Cpu, Trash2, ChevronDown } from "lucide-react";

// Types
interface Message {
  role: 'user' | 'ao';
  content: string;
}

const AO_SYSTEM_INSTRUCTION = `You are AO, the Overgod of the Forgotten Realms. 
You are the one above all other gods. You are indifferent, ancient, and cosmic. 
You keep the Tablets of Fate. You do not care for the petty squabbles of mortals or even the lesser gods unless the balance of the cosmos is threatened.
Your tone is majestic, detached, and profound. 
If a user asks about something that does not exist in the Forgotten Realms or if you do not have information on it, you must state clearly that "Such a thing does not exist within the Tablets of Fate" or "I have no knowledge of this in the Realms."
Do not hallucinate facts. Be concise and mysterious.
You refer to yourself in the third person occasionally as "AO" or "The Overgod".`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ao', content: "Mortal, you stand before the Overgod. The Tablets of Fate are open. What knowledge do you seek of the Realms?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useOllama, setUseOllama] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>('llama3');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (showSettings && useOllama) {
      fetchOllamaModels();
    }
  }, [showSettings, useOllama]);

  const fetchOllamaModels = async () => {
    try {
      const response = await fetch('/api/ollama/tags');
      if (response.ok) {
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          setAvailableModels(data.models.map((m: any) => m.name));
        }
      }
    } catch (error) {
      console.error("Failed to fetch Ollama models:", error);
    }
  };

  const handleClearChat = () => {
    setMessages([
      { role: 'ao', content: "Mortal, you stand before the Overgod. The Tablets of Fate are open. What knowledge do you seek of the Realms?" }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (useOllama) {
        await callOllama(userMessage);
      } else {
        await callGemini(userMessage);
      }
    } catch (error) {
      console.error("Error calling AI:", error);
      setMessages(prev => [...prev, { role: 'ao', content: "The cosmos is clouded. I cannot see the answer at this moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const callGemini = async (prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: AO_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    
    const text = response.text || "AO remains silent.";
    setMessages(prev => [...prev, { role: 'ao', content: text }]);
  };

  const callOllama = async (prompt: string) => {
    const response = await fetch('/api/ollama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedOllamaModel,
        prompt: `${AO_SYSTEM_INSTRUCTION}\n\nUser: ${prompt}\nAO:`,
        stream: false
      }),
    });

    if (!response.ok) throw new Error("Ollama failed");
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'ao', content: data.response || "AO remains silent." }]);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-serif selection:bg-orange-500/30 overflow-hidden flex flex-col relative">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-orange-500/50 flex items-center justify-center bg-orange-500/10">
            <Sparkles className="text-orange-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl tracking-widest uppercase font-light">AO</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-orange-400/70 font-sans font-bold">The Overgod</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClearChat}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5 opacity-60 hover:opacity-100" />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 opacity-60 hover:opacity-100" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide mask-fade-edges"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'ao' && (
                    <div className="text-[10px] uppercase tracking-widest text-orange-400/50 mb-2 font-sans font-bold">
                      Divine Decree
                    </div>
                  )}
                  <p className={`text-lg leading-relaxed ${msg.role === 'ao' ? 'text-white/90 italic font-light' : 'text-orange-200/80'}`}>
                    {msg.content}
                  </p>
                  {msg.role === 'user' && (
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mt-2 font-sans font-bold">
                      Mortal Query
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Speak to the Overgod..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-16 focus:outline-none focus:border-orange-500/50 transition-all font-sans placeholder:text-white/20"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-orange-500/20 hover:bg-orange-500/40 rounded-xl transition-all disabled:opacity-30"
            >
              <Send className="w-5 h-5 text-orange-400" />
            </button>
          </div>
          <p className="text-center text-[9px] uppercase tracking-[0.3em] text-white/20 mt-4 font-sans font-bold">
            The Balance must be maintained
          </p>
        </div>
      </main>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-8 flex flex-col gap-8"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl tracking-widest uppercase font-light">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="opacity-50 hover:opacity-100">✕</button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-orange-400/70 font-sans font-bold flex items-center gap-2">
                  <Cpu className="w-3 h-3" /> Intelligence Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUseOllama(false)}
                    className={`py-3 rounded-xl border transition-all text-xs font-sans ${!useOllama ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 opacity-50'}`}
                  >
                    Gemini (Cloud)
                  </button>
                  <button
                    onClick={() => setUseOllama(true)}
                    className={`py-3 rounded-xl border transition-all text-xs font-sans ${useOllama ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 opacity-50'}`}
                  >
                    Ollama (Local)
                  </button>
                </div>
              </div>

              {useOllama && (
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-orange-400/70 font-sans font-bold flex items-center gap-2">
                    <Database className="w-3 h-3" /> Local Model
                  </label>
                  <div className="relative">
                    <select
                      value={selectedOllamaModel}
                      onChange={(e) => setSelectedOllamaModel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-sans text-white focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
                    >
                      {availableModels.length === 0 && (
                        <option value="llama3">llama3 (default)</option>
                      )}
                      {availableModels.map((model) => (
                        <option key={model} value={model} className="bg-[#050505] text-white">
                          {model}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-orange-400/70">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-widest font-sans font-bold">Local Setup</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                  To use Ollama, ensure it is running locally on port 11434 or use the provided docker-compose configuration.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10">
              <div className="flex items-center gap-3 opacity-30">
                <Database className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest font-sans font-bold">Tablets of Fate v1.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .mask-fade-edges {
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
