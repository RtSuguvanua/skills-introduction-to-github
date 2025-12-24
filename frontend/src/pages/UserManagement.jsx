import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Users, Shield, Search } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
  { value: 'officer', label: 'Economics Officer', description: 'Can edit and import data' },
  { value: 'end_user', label: 'End User', description: 'Read-only access' },
];

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?.user_id) {
      toast.error("You cannot change your own role");
      return;
    }

    setUpdating(userId);
    try {
      await axios.put(`${API}/users/${userId}/role`, 
        { role: newRole },
        { withCredentials: true }
      );
      
      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return user.name?.toLowerCase().includes(searchLower) ||
           user.email?.toLowerCase().includes(searchLower);
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      officer: 'bg-blue-100 text-blue-800 border-blue-200',
      end_user: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return colors[role] || colors.end_user;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>

        {/* Role Legend */}
        <div className="grid sm:grid-cols-3 gap-4">
          {ROLES.map((role) => (
            <Card key={role.value} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${
                    role.value === 'admin' ? 'bg-red-100' :
                    role.value === 'officer' ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    <Shield className={`w-5 h-5 ${
                      role.value === 'admin' ? 'text-red-600' :
                      role.value === 'officer' ? 'text-blue-600' : 'text-slate-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{role.label}</p>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="user-search"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.picture} />
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{user.name}</span>
                        {user.user_id === currentUser?.user_id && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">You</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {user.role?.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(val) => handleRoleChange(user.user_id, val)}
                        disabled={user.user_id === currentUser?.user_id || updating === user.user_id}
                      >
                        <SelectTrigger className="w-[140px]" data-testid={`role-select-${user.user_id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
