import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  Tag, 
  MessageSquare,
  ChevronRight,
  Flame
} from 'lucide-react';
import type { JournalEntry, AIInteractionMode } from '../types';

interface SidebarHistoryProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  isLoading: boolean;
}

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedTagFilter === 'all') return matchesSearch;
    return matchesSearch && entry.tags?.includes(selectedTagFilter);
  });

  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []).filter(Boolean))
  );

  return (
    <aside 
      id="reflection-history-sidebar" 
      className="w-full md:w-80 lg:w-96 flex flex-col bg-stone-50/70 border-r border-stone-200/80 h-[calc(100vh-4rem)] overflow-hidden shrink-0"
    >
      {/* Top Header & New Button */}
      <div className="p-4 border-b border-stone-200/80 space-y-3 bg-white/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-stone-600" />
            <h2 className="text-sm font-semibold text-stone-900 font-serif">
              Reflection Vault
            </h2>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-200 text-stone-700">
              {entries.length}
            </span>
          </div>

          <button
            id="new-reflection-button"
            type="button"
            onClick={onNewEntry}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-stone-800 active:bg-black transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            id="search-reflections-input"
            type="text"
            placeholder="Search entries or insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-stone-400 hover:text-stone-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tag Filters if tags exist */}
        {allTags.length > 0 && (
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              onClick={() => setSelectedTagFilter('all')}
              className={`px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${
                selectedTagFilter === 'all'
                  ? 'bg-amber-100 text-amber-900 font-medium'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(tag)}
                className={`px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${
                  selectedTagFilter === tag
                    ? 'bg-amber-100 text-amber-900 font-medium'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500">Syncing from Firestore...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-stone-700">
                {searchQuery ? 'No matching reflections found' : 'No reflections yet'}
              </p>
              <p className="text-[11px] text-stone-500 max-w-[200px] mx-auto">
                {searchQuery ? 'Try another search term' : 'Start your first multi-turn reflection with Gemini'}
              </p>
            </div>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            const interactionCount = entry.interactions?.length || 0;
            const dateStr = new Date(entry.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={entry.id}
                id={`history-item-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/60 border-amber-300/80 shadow-xs'
                    : 'bg-white border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      {entry.mood && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
                          {entry.mood}
                        </span>
                      )}
                      <h3 className="text-xs font-semibold text-stone-900 truncate">
                        {entry.title || 'Untitled Reflection'}
                      </h3>
                    </div>

                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                      {entry.summary || entry.content || 'Blank entry...'}
                    </p>

                    <div className="flex items-center space-x-3 mt-2 text-[10px] text-stone-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </span>

                      {interactionCount > 0 && (
                        <span className="flex items-center space-x-1 text-amber-700 font-medium">
                          <MessageSquare className="w-3 h-3" />
                          <span>{interactionCount} turns</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    id={`delete-entry-${entry.id}`}
                    type="button"
                    title="Delete reflection"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete reflection "${entry.title}"? This cannot be undone.`)) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
