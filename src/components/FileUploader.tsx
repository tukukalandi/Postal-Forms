import React, { useState, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Tag, Link as LinkIcon, Youtube, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Mail', 'BD', 'Philately', 'Savings', 'PLI/RPLI', 'Others'];

export function FileUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState<string>('Others');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Only PDF, Word, Excel, and CSV files are allowed');
        return;
      }
      setFile(selectedFile);
      if (!customName) setCustomName(selectedFile.name.split('.')[0]);
    }
  };

  const uploadData = async () => {
    if (uploadType === 'file' && !file) {
      toast.error('Please select a file');
      return;
    }
    if (uploadType === 'link' && !linkUrl) {
      toast.error('Please enter a link URL');
      return;
    }
    if (!customName) {
      toast.error('Please enter a display name');
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      let finalUrl = linkUrl;
      let fileName = customName;
      let fileSize = 0;
      let fileType = 'link';

      if (uploadType === 'file' && file) {
        const fileExt = file.name.split('.').pop();
        const storageFileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        
        // 1. Upload to Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('forms')
          .upload(storageFileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (storageError) throw storageError;
        setProgress(60);

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('forms')
          .getPublicUrl(storageFileName);
        
        finalUrl = publicUrl;
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
      }

      // 3. Insert Metadata into Database
      const { error: dbError } = await supabase
        .from('files')
        .insert([
          {
            name: fileName,
            custom_name: customName,
            instructions: instructions,
            size: fileSize,
            url: finalUrl,
            type: fileType,
            category: category,
            is_link: uploadType === 'link'
          }
        ]);

      if (dbError) throw dbError;

      setProgress(100);
      toast.success(uploadType === 'file' ? 'File uploaded successfully!' : 'Link added successfully!');
      resetForm();
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to process upload');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const resetForm = () => {
    setFile(null);
    setLinkUrl('');
    setCustomName('');
    setInstructions('');
    setCategory('Others');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="w-full border-dashed border-2 border-primary/20 bg-white">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Upload className="w-5 h-5" />
          Upload Form or Link
        </CardTitle>
        <CardDescription>
          Store PDF, Word, Excel, CSV files or Video links in the Digital Repository.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Upload Type Toggle */}
        <div className="flex p-1 bg-muted rounded-lg w-full">
          <button
            onClick={() => setUploadType('file')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${uploadType === 'file' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <FileText className="w-4 h-4" />
            File Upload
          </button>
          <button
            onClick={() => setUploadType('link')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${uploadType === 'link' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LinkIcon className="w-4 h-4" />
            Video/Web Link
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</label>
            <Input 
              placeholder="Enter a clear name for this form/link"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`
                    px-1 py-2 text-[9px] font-bold uppercase tracking-tighter rounded-md border transition-all
                    ${category === cat 
                      ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                      : 'bg-background text-muted-foreground border-muted-foreground/20 hover:border-primary/50'}
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {uploadType === 'file' ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative group cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all
                ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.csv,.xls,.xlsx"
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center space-y-3 text-center">
                {file ? (
                  <>
                    <div className="p-3 rounded-full bg-primary/10">
                      {file.name.match(/\.(xls|xlsx)$/) ? <FileSpreadsheet className="w-8 h-8 text-primary" /> : <FileText className="w-8 h-8 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-muted">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Click to browse or drag and drop</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tight">PDF, Word, Excel, CSV supported</p>
                    </div>
                  </>
                )}
              </div>

              {file && !uploading && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background border shadow-sm hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Youtube className="w-3 h-3 text-red-600" />
                Video or Website URL
              </label>
              <Input 
                placeholder="https://youtube.com/watch?v=..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instructions / Description</label>
            <Textarea 
              placeholder="Add any specific instructions or details about this form..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[80px] border-primary/20 focus-visible:ring-primary resize-none"
            />
          </div>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button 
          onClick={uploadData} 
          disabled={uploading} 
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest py-6"
        >
          {uploading ? 'Processing...' : uploadType === 'file' ? 'Upload to Repository' : 'Add Link to Repository'}
        </Button>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold pt-2">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          Secure Storage
          <span className="mx-1">•</span>
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          Multi-Format Support
        </div>
      </CardContent>
    </Card>
  );
}
