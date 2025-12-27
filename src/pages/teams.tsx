import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { MaintenanceTeam } from '@/types';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

export default function TeamsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { teams, addTeam, updateTeam, deleteTeam } = useApp();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<MaintenanceTeam | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    companyId: 1,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    // Only super_admin can access teams page
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, formData);
      } else {
        const newTeam: MaintenanceTeam = {
          id: Date.now(),
          ...formData,
        };
        await addTeam(newTeam);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Failed to save team. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      companyId: 1,
    });
    setEditingTeam(null);
    setShowModal(false);
  };

  const handleEdit = (team: MaintenanceTeam) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      companyId: team.companyId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(id);
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team. Please try again.');
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-600 mt-1">Manage maintenance teams</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add Team
          </button>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="card hover:shadow-premium-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-4 bg-primary-100 rounded-xl">
                    <FiUsers className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">Company ID: {team.companyId}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(team)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit team"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete team"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="card text-center py-12">
            <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Teams Yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first maintenance team</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Add Your First Team
            </button>
          </div>
        )}

        {/* Add/Edit Team Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-premium-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTeam ? 'Edit Team' : 'Add New Team'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Internal Maintenance, External Team"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company ID
                  </label>
                  <input
                    type="number"
                    value={formData.companyId}
                    onChange={e => setFormData({ ...formData, companyId: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 1</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingTeam ? 'Update Team' : 'Add Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

