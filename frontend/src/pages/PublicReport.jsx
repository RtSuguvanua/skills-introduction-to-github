import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
} from 'recharts';
import { 
  Building2, 
  TrendingUp, 
  MapPin, 
  Layers,
  FileText,
  Download,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Globe,
  BarChart3
} from 'lucide-react';

const COLORS = ['#0055A4', '#1B5E20', '#E65100', '#7C3AED', '#0891B2', '#DB2777', '#EA580C', '#059669', '#4F46E5', '#DC2626'];

export default function PublicReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const response = await axios.get(`${API}/public/statistics`);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setError('Failed to load statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchReport}>Try Again</Button>
        </div>
      </div>
    );
  }

  const sectionData = report?.by_section?.slice(0, 10).map((item, index) => ({
    name: item.section,
    fullName: item.name,
    value: item.count,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const surveyData = report?.by_survey?.slice(0, 8).map((item, index) => ({
    name: item.survey.length > 25 ? item.survey.substring(0, 25) + '...' : item.survey,
    fullName: item.survey,
    value: item.count,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const provinceData = report?.by_province?.slice(0, 10).map((item) => ({
    name: item.province || 'Unknown',
    businesses: item.count
  })) || [];

  const statusData = report?.by_status?.map((item, index) => ({
    name: item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown',
    value: item.count,
    fill: item.status === 'active' ? '#1B5E20' : item.status === 'inactive' ? '#64748B' : COLORS[index]
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/90 text-white py-8 print:py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between print:hidden mb-6">
            <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="border-white/30 text-white hover:bg-white/10">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
            </div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl mb-2">
              {report?.report_title}
            </h1>
            <p className="text-white/80 text-lg">{report?.organization}</p>
            <p className="text-white/60 text-sm">{report?.division}</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-green-300" />
              <span className="text-sm">
                Official Statistics | Generated: {new Date(report?.generated_at).toLocaleDateString('en-FJ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="font-heading font-bold text-xl mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Key Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Building2 className="w-10 h-10 text-primary mx-auto mb-2" />
                <p className="font-heading font-bold text-3xl text-primary">
                  {report?.summary?.total_businesses?.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Businesses</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-10 h-10 text-secondary mx-auto mb-2" />
                <p className="font-heading font-bold text-3xl text-secondary">
                  {report?.summary?.active_businesses?.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Active Businesses</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardContent className="p-6 text-center">
                <Layers className="w-10 h-10 text-accent mx-auto mb-2" />
                <p className="font-heading font-bold text-3xl text-accent">
                  {report?.summary?.total_sections}
                </p>
                <p className="text-sm text-muted-foreground">Industry Sectors</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
              <CardContent className="p-6 text-center">
                <MapPin className="w-10 h-10 text-violet-600 mx-auto mb-2" />
                <p className="font-heading font-bold text-3xl text-violet-600">
                  {report?.summary?.total_provinces}
                </p>
                <p className="text-sm text-muted-foreground">Provinces Covered</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Charts Row 1 */}
        <section className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Industry Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">
                Business Distribution by Industry Sector
              </CardTitle>
              <CardDescription>
                FSIC 2010 Classification (Based on ISIC Rev. 4)
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
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [value.toLocaleString() + ' businesses', props.payload.fullName]}
                    />
                    <Legend 
                      formatter={(value, entry) => entry.payload.fullName?.substring(0, 30)}
                      wrapperStyle={{ fontSize: '11px' }}
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

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">
                Business Status Distribution
              </CardTitle>
              <CardDescription>
                Active rate: {report?.summary?.active_rate}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString() + ' businesses'} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Geographic Distribution */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Geographic Distribution by Province
              </CardTitle>
              <CardDescription>
                Number of registered businesses across Fiji's provinces
              </CardDescription>
            </CardHeader>
            <CardContent>
              {provinceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={provinceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => value.toLocaleString() + ' businesses'} />
                    <Bar dataKey="businesses" name="Businesses" fill="#0055A4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No province data available
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* By Survey */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-secondary" />
                Distribution by Establishment Survey
              </CardTitle>
              <CardDescription>
                Businesses classified by economic survey category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {surveyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={surveyData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value, name, props) => [value.toLocaleString() + ' businesses', props.payload.fullName]}
                    />
                    <Bar dataKey="value" name="Businesses" fill="#1B5E20" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No survey data available
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Data Tables */}
        <section className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Section Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">
                Industry Sectors Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {report?.by_section?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {item.section}
                      </span>
                      <span className="text-sm text-foreground truncate max-w-[200px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-medium">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Province Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">
                Provincial Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {report?.by_province?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">
                      {item.province}
                    </span>
                    <span className="font-mono text-sm font-medium">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Methodology */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Methodology & Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-sm mb-2">Classification System</h4>
                  <p className="text-sm text-muted-foreground">
                    {report?.methodology?.classification}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Data Sources</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {report?.methodology?.data_sources?.map((source, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-secondary" />
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sm:col-span-2">
                  <h4 className="font-medium text-sm mb-2">Coverage</h4>
                  <p className="text-sm text-muted-foreground">
                    {report?.methodology?.coverage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Disclaimer */}
        <section className="text-center text-sm text-muted-foreground bg-muted/50 p-6 rounded-lg">
          <Globe className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-medium mb-1">Official Statistics Disclaimer</p>
          <p>{report?.disclaimer}</p>
          <p className="mt-4 text-xs">
            For enquiries, contact the Business Register Unit at Fiji Bureau of Statistics
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-12 print:mt-4">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-6 h-6" />
            <span className="font-heading font-semibold">Fiji Bureau of Statistics</span>
          </div>
          <p className="text-slate-400 text-sm">
            Economics Statistics Division - Business Register Unit
          </p>
          <p className="text-slate-500 text-xs mt-2">
            © {new Date().getFullYear()} Government of Fiji. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
