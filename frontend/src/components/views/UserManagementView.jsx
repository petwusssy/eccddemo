import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  Building2,
  Search,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/Table';
import { useToast } from '../ui/Toast';
import { userService } from '../../services/userService';
import { centralDataStore } from '../../services/centralDataStore';
import { SAN_FERNANDO_BARANGAYS } from '../../data/sanFernandoBarangays';

export function UserManagementView({ currentUser, onNavigate }) {
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    day_care_center_id: '',
    barangay_id: '',
    contact: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role_id: '',
    day_care_center_id: '',
    barangay_id: '',
    contact: '',
  });

  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Load users, roles, and centers
  const loadData = async () => {
    setLoading(true);
    try {
      const [userList, roleList] = await Promise.all([
        userService.getUsers(),
        userService.getRoles(),
      ]);
      setUsers(userList || []);
      setRoles(roleList || []);

      const dayCareList = centralDataStore.getDayCareCenters() || [];
      setCenters(dayCareList);

      if (roleList.length > 0 && !createForm.role_id) {
        // Default role to CDT (Child Development Teacher)
        const defaultRole = roleList.find((r) => r.name === 'cdt') || roleList[0];
        setCreateForm((prev) => ({ ...prev, role_id: defaultRole.id }));
      }
    } catch (e) {
      console.error('Error loading users:', e);
      addToast('Failed to load user accounts: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: Generate secure random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Eccd@';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleCopyPassword = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
    addToast('Password copied to clipboard!', 'info');
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.worker?.dayCareCenter?.name && u.worker.dayCareCenter.name.toLowerCase().includes(q)) ||
        (u.worker?.barangay?.name && u.worker.barangay.name.toLowerCase().includes(q));

      const roleKey = u.role?.name || (u.role_id === 1 ? 'sysadmin' : (u.role_id === 4 ? 'eccd_admin' : 'cdt'));
      const isSysAdmin = roleKey === 'sysadmin' || u.email === 'sysadmin@csfp.gov.ph';
      const isEccdAdmin = (roleKey === 'eccd_admin' || roleKey === 'cswdo_admin' || u.role_id === 4 || u.email === 'admin@eccd.gov.ph') && !isSysAdmin;
      const isCdt = !isSysAdmin && !isEccdAdmin;

      const matchRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'SYSADMIN' && isSysAdmin) ||
        (roleFilter === 'ECCD_ADMIN' && isEccdAdmin) ||
        (roleFilter === 'CDT' && isCdt);

      return matchQuery && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const sysadmins = users.filter((u) => {
      const k = u.role?.name;
      return k === 'sysadmin' || u.role_id === 1 || u.email === 'sysadmin@csfp.gov.ph';
    }).length;
    const eccdAdmins = users.filter((u) => {
      const k = u.role?.name;
      return (k === 'eccd_admin' || k === 'cswdo_admin' || u.role_id === 4 || u.email === 'admin@eccd.gov.ph') && u.email !== 'sysadmin@csfp.gov.ph';
    }).length;
    const cdts = Math.max(0, total - sysadmins - eccdAdmins);
    const withCenters = users.filter((u) => u.worker?.dayCareCenter || u.worker?.day_care_center_id).length;

    return { total, sysadmins, eccdAdmins, cdts, withCenters };
  }, [users]);

  // --- Handlers ---

  const handleOpenCreate = () => {
    const newPass = generatePassword();
    setCreateForm({
      name: '',
      email: '',
      password: newPass,
      role_id: roles.find((r) => r.name === 'cdt')?.id || roles[0]?.id || '',
      day_care_center_id: '',
      barangay_id: '',
      contact: '',
    });
    setFormError('');
    setShowPassword(true);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!createForm.name.trim()) {
      setFormError('Please provide the complete name of the staff member.');
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.createUser(createForm);
      addToast(`Account for ${createForm.name} created successfully!`, 'success');
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role_id: user.role_id || user.role?.id || '',
      day_care_center_id: user.worker?.dayCareCenter?.id || user.worker?.day_care_center_id || '',
      barangay_id: user.worker?.barangay?.id || user.worker?.barangay_id || '',
      contact: user.worker?.contact || '',
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!editForm.name.trim() || !editForm.email.trim()) {
      setFormError('Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.updateUser(selectedUser.id, editForm);
      addToast(`User account updated successfully!`, 'success');
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResetPassword = (user) => {
    setSelectedUser(user);
    const newPass = generatePassword();
    setResetPasswordVal(newPass);
    setShowPassword(true);
    setFormError('');
    setIsResetOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!resetPasswordVal || resetPasswordVal.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.resetPassword(selectedUser.id, resetPasswordVal);
      addToast(`Password for ${selectedUser.name} was reset successfully!`, 'success');
      setIsResetOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    setIsSubmitting(true);
    try {
      await userService.deleteUser(selectedUser.id);
      addToast(`User account removed successfully.`, 'info');
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to delete user.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-management-view" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={26} style={{ color: '#4f46e5' }} />
            User Accounts &amp; Access Control Directory
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            CSFP System Administration Console • Sya ang may hawak ng mga account ng ECCD Administrative officers at Child Development Teachers (CDTs).
          </p>
        </div>

        <Button
          variant="primary"
          icon={UserPlus}
          onClick={handleOpenCreate}
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            border: 'none',
            fontWeight: 700,
          }}
        >
          + Create Staff Account
        </Button>
      </div>

      {/* 2. Enhanced Statistical KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
        {/* Total Users */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, var(--bg-surface) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Registered Users
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} style={{ color: '#4f46e5' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active system credentials
          </div>
        </div>

        {/* CSFP SysAdmins */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, var(--bg-surface) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              CSFP SysAdmins
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} style={{ color: '#4f46e5' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4f46e5', lineHeight: 1.1 }}>
            {stats.sysadmins}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Admin Console &amp; IT Root Authority
          </div>
        </div>

        {/* ECCD Administrative Officers */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, var(--bg-surface) 100%)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ECCD Administrative
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} style={{ color: '#c2410c' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c2410c', lineHeight: 1.1 }}>
            {stats.eccdAdmins}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            CSWDO Operations (All 35 Barangays)
          </div>
        </div>

        {/* Child Development Teachers */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-surface) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              CDT Teachers
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={16} style={{ color: '#059669' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
            {stats.cdts}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Frontline Daycare Implementers
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <Card>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Search staff by name, email, or center..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              <select
                className="input"
                style={{ width: 'auto', minWidth: '180px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles ({users.length})</option>
                <option value="SYSADMIN">CSFP SysAdmins ({stats.sysadmins})</option>
                <option value="ECCD_ADMIN">ECCD Administrative ({stats.eccdAdmins})</option>
                <option value="CDT">Child Development Teachers ({stats.cdts})</option>
              </select>
            </div>

            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadData} isLoading={loading}>
              Refresh
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 4. Users Table */}
      <Card>
        <CardHeader>
          <CardTitle subtitle="Manage access credentials, roles, and password resets">
            Staff Credentials &amp; Accounts Directory ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name &amp; Email</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead>Assigned Facility / Barangay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      Loading accounts directory...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No staff accounts found matching your query.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const isSuperAdmin = user.id === 1 || user.email === 'sysadmin@csfp.gov.ph';
                    const isSelf = currentUser?.id === user.id || currentUser?.email === user.email;
                    const roleName = user.role?.name || (user.role_id === 1 ? 'sysadmin' : (user.role_id === 4 ? 'eccd_admin' : 'cdt'));
                    const isSysAdmin = roleName === 'sysadmin' || user.email === 'sysadmin@csfp.gov.ph';
                    const isEccdAdmin = (roleName === 'eccd_admin' || roleName === 'cswdo_admin' || user.role_id === 4 || user.email === 'admin@eccd.gov.ph') && !isSysAdmin;
                    const isCdt = !isSysAdmin && !isEccdAdmin;

                    const initials = (user.name || 'U')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase();

                    const centerName =
                      user.worker?.dayCareCenter?.name ||
                      (user.worker?.day_care_center_id
                        ? centers.find((c) => c.id === user.worker.day_care_center_id)?.name
                        : null);

                    const barangayName = user.worker?.barangay?.name || user.worker?.barangayName;

                    const avatarBg = isSysAdmin
                      ? 'linear-gradient(135deg, #312e81, #4f46e5)'
                      : isEccdAdmin
                      ? 'linear-gradient(135deg, #7e191b, #c2410c)'
                      : 'linear-gradient(135deg, #0284c7, #059669)';

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: avatarBg,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '13px',
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                {user.name}
                                {isSelf && (
                                  <span style={{ fontSize: '10px', background: 'var(--color-primary-100)', color: 'var(--color-primary-800)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {isSysAdmin ? (
                            <Badge variant="danger">
                              CSFP System Administrator
                            </Badge>
                          ) : isEccdAdmin ? (
                            <Badge variant="warning">
                              ECCD Administrative
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              Child Development Teacher (CDT)
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {isSysAdmin ? (
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#4f46e5' }}>CSFP MIS Admin Console</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>City-wide IT Infrastructure</div>
                            </div>
                          ) : isEccdAdmin ? (
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#c2410c' }}>City Social Welfare &amp; Development</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Consolidated 35 Barangays</div>
                            </div>
                          ) : centerName ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{centerName}</div>
                              {barangayName && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Brgy. {barangayName}</div>}
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unassigned Center</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                            Active
                          </span>
                        </TableCell>

                        <TableCell style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Key}
                              onClick={() => handleOpenResetPassword(user)}
                              title="Reset staff password"
                            >
                              Reset
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              icon={Edit2}
                              onClick={() => handleOpenEdit(user)}
                              title="Edit user details"
                            />

                            {!isSuperAdmin && !isSelf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Trash2}
                                onClick={() => handleOpenDelete(user)}
                                title="Delete user account"
                                style={{ color: 'var(--color-danger-primary)' }}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* ========================================================
          MODAL 1: Create New User Account
          ======================================================== */}
      {isCreateOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Create New Staff Account
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Enter credentials to grant access to ANÁC system
                </p>
              </div>
              <button className="btn-ghost btn-sm btn-icon-only" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '1.5rem' }}>
              {formError && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '6px', color: '#b91c1c', fontSize: '13px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Full Name <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Maria Remedios D. Santos"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address (Login Username) <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. msantos@cswdo.gov.ph"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">System Role <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  value={createForm.role_id}
                  onChange={(e) => setCreateForm({ ...createForm, role_id: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  CSFP SYSADMIN can provision accounts for ECCD Administrative officers (CSWDO Head) and Child Development Teachers (CDTs).
                </span>
              </div>

              {/* Day Care Center Assignment (If CDT) */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Assigned Day Care Center (Facility)</label>
                <select
                  className="input"
                  value={createForm.day_care_center_id}
                  onChange={(e) => setCreateForm({ ...createForm, day_care_center_id: e.target.value })}
                >
                  <option value="">-- No specific center / Citywide --</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.barangayName ? `(${c.barangayName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password Generator */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Initial Temporary Password <span style={{ color: 'red' }}>*</span></label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary-800)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    onClick={() => setCreateForm({ ...createForm, password: generatePassword() })}
                  >
                    <RefreshCw size={11} /> Generate New
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    icon={copiedPassword ? Check : Copy}
                    onClick={() => handleCopyPassword(createForm.password)}
                    title="Copy password"
                  >
                    {copiedPassword ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Give these credentials to the user. They can log in immediately at the ANÁC login page.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Create Staff Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: Reset User Password
          ======================================================== */}
      {isResetOpen && selectedUser && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Reset User Password
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Account: <strong>{selectedUser.name}</strong> ({selectedUser.email})
                </p>
              </div>
              <button className="btn-ghost btn-sm btn-icon-only" onClick={() => setIsResetOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} style={{ padding: '1.5rem' }}>
              {formError && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '6px', color: '#b91c1c', fontSize: '13px', marginBottom: '1rem' }}>
                  {formError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>New Temporary Password</label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary-800)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    onClick={() => setResetPasswordVal(generatePassword())}
                  >
                    <RefreshCw size={11} /> Generate
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      value={resetPasswordVal}
                      onChange={(e) => setResetPasswordVal(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    icon={copiedPassword ? Check : Copy}
                    onClick={() => handleCopyPassword(resetPasswordVal)}
                  >
                    {copiedPassword ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <Button type="button" variant="ghost" onClick={() => setIsResetOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Save &amp; Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: Edit User Details
          ======================================================== */}
      {isEditOpen && selectedUser && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Edit Staff Account
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                  Update name, email, or center assignment
                </p>
              </div>
              <button className="btn-ghost btn-sm btn-icon-only" onClick={() => setIsEditOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '1.5rem' }}>
              {formError && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '6px', color: '#b91c1c', fontSize: '13px', marginBottom: '1rem' }}>
                  {formError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">System Role</label>
                <select
                  className="input"
                  value={editForm.role_id}
                  onChange={(e) => setEditForm({ ...editForm, role_id: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Assigned Day Care Center</label>
                <select
                  className="input"
                  value={editForm.day_care_center_id}
                  onChange={(e) => setEditForm({ ...editForm, day_care_center_id: e.target.value })}
                >
                  <option value="">-- No specific center / Citywide --</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.barangayName ? `(${c.barangayName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: Delete Confirmation
          ======================================================== */}
      {isDeleteOpen && selectedUser && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#b91c1c' }}>
              <AlertCircle size={28} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Delete User Account?
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Are you sure you want to delete the account for <strong>{selectedUser.name}</strong> ({selectedUser.email})? They will no longer be able to log in to the ANÁC system.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteSubmit}>
                Yes, Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementView;
