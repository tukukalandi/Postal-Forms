/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { FileList } from './components/FileList';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { FileUp, Files, ShieldCheck, Database, AlertTriangle, ShieldAlert, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [isConfigured, setIsConfigured] = useState(true);
  const [isInternalMode, setIsInternalMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key || url === "" || key === "") {
      setIsConfigured(false);
    }
  }, []);

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePortalToggle = () => {
    if (isInternalMode) {
      // If already in internal mode, just switch back to public
      setIsInternalMode(false);
      setActiveTab('files');
    } else {
      // If in public mode, check if already authenticated
      if (isAuthenticated) {
        setIsInternalMode(true);
        setActiveTab('upload');
      } else {
        // Otherwise show login modal
        setIsLoginModalOpen(true);
      }
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsLoginModalOpen(false);
    setIsInternalMode(true);
    setActiveTab('upload');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsInternalMode(false);
    setActiveTab('files');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="National Emblem of India" 
              className="h-12 w-auto brightness-0 invert"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col border-l border-white/20 pl-3">
              <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase leading-none">India Post</h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Digital Repository</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handlePortalToggle}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-[10px] uppercase tracking-widest px-3 md:px-4 h-8"
              >
                {isInternalMode ? (
                  <><Files className="w-3 h-3 mr-1 md:mr-2" /> Public</>
                ) : (
                  <><ShieldAlert className="w-3 h-3 mr-1 md:mr-2" /> Portal</>
                )}
              </Button>

              {isAuthenticated && isInternalMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-primary-foreground hover:bg-white/10 font-bold text-[10px] uppercase tracking-widest h-8 px-2"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              )}
            </div>
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/3/32/India_Post.svg" 
              alt="India Post Logo" 
              className="h-10 w-auto bg-white p-1 rounded shadow-sm hidden sm:block"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="h-1 w-full bg-secondary"></div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {!isConfigured && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 shadow-sm"
            >
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Supabase Not Configured</p>
                <p className="opacity-90">Please add <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your environment variables in the Secrets panel to enable file storage.</p>
              </div>
            </motion.div>
          )}

          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <motion.h2 
              key={isInternalMode ? 'internal' : 'public'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-balance"
            >
              {isInternalMode ? 'Internal Management Portal' : 'Official Form Repository'}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              {isInternalMode 
                ? 'Securely upload new forms and manage the digital repository records.' 
                : 'Access and download official India Post forms from our secure digital repository.'}
            </motion.p>
          </div>

          {isInternalMode ? (
            /* Internal View with Tabs */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-primary/10 rounded-xl border-2 border-primary/20">
                  <TabsTrigger 
                    value="upload" 
                    className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    <FileUp className="w-4 h-4" />
                    Upload Form
                  </TabsTrigger>
                  <TabsTrigger 
                    value="admin" 
                    className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Panel
                  </TabsTrigger>
                </TabsList>
              </div>

              <AnimatePresence mode="wait">
                <TabsContent value="upload" key="upload">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FileUploader onUploadComplete={handleUpdate} />
                  </motion.div>
                </TabsContent>

                <TabsContent value="admin" key="admin">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AdminPanel refreshTrigger={refreshTrigger} onUpdate={handleUpdate} />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          ) : (
            /* Public View - Only File List */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <FileList refreshTrigger={refreshTrigger} />
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center items-center gap-2 opacity-80">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold uppercase tracking-widest text-xs">India Post Digital Repository</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-tighter opacity-90">
              Prepared by Kalandi Charan Sahoo, OA, DO, Dhenkanal Postal Division
            </p>
            <p className="text-[10px] opacity-60">
              &copy; {new Date().getFullYear()} India Post. All rights reserved. Secure Cloud Storage Powered by Supabase.
            </p>
          </div>
        </div>
      </footer>

      <Toaster position="top-center" richColors />
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </div>
  );
}

