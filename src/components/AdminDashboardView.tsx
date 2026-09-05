import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  Users, 
  FileCheck, 
  History, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Archive, 
  Trash2, 
  Search, 
  Filter, 
  ExternalLink,
  Lock,
  UserCheck,
  Scale,
  RefreshCw,
  Building,
  Calendar,
  Eye
} from 'lucide-react';
import { 
  fetchAdminSources, 
  createAdminSource, 
  updateAdminSourceStatus, 
  fetchAdminLawyerApplications, 
  decideAdminLawyerApplication, 
  fetchAdminUsers, 
  updateAdminUserRole, 
  fetchAdminAuditLogs 
} from '../lib/firebase';
import type { SupportedLanguage } from '../types';

interface AdminDashboardViewProps {
  language: SupportedLanguage;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'lawyers' | 'users' | 'audit'>('sources');
  
  // Sources state
  const [sources, setSources] = useState<any[]>([]);
  const [sourceStatusFilter, setSourceStatusFilter] = useState<string>('ALL');
  const [sourceSearch, setSourceSearch] = useState('');
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [viewingSource, setViewingSource] = useState<any | null>(null);

  // New source form state
  const [newTitle, setNewTitle] = useState('');
  const [newCitation, setNewCitation] = useState('');
  const [newCourt, setNewCourt] = useState('Supreme Court of India');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRawText, setNewRawText] = useState('');
  const [newStatutes, setNewStatutes] = useState('');
  const [newStatus, setNewStatus] = useState<'ADMIN_APPROVED' | 'UNDER_REVIEW'>('ADMIN_APPROVED');
  const [newNotes, setNewNotes] = useState('Verified authoritative judgment.');

  // Lawyer applications state
  const [lawyerApps, setLawyerApps] = useState<any[]>([]);
  const [lawyerFilter, setLawyerFilter] = useState<string>('ALL');

  // Users state
  const [users, setUsers] = useState<any[]>([]);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Loading / Action states
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [srcs, apps, usrList, logs] = await Promise.all([
        fetchAdminSources(),
        fetchAdminLawyerApplications(),
        fetchAdminUsers(),
        fetchAdminAuditLogs(),
      ]);
      setSources(srcs);
      setLawyerApps(apps);
      setUsers(usrList);
      setAuditLogs(logs);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load administrative data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerFeedback = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Source Actions
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRawText.trim()) {
      setActionError('Title and Raw Judgment Text are mandatory.');
      return;
    }

    try {
      await createAdminSource({
        title: newTitle.trim(),
        citation: newCitation.trim() || 'Official Law Report',
        court: newCourt.trim(),
        date: newDate,
        rawText: newRawText.trim(),
        status: newStatus,
        statutesReferenced: newStatutes ? newStatutes.split(',').map(s => s.trim()) : [],
        adminReviewNotes: newNotes.trim(),
      });
      triggerFeedback(`Successfully added "${newTitle}".`);
      setIsAddSourceModalOpen(false);
      setNewTitle('');
      setNewCitation('');
      setNewRawText('');
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add source.');
    }
  };

  const handleSourceStatusChange = async (sourceId: string, status: string) => {
    try {
      await updateAdminSourceStatus(sourceId, status, `Status changed to ${status} by Administrator.`);
      triggerFeedback(`Updated source status to ${status}.`);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update source status.');
    }
  };

  // Lawyer Application Actions
  const handleLawyerDecision = async (appId: string, decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    try {
      await decideAdminLawyerApplication(appId, decision, `Decided ${decision} via Admin Portal.`);
      triggerFeedback(`Lawyer application marked as ${decision}.`);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to process lawyer application.');
    }
  };

  // User Actions
  const handleUserRoleChange = async (uid: string, role: string) => {
    try {
      await updateAdminUserRole(uid, role);
      triggerFeedback(`Updated user role to ${role}.`);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user role.');
    }
  };

  const handleUserSuspensionToggle = async (uid: string, currentSuspended: boolean) => {
    try {
      await updateAdminUserRole(uid, undefined, !currentSuspended);
      triggerFeedback(currentSuspended ? 'User account restored.' : 'User account suspended.');
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update suspension status.');
    }
  };

  // Filtered Sources
  const filteredSources = sources.filter(s => {
    const matchesStatus = sourceStatusFilter === 'ALL' || s.status === sourceStatusFilter;
    const matchesSearch = !sourceSearch || 
      s.title?.toLowerCase().includes(sourceSearch.toLowerCase()) || 
      s.citation?.toLowerCase().includes(sourceSearch.toLowerCase()) ||
      s.court?.toLowerCase().includes(sourceSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Lawyer Apps
  const filteredLawyerApps = lawyerApps.filter(a => {
    return lawyerFilter === 'ALL' || a.verificationStatus === lawyerFilter;
  });

  const pendingAppsCount = lawyerApps.filter(a => a.verificationStatus === 'PENDING').length;
  const approvedSourcesCount = sources.filter(s => s.status === 'ADMIN_APPROVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-stone-100">
      
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>NyayaTrace Master Administrator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Security & Source Control Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl font-sans">
            Only <span className="text-emerald-400 font-semibold">ADMIN_APPROVED</span> sources are indexed by the legal AI engine. Manage advocate credentials, audit events, and user authorizations server-side.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 rounded-xl text-xs font-semibold text-stone-200 border border-stone-700 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh System State</span>
          </button>

          <button
            onClick={() => setIsAddSourceModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Authoritative Judgment</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-1">
          <p className="text-xs font-medium text-stone-400">Approved Sources</p>
          <p className="text-2xl font-bold text-emerald-400">{approvedSourcesCount}</p>
          <p className="text-[11px] text-stone-500">Indexed in Grounded Search</p>
        </div>

        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-1">
          <p className="text-xs font-medium text-stone-400">Lawyer Applications</p>
          <p className="text-2xl font-bold text-amber-400">{pendingAppsCount} Pending</p>
          <p className="text-[11px] text-stone-500">{lawyerApps.length} Total Applicants</p>
        </div>

        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-1">
          <p className="text-xs font-medium text-stone-400">Active Users</p>
          <p className="text-2xl font-bold text-blue-400">{users.length}</p>
          <p className="text-[11px] text-stone-500">Registered Advocates & Litigants</p>
        </div>

        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-1">
          <p className="text-xs font-medium text-stone-400">Security Audit Logs</p>
          <p className="text-2xl font-bold text-rose-400">{auditLogs.length}</p>
          <p className="text-[11px] text-stone-500">Immutable Event Trail</p>
        </div>
      </div>

      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center space-x-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-stone-800 space-x-1 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'sources'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Authoritative Sources ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lawyers')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'lawyers'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>
            Lawyer Verification
            {pendingAppsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-stone-950 font-bold">
                {pendingAppsCount}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Role Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Sources Management */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 border border-stone-800 rounded-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-stone-400">Status:</span>
              {['ALL', 'ADMIN_APPROVED', 'UNDER_REVIEW', 'REJECTED', 'ARCHIVED'].map(status => (
                <button
                  key={status}
                  onClick={() => setSourceStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    sourceStatusFilter === status
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
              <input
                type="text"
                placeholder="Search judgment title or citation..."
                value={sourceSearch}
                onChange={e => setSourceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredSources.map(src => (
              <div
                key={src.id}
                className="p-5 bg-stone-900 border border-stone-800 rounded-2xl hover:border-stone-700 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-serif font-bold text-white">{src.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        src.status === 'ADMIN_APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : src.status === 'UNDER_REVIEW'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : src.status === 'ARCHIVED'
                          ? 'bg-stone-500/20 text-stone-300'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {src.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                      <span><strong className="text-stone-300">Citation:</strong> {src.citation}</span>
                      <span><strong className="text-stone-300">Court:</strong> {src.court}</span>
                      <span><strong className="text-stone-300">Date:</strong> {src.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewingSource(src)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-400" />
                      <span>View Text</span>
                    </button>

                    {src.status !== 'ADMIN_APPROVED' && (
                      <button
                        onClick={() => handleSourceStatusChange(src.id, 'ADMIN_APPROVED')}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Approve</span>
                      </button>
                    )}

                    {src.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleSourceStatusChange(src.id, 'REJECTED')}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Reject</span>
                      </button>
                    )}

                    {src.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleSourceStatusChange(src.id, 'ARCHIVED')}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleSourceStatusChange(src.id, 'DELETED')}
                      className="p-1.5 bg-stone-800 hover:bg-rose-900/50 text-stone-400 hover:text-rose-300 rounded-xl cursor-pointer"
                      title="Delete Source"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {src.adminReviewNotes && (
                  <p className="text-xs text-stone-400 bg-stone-950/60 p-2 rounded-xl border border-stone-800/80">
                    <strong className="text-stone-300">Admin Review Notes:</strong> {src.adminReviewNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Lawyer Verification */}
      {activeTab === 'lawyers' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-stone-900/60 p-4 border border-stone-800 rounded-2xl">
            <span className="text-xs font-semibold text-stone-400">Filter Status:</span>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(st => (
              <button
                key={st}
                onClick={() => setLawyerFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  lawyerFilter === st
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredLawyerApps.length === 0 ? (
            <div className="text-center py-12 bg-stone-900 border border-stone-800 rounded-2xl text-stone-400 space-y-2">
              <UserCheck className="w-8 h-8 mx-auto text-stone-500" />
              <p className="text-sm">No lawyer verification applications matching filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredLawyerApps.map(app => (
                <div
                  key={app.id}
                  className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-4 hover:border-stone-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-serif font-bold text-white">{app.fullName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.verificationStatus === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : app.verificationStatus === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {app.verificationStatus}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400">
                        {app.email} • UID: <span className="font-mono text-stone-500">{app.userId}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {app.verificationStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleLawyerDecision(app.id, 'APPROVED')}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-xl inline-flex items-center space-x-1.5 cursor-pointer shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Grant Lawyer Role</span>
                        </button>
                      )}

                      {app.verificationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleLawyerDecision(app.id, 'REJECTED')}
                          className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Reject</span>
                        </button>
                      )}

                      {app.verificationStatus === 'APPROVED' && (
                        <button
                          onClick={() => handleLawyerDecision(app.id, 'SUSPENDED')}
                          className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Suspend</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs">
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">Bar Enrollment #</span>
                      <span className="font-mono text-amber-300 font-semibold">{app.barEnrollmentNumber}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">State Bar Council</span>
                      <span className="text-stone-200">{app.stateBarCouncil}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">Practice Experience</span>
                      <span className="text-stone-200">{app.experienceYears || 1} Years</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase font-bold">Submitted Date</span>
                      <span className="text-stone-200">{new Date(app.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Users & Roles */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">User Identity / Email</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Lawyer Status</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 text-right">Role Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 text-stone-200">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-stone-800/40">
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{u.email || 'Anonymous Advocate'}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{u.uid}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : u.role === 'LAWYER'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-stone-700 text-stone-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-stone-300">{u.lawyerStatus || 'NONE'}</span>
                      </td>
                      <td className="p-3.5">
                        {u.isSuspended ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/30 text-rose-300 font-semibold">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleUserRoleChange(u.uid, e.target.value)}
                          className="px-2 py-1 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                        >
                          <option value="USER">USER</option>
                          <option value="LAWYER">LAWYER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        <button
                          onClick={() => handleUserSuspensionToggle(u.uid, !!u.isSuspended)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            u.isSuspended
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                          }`}
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl text-xs space-y-1">
            <p className="font-semibold text-stone-200">Immutable Audit Trail</p>
            <p className="text-stone-400">All administrative operations, role modifications, lawyer verification decisions, and source updates are recorded here.</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl divide-y divide-stone-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-stone-800 text-amber-300 font-mono font-bold rounded text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-stone-300">{log.details}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono">
                    By: {log.performedByEmail} ({log.performedByUid}) • Target: {log.targetEntityType || 'system'}:{log.targetEntityId || 'global'}
                  </p>
                </div>
                <div className="text-[11px] text-stone-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Authoritative Source */}
      {isAddSourceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-serif font-bold text-white">Upload Authoritative Judgment</h3>
              <button onClick={() => setIsAddSourceModalOpen(false)} className="text-stone-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleAddSource} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Case Name / Judgment Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Vineeta Sharma v. Rakesh Sharma"
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-white focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Official Citation</label>
                  <input
                    type="text"
                    value={newCitation}
                    onChange={e => setNewCitation(e.target.value)}
                    placeholder="e.g. (2020) 9 SCC 1"
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Court / Forum</label>
                  <input
                    type="text"
                    value={newCourt}
                    onChange={e => setNewCourt(e.target.value)}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Judgment Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Statutes & Sections (Comma Separated)</label>
                <input
                  type="text"
                  value={newStatutes}
                  onChange={e => setNewStatutes(e.target.value)}
                  placeholder="e.g. Section 6 Hindu Succession Act, 1956"
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Verbatim Judgment Text (Unedited) *</label>
                <textarea
                  rows={8}
                  required
                  value={newRawText}
                  onChange={e => setNewRawText(e.target.value)}
                  placeholder="Paste complete authentic judgment text..."
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Initial Approval Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  >
                    <option value="ADMIN_APPROVED">ADMIN_APPROVED (Indexed for Search)</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW (Draft)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Editorial Review Notes</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddSourceModalOpen(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl cursor-pointer"
                >
                  Save & Index Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full Source Text */}
      {viewingSource && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 text-stone-100 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-white">{viewingSource.title}</h3>
                <p className="text-xs text-stone-400">{viewingSource.citation} • {viewingSource.court}</p>
              </div>
              <button onClick={() => setViewingSource(null)} className="text-stone-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono text-xs text-stone-300 whitespace-pre-wrap leading-relaxed">
              {viewingSource.rawText}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingSource(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
