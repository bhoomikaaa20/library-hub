import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  studentId: z.string().trim().min(3, "Student ID must be at least 3 characters").max(50),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const signInSchema = z.object({
  identifier: z.string().trim().min(1, "This field is required"),
  password: z.string().min(1, "Password is required")
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'librarian'>('student');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, user, userRole } = useAuth();
  const navigate = useNavigate();

  // Form states for signup
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Form states for signin
  const [identifier, setIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Hardcoded librarian credentials
  const LIBRARIAN_ID = 'LIB001';
  const LIBRARIAN_PASSWORD = 'librarian123';

  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'student') {
        navigate('/student/books');
      } else if (userRole === 'librarian') {
        navigate('/librarian/books');
      }
    }
  }, [user, userRole, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = signUpSchema.parse({
        name,
        studentId,
        email,
        phone,
        password
      });

      setLoading(true);

      const { error } = await signUp(validated.email, validated.password, {
        name: validated.name,
        student_id: validated.studentId,
        phone: validated.phone
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message || 'Failed to sign up');
        }
      } else {
        toast.success('Account created successfully!');
        // Clear form
        setName('');
        setStudentId('');
        setEmail('');
        setPhone('');
        setPassword('');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          toast.error(err.message);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = signInSchema.parse({
        identifier,
        password: signInPassword
      });

      setLoading(true);

      // Check if librarian
      if (role === 'librarian') {
        if (validated.identifier === LIBRARIAN_ID && validated.password === LIBRARIAN_PASSWORD) {
          // For librarian, we need to sign in with a special account
          // In a real app, this would be handled differently
          toast.error('Librarian functionality requires backend setup. Please contact admin.');
        } else {
          toast.error('Invalid librarian credentials');
        }
        setLoading(false);
        return;
      }

      // For students, find by student_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('student_id', validated.identifier)
        .single();

      if (profileError || !profileData) {
        toast.error('Invalid student ID or password');
        setLoading(false);
        return;
      }

      const { error } = await signIn(profileData.email, validated.password);

      if (error) {
        toast.error('Invalid credentials');
      } else {
        toast.success('Signed in successfully!');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          toast.error(err.message);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="gradient-primary p-3 rounded-2xl shadow-medium">
            <BookOpen className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        
        <Card className="shadow-medium border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Library Management</CardTitle>
            <CardDescription className="text-center">
              Sign in to access your library account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={role} onValueChange={(v) => setRole(v as 'student' | 'librarian')} className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="librarian">Librarian</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={isSignUp ? 'signup' : 'signin'} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin" onClick={() => setIsSignUp(false)}>
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  onClick={() => setIsSignUp(true)}
                  disabled={role === 'librarian'}
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">
                      {role === 'student' ? 'Student ID' : 'Librarian ID'}
                    </Label>
                    <Input
                      id="identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === 'student' ? 'Enter your student ID' : 'Enter librarian ID'}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signInPassword">Password</Label>
                    <Input
                      id="signInPassword"
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Enter your student ID"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password (min 6 characters)"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {role === 'librarian' && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Contact administrator for librarian access
          </p>
        )}
      </div>
    </div>
  );
};

// Import supabase for the profile lookup
import { supabase } from '@/integrations/supabase/client';

export default Auth;