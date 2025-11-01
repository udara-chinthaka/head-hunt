import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Star,
  Shield
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();

  const features = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "Smart Job Matching",
      description: "Our AI-powered system matches your skills with the perfect opportunities."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Expert Recruitment",
      description: "Professional headhunters review and recommend your profile to top companies."
    },
    {
      icon: <Building2 className="h-8 w-8 text-primary" />,
      title: "Premium Companies",
      description: "Access exclusive positions from leading organizations in your industry."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Career Growth",
      description: "Track your application progress and get feedback to improve your chances."
    }
  ];

  const stats = [
    { label: "Active Jobs", value: "2,500+", icon: <Briefcase className="h-5 w-5" /> },
    { label: "Success Rate", value: "87%", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "Partner Companies", value: "450+", icon: <Building2 className="h-5 w-5" /> },
    { label: "Satisfied Candidates", value: "12K+", icon: <Star className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">HeadHunt</h1>
            <Badge variant="secondary">Professional</Badge>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="outline" asChild>
                    <Link to="/admin/dashboard">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </Button>
                )}
                <Button asChild>
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Candidate Login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/recruiter/auth">Recruiter Portal</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Your Next Career Move Starts Here
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Connect with top-tier companies through our professional headhunting platform. 
            Upload your CV, get matched with premium opportunities, and take your career to the next level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!user && (
              <Button size="lg" asChild className="px-8">
                <Link to="/auth">
                  Join HeadHunt Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="lg" className="px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-2 text-primary">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Why Choose HeadHunt?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're not just another job board. We're your personal career advancement partner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">How It Works</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Getting your dream job is easier than you think. Follow these simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h4 className="text-xl font-semibold mb-2">Create Your Profile</h4>
            <p className="text-muted-foreground">
              Sign up and complete your professional profile with skills, experience, and career goals.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h4 className="text-xl font-semibold mb-2">Upload Your CV</h4>
            <p className="text-muted-foreground">
              Upload your latest CV and let our experts review it for the best opportunities.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h4 className="text-xl font-semibold mb-2">Get Matched</h4>
            <p className="text-muted-foreground">
              Receive notifications when companies are interested and track your application status.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="text-center py-12">
            <h3 className="text-3xl font-bold mb-4">Ready to Accelerate Your Career?</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have found their dream jobs through HeadHunt. 
              Your next opportunity is just a click away.
            </p>
            {!user && (
              <Button size="lg" asChild className="px-8">
                <Link to="/auth">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <h1 className="text-xl font-bold text-primary">HeadHunt</h1>
              <Badge variant="outline">Beta</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting talent with opportunity. © 2024 HeadHunt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
