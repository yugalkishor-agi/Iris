/**
 * Quick Account Switcher
 * Shows up on long press of Profile icon in bottom nav
 * Supports swipe to select and tap to switch
 */

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, Plus, Fingerprint, X, Trash2 } from 'lucide-react';
import { multiAccountService, StoredAccount } from '../../../src/services/multiAccount.service';
import { biometricService } from '../../../src/services/biometric.service';
import { useToast } from '@/hooks/use-toast';
import { VerifiedBadge } from '../ui/verified-badge';

interface QuickAccountSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitch: (userId: string) => void;
  onAddAccount: () => void;
}

export function QuickAccountSwitcher({
  isOpen,
  onClose,
  onSwitch,
  onAddAccount
}: QuickAccountSwitcherProps) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<StoredAccount | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      checkBiometric();
    }
  }, [isOpen]);

  const loadAccounts = () => {
    const accs = multiAccountService.getAccounts();
    const activeId = multiAccountService.getActiveAccountId();
    setAccounts(accs);
    setActiveAccountId(activeId);
    
    // Pre-select active account
    const active = accs.find(acc => acc.userId === activeId);
    setSelectedAccount(active || null);
  };

  const checkBiometric = async () => {
    const available = await biometricService.isPlatformAuthenticatorAvailable();
    setBiometricAvailable(available);
  };

  const handleAccountSelect = (account: StoredAccount) => {
    setSelectedAccount(account);
  };

  const handleSwitch = async () => {
    if (!selectedAccount || selectedAccount.userId === activeAccountId) {
      onClose();
      return;
    }

    // Check if account has credentials
    if (!(selectedAccount as any).encryptedPassword) {
      toast({
        title: '⚠️ Re-login Required',
        description: 'Please logout and login with this account once to enable switching.',
        variant: 'destructive',
        duration: 5000,
      });
      setIsSwitching(false);
      return;
    }

    setIsSwitching(true);

    try {
      // Check if biometric is registered for this account
      const needsBiometric = biometricAvailable && 
                            biometricService.isRegistered(selectedAccount.userId);

      let biometricVerified = false;

      if (needsBiometric) {
        try {
          biometricVerified = await biometricService.authenticate(selectedAccount.userId);
        } catch (error: any) {
          toast({
            title: 'Authentication Failed',
            description: error.message || 'Biometric authentication failed',
            variant: 'destructive'
          });
          setIsSwitching(false);
          return;
        }
      } else {
        biometricVerified = true; // No biometric required
      }

      // Perform switch
      const result = await multiAccountService.switchAccount(
        selectedAccount.userId,
        biometricVerified
      );

      if (result.success) {
        toast({
          title: '✅ Account Switched',
          description: `Switched to @${selectedAccount.username}`,
        });
        
        // Call parent handler
        onSwitch(selectedAccount.userId);
        onClose();

        // Mark splash as shown AND set account switch flag
        sessionStorage.setItem('splashShown', 'true');
        localStorage.setItem('accountSwitching', 'true');
        
        // Reload page to update context
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        if (result.error === 'biometric_required') {
          toast({
            title: 'Biometric Required',
            description: 'Please authenticate with biometric',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Switch Failed',
            description: result.error || 'Failed to switch account',
            variant: 'destructive'
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to switch account',
        variant: 'destructive'
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, account: StoredAccount) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, account: StoredAccount) => {
    const touchCurrent = e.touches[0].clientX;
    const diff = touchCurrent - touchStart;

    // Swipe threshold
    if (Math.abs(diff) > 50) {
      setSelectedAccount(account);
    }
  };

  const handleRemoveAccount = async (account: StoredAccount, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent account selection
    
    // Cannot remove active account if it's the only one
    if (accounts.length === 1) {
      toast({
        title: 'Cannot Remove',
        description: 'You must have at least one account',
        variant: 'destructive'
      });
      return;
    }

    // Confirm before removing
    if (!confirm(`Remove @${account.username} from this device?\n\nYou can add it back by logging in again.`)) {
      return;
    }

    try {
      const success = await multiAccountService.removeAccount(account.userId);
      
      if (success) {
        toast({
          title: 'Account Removed',
          description: `@${account.username} removed from this device`,
        });
        
        // Reload accounts list
        loadAccounts();
        
        // If removed account was active, reload page to switch to another account
        if (account.userId === activeAccountId) {
          toast({
            title: 'Switching Account',
            description: 'Switching to another account...',
          });
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        toast({
          title: 'Remove Failed',
          description: 'Failed to remove account',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove account',
        variant: 'destructive'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 mb-24 bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div>
            <h3 className="font-semibold text-lg">Quick Switch</h3>
            <p className="text-xs text-muted-foreground">
              {accounts.length}/3 accounts
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Accounts Carousel */}
        <div className="p-6">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {accounts.map((account) => (
              <div
                key={account.userId}
                className={`flex-shrink-0 snap-center transition-all duration-300 cursor-pointer ${
                  selectedAccount?.userId === account.userId
                    ? 'scale-110'
                    : 'scale-95 opacity-60'
                }`}
                onClick={() => handleAccountSelect(account)}
                onTouchStart={(e) => handleTouchStart(e, account)}
                onTouchMove={(e) => handleTouchMove(e, account)}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <Avatar
                      className={`h-20 w-20 border-4 transition-all ${
                        selectedAccount?.userId === account.userId
                          ? 'border-primary shadow-lg shadow-primary/50'
                          : 'border-transparent'
                      }`}
                    >
                      <AvatarImage src={account.avatarURL} />
                      <AvatarFallback>
                        {account.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Remove button - top left - Always visible */}
                    {accounts.length > 1 && (
                      <button
                        onClick={(e) => handleRemoveAccount(account, e)}
                        className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-full p-1.5 shadow-lg z-10 transition-all hover:scale-110"
                        title={`Remove @${account.username}`}
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    )}
                    
                    {/* Active indicator */}
                    {account.userId === activeAccountId && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}

                    {/* Biometric indicator */}
                    {biometricService.isRegistered(account.userId) && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                        <Fingerprint className="h-3 w-3 text-white" />
                      </div>
                    )}
                    
                    {/* Warning if no switching credentials */}
                    {!(account as any).encryptedPassword && account.userId !== activeAccountId && (
                      <div className="absolute -bottom-1 -left-1 bg-orange-500 rounded-full p-1" title="Re-login required">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold truncate max-w-[80px]">
                        {account.username}
                      </p>
                      {account.verified && <VerifiedBadge size="sm" />}
                    </div>
                    {account.userId === activeAccountId ? (
                      <p className="text-xs text-primary">Active</p>
                    ) : !(account as any).encryptedPassword ? (
                      <p className="text-xs text-orange-500">Re-login needed</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Account Button */}
            {accounts.length < 3 && (
              <button
                className="flex-shrink-0 snap-center scale-95 opacity-60 hover:scale-100 hover:opacity-100 transition-all"
                onClick={onAddAccount}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-20 w-20 border-4 border-dashed border-muted-foreground/30 rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Add Account</p>
                </div>
              </button>
            )}
          </div>

          {/* Swipe Hint */}
          <p className="text-center text-xs text-muted-foreground mt-2">
            ← Swipe to select →
          </p>
        </div>

        {/* Switch Button */}
        <div className="p-4 border-t border-border/50">
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl"
            onClick={handleSwitch}
            disabled={
              isSwitching || 
              !selectedAccount || 
              selectedAccount.userId === activeAccountId
            }
          >
            {isSwitching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Switching...
              </>
            ) : selectedAccount?.userId === activeAccountId ? (
              'Current Account'
            ) : (
              <>Switch to @{selectedAccount?.username}</>
            )}
          </Button>

          {biometricAvailable && selectedAccount && 
           biometricService.isRegistered(selectedAccount.userId) && (
            <p className="text-xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Fingerprint className="h-3 w-3" />
              Biometric authentication enabled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
