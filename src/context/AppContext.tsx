'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Equipment,
  MaintenanceRequest,
  MaintenanceStage,
  EquipmentCategory,
  MaintenanceTeam,
  WorkCenter,
} from '@/types';
import { equipmentAPI, maintenanceAPI, stagesAPI, teamsAPI } from '@/lib/api';

interface AppContextType {
  equipment: Equipment[];
  maintenanceRequests: MaintenanceRequest[];
  stages: MaintenanceStage[];
  categories: EquipmentCategory[];
  teams: MaintenanceTeam[];
  workCenters: WorkCenter[];
  isLoading: boolean;
  refreshEquipment: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshTeams: () => Promise<void>;
  addEquipment: (equipment: Equipment) => Promise<void>;
  updateEquipment: (id: number, equipment: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: number) => Promise<void>;
  addTeam: (team: MaintenanceTeam) => Promise<void>;
  updateTeam: (id: number, team: Partial<MaintenanceTeam>) => Promise<void>;
  deleteTeam: (id: number) => Promise<void>;
  addMaintenanceRequest: (request: MaintenanceRequest) => Promise<void>;
  updateMaintenanceRequest: (id: number, request: Partial<MaintenanceRequest>) => Promise<void>;
  deleteMaintenanceRequest: (id: number) => void;
  initializeData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [stages, setStages] = useState<MaintenanceStage[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshEquipment = async () => {
    try {
      const data = await equipmentAPI.getEquipment();
      // Map backend data to frontend format
      const mappedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        serialNumber: item.serial_number,
        categoryId: item.category_id || 1,
        maintenanceTeamId: item.maintenance_team_id || 1,
        technicianUserId: item.technician_id || 2,
        companyId: item.company_id || 1,
        healthPercentage: item.health || 100,
        location: item.location,
      }));
      setEquipment(mappedData);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  };

  const refreshRequests = async () => {
    try {
      const data = await maintenanceAPI.getRequests();
      // Map backend data to frontend format
      const mappedData = data.map((item: any) => ({
        id: item.id,
        subject: item.subject,
        description: item.description,
        maintenanceType: item.type,
        equipmentId: item.equipment_id,
        stageId: item.stage_id,
        kanbanState: item.kanban_state || 'normal',
        priority: item.priority,
        requestDate: item.created_at?.split('T')[0],
        scheduledDate: item.scheduled_date,
        duration: 0,
        createdByUserId: item.created_by,
        technicianUserId: item.technician_id || 2,
        maintenanceTeamId: 1,
        companyId: 1,
        createdAt: item.created_at,
        updatedAt: item.created_at,
      }));
      setMaintenanceRequests(mappedData);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const refreshTeams = async () => {
    try {
      const data = await teamsAPI.getTeams();
      const mappedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        companyId: item.company_id || 1,
      }));
      setTeams(mappedData);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      // Fallback to default team
      setTeams([{ id: 1, name: 'Internal Maintenance', companyId: 1 }]);
    }
  };

  const initializeData = async () => {
    setIsLoading(true);
    try {
      // Fetch from backend API
      await Promise.all([
        refreshEquipment(),
        refreshRequests(),
        refreshTeams(),
        stagesAPI.getStages().then(data => {
          const mappedStages = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            sequence: s.sequence,
            isScrap: false,
            isClosed: false,
            companyId: 1,
          }));
          setStages(mappedStages);
        }).catch(() => {
          // Fallback stages
          setStages([
            { id: 1, name: 'New Request', sequence: 10, isScrap: false, isClosed: false, companyId: 1 },
            { id: 2, name: 'In Progress', sequence: 20, isScrap: false, isClosed: false, companyId: 1 },
            { id: 3, name: 'Repaired', sequence: 30, isScrap: false, isClosed: true, companyId: 1 },
            { id: 4, name: 'Scrap', sequence: 100, isScrap: true, isClosed: true, companyId: 1 },
          ]);
        }),
      ]);

      // Initialize default categories and teams (these can be made into API calls later)
      const defaultCategories: EquipmentCategory[] = [
        { id: 1, name: 'Computers', companyId: 1 },
        { id: 2, name: 'Monitors', companyId: 1 },
        { id: 3, name: 'Furniture', companyId: 1 },
        { id: 4, name: 'Tools', companyId: 1 },
      ];
      setCategories(defaultCategories);

      const defaultWorkCenters: WorkCenter[] = [
        { id: 1, name: 'Main Workshop', companyId: 1 },
      ];
      setWorkCenters(defaultWorkCenters);

    } catch (error) {
      console.error('Failed to initialize data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  const addEquipment = async (newEquipment: Equipment) => {
    try {
      // Call backend API
      const response = await equipmentAPI.createEquipment({
        name: newEquipment.name,
        serial_number: newEquipment.serialNumber,
        category_id: newEquipment.categoryId,
        maintenance_team_id: newEquipment.maintenanceTeamId,
        technician_user_id: newEquipment.technicianUserId,
        company_id: newEquipment.companyId,
        location: newEquipment.location,
        health_percentage: newEquipment.healthPercentage,
      });
      
      // Refresh the equipment list from backend
      await refreshEquipment();
    } catch (error) {
      console.error('Failed to create equipment:', error);
      // Fallback to local state
      const updated = [...equipment, newEquipment];
      setEquipment(updated);
    }
  };

  const updateEquipment = async (id: number, updates: Partial<Equipment>) => {
    try {
      // Call backend API
      await equipmentAPI.updateEquipment(id, {
        name: updates.name,
        serial_number: updates.serialNumber,
        category_id: updates.categoryId,
        maintenance_team_id: updates.maintenanceTeamId,
        technician_user_id: updates.technicianUserId,
        location: updates.location,
        health_percentage: updates.healthPercentage,
      });
      
      // Update local state
      const updated = equipment.map(e => e.id === id ? { ...e, ...updates } : e);
      setEquipment(updated);
    } catch (error) {
      console.error('Failed to update equipment:', error);
      // Fallback to local state only
      const updated = equipment.map(e => e.id === id ? { ...e, ...updates } : e);
      setEquipment(updated);
    }
  };

  const deleteEquipment = async (id: number) => {
    try {
      // Call backend API
      await equipmentAPI.deleteEquipment(id);
      
      // Update local state
      const updated = equipment.filter(e => e.id !== id);
      setEquipment(updated);
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      // Fallback to local state only
      const updated = equipment.filter(e => e.id !== id);
      setEquipment(updated);
    }
  };

  const addTeam = async (newTeam: MaintenanceTeam) => {
    try {
      const response = await teamsAPI.createTeam({
        name: newTeam.name,
        company_id: newTeam.companyId,
      });
      
      await refreshTeams();
    } catch (error) {
      console.error('Failed to create team:', error);
      const updated = [...teams, newTeam];
      setTeams(updated);
    }
  };

  const updateTeam = async (id: number, updates: Partial<MaintenanceTeam>) => {
    try {
      await teamsAPI.updateTeam(id, {
        name: updates.name,
        company_id: updates.companyId,
      });
      
      const updated = teams.map(t => t.id === id ? { ...t, ...updates } : t);
      setTeams(updated);
    } catch (error) {
      console.error('Failed to update team:', error);
      const updated = teams.map(t => t.id === id ? { ...t, ...updates } : t);
      setTeams(updated);
    }
  };

  const deleteTeam = async (id: number) => {
    try {
      await teamsAPI.deleteTeam(id);
      
      const updated = teams.filter(t => t.id !== id);
      setTeams(updated);
    } catch (error) {
      console.error('Failed to delete team:', error);
      const updated = teams.filter(t => t.id !== id);
      setTeams(updated);
    }
  };

  const addMaintenanceRequest = async (request: MaintenanceRequest) => {
    try {
      // Call backend API
      const response = await maintenanceAPI.createRequest({
        subject: request.subject,
        description: request.description,
        request_type: request.maintenanceType,
        equipment_id: request.equipmentId,
        priority: request.priority,
        scheduled_date: request.scheduledDate,
      });
      
      // Refresh the list from backend
      await refreshRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
      // Fallback to local state
      const updated = [...maintenanceRequests, request];
      setMaintenanceRequests(updated);
      localStorage.setItem('gearguard_requests', JSON.stringify(updated));
    }
  };

  const updateMaintenanceRequest = async (id: number, updates: Partial<MaintenanceRequest>) => {
    try {
      // Call backend API
      await maintenanceAPI.updateRequest(id, {
        stage_id: updates.stageId,
        technician_user_id: updates.technicianUserId,
        priority: updates.priority,
        kanban_state: updates.kanbanState,
      });
      
      // Update local state
      const updated = maintenanceRequests.map(r => r.id === id ? { ...r, ...updates } : r);
      setMaintenanceRequests(updated);
    } catch (error) {
      console.error('Failed to update request:', error);
      // Fallback to local state only
      const updated = maintenanceRequests.map(r => r.id === id ? { ...r, ...updates } : r);
      setMaintenanceRequests(updated);
      localStorage.setItem('gearguard_requests', JSON.stringify(updated));
    }
  };

  const deleteMaintenanceRequest = (id: number) => {
    const updated = maintenanceRequests.filter(r => r.id !== id);
    setMaintenanceRequests(updated);
    localStorage.setItem('gearguard_requests', JSON.stringify(updated));
  };

  return (
    <AppContext.Provider
      value={{
        equipment,
        maintenanceRequests,
        stages,
        categories,
        teams,
        workCenters,
        isLoading,
        refreshEquipment,
        refreshRequests,
        refreshTeams,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        addTeam,
        updateTeam,
        deleteTeam,
        addMaintenanceRequest,
        updateMaintenanceRequest,
        deleteMaintenanceRequest,
        initializeData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
