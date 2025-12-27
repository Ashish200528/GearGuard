import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { MaintenanceRequest } from '@/types';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiPlus, FiX } from 'react-icons/fi';

export default function CalendarPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { maintenanceRequests, equipment, stages, addMaintenanceRequest } = useApp();
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    maintenanceType: 'preventive' as 'corrective' | 'preventive',
    equipmentId: 0,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    scheduledDate: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    // Only super_admin and maintenance_staff can access calendar
    if (!authLoading && user && user.role === 'end_user') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getRequestsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Filter requests by date
    let requests = maintenanceRequests.filter(r => r.scheduledDate === dateStr);
    
    // For maintenance staff, only show their assigned tasks
    if (user?.role === 'maintenance_staff') {
      requests = requests.filter(r => r.technicianUserId === user.id);
    }
    
    return requests;
  };

  const selectedDateRequests = selectedDate ? getRequestsForDate(selectedDate.getDate()) : [];

  const handleScheduleTask = () => {
    if (selectedDate) {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      setFormData({ ...formData, scheduledDate: dateStr });
      setShowScheduleModal(true);
    } else {
      alert('Please select a date first');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.equipmentId) {
      alert('Please select equipment');
      return;
    }

    try {
      const newRequest: MaintenanceRequest = {
        id: Date.now(),
        subject: formData.subject,
        description: formData.description,
        maintenanceType: formData.maintenanceType,
        equipmentId: formData.equipmentId,
        stageId: 1, // New Request
        kanbanState: 'normal',
        priority: formData.priority,
        requestDate: new Date().toISOString().split('T')[0],
        scheduledDate: formData.scheduledDate,
        duration: 0,
        createdByUserId: user?.id || 1,
        technicianUserId: undefined,
        maintenanceTeamId: 1,
        companyId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addMaintenanceRequest(newRequest);
      
      setShowScheduleModal(false);
      setFormData({
        subject: '',
        description: '',
        maintenanceType: 'preventive',
        equipmentId: 0,
        priority: 'medium',
        scheduledDate: '',
      });
    } catch (error) {
      console.error('Error scheduling task:', error);
      alert('Failed to schedule task. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Calendar</h1>
          <p className="text-gray-600 mt-1">Schedule and view preventive tasks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Calendar days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const requests = getRequestsForDate(day);
                const isToday = 
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();
                const isSelected = 
                  selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === currentDate.getMonth();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className={`aspect-square p-2 rounded-lg border-2 transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50'
                        : isToday
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{day}</div>
                    {requests.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 justify-center">
                        {requests.slice(0, 2).map((req, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              req.priority === 'critical' ? 'bg-red-500' :
                              req.priority === 'high' ? 'bg-orange-500' :
                              req.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}
                          />
                        ))}
                        {requests.length > 2 && (
                          <div className="text-xs text-gray-600">+{requests.length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FiCalendar className="w-6 h-6 text-primary-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedDate 
                    ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Select a date'}
                </h3>
              </div>
              {selectedDate && (
                <button
                  onClick={handleScheduleTask}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Schedule task"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
              )}
            </div>

            {selectedDate ? (
              <div className="space-y-4">
                {selectedDateRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No scheduled tasks</p>
                    <button
                      onClick={handleScheduleTask}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Schedule Task
                    </button>
                  </div>
                ) : (
                  <>
                    {selectedDateRequests.map(request => {
                      const equipmentItem = equipment.find(e => e.id === request.equipmentId);
                      const stage = stages.find(s => s.id === request.stageId);
                      
                      return (
                        <div key={request.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{request.subject}</h4>
                            <span className={`badge priority-${request.priority}`}>
                              {request.priority}
                            </span>
                          </div>
                          
                          {request.description && (
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          )}
                          
                          <p className="text-sm text-gray-600 mb-3">
                            Equipment: {equipmentItem?.name || 'N/A'}
                          </p>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`badge ${stage?.isClosed ? 'status-done' : 'status-normal'}`}>
                              {stage?.name || 'Unknown'}
                            </span>
                            <span className="badge bg-purple-100 text-purple-700">
                              {request.maintenanceType}
                            </span>
                          </div>
                          
                          {request.duration > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Duration: {request.duration} hours
                            </p>
                          )}
                        </div>
                      );
                    })}
                    
                    <button
                      onClick={handleScheduleTask}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Schedule Another Task
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">
                Click on a date to view scheduled tasks
              </p>
            )}
          </div>
        </div>

        {/* Schedule Task Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-premium-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">
                  Schedule Maintenance Task
                </h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                    placeholder="e.g., Quarterly Equipment Check"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Describe the maintenance task..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment *
                    </label>
                    <select
                      value={formData.equipmentId}
                      onChange={e => setFormData({ ...formData, equipmentId: parseInt(e.target.value) })}
                      className="input"
                      required
                    >
                      <option value="">Select Equipment</option>
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} - {eq.serialNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Type *
                    </label>
                    <select
                      value={formData.maintenanceType}
                      onChange={e => setFormData({ ...formData, maintenanceType: e.target.value as 'corrective' | 'preventive' })}
                      className="input"
                      required
                    >
                      <option value="preventive">Preventive</option>
                      <option value="corrective">Corrective</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                      className="input"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Schedule Task
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
