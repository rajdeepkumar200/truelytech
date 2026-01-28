import { Capacitor } from '@capacitor/core';
import { Settings, User, Eye, Bell, Download, LogOut, Moon, Sun } from 'lucide-react';
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [apkUrl, setApkUrl] = useState<string>('');
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  // Fallback for displayName if user_metadata is missing
  const displayName = (user && (user as any).user_metadata?.full_name) ||
    (user && (user as any).user_metadata?.name) ||
    user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    if (!isAndroid) return;
    const updateUrl = new URL(`${import.meta.env.BASE_URL}app-update.json`, window.location.origin);
    updateUrl.searchParams.set('ts', String(Date.now()));
    fetch(updateUrl.toString(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.apkUrl) {
          setApkUrl(data.apkUrl);
        }
      })
      .catch(err => console.error('Failed to fetch update info:', err));
  }, [isAndroid]);

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

          {/* Download APK (Android browser only - hidden in native app) */}
          {isAndroid && !Capacitor.isNativePlatform() && apkUrl && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href={apkUrl} download>
                <Download className="mr-2 h-4 w-4" />
                <span>Download APK</span>
              </a>
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
    </>
  );
};

export default SettingsDialog;
