import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Save, 
  UserPlus, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Building, 
  MapPin, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Lock, 
  Settings, 
  UserCheck, 
  UserX,
  Info
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  department: string | null;
  avatar: string | null;
  address: string | null;
  deletedAt: string | null;
  role?: {
    id: string;
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  permissions: {
    id: string;
    name: string;
  }[];
}

interface UserManagementModuleProps {
  darkMode: boolean;
  currentUser: any;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({ darkMode, currentUser }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Main Tab: 'directory' or 'permissions'
  const [activeTab, setActiveTab] = useState<'directory' | 'permissions'>('directory');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Confirmation Modal State
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    roleId: '',
    department: 'Operations',
    address: '',
    avatar: 'emerald',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    roleId: '',
    department: '',
    address: '',
    avatar: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Role Permissions Selection States (Module Permission Matrix)
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Custom Role States
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({
    id: '',
    name: '',
    description: '',
    permissions: {} as Record<string, boolean>
  });
  const [submittingRole, setSubmittingRole] = useState(false);
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  // All system modules and their actions
  const modules = [
    { label: 'Inventory Dashboard', prefix: 'dashboard', actions: ['view'] },
    { label: 'Raw Materials Master', prefix: 'inventory_raw', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Products (Finished Goods)', prefix: 'inventory_products', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Categories & Sub-Categories', prefix: 'inventory_categories', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Suppliers (Mill Directory)', prefix: 'inventory_suppliers', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Warehouses & Bins', prefix: 'inventory_warehouses', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Stock Movements', prefix: 'inventory_transactions', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Stock Management Dashboard', prefix: 'inventory_stock', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Procurement Dashboard', prefix: 'procurement_dashboard', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Requisitions & RFQs', prefix: 'procurement_rfq', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Supplier Quotations', prefix: 'procurement_quotes', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Purchase Orders (POs)', prefix: 'procurement_po', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Gate Entry', prefix: 'procurement_gate_entry', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Reel Inward', prefix: 'procurement_reel_inward', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Quality Control (QC)', prefix: 'procurement_qc', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Production Module', prefix: 'production', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Sales & Dispatch', prefix: 'sales', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Accounts & Finance', prefix: 'accounts', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Reports & Analytics', prefix: 'reports', actions: ['view', 'create', 'edit', 'delete', 'import'] },
    { label: 'Settings & Roles', prefix: 'settings', actions: ['view', 'create', 'edit', 'delete', 'import'] },
  ];

  const getAuthHeaders = () => {
    const token = currentUser?.token || (typeof window !== 'undefined' ? localStorage.getItem('erp_token') : '') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentUser?.email) headers['x-user-email'] = currentUser.email;
    return headers;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users', { headers, credentials: 'include' }).then(r => r.json()),
        fetch('/api/roles', { headers, credentials: 'include' }).then(r => r.json()),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data);
      } else {
        throw new Error(usersRes.error || 'Failed to load users');
      }

