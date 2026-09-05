import React, { useState } from 'react';
import { 
  Scale, 
  BookOpen, 
  GitFork, 
  Columns, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  Bookmark, 
  CheckCircle2, 
  FileSignature, 
  Download,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import type { 
  SourceDocument, 
  ResearchSession, 
  CaseAnalysis, 
  SavedFinding, 
  SupportedLanguage,
  UserRole,
  LawyerVerificationStatus
} from '../types';

interface LawyerWorkspaceViewProps {
  sources: SourceDocument[];
  sessions: ResearchSession[];
  analyses: CaseAnalysis[];
  findings: SavedFinding[];
  language: SupportedLanguage;
  userRole: UserRole;
  lawyerStatus: LawyerVerificationStatus;
  barEnrollmentNumber?: string;
  stateBarCouncil?: string;
  onOpenNewResearch: () => void;
  onOpenFactSearch: () => void;
  onOpenCaseComparison: () => void;
  onOpenCaseTrace: () => void;
  onOpenDigest: () => void;
  onOpenSourceLibrary: () => void;
}

export const LawyerWorkspaceView: React.FC<LawyerWorkspaceViewProps> = ({
  sources,
  sessions,
  analyses,
  findings,
  language,
  userRole,
  lawyerStatus,
  barEnrollmentNumber,
  stateBarCouncil,
  onOpenNewResearch,
  onOpenFactSearch,
  onOpenCaseComparison,
  onOpenCaseTrace,
  onOpenDigest,
  onOpenSourceLibrary,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-stone-100">
      
      {/* Workspace Header Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>Advocate & Legal Professional Workspace</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Advocate Research Chamber
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl font-sans">
            Rigorous, citation-accurate legal research grounded exclusively in authenticated Supreme Court & High Court judgments. All briefings, comparisons, and ratio analyses are strictly verified.
          </p>

          {barEnrollmentNumber && (
            <div className="pt-1 flex items-center space-x-3 text-xs text-stone-300 font-mono">
              <span className="px-2.5 py-1 bg-stone-950 border border-stone-800 rounded-lg text-amber-300">
                Enrollment: {barEnrollmentNumber}
              </span>
              <span className="text-stone-400">
                {stateBarCouncil || 'Bar Council of India'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenFactSearch}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>Fact-Based Case Search</span>
          </button>

          <button
            onClick={onOpenNewResearch}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded-xl text-xs font-semibold text-stone-200 border border-stone-700 cursor-pointer transition-colors"
          >
            <FileSignature className="w-4 h-4 text-amber-400" />
            <span>New Research Brief</span>
          </button>
        </div>
      </div>

      {/* Quick Action Chamber Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Module 1: Precedent & Fact Search */}
        <div 
          onClick={onOpenFactSearch}
          className="p-6 bg-stone-900 border border-stone-800 rounded-3xl hover:border-amber-500/50 transition-all cursor-pointer group space-y-4 shadow-lg"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
              Fact Similarity & Ratio Search
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Match your client's factual scenario against verified precedents with scoring on factual parity, legal issue alignment, and binding ratio.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-400 inline-flex items-center space-x-1">
            <span>Launch Fact Search</span>
            <span>→</span>
          </span>
        </div>

        {/* Module 2: Comparative Jurisprudence */}
        <div 
          onClick={onOpenCaseComparison}
          className="p-6 bg-stone-900 border border-stone-800 rounded-3xl hover:border-blue-500/50 transition-all cursor-pointer group space-y-4 shadow-lg"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Columns className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-white group-hover:text-blue-300 transition-colors">
              Case Comparison Matrix
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Compare conflicting or evolving authorities side-by-side: evaluate ratio decidendi, statutory interpretations, and distinguishing factors.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-400 inline-flex items-center space-x-1">
            <span>Compare Judgments</span>
            <span>→</span>
          </span>
        </div>

        {/* Module 3: Case Trace Network */}
        <div 
          onClick={onOpenCaseTrace}
          className="p-6 bg-stone-900 border border-stone-800 rounded-3xl hover:border-emerald-500/50 transition-all cursor-pointer group space-y-4 shadow-lg"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <GitFork className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
              Case Trace Precedent Graph
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Trace judicial treatment: identify which judgments were followed, distinguished, or overruled with verbatim quotes.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 inline-flex items-center space-x-1">
            <span>Explore Precedent Graph</span>
            <span>→</span>
          </span>
        </div>

      </div>

      {/* Overview Stats & Recent Chamber Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Case Briefs & Analyses */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-serif font-bold text-white">Analyzed Precedents & Structured Briefs</h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">{analyses.length} Records</span>
          </div>

          {analyses.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-xs space-y-1">
              <p>No structured case analyses generated yet.</p>
              <p className="text-stone-600">Select any approved judgment in the Source Library to generate an instant judicial brief.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.slice(0, 5).map((a) => (
                <div key={a.id} className="p-4 bg-stone-950 border border-stone-800/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-serif font-bold text-white">{a.caseName}</h4>
                    <span className="text-[10px] text-stone-500 font-mono">{a.citation}</span>
                  </div>
                  <p className="text-xs text-stone-300 line-clamp-2">
                    <strong className="text-amber-400">Ratio:</strong> {a.ratioDecidendi}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Verified Source Repository Status */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-800 pb-3">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-serif font-bold text-white">Authoritative Source Status</h3>
            </div>

            <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Grounding Engine</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Strict Zero-Hallucination</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Available Precedents</span>
                <span className="font-mono font-bold text-white">{sources.length} Judgments</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Saved Legal Findings</span>
                <span className="font-mono font-bold text-amber-400">{findings.length} Quotes</span>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Every ratio, quote, and precedent relationship cited in this workspace is anchored directly to official SCR or High Court verbatim text.
            </p>
          </div>

          <div className="pt-4 border-t border-stone-800 flex gap-2">
            <button
              onClick={onOpenDigest}
              className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold cursor-pointer text-center"
            >
              Generate Research Digest
            </button>
            <button
              onClick={onOpenSourceLibrary}
              className="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold cursor-pointer text-center"
            >
              View Source Library
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
