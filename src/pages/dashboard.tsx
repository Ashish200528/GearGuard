import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { dashboardAPI } from '@/lib/api';
import { MaintenanceRequest } from '@/types';
import { 
  FiAlertTriangle, 
  FiTool, 
  FiCheckCircle, 
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiX,
  FiPlus
} from 'react-icons/fi';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { equipment, maintenanceRequests, stages, addMaintenanceRequest, isLoading: appLoading } = useApp();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    maintenanceType: 'corrective' as 'corrective' | 'preventive',
    equipmentId: equipment[0]?.id || 1,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    scheduledDate: '',
    duration: 0,
    instruction: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Fetch dashboard stats from backend
    const fetchStats = async () => {
      try {
        const stats = await dashboardAPI.getStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (isLoading || !user || appLoading) {
    return null;
  }

  // Calculate metrics
  const criticalEquipment = equipment.filter(e => e.healthPercentage < 30);
  const healthyEquipment = equipment.filter(e => e.healthPercentage >= 70);
  const openRequests = maintenanceRequests.filter(r => {
    const stage = stages.find(s => s.id === r.stageId);
    return stage && !stage.isClosed;
  });
  const overdueRequests = maintenanceRequests.filter(r => {
    if (!r.scheduledDate) return false;
    const scheduled = new Date(r.scheduledDate);
    const today = new Date();
    const stage = stages.find(s => s.id === r.stageId);
    return scheduled < today && stage && !stage.isClosed;
  });

  const technicianLoad = user.role === 'maintenance_staff' 
    ? maintenanceRequests.filter(r => r.technicianUserId === user.id && !stages.find(s => s.id === r.stageId)?.isClosed).length
    : 0;

  const stats = [
    ...(user.role === 'super_admin' ? [{
      name: 'Critical Equipment',
      value: criticalEquipment.length,
      total: equipment.length,
      icon: FiAlertTriangle,
      color: 'red',
      description: 'Health < 30%',
    }] : []),
    {
      name: user.role === 'end_user' ? 'My Requests' : 'Open Requests',
      value: user.role === 'end_user' 
        ? maintenanceRequests.filter(r => r.createdByUserId === user.id).length
        : openRequests.length,
      total: user.role === 'end_user'
        ? maintenanceRequests.filter(r => r.createdByUserId === user.id).length
        : maintenanceRequests.length,
      icon: FiTool,
      color: 'blue',
      description: user.role === 'end_user' ? 'Created by me' : `${overdueRequests.length} Overdue`,
    },
    ...(user.role === 'super_admin' ? [{
      name: 'Healthy Equipment',
      value: healthyEquipment.length,
      total: equipment.length,
      icon: FiCheckCircle,
      color: 'green',
      description: 'Health ≥ 70%',
    }] : []),
    ...(user.role === 'maintenance_staff' ? [{
      name: 'My Workload',
      value: technicianLoad,
      total: openRequests.length,
      icon: FiActivity,
      color: 'yellow',
      description: 'Assigned to me',
    }] : []),
  ];

  const recentRequests = maintenanceRequests
    .filter(r => user.role === 'end_user' ? r.createdByUserId === user.id : true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newRequest: MaintenanceRequest = {
        id: Date.now(),
        ...formData,
        stageId: stages[0]?.id || 1,
        kanbanState: 'normal',
        requestDate: new Date().toISOString().split('T')[0],
        createdByUserId: user.id,
        technicianUserId: undefined,
        maintenanceTeamId: 1,
        companyId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await addMaintenanceRequest(newRequest);
      
      // Show success message
      alert('✅ Issue reported successfully! Your request has been submitted to the maintenance team.');
      resetForm();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('❌ Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      description: '',
      maintenanceType: 'corrective',
      equipmentId: equipment[0]?.id || 1,
      priority: 'medium',
      scheduledDate: '',
      duration: 0,
      instruction: '',
    });
    setShowModal(false);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header with personalized welcome */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Good Morning, {user.name}</p>
        </div>

        {/* Stats Grid with KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              red: 'bg-red-100 text-red-600',
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              yellow: 'bg-yellow-100 text-yellow-600',
            }[stat.color];
            
            // Property 1: Critical equipment gets pulsing animation
            const shouldPulse = stat.name === 'Critical Equipment' && stat.value > 0;

            return (
              <motion.div 
                key={stat.name} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card hover:shadow-premium-lg transition-all ${
                  shouldPulse ? 'ring-2 ring-red-400 animate-pulse' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">/ {stat.total}</p>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                    className={`h-full ${stat.color === 'red' ? 'bg-red-500' : stat.color === 'blue' ? 'bg-blue-500' : stat.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Maintenance Requests */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {user.role === 'end_user' ? 'My Requests' : 'Recent Requests'}
              </h2>
              {user.role !== 'end_user' && (
                <button 
                  onClick={() => router.push('/maintenance')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                >
                  View All →
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {recentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FiTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No requests yet</p>
                  {user.role === 'end_user' && (
                    <p className="text-sm text-gray-400">Click "Report an Issue" below to create your first request</p>
                  )}
                </div>
              ) : (
                recentRequests.map((request) => {
                  const stage = stages.find(s => s.id === request.stageId);
                  const equipmentItem = equipment.find(e => e.id === request.equipmentId);
                  const isCompleted = stage?.isClosed;
                  
                  return (
                    <div 
                      key={request.id} 
                      className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                        user.role === 'end_user' 
                          ? 'bg-gray-50 border-2 border-gray-200' 
                          : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                      }`}
                      onClick={() => user.role !== 'end_user' && router.push('/maintenance')}
                    >
                      <div className={`p-2 rounded-lg ${
                        isCompleted ? 'bg-green-100 text-green-600' :
                        request.priority === 'critical' ? 'bg-red-100 text-red-600' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? <FiCheckCircle className="w-5 h-5" /> : <FiTool className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{request.subject}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Equipment: {equipmentItem?.name || 'N/A'}
                        </p>
                        {request.description && user.role === 'end_user' && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{request.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`badge ${
                            isCompleted ? 'bg-green-100 text-green-700 border-green-200' : 
                            'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {stage?.name || 'Unknown'}
                          </span>
                          <span className={`badge priority-${request.priority}`}>
                            {request.priority}
                          </span>
                          {user.role === 'end_user' && (
                            <span className="text-xs text-gray-500">
                              Submitted {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {user.role !== 'end_user' && (
                        <div className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Critical Equipment */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Critical Equipment</h2>
              <button 
                onClick={() => router.push('/equipment')}
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-4">
              {criticalEquipment.length === 0 ? (
                <div className="text-center py-8">
                  <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">All equipment in good condition!</p>
                </div>
              ) : (
                criticalEquipment.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
                    onClick={() => router.push('/equipment')}
                  >
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FiAlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.serialNumber}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        {item.healthPercentage}%
                      </div>
                      <div className="text-xs text-gray-500">Health</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {user.role !== 'end_user' && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.role === 'super_admin' && (
                <button
                  onClick={() => router.push('/equipment')}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg hover:shadow-lg transition-all text-left"
                >
                  <div className="p-3 bg-primary-600 text-white rounded-lg">
                    <FiActivity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Add Equipment</p>
                    <p className="text-sm text-gray-600">Register new asset</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => router.push('/maintenance')}
                className="flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-lg transition-all text-left"
              >
                <div className="p-3 bg-green-600 text-white rounded-lg">
                  <FiTool className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.role === 'maintenance_staff' ? 'View Requests' : 'Manage Requests'}</p>
                  <p className="text-sm text-gray-600">{user.role === 'maintenance_staff' ? 'Work on tasks' : 'Oversee maintenance'}</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/calendar')}
                className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-lg transition-all text-left"
              >
                <div className="p-3 bg-purple-600 text-white rounded-lg">
                  <FiClock className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Schedule</p>
                  <p className="text-sm text-gray-600">View calendar</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* End User Quick Action */}
        {user.role === 'end_user' && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Need Help?</h2>
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center gap-4 p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg hover:shadow-lg transition-all"
            >
              <div className="p-4 bg-primary-600 text-white rounded-lg">
                <FiPlus className="w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="text-xl font-semibold text-gray-900">Report an Issue</p>
                <p className="text-sm text-gray-600 mt-1">Create a new maintenance request</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* New Request Modal for End Users */}
      {user.role === 'end_user' && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-premium-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Report an Issue</h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Elevator not working, Computer screen flickering, Air conditioner making noise"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Brief, clear summary of the problem</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={5}
                  placeholder="Please provide details about the issue:
• What is not working?
• When did the problem start?
• Any error messages or unusual behavior?
• Steps to reproduce the issue (if applicable)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Provide as much detail as possible to help us resolve the issue quickly</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="input-field"
                    required
                  >
                    <option value="low">Low - Can wait for scheduled maintenance</option>
                    <option value="medium">Medium - Should be addressed soon</option>
                    <option value="high">High - Needs prompt attention</option>
                    <option value="critical">Critical - Immediate action required</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose based on urgency and impact</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Equipment *
                  </label>
                  <select
                    value={formData.equipmentId}
                    onChange={(e) => setFormData({ ...formData, equipmentId: Number(e.target.value) })}
                    className="input-field"
                    required
                  >
                    {equipment.length === 0 ? (
                      <option value="">No equipment available</option>
                    ) : (
                      equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} {eq.serialNumber ? `(${eq.serialNumber})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the equipment that needs attention</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="btn-secondary flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
