import React, { useState } from 'react';
import { auth } from '@/src/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      // Add scope for Google Drive file management
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      const result = await signInWithPopup(auth, provider);
      
      // Capture the access token for Google Drive API operations
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        sessionStorage.setItem('google_drive_access_token', credential.accessToken);
      }
      
      if (result.user) {
        toast.success('Access Granted to Internal Portal');
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication Failed');
      toast.error('Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-2 border-primary/20">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-bold uppercase tracking-tight">Internal Portal Access</DialogTitle>
          <DialogDescription className="text-center">
            Sign in with your authorized Google account to manage the India Post Forms/Documents repository.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <Button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 border-2 border-gray-200 font-bold uppercase tracking-widest py-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium animate-in fade-in zoom-in-95">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="text-[10px] text-center text-muted-foreground uppercase tracking-widest opacity-60">
          Secure Authentication powered by Firebase
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
