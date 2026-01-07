import { Settings, User, Eye, Bell, Download, LogOut, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
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
  
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const apkHref = `/habitency.apk?v=${Date.now()}`;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  
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
          
          {/* Download APK (Android only) */}
          {isAndroid && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href={apkHref} download>
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
    </>
  );
};

export default SettingsDialog;
