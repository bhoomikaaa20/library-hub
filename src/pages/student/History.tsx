import { useEffect, useState } from 'react';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, History as HistoryIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BorrowRecord {
  id: string;
  book_id: string;
  borrow_date: string | null;
  due_date: string | null;
  return_date: string | null;
  status: string;
  fine: number;
  books: {
    title: string;
  };
}

const History = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('borrow_records')
        .select(`
          *,
          books (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch borrowing history');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReturn = async (recordId: string) => {
    try {
      setRequesting(recordId);

      const { error } = await supabase
        .from('borrow_records')
        .update({ status: 'pendingReturn' })
        .eq('id', recordId);

      if (error) throw error;

      toast.success('Return request submitted!');
      fetchHistory();
    } catch (error: any) {
      toast.error('Failed to submit return request');
      console.error('Error:', error);
    } finally {
      setRequesting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendingBorrow: { label: 'Pending Approval', variant: 'secondary' as const },
      approvedBorrow: { label: 'Borrowed', variant: 'default' as const },
      rejectedBorrow: { label: 'Rejected', variant: 'destructive' as const },
      pendingReturn: { label: 'Return Pending', variant: 'secondary' as const },
      returned: { label: 'Returned', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Layout role="student">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Borrowing History</h1>
          <p className="text-muted-foreground mt-2">
            Track your borrowed books and returns
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Your Borrowing Records</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No borrowing history yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Borrow Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.books?.title || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {record.borrow_date
                            ? format(new Date(record.borrow_date), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {record.due_date
                            ? format(new Date(record.due_date), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {record.return_date
                            ? format(new Date(record.return_date), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          {record.fine > 0 ? (
                            <span className="text-destructive font-medium">
                              ₹{record.fine.toFixed(2)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {record.status === 'approvedBorrow' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestReturn(record.id)}
                              disabled={requesting === record.id}
                            >
                              {requesting === record.id && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Request Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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

export default History;