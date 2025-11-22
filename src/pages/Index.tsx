import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'student') {
        navigate('/student/books');
      } else if (userRole === 'librarian') {
        navigate('/librarian/books');
      }
    }
  }, [user, userRole, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 via-background to-accent/20 p-4">
      <div className="text-center max-w-3xl mx-auto space-y-8">
        <div className="flex justify-center mb-8">
          <div className="gradient-primary p-6 rounded-3xl shadow-medium">
            <BookOpen className="h-20 w-20 text-primary-foreground" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Library Management
            <span className="block text-primary mt-2">System</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your library operations with our comprehensive management platform.
            Borrow books, track returns, and manage inventory with ease.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button
            size="lg"
            className="shadow-medium text-lg px-8"
            onClick={() => navigate('/auth')}
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="font-semibold text-lg mb-2">Browse Books</h3>
            <p className="text-sm text-muted-foreground">
              Explore our extensive collection of books across various genres
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Quick Borrowing</h3>
            <p className="text-sm text-muted-foreground">
              Request books instantly with our streamlined borrowing system
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Track History</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your borrowing history and manage returns effortlessly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
