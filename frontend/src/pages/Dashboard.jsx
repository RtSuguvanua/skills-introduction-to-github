import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../App';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats/dashboard`, {
        withCredentials: true
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
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

  const statCards = [
    {
      title: 'Total Businesses',
      value: stats?.total_businesses || 0,
      icon: Building2,
      color: 'bg-primary',
      link: '/businesses'
    },
    {
      title: 'Active Businesses',
      value: stats?.active_businesses || 0,
      icon: CheckCircle2,
      color: 'bg-secondary',
      link: '/businesses?status=active'
    },
    {
      title: 'Inactive Businesses',
      value: stats?.inactive_businesses || 0,
      icon: XCircle,
      color: 'bg-accent',
      link: '/businesses?status=inactive'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
          <h1 className="font-heading font-bold text-2xl mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-white/80 text-sm">
            Fiji Business Register Management System - Economics Statistics Division
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link key={index} to={stat.link}>
                <Card className="card-hover cursor-pointer" data-testid={`stat-card-${index}`}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="font-heading font-bold text-2xl text-foreground">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* By Survey */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                By Establishment Survey
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {stats?.by_survey?.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.by_survey.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground truncate flex-1 mr-4">
                        {item.survey}
                      </span>
                      <span className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data available. Import businesses to see statistics.
                </p>
              )}
            </CardContent>
          </Card>

          {/* By Section */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                By FSIC Section
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {stats?.by_section?.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.by_section.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {item.section}
                        </span>
                        <span className="text-sm text-muted-foreground truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded ml-2">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* By Province */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                By Province
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {stats?.by_province?.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.by_province.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {item.province || 'Not specified'}
                      </span>
                      <span className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No province data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Imports */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Recent Imports
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {stats?.recent_imports?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_imports.map((imp, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {imp.file_name || `${imp.import_type} Import`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(imp.created_at).toLocaleDateString()} - {imp.records_processed} records
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-secondary">
                          +{imp.records_created} new
                        </span>
                        {imp.records_updated > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ~{imp.records_updated} updated
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No imports yet
                  </p>
                  {(user?.role === 'admin' || user?.role === 'officer') && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/import">
                        Import Data <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <Button asChild data-testid="quick-action-businesses">
                <Link to="/businesses">
                  <Building2 className="w-4 h-4 mr-2" />
                  View All Businesses
                </Link>
              </Button>
              {(user?.role === 'admin' || user?.role === 'officer') && (
                <>
                  <Button asChild variant="outline" data-testid="quick-action-import">
                    <Link to="/import">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/businesses?action=new">
                      <Building2 className="w-4 h-4 mr-2" />
                      Add New Business
                    </Link>
                  </Button>
                </>
              )}
              <Button asChild variant="outline">
                <Link to="/fsic">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Browse FSIC Codes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
