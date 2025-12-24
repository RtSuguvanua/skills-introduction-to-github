import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Building2, Shield, FileSpreadsheet, BarChart3, Globe, Users } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  React.useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Building2,
      title: 'Business Register',
      description: 'Comprehensive database of all businesses in Fiji engaged in production of goods and services.'
    },
    {
      icon: FileSpreadsheet,
      title: 'Data Import',
      description: 'Import data from Excel, CSV files, FRCS, and Ministry of Justice records seamlessly.'
    },
    {
      icon: BarChart3,
      title: 'FSIC 2010 Classification',
      description: "Fiji's official system for classifying economic activities aligned with ISIC Rev. 4."
    },
    {
      icon: Globe,
      title: 'Offline Capable',
      description: 'Work offline and sync data when connection is restored. Perfect for field operations.'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Role-based access control for Admins, Officers, and End Users with audit trails.'
    },
    {
      icon: Users,
      title: 'Survey Distribution',
      description: 'Automatic distribution of businesses to appropriate Establishment Surveys.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative min-h-[600px] flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0,85,164,0.95) 0%, rgba(27,94,32,0.9) 100%), url(https://images.unsplash.com/photo-1661871894721-0541d8918876?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 tracking-tight">
            Fiji Business Register
          </h1>
          <h2 className="font-heading font-semibold text-lg sm:text-xl text-white/90 mb-6">
            Management System
          </h2>
          
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            A comprehensive platform for the Fiji Bureau of Statistics Economics Division to manage, 
            update, and maintain the national business register with FSIC 2010 classification.
          </p>
          
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 text-base rounded-md shadow-lg"
            data-testid="login-btn"
          >
            Sign in with Google
          </Button>
          
          <div className="mt-4">
            <Button
              asChild
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              data-testid="public-report-btn"
            >
              <Link to="/public-report">
                View Public Statistics Report
              </Link>
            </Button>
          </div>
          
          <p className="text-white/60 text-sm mt-4">
            Authorized access for Fiji Bureau of Statistics personnel
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 lg:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-3">
              System Features
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built specifically for the Fiji Bureau of Statistics to modernize business data management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-lg border border-border p-6 card-hover animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-heading font-semibold text-foreground mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-6 h-6" />
            <span className="font-heading font-semibold">Fiji Bureau of Statistics</span>
          </div>
          <p className="text-slate-400 text-sm">
            Business Register Management System - Economics Statistics Division
          </p>
          <p className="text-slate-500 text-xs mt-2">
            © {new Date().getFullYear()} Government of Fiji. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
