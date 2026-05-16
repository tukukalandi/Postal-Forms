import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
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
  Info,
  Image,
  Link2,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
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

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'files'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedFiles = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at instanceof Timestamp 
            ? data.created_at.toDate().toISOString() 
            : data.created_at || new Date().toISOString()
        } as FileMetadata;
      });
      setFiles(fetchedFiles);
      setLoading(false);
    }, (error) => {
      console.error('FileList Fetch error:', error);
      toast.error('Failed to load repository');
      setLoading(false);
    });

    return () => unsubscribe();
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
          <div className="space-y-4">
            {filteredFiles.map((file) => {
              const dateObj = new Date(file.created_at);
              const day = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
              const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
              const yearForm = dateObj.toLocaleDateString('en-US', { year: '2-digit' });
              const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
              
              let actionConfig = { text: 'View Document', icon: FileText, bg: 'bg-purple-100', textColors: 'text-purple-700', hover: 'hover:bg-purple-200' };
              if (file.is_link) {
                actionConfig = { text: 'Watch Video', icon: Youtube, bg: 'bg-blue-100', textColors: 'text-blue-700', hover: 'hover:bg-blue-200' };
              } else if (file.name.match(/\.(pdf)$/i)) {
                actionConfig = { text: 'View PDF', icon: FileText, bg: 'bg-red-100', textColors: 'text-red-700', hover: 'hover:bg-red-200' };
              } else if (file.name.match(/\.(png|jpg|jpeg|gif)$/i)) {
                actionConfig = { text: 'View Image', icon: Image, bg: 'bg-orange-100', textColors: 'text-orange-700', hover: 'hover:bg-orange-200' };
              } else if (file.name.match(/\.(xls|xlsx|csv)$/i)) {
                actionConfig = { text: 'View Excel', icon: FileSpreadsheet, bg: 'bg-green-100', textColors: 'text-green-700', hover: 'hover:bg-green-200' };
              }

              const ActionIcon = actionConfig.icon;

              return (
                <div key={file.id} className="flex flex-col lg:flex-row bg-[#1b2333] rounded-xl overflow-hidden border border-[#2b354d] shadow-md transform transition-all hover:scale-[1.005]">
                  {/* Date section */}
                  <div className="bg-[#661e24] lg:w-[130px] flex lg:flex-col items-center justify-between lg:justify-center p-4 lg:p-0 gap-2 lg:gap-1 text-white border-b lg:border-b-0 lg:border-r border-[#1b2333]/50 shrink-0">
                    <div className="text-3xl lg:text-4xl font-extrabold tracking-tighter flex items-baseline gap-1.5">
                      {day} <span className="text-sm font-bold opacity-90 tracking-normal">{month} '{yearForm}</span>
                    </div>
                    <div className="text-xs font-semibold opacity-75">{time}</div>
                  </div>
                  
                  {/* Main content */}
                  <div className="flex-1 p-5 lg:pl-6 flex flex-col justify-center gap-1.5 min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-widest text-white/50">
                      {file.category}
                    </div>
                    <div className="text-white font-bold text-base md:text-lg lg:text-xl truncate">
                      {file.custom_name || file.name}
                    </div>
                    {file.instructions && (
                      <div className="text-white/40 text-xs truncate mt-0.5">
                        {file.instructions}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 lg:py-5 lg:px-6 flex flex-wrap items-center gap-3 justify-end shrink-0 bg-[#1b2333]">
                    <Button 
                      variant="secondary"
                      className={`h-11 px-5 flex items-center justify-center gap-2.5 ${actionConfig.bg} ${actionConfig.textColors} ${actionConfig.hover} border-none font-bold text-sm`}
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <ActionIcon className="w-4 h-4" />
                      {actionConfig.text}
                    </Button>
                    
                    <Button 
                      size="icon"
                      variant="secondary"
                      className="h-11 w-11 bg-green-100 text-green-700 hover:bg-green-200 border-none shrink-0 rounded-lg"
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this file from India Post Digital Repository: ${file.url}`)}`, '_blank')}
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                    
                    <Button 
                      size="icon"
                      variant="secondary"
                      className="h-11 w-11 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shrink-0 rounded-lg"
                      onClick={() => {
                        navigator.clipboard.writeText(file.url);
                        toast.success('Link copied to clipboard');
                      }}
                    >
                      <Link2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
