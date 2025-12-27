import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { MaintenanceRequest } from '@/types';
import { 
  FiPlus, 
  FiX,
  FiAlertCircle,
  FiClock,
  FiUser,
  FiTool,
  FiCheck,
  FiInfo
} from 'react-icons/fi';

export default function MaintenancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    maintenanceRequests, 
    stages, 
    equipment, 
    addMaintenanceRequest, 
    updateMaintenanceRequest 
  } = useApp();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  
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
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    resetForm();
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

  // Property 3: Sort stages by sequence
  const sortedStages = [...stages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    
    if (!destination) return;
    
    const requestId = parseInt(draggableId.replace('request-', ''));
    const newStageId = parseInt(destination.droppableId.replace('stage-', ''));
    
    // Property 7: Update stage_id via API
    await updateMaintenanceRequest(requestId, { stageId: newStageId });
  };

  const getRequestsByStage = (stageId: number) => {
    return maintenanceRequests.filter(r => r.stageId === stageId);
  };

  // Property 6: Determine blocked state indicator
  const getKanbanStateClass = (kanbanState: string) => {
    if (kanbanState === 'blocked') return 'border-l-4 border-red-600';
    return 'border-l-2 border-gray-200';
  };

  // Property 5: Determine priority badge
  const getPriorityBadgeClass = (priority: string) => {
    if (priority === 'critical') return 'bg-red-100 text-red-700 border-red-200';
    if (priority === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleAcceptRequest = async (request: MaintenanceRequest) => {
    if (!user) return;
    
    // Find "In Progress" stage (typically sequence 2)
    const inProgressStage = stages.find(s => s.name.toLowerCase().includes('progress')) || stages[1];
    
    await updateMaintenanceRequest(request.id, {
      technicianUserId: user.id,
      stageId: inProgressStage?.id || 2,
    });
    
    setShowDetailModal(false);
  };

  const handleViewDetails = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-gray-600 mt-1">Kanban workflow management</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            New Request
          </button>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {sortedStages.map((stage) => {
              const stageRequests = getRequestsByStage(stage.id);
              
              return (
                <div 
                  key={stage.id} 
                  className="flex-shrink-0 w-80 bg-gray-100 rounded-xl p-4"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">{stage.name}</h2>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                      {stageRequests.length}
                    </span>
                  </div>

                  {/* Droppable Column */}
                  <Droppable droppableId={`stage-${stage.id}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] space-y-3 ${
                          snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                        }`}
                      >
                        {stageRequests.map((request, index) => {
                          const equipmentItem = equipment.find(e => e.id === request.equipmentId);
                          
                          return (
                            <Draggable
                              key={request.id}
                              draggableId={`request-${request.id}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  className={`
                                    bg-white rounded-lg shadow-sm hover:shadow-md transition-all
                                    ${getKanbanStateClass(request.kanbanState)}
                                    ${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}
                                  `}
                                >
                                  {/* Drag Handle */}
                                  <div {...provided.dragHandleProps} className="cursor-move">
                                    {/* Property 4: Display subject and equipment_name */}
                                    <h3 className="font-semibold text-gray-900 mb-2 pr-8">
                                      {request.subject}
                                    </h3>
                                    {equipmentItem && (
                                      <p className="text-sm text-gray-600 mb-3">
                                        {equipmentItem.name}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center gap-2 flex-wrap mb-3">
                                      {/* Property 5: Critical priority badge in red */}
                                      <span className={`text-xs px-2 py-1 rounded border ${getPriorityBadgeClass(request.priority)}`}>
                                        {request.priority}
                                      </span>
                                      
                                      {request.scheduledDate && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <FiClock className="w-3 h-3" />
                                          {new Date(request.scheduledDate).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(request);
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                                    >
                                      <FiInfo className="w-3 h-3" />
                                      Details
                                    </button>
                                    
                                    {!request.technicianUserId && (user?.role === 'maintenance_staff' || user?.role === 'super_admin') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAcceptRequest(request);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                                      >
                                        <FiCheck className="w-3 h-3" />
                                        Accept
                                      </button>
                                    )}
                                    
                                    {request.technicianUserId && (
                                      <div className="flex-1 flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg">
                                        <FiUser className="w-3 h-3" />
                                        <span className="truncate">Assigned</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {/* Create Request Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">New Maintenance Request</h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Detailed description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment *
                    </label>
                    <select
                      required
                      value={formData.equipmentId}
                      onChange={(e) => setFormData({ ...formData, equipmentId: parseInt(e.target.value) })}
                      className="input"
                    >
                      {equipment.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority *
                    </label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.maintenanceType}
                      onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value as any })}
                      className="input"
                    >
                      <option value="corrective">Corrective</option>
                      <option value="preventive">Preventive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Request Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.subject}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-3 py-1 rounded-full border ${getPriorityBadgeClass(selectedRequest.priority)}`}>
                      {selectedRequest.priority} priority
                    </span>
                    <span className="text-sm text-gray-600">
                      {stages.find(s => s.id === selectedRequest.stageId)?.name || 'Unknown Stage'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {selectedRequest.description || 'No description provided'}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Equipment</h3>
                    <p className="text-gray-900">
                      {equipment.find(e => e.id === selectedRequest.equipmentId)?.name || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Request Type</h3>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                      selectedRequest.maintenanceType === 'corrective' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedRequest.maintenanceType}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Requested Date</h3>
                    <p className="text-gray-900">
                      {new Date(selectedRequest.requestDate).toLocaleDateString()}
                    </p>
                  </div>

                  {selectedRequest.scheduledDate && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Scheduled Date</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <FiClock className="w-4 h-4 text-gray-500" />
                        {new Date(selectedRequest.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {selectedRequest.technicianUserId && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Assigned To</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-gray-500" />
                        Technician #{selectedRequest.technicianUserId}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Kanban State</h3>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                      selectedRequest.kanbanState === 'blocked' 
                        ? 'bg-red-100 text-red-700' 
                        : selectedRequest.kanbanState === 'done'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedRequest.kanbanState}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  {!selectedRequest.technicianUserId && (user?.role === 'maintenance_staff' || user?.role === 'super_admin') && (
                    <button
                      onClick={() => handleAcceptRequest(selectedRequest)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                    >
                      <FiCheck className="w-5 h-5" />
                      Accept & Start Working
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
