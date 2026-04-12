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
  ArrowLeft,
  HeartPulse,
  Youtube,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CATEGORIES = [
  { name: 'Mail', icon: Mail, color: 'bg-blue-500' },
  { name: 'BD', icon: Briefcase, color: 'bg-orange-500' },
  { name: 'Philately', icon: Stamp, color: 'bg-purple-500' },
  { name: 'Savings', icon: PiggyBank, color: 'bg-green-500' },
  { name: 'PLI/RPLI', icon: HeartPulse, color: 'bg-red-500' },
  { name: 'Others', icon: MoreHorizontal, color: 'bg-gray-500' },
];

export function FileList({ refreshTrigger }: { refreshTrigger: number }) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
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
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      file.name.toLowerCase().includes(searchLower) || 
      (file.custom_name && file.custom_name.toLowerCase().includes(searchLower)) ||
      (file.instructions && file.instructions.toLowerCase().includes(searchLower));
    const matchesCategory = selectedCategory ? file.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Link';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileMetadata) => {
    if (file.is_link) return <Youtube className="w-5 h-5 text-red-600" />;
    if (file.name.match(/\.(xls|xlsx|csv)$/)) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    return <FileText className="w-5 h-5 text-primary/80" />;
  };

  if (!selectedCategory) {
    return (
      <div className="w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Digital Repository</h2>
          <p className="text-muted-foreground font-medium">Select a category to view official India Post forms and resources</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    {count} {count === 1 ? 'Resource' : 'Resources'}
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
    <Card className="w-full border-2 border-primary/10 shadow-lg">
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
                Viewing all resources in the {selectedCategory} category.
              </CardDescription>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or instructions..."
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
            <p className="text-sm text-muted-foreground">Loading resources...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border-2 border-dashed rounded-lg">
            <FileText className="w-10 h-10 text-muted-foreground/50" />
            <p className="font-medium">No resources found in {selectedCategory}</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'No resources have been added to this category yet'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">Resource Name</TableHead>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">Type/Size</TableHead>
                  <TableHead className="text-primary font-bold uppercase tracking-tighter text-xs">Date</TableHead>
                  <TableHead className="text-right text-primary font-bold uppercase tracking-tighter text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3 py-1">
                        <div className="p-2 bg-primary/5 rounded-md group-hover:bg-primary/10 transition-colors">
                          {getFileIcon(file)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground tracking-tight truncate max-w-[200px] md:max-w-xs group-hover:text-primary transition-colors">
                            {file.custom_name || file.name}
                          </span>
                          {file.instructions && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground italic">
                              <Info className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{file.instructions}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {file.is_link ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold uppercase text-[9px]">Video Link</span>
                      ) : (
                        formatSize(file.size)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(file.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!file.is_link && (
                          <Tooltip>
                            <TooltipTrigger 
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger 
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>{file.is_link ? 'Open Link' : 'View Online'}</TooltipContent>
                        </Tooltip>
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
  );
}
