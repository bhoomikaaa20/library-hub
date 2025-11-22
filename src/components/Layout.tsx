import { ReactNode } from 'react';
import { useAuth } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  role: 'student' | 'librarian';
}

const Layout = ({ children, role }: LayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const studentLinks = [
    { href: '/student/books', label: 'Books' },
    { href: '/student/history', label: 'Borrowing History' },
  ];

  const librarianLinks = [
    { href: '/librarian/books', label: 'Books Management' },
    { href: '/librarian/details', label: 'Details' },
    { href: '/librarian/requests', label: 'Request Handler' },
  ];

  const links = role === 'student' ? studentLinks : librarianLinks;

  return (
    <div className="min-h-screen bg-muted/20">
      <nav className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="gradient-primary p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="font-semibold text-lg">Library System</span>
              </div>
              
              <div className="hidden md:flex gap-1">
                {links.map((link) => (
                  <Link key={link.href} to={link.href}>
                    <Button
                      variant={location.pathname === link.href ? 'secondary' : 'ghost'}
                      className={cn(
                        "transition-smooth",
                        location.pathname === link.href && "shadow-sm"
                      )}
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;