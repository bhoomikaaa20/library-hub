import { useEffect, useState } from 'react';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  stock: number;
  borrowed_count: number;
}

const Books = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowingBook, setBorrowingBook] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch books');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (bookId: string) => {
    if (!user) return;

    try {
      setBorrowingBook(bookId);

      // Create borrow request
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 days from now

      const { error } = await supabase
        .from('borrow_records')
        .insert({
          user_id: user.id,
          book_id: bookId,
          due_date: dueDate.toISOString(),
          status: 'pendingBorrow'
        });

      if (error) throw error;

      toast.success('Borrow request submitted! Waiting for librarian approval.');
      fetchBooks();
    } catch (error: any) {
      toast.error('Failed to submit borrow request');
      console.error('Error:', error);
    } finally {
      setBorrowingBook(null);
    }
  };

  const getAvailability = (book: Book) => {
    const available = book.stock - book.borrowed_count;
    return { available, total: book.stock };
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
          <h1 className="text-3xl font-bold tracking-tight">Browse Books</h1>
          <p className="text-muted-foreground mt-2">
            Explore our collection and borrow books
          </p>
        </div>

        {books.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No books available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => {
              const { available, total } = getAvailability(book);
              const isAvailable = available > 0;

              return (
                <Card key={book.id} className="shadow-soft hover:shadow-medium transition-smooth flex flex-col">
                  <CardHeader>
                    <div className="aspect-[3/4] relative mb-4 rounded-lg overflow-hidden bg-muted">
                      {book.image ? (
                        <img
                          src={book.image}
                          alt={book.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{book.author}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {book.description || 'No description available'}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between gap-4">
                    <Badge
                      variant={isAvailable ? 'default' : 'secondary'}
                      className={isAvailable ? 'bg-success' : ''}
                    >
                      {available} of {total} available
                    </Badge>
                    <Button
                      onClick={() => handleBorrow(book.id)}
                      disabled={!isAvailable || borrowingBook === book.id}
                      size="sm"
                    >
                      {borrowingBook === book.id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Borrow
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Books;