import React, { useState, useRef } from 'react';
import axios from 'axios';
import { API, useAuth } from '../App';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Building2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function DataImport() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('excel');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      const allowedExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Please select an Excel (.xlsx, .xls) or CSV file');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async (importType) => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = importType === 'excel' 
        ? '/import/excel' 
        : importType === 'frcs' 
          ? '/import/frcs' 
          : '/import/moj';

      const response = await axios.post(`${API}${endpoint}`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      toast.success('Import completed successfully');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error.response?.data?.detail || 'Import failed');
      setResult({ error: error.response?.data?.detail || 'Import failed' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground">Data Import</h1>
          <p className="text-sm text-muted-foreground">
            Import business data from Excel, CSV, FRCS, or Ministry of Justice files
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="excel" data-testid="tab-excel">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel/CSV
            </TabsTrigger>
            <TabsTrigger value="frcs" data-testid="tab-frcs">
              <Building2 className="w-4 h-4 mr-2" />
              FRCS Data
            </TabsTrigger>
            <TabsTrigger value="moj" data-testid="tab-moj">
              <FileText className="w-4 h-4 mr-2" />
              MOJ Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">Excel/CSV Import</CardTitle>
                <CardDescription>
                  Import business data from Excel (.xlsx, .xls) or CSV files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="excel-file" className="cursor-pointer">
                      <span className="text-primary hover:underline">Click to upload</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </Label>
                    <Input
                      id="excel-file"
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="file-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported: .xlsx, .xls, .csv
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      Remove
                    </Button>
                  </div>
                )}

                <div className="bg-muted/30 p-4 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Expected Columns</h4>
                  <p className="text-xs text-muted-foreground">
                    business_name, trading_name, tin, registration_number, fsic_code, 
                    province, address, phone, email, employee_count, status
                  </p>
                </div>

                <Button 
                  onClick={() => handleUpload('excel')} 
                  disabled={!file || uploading}
                  className="w-full"
                  data-testid="upload-btn"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frcs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">FRCS Data Import</CardTitle>
                <CardDescription>
                  Import data from Fiji Revenue & Customs Service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="frcs-file" className="cursor-pointer">
                      <span className="text-primary hover:underline">Upload FRCS file</span>
                    </Label>
                    <Input
                      id="frcs-file"
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      FRCS export files (.xlsx, .csv)
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      Remove
                    </Button>
                  </div>
                )}

                <Button 
                  onClick={() => handleUpload('frcs')} 
                  disabled={!file || uploading}
                  className="w-full"
                >
                  {uploading ? 'Importing...' : 'Import FRCS Data'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moj" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">Ministry of Justice Import</CardTitle>
                <CardDescription>
                  Import data from Ministry of Justice - Birth Death and Marriage Department
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="moj-file" className="cursor-pointer">
                      <span className="text-primary hover:underline">Upload MOJ file</span>
                    </Label>
                    <Input
                      id="moj-file"
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      MOJ export files (.xlsx, .csv)
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      Remove
                    </Button>
                  </div>
                )}

                <Button 
                  onClick={() => handleUpload('moj')} 
                  disabled={!file || uploading}
                  className="w-full"
                >
                  {uploading ? 'Importing...' : 'Import MOJ Data'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Result Display */}
        {result && (
          <Card className={result.error ? 'border-destructive' : 'border-secondary'}>
            <CardContent className="pt-6">
              {result.error ? (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-destructive">Import Failed</h4>
                    <p className="text-sm text-muted-foreground">{result.error}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-secondary">Import Successful</h4>
                      <p className="text-sm text-muted-foreground">
                        Data has been imported to the Business Register
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{result.records_processed}</p>
                      <p className="text-xs text-muted-foreground">Processed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-secondary">{result.records_created}</p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{result.records_updated}</p>
                      <p className="text-xs text-muted-foreground">Updated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-destructive">{result.records_failed || 0}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>

                  {result.errors?.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-sm font-medium mb-2">Errors:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                        {result.errors.map((err, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
