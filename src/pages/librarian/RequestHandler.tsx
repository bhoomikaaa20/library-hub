import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Request {
  id: string;
  user_id: string;
  book_id: string;
  due_date: string | null;
  borrow_date: string | null;
  status: string;
  created_at: string;
  profiles: {
    name: string;
    student_id: string;
  };
  books: {
    title: string;
    stock: number;
    borrowed_count: number;
  };
}

const RequestHandler = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('borrow_records')
        .select(`
          *,
          profiles (
            name,
            student_id
          ),
          books (
            title,
            stock,
            borrowed_count
          )
        `)
        .in('status', ['pendingBorrow', 'pendingReturn'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch requests');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBorrow = async (request: Request) => {
    try {
      setProcessing(request.id);

      // Update record status and set borrow date
      const { error: recordError } = await supabase
        .from('borrow_records')
        .update({
          status: 'approvedBorrow',
          borrow_date: new Date().toISOString()
        })
        .eq('id', request.id);

      if (recordError) throw recordError;

      // Increment borrowed_count
      const { error: bookError } = await supabase
        .from('books')
        .update({
          borrowed_count: request.books.borrowed_count + 1
        })
        .eq('id', request.book_id);

      if (bookError) throw bookError;

      toast.success('Borrow request approved!');
      fetchRequests();
    } catch (error: any) {
      toast.error('Failed to approve request');
      console.error('Error:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectBorrow = async (requestId: string) => {
    try {
      setProcessing(requestId);

      const { error } = await supabase
        .from('borrow_records')
        .update({ status: 'rejectedBorrow' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Borrow request rejected');
      fetchRequests();
    } catch (error: any) {
      toast.error('Failed to reject request');
      console.error('Error:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleAcceptReturn = async (request: Request) => {
    try {
      setProcessing(request.id);

      // Calculate fine if overdue
      let fine = 0;
      if (request.due_date) {
        const dueDate = new Date(request.due_date);
        const returnDate = new Date();
        const daysLate = Math.max(
          0,
          Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        fine = daysLate * 10; // ₹10 per day
      }

      // Update record
      const { error: recordError } = await supabase
        .from('borrow_records')
        .update({
          status: 'returned',
          return_date: new Date().toISOString(),
          fine
        })
        .eq('id', request.id);

      if (recordError) throw recordError;

      // Decrement borrowed_count
      const { error: bookError } = await supabase
        .from('books')
        .update({
          borrowed_count: Math.max(0, request.books.borrowed_count - 1)
        })
        .eq('id', request.book_id);

      if (bookError) throw bookError;

      if (fine > 0) {
        toast.success(`Return approved with fine: ₹${fine.toFixed(2)}`);
      } else {
        toast.success('Return approved successfully!');
      }
      fetchRequests();
    } catch (error: any) {
      toast.error('Failed to approve return');
      console.error('Error:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectReturn = async (requestId: string) => {
    try {
      setProcessing(requestId);

      const { error } = await supabase
        .from('borrow_records')
        .update({ status: 'approvedBorrow' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Return request rejected');
      fetchRequests();
    } catch (error: any) {
      toast.error('Failed to reject return');
      console.error('Error:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Layout role="librarian">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="librarian">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Handler</h1>
          <p className="text-muted-foreground mt-2">
            Approve or reject borrowing and return requests
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>
              Manage all pending borrow and return requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => {
                      const isBorrowRequest = request.status === 'pendingBorrow';

                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.profiles?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>{request.profiles?.student_id || '-'}</TableCell>
                          <TableCell>{request.books?.title || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant={isBorrowRequest ? 'default' : 'secondary'}>
                              {isBorrowRequest ? 'Borrow' : 'Return'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  isBorrowRequest
                                    ? handleAcceptBorrow(request)
                                    : handleAcceptReturn(request)
                                }
                                disabled={processing === request.id}
                                className="bg-success hover:bg-success/90"
                              >
                                {processing === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Accept
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  isBorrowRequest
                                    ? handleRejectBorrow(request.id)
                                    : handleRejectReturn(request.id)
                                }
                                disabled={processing === request.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RequestHandler;