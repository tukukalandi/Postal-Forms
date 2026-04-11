import React, { useState, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Tag } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Mail', 'BD', 'Philately', 'Savings', 'Others'];

export function FileUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('Others');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(10);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('forms')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;
      setProgress(60);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('forms')
        .getPublicUrl(filePath);

      // 3. Insert Metadata into Database
      const { error: dbError } = await supabase
        .from('files')
        .insert([
          {
            name: file.name,
            size: file.size,
            url: publicUrl,
            type: file.type,
            category: category,
          }
        ]);

      if (dbError) throw dbError;

      setProgress(100);
      toast.success('File uploaded successfully!');
      setFile(null);
      setCategory('Others');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.message === 'Bucket not found') {
        toast.error('Storage bucket "forms" not found. Please create it in your Supabase dashboard.');
      } else {
        toast.error(error.message || 'Failed to upload file');
      }
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="w-full max-w-xl mx-auto border-dashed border-2 border-primary/20 bg-white">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Upload className="w-5 h-5" />
          Upload PDF Form
        </CardTitle>
        <CardDescription>
          Select a PDF file and category to store it securely in the India Post Digital Repository.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Tag className="w-3 h-3" />
            Select Category
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`
                  px-2 py-2 text-[10px] font-bold uppercase tracking-tighter rounded-md border transition-all
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

        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative group cursor-pointer rounded-lg border-2 border-dashed p-10 transition-all
            ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            {file ? (
              <>
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-muted">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click to browse or drag and drop</p>
                  <p className="text-xs text-muted-foreground">Only PDF files are supported</p>
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

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button 
          onClick={uploadFile} 
          disabled={!file || uploading} 
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest py-6"
        >
          {uploading ? 'Processing...' : 'Upload to Repository'}
        </Button>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold pt-2">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          Secure Storage
          <span className="mx-1">•</span>
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          Auto Metadata
        </div>
      </CardContent>
    </Card>
  );
}
