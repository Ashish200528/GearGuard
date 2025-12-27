import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { FiTrendingUp, FiDownload, FiBarChart2 } from 'react-icons/fi';

export default function ReportingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { equipment, maintenanceRequests, stages } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    // Only super_admin can access reporting page
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const totalRequests = maintenanceRequests.length;
  const completedRequests = maintenanceRequests.filter(r => {
    const stage = stages.find(s => s.id === r.stageId);
    return stage?.isClosed;
  }).length;
  
  const completionRate = totalRequests > 0 
    ? Math.round((completedRequests / totalRequests) * 100) 
    : 0;

  const avgHealth = equipment.length > 0
    ? Math.round(equipment.reduce((sum, e) => sum + e.healthPercentage, 0) / equipment.length)
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporting & Analytics</h1>
            <p className="text-gray-600 mt-1">Monitor performance metrics</p>
          </div>
          
          <button className="btn-primary flex items-center gap-2">
            <FiDownload className="w-5 h-5" />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalRequests}</p>
              </div>
              <FiBarChart2 className="w-12 h-12 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{completionRate}%</p>
              </div>
              <FiTrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Equipment Health</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{avgHealth}%</p>
              </div>
              <FiBarChart2 className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Request Distribution by Stage</h2>
          <div className="space-y-4">
            {stages.map(stage => {
              const count = maintenanceRequests.filter(r => r.stageId === stage.id).length;
              const percentage = totalRequests > 0 ? (count / totalRequests) * 100 : 0;
              
              return (
                <div key={stage.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Priority Distribution */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Priority Distribution</h2>
            <div className="space-y-3">
              {['critical', 'high', 'medium', 'low'].map(priority => {
                const count = maintenanceRequests.filter(r => r.priority === priority).length;
                const percentage = totalRequests > 0 ? (count / totalRequests) * 100 : 0;
                const color = 
                  priority === 'critical' ? 'bg-red-500' :
                  priority === 'high' ? 'bg-orange-500' :
                  priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400';
                
                return (
                  <div key={priority} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{priority}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Maintenance Type Distribution */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Maintenance Type</h2>
            <div className="space-y-3">
              {['preventive', 'corrective'].map(type => {
                const count = maintenanceRequests.filter(r => r.maintenanceType === type).length;
                const percentage = totalRequests > 0 ? (count / totalRequests) * 100 : 0;
                const color = type === 'preventive' ? 'bg-blue-500' : 'bg-purple-500';
                
                return (
                  <div key={type} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Equipment Health Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Equipment Health Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Critical (<30%)', min: 0, max: 30, color: 'bg-red-100 text-red-700 border-red-200' },
              { label: 'Warning (30-70%)', min: 30, max: 70, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
              { label: 'Healthy (>70%)', min: 70, max: 100, color: 'bg-green-100 text-green-700 border-green-200' },
            ].map(({ label, min, max, color }) => {
              const count = equipment.filter(e => e.healthPercentage >= min && e.healthPercentage < max).length;
              const percentage = equipment.length > 0 ? (count / equipment.length) * 100 : 0;
              
              return (
                <div key={label} className={`p-4 rounded-lg border-2 ${color}`}>
                  <p className="text-sm font-medium mb-2">{label}</p>
                  <p className="text-3xl font-bold">{count}</p>
                  <p className="text-xs mt-1">{percentage.toFixed(1)}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Equipment by Health */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Equipment Requiring Attention</h2>
          {equipment.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No equipment data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Equipment</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Serial Number</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Health</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment
                    .sort((a, b) => a.healthPercentage - b.healthPercentage)
                    .slice(0, 10)
                    .map(eq => {
                      const healthColor = 
                        eq.healthPercentage >= 70 ? 'text-green-600 bg-green-100' :
                        eq.healthPercentage >= 30 ? 'text-yellow-600 bg-yellow-100' :
                        'text-red-600 bg-red-100';
                      
                      return (
                        <tr key={eq.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{eq.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{eq.serialNumber || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{eq.location || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                                <div 
                                  className={`h-full ${healthColor.split(' ')[1]} transition-all duration-300`}
                                  style={{ width: `${eq.healthPercentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{eq.healthPercentage}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${healthColor}`}>
                              {eq.healthPercentage >= 70 ? 'Good' : eq.healthPercentage >= 30 ? 'Warning' : 'Critical'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
