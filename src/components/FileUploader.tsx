import React, { useState, useRef } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle2, X, Link as LinkIcon, Youtube, FileSpreadsheet, Ban, Image as ImageIcon, Presentation } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToDrive } from '@/src/services/googleDriveService';

const CATEGORIES = ['Mail', 'CCS', 'Parcel', 'Philately', 'Savings', 'PLI/RPLI', 'Fonacle', 'APT 2.0', 'IRGB', 'Others'];

export function FileUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState<string>('Others');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
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
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls|pdf|doc|docx|ppt|pptx|jpg|jpeg|png|gif|webp)$/i)) {
        toast.error('Only PDF, Word, Excel, CSV, PPT, and Image files are allowed');
        return;
      }
      setFile(selectedFile);
      if (!customName) setCustomName(selectedFile.name.split('.')[0]);
    }
  };

  const cancelUpload = () => {
    if (abortController) {
      abortController.abort();
      setUploading(false);
      setAbortController(null);
      setProgress(0);
      toast.info('Upload cancelled by user');
    }
  };

  const uploadData = async () => {
    if (!auth.currentUser) {
      toast.error('You must be authenticated to upload files');
      return;
    }

    const accessToken = sessionStorage.getItem('google_drive_access_token');
    if (uploadType === 'file' && !accessToken) {
      toast.error('Google Drive session expired. Please sign in again.');
      return;
    }

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
      let dbStorageId = null;

      if (uploadType === 'file' && file) {
        setProgress(30);
        
        // For cancellation support
        const controller = new AbortController();
        setAbortController(controller);

        // Upload to Google Drive
        // Note: The service would need to be updated to support AbortController if we wanted true cancellation of the fetch
        const driveData = await uploadToDrive(file, accessToken!);
        
        finalUrl = driveData.webViewLink;
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        dbStorageId = driveData.id;
        setProgress(90);
      }

      // 3. Insert Metadata into Database
      await addDoc(collection(db, 'files'), {
        name: fileName,
        custom_name: customName,
        instructions: instructions,
        size: fileSize,
        url: finalUrl,
        type: fileType,
        category: category,
        is_link: uploadType === 'link',
        storage_id: dbStorageId,
        owner_id: auth.currentUser.uid,
        created_at: serverTimestamp()
      });

      setProgress(100);
      toast.success(uploadType === 'file' ? 'File uploaded to Google Drive!' : 'Link added to Repository!');
      resetForm();
      onUploadComplete();
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Upload error:', error);
      const message = error.message || 'Storage or Database error';
      toast.error(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
      setAbortController(null);
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
    <Card className="w-full border-dashed border-2 border-primary/20 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-tight">
          <Upload className="w-5 h-5" />
          Upload to Repository
        </CardTitle>
        <CardDescription className="font-medium text-xs">
          Files will be securely stored in your Google Drive and shared for public access.
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
              className="border-primary/20 focus-visible:ring-primary h-11"
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
                accept=".pdf,.doc,.docx,.csv,.xls,.xlsx,.ppt,.pptx,image/*"
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center space-y-3 text-center">
                {file ? (
                  <>
                    <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                      {file.name.match(/\.(xls|xlsx|csv)$/i) ? <FileSpreadsheet className="w-8 h-8 text-primary" /> : 
                       file.name.match(/\.(ppt|pptx)$/i) ? <Presentation className="w-8 h-8 text-primary" /> :
                       file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) || file.type.startsWith('image/') ? <ImageIcon className="w-8 h-8 text-primary" /> :
                       <FileText className="w-8 h-8 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{file.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-muted">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">Click to browse or drag and drop</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">PDF, Word, Excel, PPT, CSV, Images supported</p>
                    </div>
                  </>
                )}
              </div>

              {file && !uploading && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background border shadow-sm hover:bg-muted transition-colors"
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
                className="border-primary/20 focus-visible:ring-primary h-11"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instructions / Description</label>
            <Textarea 
              placeholder="Add any specific instructions or details about this form..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[100px] border-primary/20 focus-visible:ring-primary resize-none p-4"
            />
          </div>
        </div>

        {uploading && (
          <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-primary">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Uploading to Google Drive...
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 shadow-inner" />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cancelUpload}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-tighter h-8 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Ban className="w-3 h-3" />
              Cancel Upload
            </Button>
          </div>
        )}

        {!uploading && (
          <Button 
            onClick={uploadData} 
            className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest py-7 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {uploadType === 'file' ? 'Upload to Google Drive' : 'Add Link to Repository'}
          </Button>
        )}

        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black pt-4 opacity-70">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Google Drive
          </div>
          <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Public View
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
