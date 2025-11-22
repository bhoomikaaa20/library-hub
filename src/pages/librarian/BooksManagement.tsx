import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: z.string().trim().min(1, "Author is required").max(100),
  description: z.string().trim().max(1000).optional(),
  image: z.string().trim().url("Must be a valid URL").optional().or(z.literal('')),
  stock: z.number().min(0, "Stock must be at least 0")
});

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  image: string | null;
  stock: number;
  borrowed_count: number;
}

const BooksManagement = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [stock, setStock] = useState('');

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

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setDescription('');
    setImage('');
    setStock('');
    setEditingBook(null);
  };

  const handleAddBook = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setDescription(book.description || '');
    setImage(book.image || '');
    setStock(book.stock.toString());
    setDialogOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = bookSchema.parse({
        title,
        author,
        description: description || undefined,
        image: image || undefined,
        stock: parseInt(stock)
      });

      setSaving(true);

      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(validated)
          .eq('id', editingBook.id);

        if (error) throw error;
        toast.success('Book updated successfully');
      } else {
        const { error } = await supabase
          .from('books')
          .insert([{
            title: validated.title,
            author: validated.author,
            description: validated.description || null,
            image: validated.image || null,
            stock: validated.stock,
            borrowed_count: 0
          }]);

        if (error) throw error;
        toast.success('Book added successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchBooks();
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          toast.error(err.message);
        });
      } else {
        toast.error('Failed to save book');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;
      toast.success('Book deleted successfully');
      fetchBooks();
    } catch (error: any) {
      toast.error('Failed to delete book');
      console.error('Error:', error);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Books Management</h1>
            <p className="text-muted-foreground mt-2">
              Add, edit, and manage library books
            </p>
          </div>
          <Button onClick={handleAddBook} className="shadow-soft">
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>All Books</CardTitle>
            <CardDescription>Manage your library inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {books.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No books in the library yet</p>
                <Button onClick={handleAddBook} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Total Stock</TableHead>
                      <TableHead>Borrowed</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.stock}</TableCell>
                        <TableCell>{book.borrowed_count}</TableCell>
                        <TableCell className="font-medium text-success">
                          {book.stock - book.borrowed_count}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBook(book)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteBook(book.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </DialogTitle>
              <DialogDescription>
                {editingBook
                  ? 'Update book information'
                  : 'Fill in the details to add a new book'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveBook} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter book title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter author name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter book description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/book-cover.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Enter stock quantity"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBook ? 'Update' : 'Add'} Book
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default BooksManagement;