import { Download, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const UserMenu = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const apkHref = `/habitency.apk?v=${Date.now()}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium text-foreground truncate">
          {displayName}
        </div>
        <div className="px-2 pb-1.5 text-xs text-muted-foreground truncate">
          {user.email}
        </div>
        {isAndroid && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={apkHref} download>
              <Download className="mr-2 h-4 w-4" />
              Download APK
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
