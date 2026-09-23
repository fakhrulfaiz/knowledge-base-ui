import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Building2,
  Users,
  User,
  Check,
  ArrowRight
} from 'lucide-react';
import { Collection, UserProfile } from '../types';

interface NewCollectionModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onCreate: (newCol: Collection) => void;
}

export const NewCollectionModal: React.FC<NewCollectionModalProps> = ({
  currentUser,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'mine' | 'team' | 'org'>('mine');
  const [teamName, setTeamName] = useState('Platform Infrastructure');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCol: Collection = {
      id: `col-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'No description provided.',
      scope,
      teamName: scope === 'team' ? teamName : undefined,
      createdBy: {
        name: currentUser.name,
        email: currentUser.email,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentCount: 0,
      totalChunks: 0,
      tags: [],
    };

    onCreate(newCol);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="h-14 px-6 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Create New Collection</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Collection Name */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Collection Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Database Architecture 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-800/90"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the scope, systems covered, and intended audience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-800/90 resize-none"
            />
          </div>

          {/* Scope Selection */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Access Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('mine')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  scope === 'mine'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium mb-0.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Mine</span>
                </div>
                <div className={`text-[10px] ${scope === 'mine' ? 'text-blue-100' : 'text-neutral-400 dark:text-neutral-500'}`}>
                  Private personal scope
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('team')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  scope === 'team'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium mb-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Team</span>
                </div>
                <div className={`text-[10px] ${scope === 'team' ? 'text-blue-100' : 'text-neutral-400 dark:text-neutral-500'}`}>
                  Shared with team members
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('org')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  scope === 'org'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium mb-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Organization</span>
                </div>
                <div className={`text-[10px] ${scope === 'org' ? 'text-blue-100' : 'text-neutral-400 dark:text-neutral-500'}`}>
                  Enterprise-wide shared
                </div>
              </button>
            </div>
          </div>

          {/* If Team Scope, choose team name */}
          {scope === 'team' && (
            <div>
              <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Team Identifier
              </label>
              <select
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-500"
              >
                <option value="Platform Infrastructure" className="dark:bg-neutral-800">Platform Infrastructure</option>
                <option value="Core AI Infrastructure" className="dark:bg-neutral-800">Core AI Infrastructure</option>
                <option value="Data Engineering" className="dark:bg-neutral-800">Data Engineering</option>
                <option value="SecOps & Compliance" className="dark:bg-neutral-800">SecOps &amp; Compliance</option>
                <option value="Frontend Architecture" className="dark:bg-neutral-800">Frontend Architecture</option>
              </select>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <span>Create Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
