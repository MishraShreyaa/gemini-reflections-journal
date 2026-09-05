import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Briefcase, 
  FileText,
  User
} from 'lucide-react';
import { applyForLawyerVerification } from '../lib/firebase';
import type { SupportedLanguage } from '../types';

interface LawyerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  userName: string | null;
  onSubmitted: () => void;
  language: SupportedLanguage;
}

const STATE_BAR_COUNCILS = [
  'Bar Council of Delhi',
  'Bar Council of Maharashtra & Goa',
  'Bar Council of Karnataka',
  'Bar Council of Tamil Nadu & Puducherry',
  'Bar Council of Uttar Pradesh',
  'Bar Council of West Bengal',
  'Bar Council of Kerala',
  'Bar Council of Gujarat',
  'Bar Council of Punjab & Haryana',
  'Bar Council of Rajasthan',
  'Bar Council of Madhya Pradesh',
  'Bar Council of Andhra Pradesh',
  'Bar Council of Bihar',
  'Bar Council of Telangana',
  'Bar Council of Odisha',
  'Bar Council of Assam, Nagaland, Meghalaya, Manipur, Tripura, Mizoram & Arunachal Pradesh',
  'Other / Supreme Court Bar Association',
];

export const LawyerApplicationModal: React.FC<LawyerApplicationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  onSubmitted,
  language,
}) => {
  const [fullName, setFullName] = useState(userName || '');
  const [barEnrollmentNumber, setBarEnrollmentNumber] = useState('');
  const [stateBarCouncil, setStateBarCouncil] = useState(STATE_BAR_COUNCILS[0]);
  const [experienceYears, setExperienceYears] = useState(3);
  const [practiceArea, setPracticeArea] = useState('Constitutional & Civil Litigation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !barEnrollmentNumber.trim()) {
      setError('Full Name and Bar Council Enrollment Number are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await applyForLawyerVerification({
        fullName: fullName.trim(),
        email: userEmail || undefined,
        barEnrollmentNumber: barEnrollmentNumber.trim(),
        stateBarCouncil,
        practiceAreas: [practiceArea],
        experienceYears,
      });

      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-stone-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white">Apply for Lawyer Verification</h3>
              <p className="text-xs text-stone-400">Bar Council Credential Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-serif font-bold text-white">Application Submitted</h4>
            <p className="text-xs text-stone-300 max-w-xs mx-auto">
              Your credentials are now under administrator review. Once verified by an Admin, your account will be granted Lawyer Workspace access.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 space-y-1">
              <p className="font-semibold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Verification Mandate</span>
              </p>
              <p className="text-[11px] text-stone-300">
                NyayaTrace requires administrator review of State Bar Council enrollment before enabling professional advocate tools.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Full Advocate Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adv. Rajesh Sharma"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Bar Council Enrollment Number *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="text"
                  required
                  value={barEnrollmentNumber}
                  onChange={(e) => setBarEnrollmentNumber(e.target.value)}
                  placeholder="e.g. D/1234/2018 or MAH/5678/2015"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                State Bar Council *
              </label>
              <select
                value={stateBarCouncil}
                onChange={(e) => setStateBarCouncil(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {STATE_BAR_COUNCILS.map((bc) => (
                  <option key={bc} value={bc}>{bc}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Years of Practice
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Primary Practice Area
                </label>
                <input
                  type="text"
                  value={practiceArea}
                  onChange={(e) => setPracticeArea(e.target.value)}
                  placeholder="e.g. Property & Succession"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end space-x-2 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Administrator Review'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