      if (rolesRes.success) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0) {
          // Default to the first role that is not Administrator, or Administrator if none other
          const defaultRole = rolesRes.data.find((r: any) => r.name !== 'Administrator') || rolesRes.data[0];
          selectRole(defaultRole);
        }
      } else {
        throw new Error(rolesRes.error || 'Failed to load roles');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with server API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectRole = (role: Role) => {
    setActiveRole(role);
    const mapped: Record<string, boolean> = {};
    role.permissions.forEach(p => {
      mapped[p.name] = true;
    });
    setSelectedPermissions(mapped);
  };

  const handlePermissionChange = (permName: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permName]: checked,
    }));
  };

  const openCreateRoleModal = () => {
    setRoleForm({
      id: '',
      name: '',
      description: '',
      permissions: {}
    });
    setIsCreateRoleModalOpen(true);
  };

  const openEditRoleModal = (role: Role) => {
    const mapped: Record<string, boolean> = {};
    role.permissions.forEach(p => {
      mapped[p.name] = true;
    });
    setRoleForm({
      id: role.id,
      name: role.name,
      description: (role as any).description || '',
      permissions: mapped
    });
    setIsEditRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e: React.FormEvent, isEdit: boolean) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      alert('Role name is required.');
      return;
    }

    setSubmittingRole(true);
    setError(null);
    setSuccessMsg(null);

    const permissionNames = Object.entries(roleForm.permissions)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: isEdit ? 'update' : 'create',
          roleId: isEdit ? roleForm.id : undefined,
          name: roleForm.name.trim(),
          description: roleForm.description.trim() || null,
          permissionNames,
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`Role "${roleForm.name}" ${isEdit ? 'updated' : 'created'} successfully.`);
        if (isEdit) {
          setIsEditRoleModalOpen(false);
        } else {
          setIsCreateRoleModalOpen(false);
        }
        await fetchData(); // Refresh roles & users
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || `Failed to ${isEdit ? 'update' : 'create'} role`);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing role changes');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteRoleConfirm = async () => {
    if (!confirmDeleteRole) return;

    // Count how many users have this role
    const assignedUsers = users.filter(u => u.roleId === confirmDeleteRole.id && !u.deletedAt);
    if (assignedUsers.length > 0) {
      alert(`Cannot delete role. There are currently ${assignedUsers.length} users assigned to this role. Please reassign them before deleting.`);
      setConfirmDeleteRole(null);
      return;
    }

    setDeletingRole(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete',
          roleId: confirmDeleteRole.id,
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`Role "${confirmDeleteRole.name}" has been deleted safely.`);
        setConfirmDeleteRole(null);
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to delete role');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting role');
    } finally {
      setDeletingRole(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!activeRole) return;
    if (activeRole.name === 'Administrator') {
      alert('The Administrator role inherently possesses all permissions to secure the application and prevent lockout.');
      return;
    }

    setSavingPermissions(true);
    setSuccessMsg(null);
    setError(null);

    const permissionNames = Object.entries(selectedPermissions)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          roleId: activeRole.id,
          permissionNames,
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`Permissions for role "${activeRole.name}" updated successfully.`);
        // Refresh local roles list
        const updatedRoles = roles.map(r => {
          if (r.id === activeRole.id) {
            return {
              ...r,
              permissions: permissionNames.map(name => ({ id: name, name })),
            };
          }
          return r;
        });
        setRoles(updatedRoles);
        
        // Auto-refresh current user session state if they edit their own role
        if (currentUser && currentUser.role === activeRole.name) {
          const updatedUser = {
            ...currentUser,
            permissions: permissionNames
          };
          localStorage.setItem('erp_currentUser', JSON.stringify(updatedUser));
        }

        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to save permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  // Helper to calculate avatar initials and pleasant background color mapping
  const getAvatarStyle = (name: string, customAvatar: string | null) => {
    const initials = name 
      ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
      : 'U';
    
    if (customAvatar && customAvatar.startsWith('http')) {
      return { isImg: true, src: customAvatar, initials };
    }

    const theme = customAvatar || 'emerald';
    const styles: Record<string, string> = {
      emerald: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      amber: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      rose: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
      sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    };

    const pickedClass = styles[theme] || styles['emerald'];
    return { isImg: false, class: pickedClass, initials };
  };

  // Create User Handler
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.roleId) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmittingCreate(true);
    setSuccessMsg(null);
    setError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'create',
          name: createForm.name,
          email: createForm.email,
          password: createForm.password || 'password123',
          roleId: createForm.roleId,
          department: createForm.department || 'Operations',
          address: createForm.address || null,
          avatar: createForm.avatar || 'emerald',
          status: createForm.status
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`Account for "${createForm.name}" provisioned successfully.`);
        setIsCreateModalOpen(false);
        // Reset Form
        setCreateForm({
          name: '',
          email: '',
          password: 'password123',
          roleId: '',
          department: 'Operations',
          address: '',
          avatar: 'emerald',
          status: 'Active'
        });
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating user');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '', // Blank by default, only updated if filled
      roleId: user.roleId || '',
      department: user.department || '',
      address: user.address || '',
      avatar: user.avatar || 'emerald',
      status: user.deletedAt ? 'Inactive' : 'Active'
    });
    setIsEditModalOpen(true);
  };

  // Edit User Handler
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email || !editForm.roleId) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmittingEdit(true);
    setSuccessMsg(null);
    setError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'update',
          userId: editForm.id,
          name: editForm.name,
          email: editForm.email,
          password: editForm.password || undefined,
          roleId: editForm.roleId,
          department: editForm.department || null,
          address: editForm.address || null,
          avatar: editForm.avatar || 'emerald',
          status: editForm.status
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`User profile for "${editForm.name}" updated successfully.`);
        setIsEditModalOpen(false);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to update user');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating user');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Soft Delete User Handler
  const handleDeleteUserConfirm = async () => {
    if (!confirmDeleteUser) return;
    setDeletingUser(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete',
          userId: confirmDeleteUser.id
        }),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(`User account "${confirmDeleteUser.name}" suspended successfully.`);
        setConfirmDeleteUser(null);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to suspend user');
      }
    } catch (err: any) {
      setError(err.message || 'Error suspending user');
    } finally {
      setDeletingUser(false);
    }
  };

  // Compile Unique Departments for Filtering
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    users.forEach(u => {
      if (u.department) depts.add(u.department.trim());
    });
    return Array.from(depts).sort();
  }, [users]);

  // Client Side Filtering & Searching (Designed for 100-200+ users efficiently)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query);

      // 2. Role Filter
      const matchesRole = !roleFilter || user.roleId === roleFilter;

      // 3. Department Filter
      const matchesDept = !deptFilter || user.department === deptFilter;

      // 4. Status Filter
      const isActive = !user.deletedAt;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && isActive) || 
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, deptFilter, statusFilter]);

  // Pagination Logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Whenever filters change, reset back to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, deptFilter, statusFilter, pageSize]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header section with AMK ERP design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Enterprise Identity & Access Management (IAM)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision user directory, assign secure system roles, and configure the module permission matrix.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Synchronize IAM</span>
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-semibold flex items-start space-x-3">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs font-semibold flex items-start space-x-3 animate-fade-in">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Primary Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'directory'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory</span>
          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
            activeTab === 'directory' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
          }`}>
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'permissions'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Roles & Permissions Management</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Loading secure role matrices and user registries...</p>
        </div>
      ) : activeTab === 'directory' ? (
        /* ======================== USER DIRECTORY VIEW ======================== */
        <div className="space-y-4">
          
          {/* Filters Dashboard Panel */}
          <div className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              
              {/* Left group: search & filters */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3.5">
                {/* Search query */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className={`w-full pl-3 pr-8 py-2 text-xs border rounded-xl outline-none appearance-none transition-all ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="">All Roles</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Department / Enterprise Filter */}
                <div className="relative">
                  <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className={`w-full pl-3 pr-8 py-2 text-xs border rounded-xl outline-none appearance-none transition-all ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="">All Enterprises/Depts</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className={`w-full pl-3 pr-8 py-2 text-xs border rounded-xl outline-none appearance-none transition-all ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Add user button */}
              <div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full xl:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>

            </div>
          </div>

          {/* User List Table area */}
          <div className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="max-h-[560px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs table-auto relative border-collapse">
                <thead className={`sticky top-0 z-10 ${
                  darkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-700'
                } font-bold border-b border-slate-200 dark:border-slate-800`}>
                  <tr>
                    <th className="py-3 px-4">Profile Card</th>
                    <th className="py-3 px-4">Enterprise Department</th>
                    <th className="py-3 px-4">Authorization Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400 font-medium">
                        No employees or accounts match your current filter query.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(user => {
                      const avatarInfo = getAvatarStyle(user.name, user.avatar);
                      const isActive = !user.deletedAt;

                      return (
                        <tr 
                          key={user.id} 
                          className={`group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                            !isActive ? 'opacity-70 dark:bg-slate-950/20' : ''
                          }`}
                        >
                          {/* Profile Card / User Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              {avatarInfo.isImg ? (
                                <img 
                                  src={avatarInfo.src} 
                                  alt={user.name} 
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-extrabold text-xs shrink-0 ${avatarInfo.class}`}>
                                  {avatarInfo.initials}
                                </div>
                              )}
                              <div>
                                <div className={`font-bold transition-colors ${
                                  darkMode ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                                }`}>
                                  {user.name}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center mt-0.5 font-medium">
                                  <Mail className="w-3 h-3 mr-1 text-slate-500" />
                                  <span>{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Enterprise/Dept */}
                          <td className="py-3.5 px-4 font-semibold text-slate-300">
                            <div className="flex items-center space-x-2">
                              <Building className="w-3.5 h-3.5 text-slate-500" />
                              <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                                {user.department || 'Operations'}
                              </span>
                            </div>
                            {user.address && (
                              <div className="text-[9px] text-slate-500 flex items-center mt-0.5">
                                <MapPin className="w-2.5 h-2.5 mr-0.5" />
                                <span className="truncate max-w-[150px]">{user.address}</span>
                              </div>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4 font-bold">
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] border shrink-0 ${
                              user.role?.name === 'Administrator'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              {user.role?.name || 'Unassigned'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 font-bold">
                            {isActive ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-500 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-slate-500 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                <span>Suspended</span>
                              </span>
                            )}
                          </td>

                          {/* Row Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(user)}
                                title="Edit employee profile"
                                className={`p-1.5 rounded-lg border transition-all ${
                                  darkMode
                                    ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                                    : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 shadow-sm'
                                }`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {isActive ? (
                                <button
                                  onClick={() => setConfirmDeleteUser(user)}
                                  title="Suspend account"
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    darkMode
                                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800'
                                      : 'bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:bg-slate-50 shadow-sm'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    // Quick toggle to restore
                                    try {
                                      const res = await fetch('/api/users', {
                                        method: 'POST',
                                        headers: getAuthHeaders(),
                                        body: JSON.stringify({
                                          action: 'update',
                                          userId: user.id,
                                          name: user.name,
                                          email: user.email,
                                          roleId: user.roleId,
                                          status: 'Active'
                                        })
                                      }).then(r => r.json());
                                      if (res.success) {
                                        setSuccessMsg(`User "${user.name}" restored successfully.`);
                                        fetchData();
                                        setTimeout(() => setSuccessMsg(null), 4000);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  title="Reactivate account"
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    darkMode
                                      ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400 hover:bg-emerald-900/40'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 shadow-sm'
                                  }`}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Control Footer */}
            {totalUsers > 0 && (
              <div className={`px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
                darkMode ? 'bg-slate-950 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                {/* Information */}
                <div className="text-[11px] font-medium">
                  Showing <span className="font-bold text-emerald-500">{Math.min(totalUsers, (currentPage - 1) * pageSize + 1)}</span> to{' '}
                  <span className="font-bold text-emerald-500">{Math.min(totalUsers, currentPage * pageSize)}</span> of{' '}
                  <span className="font-bold text-emerald-500">{totalUsers}</span> users found
                </div>

                {/* Direct Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border bg-transparent hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Dynamic Page Indexing */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const idx = i + 1;
                    const isCurrent = idx === currentPage;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx)}
                        className={`w-7 h-7 text-xs font-bold rounded-lg transition-all ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-md'
                            : (darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-950')
                        }`}
                      >
                        {idx}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border bg-transparent hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sizing options */}
                <div className="flex items-center space-x-2 text-[11px] font-medium">
                  <span>Page size:</span>
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className={`px-2 py-1 rounded-lg border bg-transparent text-xs font-bold outline-none cursor-pointer ${
                      darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value={10}>10 Users</option>
                    <option value={20}>20 Users</option>
                    <option value={50}>50 Users</option>
                    <option value={100}>100 Users</option>
                  </select>
                </div>

              </div>
            )}
          </div>

        </div>
      ) : (
        /* ======================== ROLE & PERMISSION MATRIX VIEW ======================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Role Tabs / Selector Column (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <button
              onClick={openCreateRoleModal}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 mb-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
            <h3 className={`text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 pl-1`}>
              Security Roles
            </h3>
            <div className="flex flex-col gap-2">
              {roles.map(role => {
                const isActive = activeRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-emerald-600/10 border-emerald-500/60 text-emerald-400 font-extrabold shadow-sm'
                        : (darkMode 
                            ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-white' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-950 shadow-xs')
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold">{role.name}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 font-medium">
                          {role.permissions.length} granular permissions
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Permission Matrix Column (9 cols) */}
          <div className="lg:col-span-9">
            <div className={`p-5 rounded-2xl border flex flex-col ${
              darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
              
              {activeRole && (
                <div className="space-y-5">
                  
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Configure permissions for: <span className="text-emerald-500">{activeRole.name}</span>
                      </h3>
                      {(activeRole as any).description && (
                        <p className={`text-[11px] font-medium mt-1 leading-normal ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {(activeRole as any).description}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        View/edit module access permissions for this security group
                      </p>
                    </div>
                    {/* Actions for custom roles */}
                    {!['Administrator', 'Super Admin', 'Inventory Manager', 'Purchase Manager'].includes(activeRole.name) && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditRoleModal(activeRole)}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            darkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Edit Role</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteRole(activeRole)}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            darkMode
                              ? 'bg-slate-950 border-slate-800 text-red-400 hover:bg-slate-850 hover:text-red-350'
                              : 'bg-white border-slate-200 text-red-600 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Role</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Safety Locks warning for Admin */}
                  {activeRole.name === 'Administrator' ? (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs flex items-start space-x-3 leading-relaxed">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">Administrator Lock Protection Enabled</span>
                        The Administrator role possesses absolute read, write, update, and delete access across all enterprise modules. These permissions are managed by the platform config to prevent administrative lockouts.
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">
                      Define which modules the <strong className="text-emerald-400">{activeRole.name}</strong> role is authorized to read or write.
                    </p>
                  )}

                  {/* Select All and Deselect All buttons */}
                  {activeRole.name !== 'Administrator' && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next: Record<string, boolean> = {};
                          modules.forEach(mod => {
                            mod.actions.forEach(action => {
                              next[`${mod.prefix}:${action}`] = true;
                            });
                          });
                          setSelectedPermissions(next);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          darkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        Select All Permissions
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPermissions({});
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          darkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        Deselect All
                      </button>
                    </div>
                  )}

                  {/* Matrix Columns Scrollbar container */}
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
                    
                    {/* Header Columns labels */}
                    <div className={`grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800`}>
                      <div className="col-span-5">Application Module</div>
                      <div className="col-span-7 grid grid-cols-6 text-center">
                        <div>View</div>
                        <div>Add</div>
                        <div>Edit</div>
                        <div>Delete</div>
                        <div>Import</div>
                        <div>All</div>
                      </div>
                    </div>

                    {/* Mod list */}
                    {modules.map((mod, index) => {
                      // Determine if All checkbox for this module is checked
                      const isAllChecked = mod.actions.every(action => selectedPermissions[`${mod.prefix}:${action}`]);
                      
                      const handleToggleAll = (checked: boolean) => {
                        setSelectedPermissions(prev => {
                          const next = { ...prev };
                          mod.actions.forEach(action => {
                            next[`${mod.prefix}:${action}`] = checked;
                          });
                          return next;
                        });
                      };

                      return (
                        <div
                          key={index}
                          className={`grid grid-cols-12 gap-2 items-center py-2.5 px-3 rounded-xl border transition-colors ${
                            darkMode 
                              ? 'border-slate-800/40 hover:bg-slate-800/20' 
                              : 'border-slate-200/40 hover:bg-slate-50'
                          }`}
                        >
                          <div className="col-span-5">
                            <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                              {mod.label}
                            </span>
                            <span className="block text-[9px] text-slate-500 font-mono tracking-tighter mt-0.5">
                              {mod.prefix}
                            </span>
                          </div>
                          <div className="col-span-7 grid grid-cols-6">
                            {['view', 'create', 'edit', 'delete', 'import'].map(action => {
                              const isSupported = mod.actions.includes(action);
                              const permName = `${mod.prefix}:${action}`;
                              const isChecked = selectedPermissions[permName] || false;

                              if (!isSupported) {
                                return <div key={action} className="flex justify-center text-slate-600">-</div>;
                              }

                              return (
                                <div key={action} className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    disabled={activeRole.name === 'Administrator'}
                                    checked={activeRole.name === 'Administrator' || isChecked}
                                    onChange={e => handlePermissionChange(permName, e.target.checked)}
                                    className={`w-4 h-4 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                      darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                            
                            {/* All Checkbox for this module */}
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                disabled={activeRole.name === 'Administrator'}
                                checked={activeRole.name === 'Administrator' || isAllChecked}
                                onChange={e => handleToggleAll(e.target.checked)}
                                className={`w-4 h-4 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                  darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Save Footer button */}
                  {activeRole.name !== 'Administrator' && (
                    <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-2">
                      <button
                        onClick={handleSavePermissions}
                        disabled={savingPermissions}
                        className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                      >
                        {savingPermissions ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save permissions for {activeRole.name}</span>
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ======================== ADD USER MODAL ======================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Provision New Employee Account</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. john@amkcarton.com"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Password */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Enterprise/Department */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enterprise Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={e => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Supply Chain"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Role */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Security Role *</label>
                  <select
                    required
                    value={createForm.roleId}
                    onChange={e => setCreateForm(prev => ({ ...prev, roleId: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="">Select security role...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enterprise Address / Desk</label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={e => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Warehouse Block B, Desk 4"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Initials Color Avatar */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initials Theme Color</label>
                  <select
                    value={createForm.avatar}
                    onChange={e => setCreateForm(prev => ({ ...prev, avatar: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="emerald">Emerald Theme</option>
                    <option value="indigo">Indigo Theme</option>
                    <option value="amber">Amber Theme</option>
                    <option value="rose">Rose Theme</option>
                    <option value="sky">Sky Theme</option>
                    <option value="violet">Violet Theme</option>
                    <option value="teal">Teal Theme</option>
                  </select>
                </div>

                {/* Status */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Status</label>
                  <select
                    value={createForm.status}
                    onChange={e => setCreateForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Submitting Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {submittingCreate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== EDIT USER MODAL ======================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <Edit className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Edit Employee Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. john@amkcarton.com"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Password change (optional) */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reset Password (leave blank to keep current)</label>
                  <input
                    type="text"
                    value={editForm.password}
                    onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter new password..."
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Enterprise/Department */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enterprise Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Supply Chain"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Role */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Security Role *</label>
                  <select
                    required
                    value={editForm.roleId}
                    onChange={e => setEditForm(prev => ({ ...prev, roleId: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="">Select security role...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enterprise Address / Desk</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Warehouse Block B, Desk 4"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Initials Color Avatar */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Initials Theme Color</label>
                  <select
                    value={editForm.avatar}
                    onChange={e => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="emerald">Emerald Theme</option>
                    <option value="indigo">Indigo Theme</option>
                    <option value="amber">Amber Theme</option>
                    <option value="rose">Rose Theme</option>
                    <option value="sky">Sky Theme</option>
                    <option value="violet">Violet Theme</option>
                    <option value="teal">Teal Theme</option>
                  </select>
                </div>

                {/* Status */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {submittingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== CUSTOM CONFIRMATION DIALOG MODAL ======================== */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start space-x-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight">Confirm Account Suspension</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Are you absolutely sure you want to suspend the employee account of{' '}
                  <strong className="text-red-400 font-bold">{confirmDeleteUser.name}</strong> ({confirmDeleteUser.email})? 
                  This will revoke their access to the system immediately. You can reactivate their account later.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  darkMode
                    ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                }`}
              >
                No, Keep Active
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleDeleteUserConfirm}
                className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-600/10 disabled:opacity-50"
              >
                {deletingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                <span>Yes, Suspend Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== CREATE CUSTOM ROLE MODAL ======================== */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Create Custom Security Role</h3>
              </div>
              <button 
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-850 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={e => handleRoleSubmit(e, false)} className="flex flex-col flex-1 overflow-hidden space-y-4">
              <div className="space-y-3.5 shrink-0">
                {/* Role Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Purchase Executive"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={e => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a clear description of who should be assigned this role and what it governs..."
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all resize-none ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Module matrix */}
              <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                <div className="flex items-center justify-between pb-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module Permissions Matrix</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        modules.forEach(m => m.actions.forEach(a => next[`${m.prefix}:${a}`] = true));
                        setRoleForm(prev => ({ ...prev, permissions: next }));
                      }}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleForm(prev => ({ ...prev, permissions: {} }))}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex-1 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col min-h-0">
                  <div className={`grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider p-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
                    <div className="col-span-5">Module</div>
                    <div className="col-span-7 grid grid-cols-6 text-center">
                      <div>View</div>
                      <div>Add</div>
                      <div>Edit</div>
                      <div>Delete</div>
                      <div>Import</div>
                      <div>All</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                    {modules.map((mod, index) => {
                      const isAllChecked = mod.actions.every(action => roleForm.permissions[`${mod.prefix}:${action}`]);
                      
                      const handleToggleRow = (checked: boolean) => {
                        setRoleForm(prev => {
                          const next = { ...prev.permissions };
                          mod.actions.forEach(action => {
                            next[`${mod.prefix}:${action}`] = checked;
                          });
                          return { ...prev, permissions: next };
                        });
                      };

                      const handleCellToggle = (permName: string, checked: boolean) => {
                        setRoleForm(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [permName]: checked
                          }
                        }));
                      };

                      return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                          <div className="col-span-5">
                            <span className="text-xs font-bold block">{mod.label}</span>
                            <span className="text-[9px] font-mono text-slate-500">{mod.prefix}</span>
                          </div>
                          <div className="col-span-7 grid grid-cols-6">
                            {['view', 'create', 'edit', 'delete', 'import'].map(action => {
                              const isSupported = mod.actions.includes(action);
                              const permName = `${mod.prefix}:${action}`;
                              const isChecked = roleForm.permissions[permName] || false;

                              if (!isSupported) {
                                return <div key={action} className="flex justify-center text-slate-500">-</div>;
                              }

                              return (
                                <div key={action} className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => handleCellToggle(permName, e.target.checked)}
                                    className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                      darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                            
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={isAllChecked}
                                onChange={e => handleToggleRow(e.target.checked)}
                                className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                  darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {submittingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== EDIT CUSTOM ROLE MODAL ======================== */}
      {isEditRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center space-x-2.5">
                <Edit className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-sm tracking-tight">Modify Security Role: <span className="text-emerald-500">{roleForm.name}</span></h3>
              </div>
              <button 
                onClick={() => setIsEditRoleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-855 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={e => handleRoleSubmit(e, true)} className="flex flex-col flex-1 overflow-hidden space-y-4">
              <div className="space-y-3.5 shrink-0">
                {/* Role Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Purchase Executive"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={e => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a clear description of who should be assigned this role and what it governs..."
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none transition-all resize-none ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Module matrix */}
              <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                <div className="flex items-center justify-between pb-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module Permissions Matrix</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        modules.forEach(m => m.actions.forEach(a => next[`${m.prefix}:${a}`] = true));
                        setRoleForm(prev => ({ ...prev, permissions: next }));
                      }}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleForm(prev => ({ ...prev, permissions: {} }))}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex-1 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col min-h-0">
                  <div className={`grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider p-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
                    <div className="col-span-5">Module</div>
                    <div className="col-span-7 grid grid-cols-6 text-center">
                      <div>View</div>
                      <div>Add</div>
                      <div>Edit</div>
                      <div>Delete</div>
                      <div>Import</div>
                      <div>All</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                    {modules.map((mod, index) => {
                      const isAllChecked = mod.actions.every(action => roleForm.permissions[`${mod.prefix}:${action}`]);
                      
                      const handleToggleRow = (checked: boolean) => {
                        setRoleForm(prev => {
                          const next = { ...prev.permissions };
                          mod.actions.forEach(action => {
                            next[`${mod.prefix}:${action}`] = checked;
                          });
                          return { ...prev, permissions: next };
                        });
                      };

                      const handleCellToggle = (permName: string, checked: boolean) => {
                        setRoleForm(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [permName]: checked
                          }
                        }));
                      };

                      return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                          <div className="col-span-5">
                            <span className="text-xs font-bold block">{mod.label}</span>
                            <span className="text-[9px] font-mono text-slate-500">{mod.prefix}</span>
                          </div>
                          <div className="col-span-7 grid grid-cols-6">
                            {['view', 'create', 'edit', 'delete', 'import'].map(action => {
                              const isSupported = mod.actions.includes(action);
                              const permName = `${mod.prefix}:${action}`;
                              const isChecked = roleForm.permissions[permName] || false;

                              if (!isSupported) {
                                return <div key={action} className="flex justify-center text-slate-500">-</div>;
                              }

                              return (
                                <div key={action} className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => handleCellToggle(permName, e.target.checked)}
                                    className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                      darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                    }`}
                                  />
                                </div>
                              );
                            })}
                            
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={isAllChecked}
                                onChange={e => handleToggleRow(e.target.checked)}
                                className={`w-3.5 h-3.5 rounded border outline-none cursor-pointer accent-emerald-500 ${
                                  darkMode ? 'border-slate-800 bg-slate-950 text-emerald-500' : 'border-slate-200 bg-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditRoleModalOpen(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {submittingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== DELETE CUSTOM ROLE CONFIRMATION DIALOG ======================== */}
      {confirmDeleteRole && (() => {
        const assignedUsers = users.filter(u => u.roleId === confirmDeleteRole.id && !u.deletedAt);
        const hasAssignedUsers = assignedUsers.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className={`w-full max-w-md rounded-2xl border shadow-xl p-5 overflow-hidden animate-fade-in ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-start space-x-3.5 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  hasAssignedUsers ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">
                    {hasAssignedUsers ? 'Role Deletion Blocked' : 'Delete Custom Role'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {hasAssignedUsers ? (
                      <>
                        The security role <strong className="text-amber-400 font-bold">{confirmDeleteRole.name}</strong> cannot be deleted because it is currently assigned to <span className="text-amber-400 font-bold">{assignedUsers.length} active employee(s)</span>. 
                        Please edit their profile or reassign them to another role first.
                      </>
                    ) : (
                      <>
                        Are you sure you want to permanently delete the custom security role <strong className="text-red-400 font-bold">{confirmDeleteRole.name}</strong>?
                        This will delete this group and revoke all permissions associated with it. This action is irreversible.
                      </>
                    )}
                  </p>
                  
                  {hasAssignedUsers && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 text-[10px] text-slate-300">
                      <span className="font-bold block mb-1">Affected Employees:</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {assignedUsers.map(u => (
                          <div key={u.id} className="flex justify-between">
                            <span>{u.name}</span>
                            <span className="text-slate-500">{u.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteRole(null)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                    darkMode
                      ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                  }`}
                >
                  {hasAssignedUsers ? 'Dismiss' : 'Cancel'}
                </button>
                {!hasAssignedUsers && (
                  <button
                    type="button"
                    disabled={deletingRole}
                    onClick={handleDeleteRoleConfirm}
                    className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-600/10 disabled:opacity-50"
                  >
                    {deletingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Delete Role</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
