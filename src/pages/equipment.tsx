import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Equipment } from '@/types';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiFilter,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiTool
} from 'react-icons/fi';

export default function EquipmentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { equipment, categories, teams, maintenanceRequests, addEquipment, updateEquipment, deleteEquipment } = useApp();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [filterHealth, setFilterHealth] = useState<'all' | 'critical' | 'healthy'>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    categoryId: 1,
    maintenanceTeamId: 1,
    technicianUserId: 2,
    healthPercentage: 100,
    location: '',
    note: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    // Only super_admin can access equipment page
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const filteredEquipment = equipment.filter(e => {
    if (filterHealth === 'critical') return e.healthPercentage < 30;
    if (filterHealth === 'healthy') return e.healthPercentage >= 70;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, formData);
      } else {
        const newEquipment: Equipment = {
          id: Date.now(),
          companyId: 1,
          ...formData,
        };
        await addEquipment(newEquipment);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving equipment:', error);
      alert('Failed to save equipment. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      serialNumber: '',
      categoryId: 1,
      maintenanceTeamId: 1,
      technicianUserId: 2,
      healthPercentage: 100,
      location: '',
      note: '',
    });
    setEditingEquipment(null);
    setShowModal(false);
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      serialNumber: item.serialNumber || '',
      categoryId: item.categoryId,
      maintenanceTeamId: item.maintenanceTeamId || 1,
      technicianUserId: item.technicianUserId || 2,
      healthPercentage: item.healthPercentage,
      location: item.location || '',
      note: item.note || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      try {
        await deleteEquipment(id);
      } catch (error) {
        console.error('Error deleting equipment:', error);
        alert('Failed to delete equipment. Please try again.');
      }
    }
  };

  // Property 7, 8, 9: Health bar color coding
  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600 bg-green-100'; // Property 7: >80% green
    if (health >= 50) return 'text-yellow-600 bg-yellow-100'; // Property 7: 50-80% yellow
    return 'text-red-600 bg-red-100'; // Property 7: <30% red
  };
  
  const getHealthBarColor = (health: number) => {
    if (health >= 80) return 'bg-green-500'; // Property 7: >80% green
    if (health >= 50) return 'bg-yellow-500'; // Property 7: 50-80% yellow  
    return 'bg-red-500'; // Property 7: <30% red
  };
  
  // Property 9: Get active maintenance requests count for equipment
  const getEquipmentRequestCount = (equipmentId: number) => {
    return maintenanceRequests.filter(r => r.equipmentId === equipmentId).length;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
            <p className="text-gray-600 mt-1">Manage your equipment inventory</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add Equipment
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex items-center gap-4">
            <FiFilter className="text-gray-600" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterHealth('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterHealth === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({equipment.length})
              </button>
              <button
                onClick={() => setFilterHealth('critical')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterHealth === 'critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Critical ({equipment.filter(e => e.healthPercentage < 30).length})
              </button>
              <button
                onClick={() => setFilterHealth('healthy')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterHealth === 'healthy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Healthy ({equipment.filter(e => e.healthPercentage >= 70).length})
              </button>
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => {
            const category = categories.find(c => c.id === item.categoryId);
            const team = teams.find(t => t.id === item.maintenanceTeamId);
            const activeRequests = getEquipmentRequestCount(item.id);
            
            return (
              <div key={item.id} className="card hover:shadow-premium-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.serialNumber}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <FiEdit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <FiTrash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category</span>
                    <span className="badge bg-gray-100 text-gray-800">{category?.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Team</span>
                    <span className="text-sm font-medium text-gray-900">{team?.name}</span>
                  </div>
                  
                  {item.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Location</span>
                      <span className="text-sm font-medium text-gray-900">{item.location}</span>
                    </div>
                  )}

                  {/* Property 8: Health Progress Bar Visualization */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Health Status</span>
                      <span className={`text-lg font-bold ${getHealthColor(item.healthPercentage).split(' ')[0]}`}>
                        {item.healthPercentage}%
                      </span>
                    </div>
                    {/* Property 8: Visual progress bar that accurately represents health value */}
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getHealthBarColor(item.healthPercentage)}`}
                        style={{ width: `${item.healthPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Property 9: Smart Button with wrench icon and request count */}
                  {activeRequests > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <button
                        onClick={() => router.push('/maintenance')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                      >
                        <FiTool className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          {activeRequests} Active {activeRequests === 1 ? 'Request' : 'Requests'}
                        </span>
                      </button>
                    </div>
                  )}

                  {item.healthPercentage < 30 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <FiAlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className="text-xs text-red-700 font-medium">Requires immediate attention</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredEquipment.length === 0 && (
          <div className="card text-center py-12">
            <FiCheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No equipment found matching your filters</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-premium-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="input-field"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maintenance Team *
                  </label>
                  <select
                    value={formData.maintenanceTeamId}
                    onChange={(e) => setFormData({ ...formData, maintenanceTeamId: Number(e.target.value) })}
                    className="input-field"
                    required
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Health Percentage *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.healthPercentage}
                    onChange={(e) => setFormData({ ...formData, healthPercentage: Number(e.target.value) })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    placeholder="Building A, Floor 2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Additional information..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
