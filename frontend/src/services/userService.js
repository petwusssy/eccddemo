/**
 * ECCD CARE — User Accounts & Administrative Access Service
 * City Social Welfare & Development Office (CSWDO)
 *
 * REST Endpoints:
 * GET    /api/users
 * GET    /api/roles
 * POST   /api/users
 * GET    /api/users/:id
 * PUT    /api/users/:id
 * POST   /api/users/:id/reset-password
 * DELETE /api/users/:id
 */

import { getApiUrl } from './apiConfig';
import { centralDataStore } from './centralDataStore';

const HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  'Bypass-Tunnel-Reminder': 'true',
};

export const userService = {
  /**
   * Fetch all registered users with their roles and worker profiles.
   */
  async getUsers() {
    try {
      const res = await fetch(getApiUrl('/api/users'), {
        headers: HEADERS,
      });

      if (res.ok) {
        const json = await res.json();
        const serverUsers = json.data || [];
        if (Array.isArray(serverUsers) && serverUsers.length > 0) {
          return serverUsers;
        }
      }
    } catch (e) {
      console.warn('userService: Backend /api/users error, using local fallback:', e.message);
    }

    // Local / Offline store fallback
    const localUsers = centralDataStore.getUsers() || [];
    const roles = centralDataStore.getRoles() || [];
    return localUsers.map((u) => {
      const role = roles.find((r) => r.id === u.roleId || r.name === u.role) || {
        id: u.roleId || 5,
        name: u.role || 'cdt',
        label: u.role === 'sysadmin' ? 'CSFP System Administrator' : (u.role === 'eccd_admin' ? 'ECCD Administrative' : 'Child Development Teacher (CDT)'),
      };
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role_id: role.id,
        role: role,
        worker: {
          name: u.name,
          role: role.label,
          status: 'Active',
          contact: u.contact || '',
          dayCareCenter: u.centerName ? { name: u.centerName } : null,
          barangay: u.barangay ? { name: u.barangay } : null,
        },
        created_at: u.createdAt || new Date().toISOString(),
      };
    });
  },

  /**
   * Fetch system assignable roles.
   */
  async getRoles() {
    try {
      const res = await fetch(getApiUrl('/api/roles'), {
        headers: HEADERS,
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('userService: Backend /api/roles error, using local fallback:', e.message);
    }

    return [
      {
        id: 1,
        name: 'sysadmin',
        label: 'CSFP System Administrator',
        description: 'City IT / MIS Administrator managing system access, tenant security, audit logs, and account provisioning for ECCD Administrative officers and Child Development Teachers.',
      },
      {
        id: 4,
        name: 'eccd_admin',
        label: 'ECCD Administrative',
        description: 'CSWDO Early Childhood Care Supervisor responsible for city-wide daycare operations, Form 8 & 9 approvals, and consolidated child developmental analytics.',
      },
      {
        id: 5,
        name: 'cdt',
        label: 'Child Development Teacher (CDT)',
        description: 'Frontline child assessment, mapping, and day care center instruction.',
      },
    ];
  },

  /**
   * Create a new user account with initial credentials.
   */
  async createUser(payload) {
    try {
      const res = await fetch(getApiUrl('/api/users'), {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to create user account.');
      }

      // Add to local store if available
      try {
        const users = centralDataStore.getUsers() || [];
        users.push({
          id: json.data?.id || Date.now(),
          name: payload.name,
          email: payload.email,
          role: json.data?.role?.name || 'cdt',
          roleId: payload.role_id,
        });
      } catch (_) {}

      return json.data;
    } catch (err) {
      console.error('userService.createUser error:', err);
      throw err;
    }
  },

  /**
   * Update user details and role.
   */
  async updateUser(id, payload) {
    try {
      const res = await fetch(getApiUrl(`/api/users/${id}`), {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to update user account.');
      }

      return json.data;
    } catch (err) {
      console.error('userService.updateUser error:', err);
      throw err;
    }
  },

  /**
   * Reset user password by IT Administrator.
   */
  async resetPassword(id, newPassword) {
    try {
      const res = await fetch(getApiUrl(`/api/users/${id}/reset-password`), {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ password: newPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to reset password.');
      }

      return json;
    } catch (err) {
      console.error('userService.resetPassword error:', err);
      throw err;
    }
  },

  /**
   * Delete or deactivate user account.
   */
  async deleteUser(id) {
    try {
      const res = await fetch(getApiUrl(`/api/users/${id}`), {
        method: 'DELETE',
        headers: HEADERS,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to delete user account.');
      }

      return json;
    } catch (err) {
      console.error('userService.deleteUser error:', err);
      throw err;
    }
  },
};

export default userService;
