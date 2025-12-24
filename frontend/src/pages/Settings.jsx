import React from 'react';
import { useAuth } from '../App';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Info,
  ExternalLink
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="bg-primary text-white text-xl">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-heading font-semibold text-lg">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    user?.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                    user?.role === 'officer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Preferences */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="import-notif" className="text-sm font-medium">Import Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive alerts when data imports complete</p>
              </div>
              <Switch id="import-notif" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="update-notif" className="text-sm font-medium">Business Updates</Label>
                <p className="text-xs text-muted-foreground">Get notified when businesses are updated</p>
              </div>
              <Switch id="update-notif" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notif" className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch id="email-notif" />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Authentication</p>
                  <p className="text-xs text-muted-foreground">Signed in with Google</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Secure
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Session</p>
                  <p className="text-xs text-muted-foreground">Your session expires in 7 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Offline Data
            </CardTitle>
            <CardDescription>
              Manage locally stored data for offline access
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Offline Mode</p>
                <p className="text-xs text-muted-foreground">Store data locally for offline access</p>
              </div>
              <Switch id="offline-mode" />
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm">
                Clear Local Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application</span>
                <span className="font-medium">FBS Business Register</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization</span>
                <span className="font-medium">Fiji Bureau of Statistics</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Division</span>
                <span className="font-medium">Economics Statistics Division</span>
              </div>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.statsfiji.gov.fj" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    FBS Website
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
