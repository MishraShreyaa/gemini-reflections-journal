import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Lightbulb, 
  ListChecks, 
  HelpCircle, 
  Save, 
  Check, 
  RotateCw, 
  Tag, 
  Plus, 
  X, 
  Copy, 
  Bot, 
  User, 
  ShieldCheck, 
  MessageSquare,
  Wand2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import type { JournalEntry, InteractionMessage, AIInteractionMode } from '../types';

interface ActiveReflectionCanvasProps {
  entry: JournalEntry;
  onSaveEntry: (updatedEntry: JournalEntry) => Promise<void>;
  saveStatus: 'saved' | 'saving' | 'error';
  userId: string;
}

const MOODS = [
  'Reflective',
  'Inspired',
  'Focused',
  'Calm',
  'Grateful',
  'Challenged',
  'Restless',
  'Joyful'
];

const MODES: { id: AIInteractionMode; label: string; icon: any; desc: string }[] = [
  { id: 'reflection', label: 'Deep Reflection', icon: Sparkles, desc: 'Nuanced unpacking & emotional clarity' },
  { id: 'brainstorm', label: 'Brainstorm Ideas', icon: Lightbulb, desc: 'Diverse angles & creative solutions' },
  { id: 'summary', label: 'Executive Summary', icon: ListChecks, desc: 'Structured synthesis & core takeaways' },
  { id: 'coaching', label: 'Socratic Coach', icon: HelpCircle, desc: 'Challenging questions & cognitive shifts' },
];

const PROMPT_SUGGESTIONS: Record<AIInteractionMode, string[]> = {
  reflection: [
    'What underlying emotional pattern or assumption stands out here?',
    'How can I reframe this situation constructively?',
    'What would a calm, grounded perspective advise?',
  ],
  brainstorm: [
    'Brainstorm 4 creative ways to approach this challenge.',
    'What are the low-effort high-impact quick wins?',
    'What is a completely counter-intuitive strategy here?',
  ],
  summary: [
    'Synthesize my entry into 3 key takeaways and a 1-sentence bottom line.',
    'Extract any actionable commitments or decisions mentioned.',
    'Summarize my main cognitive breakthroughs today.',
  ],
  coaching: [
    'What powerful question should I be asking myself right now?',
    'Where might I be holding a blind spot or false dichotomy?',
    'What is the true obstacle under the surface?',
  ],
};

