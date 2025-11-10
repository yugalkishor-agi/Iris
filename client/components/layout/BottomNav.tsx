import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Home, Search, PlusSquare, Film, User } from "lucide-react";
import { RadialCreateMenu } from "@/components/ui/radial-create-menu";
import { QuickAccountSwitcher } from "@/components/account/QuickAccountSwitcher";
import { multiAccountService } from "../../../src/services/multiAccount.service";
import { biometricService } from "../../../src/services/biometric.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "../../../src/config/firebase";

const itemsRight = [
  { to: "/glimpses", icon: Film, label: "Moments" },
  { to: "/me", icon: User, label: "Profile" },
];

interface BottomNavProps {
  unreadMessagesCount?: number;
}

export function BottomNav({ unreadMessagesCount = 0 }: BottomNavProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Left nav items (removed Discovery from here - now in Search page)
  const itemsLeft = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
  ];
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  
  // Gesture detection refs
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);
  const profileIconRef = useRef<HTMLDivElement>(null);

  // Long press handler (500ms)
  const handleProfileTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Don't preventDefault here - it's a passive listener
    // Just start the timer
    
    longPressTimer.current = setTimeout(() => {
      // Haptic feedback if available (silently fail if blocked)
      try {
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      } catch (error) {
        // Vibrate blocked by browser - ignore
      }
      setShowAccountSwitcher(true);
    }, 500);
  };

  const handleProfileTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleProfileTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Double tap handler (< 300ms between taps)
  const handleProfileDoubleTap = async (e: React.MouseEvent | React.TouchEvent) => {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTime.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      e.preventDefault();
      
      console.log('⚡ Double-click detected! Quick switching...');
      
      // Quick switch to next account
      const nextAccount = multiAccountService.getNextAccount();
      
      if (!nextAccount) {
        toast({
          title: 'No Other Accounts',
          description: 'Add another account to quick switch',
        });
        return;
      }
      
      // Check if account has credentials for switching
      if (!(nextAccount as any).encryptedPassword) {
        toast({
          title: '⚠️ Re-login Required',
          description: `Please logout and login with @${nextAccount.username} once to enable quick switching.`,
          variant: 'destructive',
          duration: 5000,
        });
        return;
      }
      
      // Show switching indicator
      toast({
        title: '⚡ Quick Switching...',
        description: `Switching to @${nextAccount.username}`,
      });

      // Check if biometric is required
      const needsBiometric = await biometricService.isPlatformAuthenticatorAvailable() &&
                            biometricService.isRegistered(nextAccount.userId);

      let biometricVerified = false;

      if (needsBiometric) {
        try {
          biometricVerified = await biometricService.authenticate(nextAccount.userId);
        } catch (error: any) {
          toast({
            title: 'Authentication Failed',
            description: 'Biometric authentication required',
            variant: 'destructive'
          });
          return;
        }
      } else {
        biometricVerified = true;
      }

      // Perform quick switch
      const result = await multiAccountService.switchAccount(
        nextAccount.userId,
        biometricVerified
      );

      if (result.success) {
        // Haptic feedback (silently fail if blocked)
        try {
          if (navigator.vibrate) {
            navigator.vibrate([30, 50, 30]);
          }
        } catch (error) {
          // Vibrate blocked by browser - ignore
        }
        
        toast({
          title: 'Quick Switched',
          description: `Switched to @${nextAccount.username}`,
        });

        // Mark splash as shown AND set account switch flag
        sessionStorage.setItem('splashShown', 'true');
        localStorage.setItem('accountSwitching', 'true');
        
        // Reload to update context
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        toast({
          title: 'Switch Failed',
          description: result.error || 'Failed to switch account',
          variant: 'destructive'
        });
      }
    } else if (timeSinceLastTap > 300) {
      // Single click - show hint if multiple accounts exist
      const accounts = multiAccountService.getAccounts();
      if (accounts.length > 1) {
        // Small hint on first click (only once per session)
        const hasShownHint = sessionStorage.getItem('quickSwitchHintShown');
        if (!hasShownHint) {
          setTimeout(() => {
            toast({
              title: '💡 Quick Tip',
              description: 'Double-click to quickly switch accounts!',
              duration: 2000,
            });
          }, 100);
          sessionStorage.setItem('quickSwitchHintShown', 'true');
        }
      }
    }

    lastTapTime.current = currentTime;
  };

  const handleAccountSwitch = (userId: string) => {
    // Account switch handled in QuickAccountSwitcher
    setShowAccountSwitcher(false);
  };

  const handleAddAccount = async () => {
    setShowAccountSwitcher(false);
    
    // CRITICAL: Save current logged-in account before navigating to add new one
    if (currentUser) {
      const existingAccounts = multiAccountService.getAccounts();
      const accountExists = existingAccounts.some(acc => acc.userId === currentUser.userId);
      
      if (!accountExists) {
        console.log('💾 Saving current account before adding new one...');
        
        // Get current Firebase user for token
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            const encryptedToken = await (multiAccountService as any).encryptToken(token);
            
            // Note: We can't get the password here since user is already logged in
            // The encryptedPassword will be added when they login again via AuthContext
            
            // Manually add current account to storage
            const accounts = multiAccountService.getAccounts();
            accounts.push({
              userId: currentUser.userId,
              username: currentUser.username,
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.username,
              avatarURL: currentUser.avatarURL,
              verified: currentUser.verified || false,
              lastActive: Date.now(),
              encryptedToken,
              encryptedPassword: undefined // Will be set on next login
            });
            
            localStorage.setItem('iris_accounts', JSON.stringify({
              accounts,
              activeAccountId: currentUser.userId
            }));
            
            console.log('✅ Current account saved before adding new one');
            
            // Show important instruction to user
            toast({
              title: '📝 Important Setup Step',
              description: 'After adding the new account, logout once and re-login to both accounts to enable seamless switching.',
              duration: 8000,
            });
          } catch (error) {
            console.error('⚠️ Failed to save current account:', error);
          }
        }
      }
    }
    
    // Navigate to login page
    navigate('/login', { state: { addingAccount: true } });
  };

  return (
    <nav className="fixed mx-auto max-w-md z-50" style={{ 
      left: 'max(1rem, var(--sal))', 
      right: 'max(1rem, var(--sar))', 
      bottom: 'max(1rem, var(--sab))' 
    }}>
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-primary/10">
        <div className="flex items-center justify-between px-2 py-2">
          {/* Left Items */}
          <div className="flex flex-1 justify-around">
            {itemsLeft.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                aria-label={label}
              >
                {({ isActive }) => (
                  <div className="relative">
                    <div
                      className={`flex items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105"
                      }`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {to === "/" && unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </div>

          {/* Center Create Button - Radial Menu Trigger */}
          <button
            className="relative -mt-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary via-cyan-500 to-blue-500 shadow-2xl flex items-center justify-center group hover:scale-110 transition-all active:scale-95"
            onClick={() => setShowRadialMenu(true)}
            style={{
              boxShadow: "0 0 20px rgba(6, 182, 212, 0.5)",
            }}
          >
            <PlusSquare className="h-7 w-7 text-white" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-60 blur-xl transition-opacity" />
          </button>

          {/* Right Items */}
          <div className="flex flex-1 justify-around">
            {itemsRight.map(({ to, icon: Icon, label }) => {
              // Special handling for Profile icon (multi-account gestures)
              const isProfileIcon = to === "/me";
              
              if (isProfileIcon) {
                return (
                  <NavLink
                    key={to}
                    to={to}
                    aria-label={label}
                  >
                    {({ isActive }) => (
                      <div
                        ref={profileIconRef}
                        className={`flex items-center justify-center p-3 rounded-2xl transition-all duration-300 cursor-pointer select-none ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105"
                        }`}
                        style={{ 
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          WebkitTouchCallout: 'none'
                        }}
                        onMouseDown={handleProfileTouchStart}
                        onMouseUp={handleProfileTouchEnd}
                        onMouseLeave={handleProfileTouchCancel}
                        onTouchStart={handleProfileTouchStart}
                        onTouchEnd={handleProfileTouchEnd}
                        onTouchCancel={handleProfileTouchCancel}
                        onClick={handleProfileDoubleTap}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                        {multiAccountService.getAccounts().length > 1 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {multiAccountService.getAccounts().length}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              }
              
              // Regular nav items
              return (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                >
                  {({ isActive }) => (
                    <div
                      className={`flex items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105"
                      }`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Radial Create Menu */}
      <RadialCreateMenu 
        isOpen={showRadialMenu} 
        onClose={() => setShowRadialMenu(false)} 
      />

      {/* Quick Account Switcher */}
      <QuickAccountSwitcher
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
        onSwitch={handleAccountSwitch}
        onAddAccount={handleAddAccount}
      />
    </nav>
  );
}
