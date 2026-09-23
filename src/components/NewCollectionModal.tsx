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
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-300">
        {/* Header */}
        <div className="h-14 px-6 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-neutral-100 text-neutral-800">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-neutral-900">Create New Collection</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Collection Name */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
              Collection Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Database Architecture 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-400 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the scope, systems covered, and intended audience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-400 focus:bg-white resize-none"
            />
          </div>

          {/* Scope Selection */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1.5">
              Access Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('mine')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  scope === 'mine'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium mb-0.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Mine</span>
                </div>
                <div className={`text-[10px] ${scope === 'mine' ? 'text-blue-100' : 'text-neutral-400'}`}>
                  Private personal scope
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('team')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  scope === 'team'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium mb-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Team</span>
                </div>
                <div className={`text-[10px] ${scope === 'team' ? 'text-blue-100' : 'text-neutral-400'}`}>
                  Shared with team members
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('org')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  scope === 'org'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium mb-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Organization</span>
                </div>
                <div className={`text-[10px] ${scope === 'org' ? 'text-blue-100' : 'text-neutral-400'}`}>
                  Enterprise-wide shared
                </div>
              </button>
            </div>
          </div>

          {/* If Team Scope, choose team name */}
          {scope === 'team' && (
            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                Team Identifier
              </label>
              <select
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-400"
              >
                <option value="Platform Infrastructure">Platform Infrastructure</option>
                <option value="Core AI Infrastructure">Core AI Infrastructure</option>
                <option value="Data Engineering">Data Engineering</option>
                <option value="SecOps & Compliance">SecOps &amp; Compliance</option>
                <option value="Frontend Architecture">Frontend Architecture</option>
              </select>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer"
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
