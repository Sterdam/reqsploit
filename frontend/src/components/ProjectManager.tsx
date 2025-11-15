/**
 * Project Manager - Organize pentests by target/project
 */

import { useState, useEffect } from 'react';
import { Folder, Plus, Search, Target, AlertCircle, TrendingUp, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface Project {
  id: string;
  name: string;
  description?: string;
  target: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    requests: number;
    findings: number;
  };
}

interface Props {
  onSelectProject?: (projectId: string | null) => void;
  selectedProjectId?: string | null;
}

export function ProjectManager({ onSelectProject, selectedProjectId }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const { accessToken, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return; // Wait for store hydration

    if (accessToken) {
      fetchProjects();
    }
  }, [_hasHydrated, accessToken]);

  const fetchProjects = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProjects();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#0A1929]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Projects
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-auto p-2">
        {/* All Requests (No Project) */}
        <button
          onClick={() => onSelectProject?.(null)}
          className={`w-full text-left p-3 mb-2 rounded-lg border transition ${
            selectedProjectId === null
              ? 'bg-blue-600/20 border-blue-600/30 text-blue-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="font-medium">All Requests</span>
          </div>
          <div className="text-xs mt-1 opacity-80">View all unorganized traffic</div>
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400 text-sm">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No projects yet</p>
            <p className="text-gray-500 text-xs mt-1">Create one to organize your pentests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject?.(project.id)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedProjectId === project.id
                    ? 'bg-blue-600/20 border-blue-600/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">{project.name}</h3>
                    <p className="text-gray-400 text-xs truncate mt-1">{project.target}</p>
                  </div>
                </div>

                {project.description && (
                  <p className="text-gray-500 text-xs mb-2 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {project._count?.requests || 0} requests
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {project._count?.findings || 0} findings
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [creating, setCreating] = useState(false);
  const { accessToken } = useAuthStore();

  const handleCreate = async () => {
    if (!name || !target) {
      alert('Name and target are required');
      return;
    }

    if (!accessToken) {
      alert('You must be logged in to create a project');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, description, target }),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A1929] border border-white/10 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">New Project</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Example.com Pentest"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target URL *
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description, scope, etc."
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name || !target}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition"
          >
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
