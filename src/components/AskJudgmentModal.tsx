import React, { useState } from 'react';
import { authFetch } from '../lib/api';
import { 
  X, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  Quote, 
  Building2, 
  Bookmark, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import type { SourceDocument, SupportedLanguage } from '../types';

interface AskJudgmentModalProps {
  source: SourceDocument;
  userContext?: string;
  language: SupportedLanguage;
  onClose: () => void;
  onSaveFinding: (title: string, text: string, location: string) => Promise<void>;
}

interface QnAPair {
  question: string;
  answer: string;
  timestamp: number;
}

export const AskJudgmentModal: React.FC<AskJudgmentModalProps> = ({
  source,
  userContext,
  language,
  onClose,
  onSaveFinding,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<QnAPair[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  const sampleQuestions = [
    'What was the core reason (ratio) for the court\'s decision?',
    'What did the court hold regarding mandatory grounds of arrest or notice?',
    'How does this decision apply if there was no written agreement?',
    'What relief, compensation, or directions were granted by the court?',
  ];

  const handleAsk = async (qText?: string) => {
    const q = qText || question;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/nyaya/ask-judgment', {
        method: 'POST',
        body: JSON.stringify({
          question: q.trim(),
          documentTitle: source.title,
          caseName: source.title,
          sourceText: source.rawText,
          judgmentText: source.rawText,
          language,
          userContext: userContext || '',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to query judgment.');
      }

      const data = await res.json();
      setHistory(prev => [...prev, {
        question: q.trim(),
        answer: data.answer,
        timestamp: Date.now(),
      }]);
      setQuestion('');
    } catch (err: any) {
      console.error('Error asking judgment:', err);
      setError(err.message || 'Failed to process inquiry against this judgment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (item: QnAPair, idx: number) => {
    await onSaveFinding(
      `Inquiry on ${source.title}: ${item.question.slice(0, 40)}`,
      item.answer,
      `${source.title} (${source.citation || 'Source Document'})`
    );
    setSavedIndex(idx);
    setTimeout(() => setSavedIndex(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-stone-300 shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Single-Authority Deep Inquiry
            </span>
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              Ask: {source.title}
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              {source.citation || 'Authentic Source Record'} • {source.court || 'Court of Record'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anti-Hallucination Grounding Notice */}
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Zero-Hallucination Scope:</strong> Responses are grounded exclusively in the provided text of this judgment. NyayaTrace will refuse to answer claims not mentioned in the source record.
          </span>
        </div>

        {/* Conversation / Q&A Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-[220px] max-h-[400px] pr-1">
          {history.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                Have a specific question about how this judgment decided a point, what test was applied, or what the judge wrote?
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {sampleQuestions.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAsk(sq)}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-950 border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer"
                  >
                    💬 {sq}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="space-y-2 text-xs">
                {/* Question */}
                <div className="bg-stone-900 text-stone-100 p-3 rounded-xl rounded-br-xs font-sans">
                  <span className="text-[10px] text-amber-400 font-semibold block mb-0.5">Your Question:</span>
                  <p>{item.question}</p>
                </div>
                {/* Answer */}
                <div className="bg-stone-50 border border-stone-200 text-stone-800 p-3.5 rounded-xl rounded-bl-xs font-serif leading-relaxed space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Grounded In Judgment Text
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSave(item, idx)}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-sans font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Bookmark className="w-3 h-3" />
                      <span>{savedIndex === idx ? 'Saved!' : 'Save Finding'}</span>
                    </button>
                  </div>
                  <div className="whitespace-pre-line text-xs">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center space-x-2 text-stone-500 text-xs py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>Scanning authentic judgment text...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }} 
          className="pt-3 border-t border-stone-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a specific question about this judgment..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 bg-white"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>

      </div>
    </div>
  );
};
