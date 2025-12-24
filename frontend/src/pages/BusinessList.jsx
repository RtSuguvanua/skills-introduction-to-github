import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../App';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  Search, 
  Plus, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'ceased', label: 'Ceased' },
  { value: 'dormant', label: 'Dormant' },
];

const DATA_SOURCES = [
  { value: 'all', label: 'All Sources' },
  { value: 'manual', label: 'Manual Entry' },
  { value: 'excel_import', label: 'Excel Import' },
  { value: 'frcs_import', label: 'FRCS Import' },
  { value: 'moj_import', label: 'MOJ Import' },
];

export default function BusinessList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [dataSource, setDataSource] = useState(searchParams.get('source') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(searchParams.get('action') === 'new');
  const [newBusiness, setNewBusiness] = useState({
    business_name: '',
    trading_name: '',
    tin: '',
    registration_number: '',
    fsic_code: '',
    province: '',
    address: '',
    phone: '',
    email: '',
    status: 'active'
  });
  const [surveys, setSurveys] = useState([]);
  const [sections, setSections] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBusinesses();
    fetchReferenceData();
  }, [page, status, dataSource]);

  const fetchReferenceData = async () => {
    try {
      const [surveysRes, sectionsRes, provincesRes] = await Promise.all([
        axios.get(`${API}/surveys`),
        axios.get(`${API}/fsic/sections`),
        axios.get(`${API}/reference/provinces`)
      ]);
      setSurveys(surveysRes.data);
      setSections(sectionsRes.data);
      setProvinces(provincesRes.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (dataSource && dataSource !== 'all') params.append('data_source', dataSource);
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await axios.get(`${API}/businesses?${params.toString()}`, {
        withCredentials: true
      });
      
      setBusinesses(response.data.businesses);
      setTotal(response.data.total);
      setPages(response.data.pages);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    
    if (!newBusiness.business_name || !newBusiness.fsic_code) {
      toast.error('Business name and FSIC code are required');
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(`${API}/businesses`, newBusiness, {
        withCredentials: true
      });
      
      toast.success('Business created successfully');
      setShowNewDialog(false);
      setNewBusiness({
        business_name: '',
        trading_name: '',
        tin: '',
        registration_number: '',
        fsic_code: '',
        province: '',
        address: '',
        phone: '',
        email: '',
        status: 'active'
      });
      fetchBusinesses();
      
      // Navigate to the new business
      navigate(`/businesses/${response.data.business_id}`);
    } catch (error) {
      console.error('Failed to create business:', error);
      toast.error(error.response?.data?.detail || 'Failed to create business');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (businessStatus) => {
    const variants = {
      active: 'badge-active',
      inactive: 'badge-inactive',
      ceased: 'badge-ceased',
      dormant: 'badge-pending'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${variants[businessStatus] || 'badge-inactive'}`}>
        {businessStatus}
      </span>
    );
  };

  const canEdit = user?.role === 'admin' || user?.role === 'officer';

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">Business Register</h1>
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString()} businesses registered
            </p>
          </div>
          
          {canEdit && (
            <Button onClick={() => setShowNewDialog(true)} data-testid="add-business-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, TIN, or registration number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="search-input"
                  />
                </div>
                <Button type="submit" variant="secondary" data-testid="search-btn">
                  Search
                </Button>
              </form>
              
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                data-testid="filter-btn"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {(status !== 'all' || dataSource !== 'all') && (
                  <span className="ml-2 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                    {[status !== 'all', dataSource !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Status</Label>
                  <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                    <SelectTrigger data-testid="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs mb-1.5 block">Data Source</Label>
                  <Select value={dataSource} onValueChange={(val) => { setDataSource(val); setPage(1); }}>
                    <SelectTrigger data-testid="source-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_SOURCES.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setStatus('all');
                      setDataSource('all');
                      setSearch('');
                      setPage(1);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="spinner"></div>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-foreground mb-2">No businesses found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search || status !== 'all' ? 'Try adjusting your search or filters' : 'Start by importing data or adding a new business'}
                </p>
                {canEdit && (
                  <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Business
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Business Name</TableHead>
                      <TableHead className="w-[120px]">TIN</TableHead>
                      <TableHead className="w-[100px]">FSIC Code</TableHead>
                      <TableHead className="w-[180px]">Survey</TableHead>
                      <TableHead className="w-[100px]">Province</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                      <TableHead className="w-[100px]">Source</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((business) => (
                      <TableRow key={business.business_id} data-testid={`business-row-${business.business_id}`}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-body text-sm text-foreground truncate max-w-[180px]">
                              {business.business_name}
                            </p>
                            {business.trading_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                Trading as: {business.trading_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{business.tin || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {business.fsic_code}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[160px]">
                          {business.establishment_survey || '-'}
                        </TableCell>
                        <TableCell className="text-xs">{business.province || '-'}</TableCell>
                        <TableCell>{getStatusBadge(business.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {business.data_source?.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link to={`/businesses/${business.business_id}`} data-testid={`view-business-${business.business_id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {pages} ({total.toLocaleString()} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Business Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Business</DialogTitle>
              <DialogDescription>
                Enter the business details. FSIC code will automatically determine the survey.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={newBusiness.business_name}
                    onChange={(e) => setNewBusiness({...newBusiness, business_name: e.target.value})}
                    required
                    data-testid="new-business-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="trading_name">Trading Name</Label>
                  <Input
                    id="trading_name"
                    value={newBusiness.trading_name}
                    onChange={(e) => setNewBusiness({...newBusiness, trading_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tin">TIN</Label>
                    <Input
                      id="tin"
                      value={newBusiness.tin}
                      onChange={(e) => setNewBusiness({...newBusiness, tin: e.target.value})}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registration_number">Registration No.</Label>
                    <Input
                      id="registration_number"
                      value={newBusiness.registration_number}
                      onChange={(e) => setNewBusiness({...newBusiness, registration_number: e.target.value})}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fsic_code">FSIC Code * (e.g., 01, 10, 45)</Label>
                  <Input
                    id="fsic_code"
                    value={newBusiness.fsic_code}
                    onChange={(e) => setNewBusiness({...newBusiness, fsic_code: e.target.value})}
                    placeholder="Enter 2-4 digit FSIC code"
                    className="font-mono"
                    required
                    data-testid="new-business-fsic"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <Link to="/fsic" className="text-primary hover:underline">Browse FSIC codes</Link>
                  </p>
                </div>

                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select 
                    value={newBusiness.province} 
                    onValueChange={(val) => setNewBusiness({...newBusiness, province: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newBusiness.address}
                    onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newBusiness.phone}
                      onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newBusiness.email}
                      onChange={(e) => setNewBusiness({...newBusiness, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newBusiness.status} 
                    onValueChange={(val) => setNewBusiness({...newBusiness, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="ceased">Ceased</SelectItem>
                      <SelectItem value="dormant">Dormant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} data-testid="create-business-btn">
                  {creating ? 'Creating...' : 'Create Business'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
