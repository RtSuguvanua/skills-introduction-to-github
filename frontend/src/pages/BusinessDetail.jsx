import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../App';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Edit2, 
  Save, 
  Trash2, 
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  BarChart3,
  Calendar,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [provinces, setProvinces] = useState([]);

  useEffect(() => {
    fetchBusiness();
    fetchProvinces();
  }, [id]);

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/businesses/${id}`, {
        withCredentials: true
      });
      setBusiness(response.data);
      setEditData(response.data);
    } catch (error) {
      console.error('Failed to fetch business:', error);
      toast.error('Failed to load business details');
      navigate('/businesses');
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await axios.get(`${API}/reference/provinces`);
      setProvinces(response.data);
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`${API}/businesses/${id}`, editData, {
        withCredentials: true
      });
      setBusiness(response.data);
      setEditing(false);
      toast.success('Business updated successfully');
    } catch (error) {
      console.error('Failed to update business:', error);
      toast.error(error.response?.data?.detail || 'Failed to update business');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/businesses/${id}`, {
        withCredentials: true
      });
      toast.success('Business deleted successfully');
      navigate('/businesses');
    } catch (error) {
      console.error('Failed to delete business:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete business');
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'officer';
  const canDelete = user?.role === 'admin';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-foreground mb-2">Business not found</h3>
          <Button asChild>
            <Link to="/businesses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to list
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-slate-100 text-slate-800 border-slate-200',
      ceased: 'bg-red-100 text-red-800 border-red-200',
      dormant: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || colors.inactive;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/businesses">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">
                {business.business_name}
              </h1>
              {business.trading_name && (
                <p className="text-sm text-muted-foreground">
                  Trading as: {business.trading_name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {canEdit && !editing && (
              <Button onClick={() => setEditing(true)} variant="outline" data-testid="edit-business-btn">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {editing && (
              <>
                <Button variant="outline" onClick={() => { setEditing(false); setEditData(business); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} data-testid="save-business-btn">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
            {canDelete && !editing && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                data-testid="delete-business-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground text-xs">Business Name</Label>
                  {editing ? (
                    <Input
                      value={editData.business_name || ''}
                      onChange={(e) => setEditData({...editData, business_name: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium text-foreground mt-1">{business.business_name}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Trading Name</Label>
                  {editing ? (
                    <Input
                      value={editData.trading_name || ''}
                      onChange={(e) => setEditData({...editData, trading_name: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{business.trading_name || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">TIN</Label>
                  {editing ? (
                    <Input
                      value={editData.tin || ''}
                      onChange={(e) => setEditData({...editData, tin: e.target.value})}
                      className="mt-1 font-mono"
                    />
                  ) : (
                    <p className="font-mono text-foreground mt-1">{business.tin || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Registration Number</Label>
                  {editing ? (
                    <Input
                      value={editData.registration_number || ''}
                      onChange={(e) => setEditData({...editData, registration_number: e.target.value})}
                      className="mt-1 font-mono"
                    />
                  ) : (
                    <p className="font-mono text-foreground mt-1">{business.registration_number || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Business Type</Label>
                  {editing ? (
                    <Input
                      value={editData.business_type || ''}
                      onChange={(e) => setEditData({...editData, business_type: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{business.business_type || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Legal Status</Label>
                  {editing ? (
                    <Input
                      value={editData.legal_status || ''}
                      onChange={(e) => setEditData({...editData, legal_status: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{business.legal_status || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Employee Count</Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editData.employee_count || ''}
                      onChange={(e) => setEditData({...editData, employee_count: parseInt(e.target.value) || null})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{business.employee_count?.toLocaleString() || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Annual Turnover</Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editData.annual_turnover || ''}
                      onChange={(e) => setEditData({...editData, annual_turnover: parseFloat(e.target.value) || null})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-mono text-foreground mt-1">
                      {business.annual_turnover ? `$${business.annual_turnover.toLocaleString()}` : '-'}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  {editing ? (
                    <Select 
                      value={editData.status} 
                      onValueChange={(val) => setEditData({...editData, status: val})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="ceased">Ceased</SelectItem>
                        <SelectItem value="dormant">Dormant</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(business.status)}`}>
                        {business.status}
                      </span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  Contact & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground text-xs">Province</Label>
                  {editing ? (
                    <Select 
                      value={editData.province || ''} 
                      onValueChange={(val) => setEditData({...editData, province: val})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-foreground mt-1">{business.province || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Division</Label>
                  {editing ? (
                    <Input
                      value={editData.division || ''}
                      onChange={(e) => setEditData({...editData, division: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{business.division || '-'}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground text-xs">Address</Label>
                  {editing ? (
                    <Textarea
                      value={editData.address || ''}
                      onChange={(e) => setEditData({...editData, address: e.target.value})}
                      className="mt-1"
                      rows={2}
                    />
                  ) : (
                    <p className="text-foreground mt-1">{business.address || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </Label>
                  {editing ? (
                    <Input
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{business.phone || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  {editing ? (
                    <Input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{business.email || '-'}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Website
                  </Label>
                  {editing ? (
                    <Input
                      value={editData.website || ''}
                      onChange={(e) => setEditData({...editData, website: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">
                      {business.website ? (
                        <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {business.website}
                        </a>
                      ) : '-'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {editing ? (
                  <Textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    rows={4}
                    placeholder="Add notes about this business..."
                  />
                ) : (
                  <p className="text-foreground whitespace-pre-wrap">
                    {business.notes || 'No notes added.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Classification */}
            <Card>
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">FSIC Code</Label>
                  {editing ? (
                    <Input
                      value={editData.fsic_code || ''}
                      onChange={(e) => setEditData({...editData, fsic_code: e.target.value})}
                      className="mt-1 font-mono"
                    />
                  ) : (
                    <p className="mt-1">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-sm">
                        {business.fsic_code}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">FSIC Description</Label>
                  <p className="text-foreground mt-1 text-sm">{business.fsic_description || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Establishment Survey</Label>
                  <p className="text-foreground mt-1 text-sm font-medium">
                    {business.establishment_survey || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  Record Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">Data Source</Label>
                  <p className="text-foreground mt-1 capitalize">
                    {business.data_source?.replace('_', ' ') || 'Manual'}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Created</Label>
                  <p className="text-foreground mt-1">
                    {business.created_at ? new Date(business.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Last Updated</Label>
                  <p className="text-foreground mt-1">
                    {business.last_updated ? new Date(business.last_updated).toLocaleDateString() : '-'}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Business ID</Label>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {business.business_id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Business</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{business.business_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
