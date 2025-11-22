import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BorrowDetail {
  id: string;
  user_id: string;
  borrow_date: string | null;
  due_date: string | null;
  return_date: string | null;
  status: string;
  fine: number;
  profiles: {
    name: string;
    student_id: string;
  };
  books: {
    title: string;
  };
}

const Details = () => {
  const [records, setRecords] = useState<BorrowDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
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
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch borrowing details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendingBorrow: { label: 'Pending Borrow', variant: 'secondary' as const },
      approvedBorrow: { label: 'Borrowed', variant: 'default' as const },
      rejectedBorrow: { label: 'Rejected', variant: 'destructive' as const },
      pendingReturn: { label: 'Pending Return', variant: 'secondary' as const },
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
          <h1 className="text-3xl font-bold tracking-tight">Borrowing Details</h1>
          <p className="text-muted-foreground mt-2">
            View all borrowing activities and records
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>All Borrowing Records</CardTitle>
            <CardDescription>Complete history of book borrowing activities</CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No borrowing records yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Borrow Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fine</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.profiles?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{record.profiles?.student_id || '-'}</TableCell>
                        <TableCell>{record.books?.title || 'Unknown'}</TableCell>
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

export default Details;