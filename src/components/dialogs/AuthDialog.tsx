import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BeamsBackground } from '@/components/ui/beams-background';
import { AUTH_URL } from '@/lib/api-urls';

interface AuthDialogProps {
  authDialogOpen: boolean;
  authMode: 'login' | 'register';
  user: unknown;
  onAuthDialogChange: (open: boolean) => void;
  onAuthModeChange: (mode: 'login' | 'register') => void;
  onAuthSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onAuthDialogAttemptClose?: () => void;
}

export const AuthDialog = ({
  authDialogOpen,
  authMode,
  user,
  onAuthDialogChange,
  onAuthModeChange,
  onAuthSubmit,
  onAuthDialogAttemptClose,
}: AuthDialogProps) => {
  const { toast } = useToast();
  const savedRefCode = localStorage.getItem('referralCode') || '';

  const handleAuthDialogChange = (open: boolean) => {
    if (!open && !user) {
      if (onAuthDialogAttemptClose) {
        onAuthDialogAttemptClose();
      }
      return;
    }
    onAuthDialogChange(open);
  };



  return (
    <Dialog open={authDialogOpen} onOpenChange={handleAuthDialogChange}>
      <DialogContent className="auth-dialog-content border-0 rounded-3xl shadow-2xl bg-transparent backdrop-blur-none max-w-md overflow-hidden p-0">
        <BeamsBackground className="absolute inset-0 rounded-3xl" intensity="medium">
          <div className="w-full h-full" />
        </BeamsBackground>
        
        <div className="relative z-20 bg-card/80 backdrop-blur-xl rounded-3xl p-6">
          <div className="auth-orbs-container">
            <div className="auth-orb auth-orb-1"></div>
            <div className="auth-orb auth-orb-2"></div>
            <div className="auth-orb auth-orb-3"></div>
          </div>
          
          <DialogHeader className="space-y-3 pb-2 relative z-10">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center auth-icon-pulse">
              <Icon name="Rocket" size={40} className="text-primary auth-icon-float" />
            </div>
            <DialogTitle className="text-center text-3xl font-bold auth-title-shimmer">
              {authMode === 'login' ? 'Добро пожаловать' : 'Регистрация'}
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground auth-fade-in">
              {authMode === 'login' ? 'Войдите, чтобы продолжить' : 'Создайте аккаунт за несколько секунд'}
            </p>
          </DialogHeader>

          <div className="relative z-10">
            <form onSubmit={onAuthSubmit} className="space-y-5 pt-2 auth-form-enter">
                <div className="space-y-4">
                  {authMode === 'register' && (
                    <div className="space-y-2 auth-input-group">
                      <label className="text-sm font-medium text-foreground/90">Имя пользователя</label>
                      <Input 
                        name="username" 
                        required 
                        minLength={3}
                        placeholder="username123"
                        className="auth-input h-11 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm focus-visible:ring-primary/50"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2 auth-input-group">
                    <label className="text-sm font-medium text-foreground/90">Email</label>
                    <Input 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="your@email.com"
                      className="auth-input h-11 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm focus-visible:ring-primary/50"
                    />
                  </div>
                  
                  <div className="space-y-2 auth-input-group">
                    <label className="text-sm font-medium text-foreground/90">Пароль</label>
                    <Input 
                      name="password" 
                      type="password" 
                      required 
                      minLength={6}
                      placeholder="••••••••"
                      className="auth-input h-11 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm focus-visible:ring-primary/50"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div className="space-y-2 auth-input-group">
                      <label className="text-sm font-medium text-foreground/90">
                        Реферальный код <span className="text-xs text-muted-foreground">(опционально)</span>
                      </label>
                      <Input 
                        name="referral_code"
                        defaultValue={savedRefCode}
                        placeholder="XXXXX"
                        className="auth-input h-11 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm focus-visible:ring-primary/50"
                      />
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold auth-button shadow-lg shadow-primary/25"
                >
                  <Icon name={authMode === 'login' ? 'LogIn' : 'UserPlus'} size={20} className="mr-2" />
                  {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
                </Button>
              </form>

              <div className="mt-5 pt-5 border-t border-white/5 relative z-10">
                <p className="text-center text-sm text-muted-foreground auth-fade-in-delay">
                  {authMode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                  {' '}
                  <button
                    type="button"
                    onClick={() => onAuthModeChange(authMode === 'login' ? 'register' : 'login')}
                    className="text-primary hover:text-primary/80 font-medium transition-colors auth-link-hover"
                  >
                    {authMode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                  </button>
                </p>
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};