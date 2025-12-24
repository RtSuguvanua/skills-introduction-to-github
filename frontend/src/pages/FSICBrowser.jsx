import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Search, FolderTree, BarChart3 } from 'lucide-react';

export default function FSICBrowser() {
  const [sections, setSections] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsRes, divisionsRes] = await Promise.all([
        axios.get(`${API}/fsic/sections`),
        axios.get(`${API}/fsic/divisions`)
      ]);
      setSections(sectionsRes.data);
      setDivisions(divisionsRes.data);
    } catch (error) {
      console.error('Failed to fetch FSIC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sections.filter(section => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const matchesSection = section.name.toLowerCase().includes(searchLower) || 
                          section.code.toLowerCase().includes(searchLower);
    const sectionDivisions = divisions.filter(d => d.section === section.code);
    const matchesDivision = sectionDivisions.some(d => 
      d.name.toLowerCase().includes(searchLower) || d.code.includes(search)
    );
    return matchesSection || matchesDivision;
  });

  const getSurveyColor = (survey) => {
    const colors = {
      'Agriculture Forestry Fishing': 'bg-green-100 text-green-800',
      'Mining and Quarrying': 'bg-amber-100 text-amber-800',
      'Manufacturing': 'bg-blue-100 text-blue-800',
      'Electricity': 'bg-yellow-100 text-yellow-800',
      'Water and Sewerage': 'bg-cyan-100 text-cyan-800',
      'Construction': 'bg-orange-100 text-orange-800',
      'Wholesale Retail Trade': 'bg-purple-100 text-purple-800',
      'Transport': 'bg-indigo-100 text-indigo-800',
      'Accommodation and Food Services': 'bg-pink-100 text-pink-800',
      'Information and Communication': 'bg-violet-100 text-violet-800',
      'Financial Activities': 'bg-emerald-100 text-emerald-800',
      'Real Estate Activities': 'bg-teal-100 text-teal-800',
      'Professional Scientific and Technical Activities': 'bg-sky-100 text-sky-800',
      'Administrative and Support Service Activities': 'bg-rose-100 text-rose-800',
      'Education': 'bg-lime-100 text-lime-800',
      'Human Health': 'bg-red-100 text-red-800',
      'Arts Entertainment and Recreation': 'bg-fuchsia-100 text-fuchsia-800',
      'Economic Surveys': 'bg-slate-100 text-slate-800',
    };
    return colors[survey] || 'bg-slate-100 text-slate-800';
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
          <h1 className="font-heading font-bold text-xl text-foreground">FSIC 2010 Classification</h1>
          <p className="text-sm text-muted-foreground">
            Fiji Standard Industrial Classification codes based on ISIC Rev. 4
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, section, or division name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="fsic-search"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sections Accordion */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              Industry Sections ({filteredSections.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="multiple" className="w-full">
              {filteredSections.map((section) => {
                const sectionDivisions = divisions.filter(d => d.section === section.code);
                const filteredDivisions = search 
                  ? sectionDivisions.filter(d => 
                      d.name.toLowerCase().includes(search.toLowerCase()) || 
                      d.code.includes(search)
                    )
                  : sectionDivisions;

                return (
                  <AccordionItem key={section.code} value={section.code} className="border-b">
                    <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3 text-left">
                        <span className="font-mono text-sm bg-primary text-white px-2 py-0.5 rounded">
                          {section.code}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{section.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sectionDivisions.length} divisions
                          </p>
                        </div>
                        <Badge className={`text-xs ${getSurveyColor(section.survey)}`}>
                          {section.survey}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 ml-8">
                        {(search ? filteredDivisions : sectionDivisions).map((division) => (
                          <div 
                            key={division.code} 
                            className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50"
                          >
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                              {division.code}
                            </span>
                            <span className="text-sm text-foreground flex-1">
                              {division.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Establishment Surveys
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Array.from(new Set(sections.map(s => s.survey))).map((survey) => (
                <div key={survey} className="flex items-center gap-2">
                  <Badge className={`text-xs ${getSurveyColor(survey)}`}>
                    {survey}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
