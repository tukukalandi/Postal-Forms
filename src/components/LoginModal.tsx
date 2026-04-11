import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hardcoded credentials as requested
    if (userId === '10166284' && password === 'Dop@1234') {
      onLoginSuccess();
      setUserId('');
      setPassword('');
      setError('');
      toast.success('Access Granted to Internal Portal');
    } else {
      setError('Invalid User ID or Password');
      toast.error('Authentication Failed');
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
            Please enter your official credentials to access the India Post Digital Repository management tools.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="userId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">User ID</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="userId"
                placeholder="Enter User ID"
                className="pl-10 border-primary/20 focus-visible:ring-primary"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter Password"
                className="pl-10 border-primary/20 focus-visible:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium animate-in fade-in zoom-in-95">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest py-6"
            >
              Authenticate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
