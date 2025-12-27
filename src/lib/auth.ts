// User interface for session management
export interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: string;
  token?: string; // JWT token from backend
  companyId?: number;
}

// Helper function for signup page (simplified)
export const detectRoleFromEmail = (email: string): string => {
  const username = email.split('@')[0]?.toLowerCase();
  
  if (username.includes('admin')) return 'super_admin';
  if (username.includes('tech') || username.includes('maintenance')) return 'maintenance_staff';
  return 'end_user';
};
