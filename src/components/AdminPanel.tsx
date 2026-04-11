import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { FileMetadata } from '@/src/types';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Trash2, FileText, Calendar, ShieldAlert, Loader2, ExternalLink, AlertTriangle, Copy, Check, Tag } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPanel({ refreshTrigger, onUpdate }: { refreshTrigger: number, onUpdate: () => void }) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      console.log('AdminPanel: Fetching files with trigger:', refreshTrigger);
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('AdminPanel Fetch error:', error);
      toast.error('Failed to load files for administration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      setDeletingId(fileToDelete.id);
      
      const urlWithoutParams = fileToDelete.url.split('?')[0];
      const urlParts = urlWithoutParams.split('/');
      const fileName = urlParts[urlParts.length - 1];

      console.log('Attempting to delete file from storage:', fileName);

      const { error: storageError } = await supabase.storage
        .from('forms')
        .remove([fileName]);

      if (storageError) {
        console.warn('Storage delete warning (continuing with DB delete):', storageError);
      }

      console.log('Attempting to delete record from database:', fileToDelete.id);
      const { error: dbError, count } = await supabase
        .from('files')
        .delete({ count: 'exact' })
        .eq('id', fileToDelete.id);

      if (dbError) throw dbError;

      if (count === 0) {
        console.error('Delete failed: 0 rows affected. Check RLS policies.');
        throw new Error('No record was deleted. Please ensure you have enabled DELETE policies in Supabase.');
      }

      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      
      toast.success(`"${fileToDelete.name}" deleted successfully`);
      
      onUpdate(); 
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete file. Check your Supabase RLS policies.');
    } finally {
      setDeletingId(null);
      setFileToDelete(null);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Public link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (file.category && file.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-5xl mx-auto border-2 border-primary/20 shadow-xl">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldAlert className="w-6 h-6" />
              Administrative Control Panel
            </CardTitle>
            <CardDescription>
              Manage all uploaded documents. Copy public links or delete files permanently.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or category..."
              className="pl-9 border-primary/20 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Accessing repository...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <FileText className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-lg font-bold text-muted-foreground">No records found</p>
              <p className="text-sm text-muted-foreground/70">The repository is currently empty or matches no search criteria.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs pl-6">Document Name</TableHead>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">Category</TableHead>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">Metadata</TableHead>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">Upload Date</TableHead>
                  <TableHead className="text-right text-primary font-bold uppercase tracking-tighter text-xs pr-6">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} className="group hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm truncate max-w-[200px] md:max-w-md">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase">{file.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-primary/60" />
                        <span className="text-xs font-bold uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                          {file.category || 'Others'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">{formatSize(file.size)}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{file.type.split('/')[1]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(file.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 w-9 p-0 border-primary/20 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleCopyLink(file.url, file.id)}
                          title="Copy Public Link"
                        >
                          {copiedId === file.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 w-9 p-0 border-primary/20 hover:bg-primary/10 hover:text-primary"
                          onClick={() => window.open(file.url, '_blank')}
                          title="View Document"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-9 w-9 p-0 shadow-lg"
                          onClick={() => setFileToDelete(file)}
                          disabled={deletingId === file.id}
                          title="Delete Permanently"
                        >
                          {deletingId === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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

      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent className="border-2 border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80">
              Are you sure you want to delete <span className="font-bold text-foreground">"{fileToDelete?.name}"</span>? 
              This action will remove the record from the database and the physical file from the India Post storage. 
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20 hover:bg-primary/5">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