export const ActiveReflectionCanvas: React.FC<ActiveReflectionCanvasProps> = ({
  entry,
  onSaveEntry,
  saveStatus,
  userId,
}) => {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [mood, setMood] = useState(entry.mood || 'Reflective');
  const [tags, setTags] = useState<string[]>(entry.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<AIInteractionMode>('reflection');
  
  const [interactions, setInteractions] = useState<InteractionMessage[]>(entry.interactions || []);
  const [summary, setSummary] = useState(entry.summary || '');
  const [keyInsights, setKeyInsights] = useState<string[]>(entry.keyInsights || []);
  
  const [followupPrompt, setFollowupPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync state when active entry prop changes
  useEffect(() => {
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || 'Reflective');
    setTags(entry.tags || []);
    setInteractions(entry.interactions || []);
    setSummary(entry.summary || '');
    setKeyInsights(entry.keyInsights || []);
    setAiError(null);
  }, [entry.id]);

  // Scroll to bottom of interaction thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions, isGenerating]);

  // Auto-save handler
  const triggerAutoSave = (overrides?: Partial<JournalEntry>) => {
    const updated: JournalEntry = {
      ...entry,
      title: title || 'Untitled Reflection',
      content,
      mood,
      tags,
      interactions,
      summary,
      keyInsights,
      updatedAt: Date.now(),
      ...overrides,
    };
    onSaveEntry(updated);
  };

  // Add Tag
  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      const nextTags = [...tags, trimmed];
      setTags(nextTags);
      setNewTagInput('');
      triggerAutoSave({ tags: nextTags });
    }
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    triggerAutoSave({ tags: nextTags });
  };

  // AI Title Suggestion
  const handleSuggestTitle = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      });
      if (!res.ok) throw new Error('Failed to generate title');
      const data = await res.json();
      if (data.suggestedTitle) {
        setTitle(data.suggestedTitle);
        triggerAutoSave({ title: data.suggestedTitle });
      }
    } catch (err: any) {
      setAiError(err.message || 'Could not suggest title.');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Executive Summary Generation
  const handleGenerateSummary = async () => {
    if (!content.trim() && interactions.length === 0) {
      setAiError('Please write some reflection content first.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const fullContext = `${content}\n\n${interactions.map(m => `${m.role}: ${m.content}`).join('\n')}`;
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fullContext, title }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to synthesize summary.');
      }

      const data = await res.json();
      const newSummary = data.summary || '';
      const newInsights = Array.isArray(data.keyInsights) ? data.keyInsights : [];
      
      setSummary(newSummary);
      setKeyInsights(newInsights);
      
      triggerAutoSave({
        summary: newSummary,
        keyInsights: newInsights,
      });
    } catch (err: any) {
      setAiError(err.message || 'Error generating summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit Prompt to Gemini (Multi-turn Reflection)
  const handleSendPrompt = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || followupPrompt).trim();
    if (!promptToSend && !content.trim()) return;

    setIsGenerating(true);
    setAiError(null);

    const userMessageId = `user_${Date.now()}`;
    const userMessage: InteractionMessage = {
      id: userMessageId,
      role: 'user',
      content: promptToSend || 'Analyze this reflection and provide your perspective.',
      timestamp: Date.now(),
      mode: selectedMode,
    };

    const nextInteractions = [...interactions, userMessage];
    setInteractions(nextInteractions);
    setFollowupPrompt('');

    try {
      // Build history payload for Gemini API
      const historyPayload = interactions.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: msg.content }],
      }));

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.content,
          history: historyPayload,
          mode: selectedMode,
          contextContent: content,
          entryTitle: title,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gemini reflection service returned an error.');
      }

      const data = await res.json();
      const assistantMessage: InteractionMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        mode: selectedMode,
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
      };

      const finalInteractions = [...nextInteractions, assistantMessage];
      setInteractions(finalInteractions);

      // Persist to user's isolated Firestore
      triggerAutoSave({
        interactions: finalInteractions,
      });

    } catch (err: any) {
      console.error('AI reflection failed:', err);
      setAiError(err.message || 'Failed to connect to Gemini API. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main 
      id="active-reflection-canvas"
      className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white overflow-y-auto"
    >
      {/* Top Toolbar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-stone-200/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Title & Suggestion */}
        <div className="flex-1 min-w-[280px] flex items-center space-x-2">
          <input
            id="reflection-title-input"
            type="text"
            placeholder="Title your reflection..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => triggerAutoSave({ title })}
            className="w-full text-base sm:text-lg font-serif font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-200 focus:border-amber-500 focus:outline-none px-1 py-0.5 transition-colors"
          />
          <button
            id="suggest-title-button"
            type="button"
            onClick={handleSuggestTitle}
            disabled={isGenerating || !content.trim()}
            title="Auto-generate title with Gemini"
            className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 transition-colors shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status & Quick Actions */}
        <div className="flex items-center space-x-3">
          {/* Save Status Indicator */}
          <div 
            id="firestore-save-status" 
            className="flex items-center space-x-1.5 text-xs text-stone-500"
          >
            {saveStatus === 'saving' ? (
              <span className="flex items-center space-x-1 text-amber-600 font-medium">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Saving to Firestore...</span>
              </span>
            ) : saveStatus === 'error' ? (
              <button 
                onClick={() => triggerAutoSave()}
                className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Retry Save</span>
              </button>
            ) : (
              <span className="flex items-center space-x-1 text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Isolated Vault Saved</span>
              </span>
            )}
          </div>

          {/* Generate Executive Summary Button */}
          <button
            id="generate-summary-button"
            type="button"
            onClick={handleGenerateSummary}
            disabled={isGenerating || (!content.trim() && interactions.length === 0)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 disabled:opacity-40 transition-colors cursor-pointer border border-stone-200"
          >
            <FileText className="w-3.5 h-3.5 text-stone-600" />
            <span>Generate Summary</span>
          </button>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto p-6 space-y-6">
        
        {/* Metadata Controls: Mood & Mode Selector */}
        <div className="p-4 bg-stone-50/70 border border-stone-200/80 rounded-2xl space-y-3.5">
          
          {/* Mood Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 mr-1">
              Mood:
            </span>
            {MOODS.map((m) => (
              <button
                key={m}
                id={`mood-pill-${m.toLowerCase()}`}
                type="button"
                onClick={() => {
                  setMood(m);
                  triggerAutoSave({ mood: m });
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  mood === m
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* AI Focus Mode Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Gemini Perspective Mode:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MODES.map((m) => {
                const Icon = m.icon;
                const isCurrent = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    id={`mode-button-${m.id}`}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? 'bg-amber-50/80 border-amber-400/90 text-amber-950 ring-1 ring-amber-400/40'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-700' : 'text-stone-400'}`} />
                      <span className="text-xs font-semibold">{m.label}</span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                      {m.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-200/60">
            <Tag className="w-3.5 h-3.5 text-stone-400 mr-1" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-800 text-xs font-medium"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="inline-flex items-center space-x-1">
              <input
                type="text"
                placeholder="Add tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="w-20 px-2 py-0.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="p-1 text-stone-500 hover:text-stone-800"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Primary Journal Content Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="journal-entry-content"
              className="text-xs font-semibold uppercase tracking-wider text-stone-500"
            >
              Your Reflection / Entry
            </label>
            <span className="text-[11px] text-stone-400">
              {content.length} characters
            </span>
          </div>

          <textarea
            id="journal-entry-content"
            rows={7}
            placeholder="Write your raw thoughts, questions, dilemmas, or experiences here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => triggerAutoSave({ content })}
            className="w-full p-4 rounded-2xl bg-white border border-stone-200/90 text-stone-900 text-sm leading-relaxed placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans shadow-xs resize-y"
          />
        </div>

        {/* Executive Summary Card (if generated) */}
        {(summary || (keyInsights && keyInsights.length > 0)) && (
          <div 
            id="executive-summary-card"
            className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 font-serif">
                  Executive AI Synthesis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(`${summary}\n\nInsights:\n${keyInsights.join('\n')}`, 'summary')}
                className="inline-flex items-center space-x-1 text-xs text-amber-800 hover:text-amber-950 font-medium"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedId === 'summary' ? 'Copied!' : 'Copy Synthesis'}</span>
              </button>
            </div>

            {summary && (
              <p className="text-xs text-stone-800 leading-relaxed font-sans font-medium">
                {summary}
              </p>
            )}

            {keyInsights && keyInsights.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-amber-200/50">
                <span className="text-[11px] font-semibold text-amber-900">Key Breakthroughs:</span>
                <ul className="space-y-1">
                  {keyInsights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-stone-700 flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Multi-Turn Reflection Thread */}
        <div className="space-y-4 pt-4 border-t border-stone-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-stone-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-serif">
                Multi-Turn Conversation with Gemini ({interactions.length} exchanges)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
              Primary: gemini-3.6-flash
            </span>
          </div>

          {/* Conversation history items */}
          <div className="space-y-3">
            {interactions.map((msg) => {
              const isAi = msg.role === 'assistant';
              const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id}
                  id={`chat-message-${msg.id}`}
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    isAi
                      ? 'bg-amber-50/30 border-amber-200/60 text-stone-900 space-y-2'
                      : 'bg-white border-stone-200 text-stone-800 ml-4 sm:ml-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-stone-100">
                    <div className="flex items-center space-x-1.5">
                      {isAi ? (
                        <>
                          <Bot className="w-3.5 h-3.5 text-amber-700" />
                          <span className="font-semibold text-amber-950 font-serif">Gemini Partner</span>
                          {msg.modelUsed && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              {msg.modelUsed}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5 text-stone-600" />
                          <span className="font-semibold text-stone-800">You</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-stone-400">
                      <span>{timeStr}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.content, msg.id)}
                        className="hover:text-stone-600"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-stone-800 text-xs sm:text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {isGenerating && (
              <div 
                id="ai-generating-indicator"
                className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 flex items-center space-x-3 animate-pulse"
              >
                <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-amber-900 font-medium">
                  Gemini 3.6 Flash is reflecting on your entry...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* AI Error Alert */}
          {aiError && (
            <div 
              id="ai-error-alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between space-x-2"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiError}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSendPrompt()}
                className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded font-semibold text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Suggested Prompt Chips */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-semibold text-stone-500">
              Suggested prompts for {MODES.find(m => m.id === selectedMode)?.label}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS[selectedMode].map((prompt, idx) => (
                <button
                  key={idx}
                  id={`prompt-suggestion-${idx}`}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleSendPrompt(prompt)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-stone-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200 border border-stone-200 text-stone-700 transition-colors disabled:opacity-40 text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Prompt Input Box */}
          <div className="pt-2">
            <div className="relative rounded-2xl border border-stone-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 bg-white shadow-xs transition-all">
              <textarea
                id="followup-prompt-input"
                rows={2}
                placeholder={`Ask Gemini for reflections, brainstorming, or insights in ${MODES.find(m => m.id === selectedMode)?.label} mode...`}
                value={followupPrompt}
                onChange={(e) => setFollowupPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                className="w-full p-3.5 pr-24 text-xs sm:text-sm text-stone-900 placeholder-stone-400 bg-transparent focus:outline-none resize-none"
              />

              <div className="absolute right-2.5 bottom-2.5 flex items-center space-x-2">
                <button
                  id="send-prompt-button"
                  type="button"
                  disabled={isGenerating || (!followupPrompt.trim() && !content.trim())}
                  onClick={() => handleSendPrompt()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <span>Reflect</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-stone-400 mt-1.5 px-1">
              Press Enter to send. All prompts and Gemini replies are automatically saved to your isolated Firestore document.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
};
