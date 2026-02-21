import { Capacitor } from '@capacitor/core';
import { Settings, User, Eye, Bell, Download, LogOut, Moon, Sun, Rocket, BatteryCharging } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import NotificationSettings from './NotificationSettings';
import ThemeToggle from './ThemeToggle';
import ContactForm from './ContactForm';
import { NotificationPreferences } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SettingsDialogProps {
  notificationPrefs: NotificationPreferences;
  onUpdateNotificationPrefs: (prefs: NotificationPreferences) => void;
  showHiddenHabits: boolean;
  onToggleHiddenHabits: () => void;
}

const SettingsDialog = ({
  notificationPrefs,
  onUpdateNotificationPrefs,
  showHiddenHabits,
  onToggleHiddenHabits
}: SettingsDialogProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showStartupGuide, setShowStartupGuide] = useState(false);
  // Fallback for displayName if user_metadata is missing
  const displayName = (user && (user as any).user_metadata?.full_name) ||
    (user && (user as any).user_metadata?.name) ||
    user?.email?.split('@')[0] || 'User';

  const handleInstallApp = () => {
    navigate('/install');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            title="Settings"
            id="settings-btn"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* User Profile */}
          {user && (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Show Hidden Habits */}
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              onToggleHiddenHabits();
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            <span>{showHiddenHabits ? 'Hide' : 'Show'} Hidden Habits</span>
          </DropdownMenuItem>

          {/* Theme Toggle */}
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex items-center w-full">
              <Moon className="mr-2 h-4 w-4" />
              <span className="flex-1">Theme</span>
              <ThemeToggle />
            </div>
          </DropdownMenuItem>

          {/* Notifications */}
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setShowNotifications(true);
            }}
          >
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>

          {/* Contact Us */}
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setShowContact(true);
            }}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Contact Us</span>
          </DropdownMenuItem>

          {/* Android: Background Running */}
          {Capacitor.isNativePlatform() && (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                // Open battery optimization settings
                try {
                  import('@capacitor/app').then(({ App }) => {
                    App.getInfo().then((info) => {
                      (window as any).open?.(`intent://settings/apps/details?package=${info.id}#Intent;scheme=android-app;end`);
                    });
                  });
                } catch {}
              }}
            >
              <BatteryCharging className="mr-2 h-4 w-4" />
              <span>Background Running</span>
            </DropdownMenuItem>
          )}

          {/* Windows/Desktop: Auto-start Guide */}
          {!Capacitor.isNativePlatform() && (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setShowStartupGuide(true);
              }}
            >
              <Rocket className="mr-2 h-4 w-4" />
              <span>Auto-start at Login</span>
            </DropdownMenuItem>
          )}

          {/* Install App (browser only - hidden in native app) */}
          {!Capacitor.isNativePlatform() && (
            <DropdownMenuItem onClick={handleInstallApp} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              <span>Install App</span>
            </DropdownMenuItem>
          )}

          {/* Sign Out */}
          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Manage your notification preferences
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <NotificationSettings
              preferences={notificationPrefs}
              onUpdate={onUpdateNotificationPrefs}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Us Dialog */}
      <ContactForm open={showContact} onOpenChange={setShowContact} />

      {/* Auto-start Guide Dialog */}
      <Dialog open={showStartupGuide} onOpenChange={setShowStartupGuide}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-purple-500" />
              Launch at Startup
            </DialogTitle>
            <DialogDescription>
              Start Habitency automatically when your computer boots up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-sm text-foreground font-medium mb-2">📋 Chrome / Edge / Brave:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">
                <li>Install Habitency as an app (if not already)</li>
                <li>Right-click the app icon in your taskbar</li>
                <li>Check <strong>"Start app when you sign in"</strong></li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Chrome: Go to <strong>chrome://apps</strong> → right-click Habitency → enable startup
              </p>
            </div>
            <Button className="w-full" onClick={() => setShowStartupGuide(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsDialog;
