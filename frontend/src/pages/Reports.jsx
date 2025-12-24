import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart as PieChartIcon,
  TrendingUp,
  Building2,
  MapPin,
  Layers,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#0055A4', '#1B5E20', '#E65100', '#7C3AED', '#0891B2', '#DB2777', '#EA580C', '#059669', '#4F46E5', '#DC2626'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  // Prepare chart data
  const sectionData = stats?.by_section?.slice(0, 10).map((item, index) => ({
    name: item.section,
    fullName: item.name,
    value: item.count,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const surveyData = stats?.by_survey?.slice(0, 10).map((item, index) => ({
    name: item.survey.length > 20 ? item.survey.substring(0, 20) + '...' : item.survey,
    fullName: item.survey,
    value: item.count,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const provinceData = stats?.by_province?.slice(0, 10).map((item) => ({
    name: item.province || 'Unknown',
    businesses: item.count
  })) || [];

  const sourceData = stats?.by_source?.map((item) => ({
    name: item.source?.replace('_', ' ') || 'Unknown',
    value: item.count
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in print:animate-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">
              Statistical Reports & Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Official statistics for policy-making and public information
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="font-heading font-bold text-2xl">Fiji Bureau of Statistics</h1>
          <h2 className="font-heading text-lg text-muted-foreground">Business Register Statistical Report</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Generated: {new Date().toLocaleDateString('en-FJ', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-white/80 text-sm">Total Businesses</p>
                  <p className="font-heading font-bold text-3xl">
                    {stats?.total_businesses?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-white/80 text-sm">Active</p>
                  <p className="font-heading font-bold text-3xl">
                    {stats?.active_businesses?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent to-accent/80 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Layers className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-white/80 text-sm">FSIC Sections</p>
                  <p className="font-heading font-bold text-3xl">
                    {stats?.by_section?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-600 to-violet-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-white/80 text-sm">Provinces</p>
                  <p className="font-heading font-bold text-3xl">
                    {stats?.by_province?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="industry">
              <PieChartIcon className="w-4 h-4 mr-2" />
              By Industry
            </TabsTrigger>
            <TabsTrigger value="geography">
              <MapPin className="w-4 h-4 mr-2" />
              By Geography
            </TabsTrigger>
            <TabsTrigger value="survey">
              <Layers className="w-4 h-4 mr-2" />
              By Survey
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Industry Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Business Distribution by FSIC Section
                  </CardTitle>
                  <CardDescription>
                    Classification of businesses by economic activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sectionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sectionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {sectionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [value.toLocaleString(), props.payload.fullName]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-secondary" />
                    Data Sources
                  </CardTitle>
                  <CardDescription>
                    How business data was collected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => value.toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="industry" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Business Count by FSIC Section
                </CardTitle>
                <CardDescription>
                  Fiji Standard Industrial Classification 2010
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sectionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={sectionData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={40} />
                      <Tooltip 
                        formatter={(value, name, props) => [value.toLocaleString(), props.payload.fullName]}
                      />
                      <Bar dataKey="value" name="Businesses" radius={[0, 4, 4, 0]}>
                        {sectionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Business Distribution by Province
                </CardTitle>
                <CardDescription>
                  Geographic distribution across Fiji's provinces
                </CardDescription>
              </CardHeader>
              <CardContent>
                {provinceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={provinceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Bar dataKey="businesses" name="Businesses" fill="#0055A4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No province data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="survey" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Business Distribution by Establishment Survey
                </CardTitle>
                <CardDescription>
                  Automatic classification for economic surveys
                </CardDescription>
              </CardHeader>
              <CardContent>
                {surveyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={surveyData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={180} />
                      <Tooltip 
                        formatter={(value, name, props) => [value.toLocaleString(), props.payload.fullName]}
                      />
                      <Bar dataKey="value" name="Businesses" fill="#1B5E20" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No survey data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Print-only charts */}
        <div className="hidden print:block space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Business Distribution by FSIC Section</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {sectionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">
                      <span className="font-mono bg-muted px-1 rounded mr-2">{item.name}</span>
                      {item.fullName}
                    </span>
                    <span className="font-mono font-medium">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Distribution by Province</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {provinceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-mono font-medium">{item.businesses.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Summary Statistics
            </CardTitle>
            <CardDescription>
              Key indicators for policy-making and international reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Active Rate</p>
                <p className="font-heading font-bold text-2xl text-foreground">
                  {stats?.total_businesses 
                    ? ((stats.active_businesses / stats.total_businesses) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  of registered businesses
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Top Industry</p>
                <p className="font-heading font-bold text-lg text-foreground truncate">
                  {stats?.by_section?.[0]?.name || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.by_section?.[0]?.count?.toLocaleString() || 0} businesses
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Top Province</p>
                <p className="font-heading font-bold text-lg text-foreground">
                  {stats?.by_province?.[0]?.province || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.by_province?.[0]?.count?.toLocaleString() || 0} businesses
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Data Coverage</p>
                <p className="font-heading font-bold text-2xl text-foreground">
                  {stats?.by_source?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  data sources integrated
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer for print */}
        <div className="hidden print:block text-center text-sm text-muted-foreground mt-8 pt-4 border-t">
          <p>Fiji Bureau of Statistics - Economics Statistics Division</p>
          <p>Business Register Management System</p>
          <p className="text-xs mt-2">
            This report contains official statistics for government use.
            For enquiries, contact the Business Register Unit.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
