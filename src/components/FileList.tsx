import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { FileMetadata } from '@/src/types';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  HardDrive, 
  ExternalLink, 
  Loader2, 
  Mail, 
  Briefcase, 
  Stamp, 
  PiggyBank, 
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { name: 'Mail', icon: Mail, color: 'bg-blue-500' },
  { name: 'BD', icon: Briefcase, color: 'bg-orange-500' },
  { name: 'Philately', icon: Stamp, color: 'bg-purple-500' },
  { name: 'Savings', icon: PiggyBank, color: 'bg-green-500' },
  { name: 'Others', icon: MoreHorizontal, color: 'bg-gray-500' },
];

export function FileList({ refreshTrigger }: { refreshTrigger: number }) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      console.log('FileList: Fetching files with trigger:', refreshTrigger);
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('FileList Fetch error:', error);
      toast.error('Failed to load files from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? file.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (url: string, name: string) => {
    window.open(url, '_blank');
    toast.info(`Opening ${name}...`);
  };

  if (!selectedCategory) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Digital Repository</h2>
          <p className="text-muted-foreground font-medium">Select a category to view official India Post forms</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => {
            const count = files.filter(f => f.category === cat.name).length;
            return (
              <Card 
                key={cat.name} 
                className="group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-primary/5 hover:border-primary/20 overflow-hidden"
                onClick={() => setSelectedCategory(cat.name)}
              >
                <div className={`h-2 w-full ${cat.color}`} />
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto w-16 h-16 rounded-2xl ${cat.color} bg-opacity-10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <cat.icon className={`w-8 h-8 ${cat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">{cat.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    {count} {count === 1 ? 'Form' : 'Forms'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 border-primary/10 shadow-lg">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedCategory(null)}
              className="h-10 w-10 p-0 rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <HardDrive className="w-5 h-5" />
                {selectedCategory} Repository
              </CardTitle>
              <CardDescription>
                Viewing all PDF files in the {selectedCategory} category.
              </CardDescription>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border-2 border-dashed rounded-lg">
            <FileText className="w-10 h-10 text-muted-foreground/50" />
            <p className="font-medium">No files found in {selectedCategory}</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'No forms have been uploaded to this category yet'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">File Name</TableHead>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">Size</TableHead>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">Upload Date</TableHead>
                  <TableHead className="text-right text-primary font-bold uppercase tracking-tighter text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary/70" />
                        <span className="truncate max-w-[200px] md:max-w-xs">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatSize(file.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(file.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(file.url, file.name)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 ml-1"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Open</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
