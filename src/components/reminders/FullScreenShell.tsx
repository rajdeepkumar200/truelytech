import { ReactNode } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
};

export default function FullScreenShell({ open, onOpenChange, children, className }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className={cn(
          'w-screen max-w-none h-[100dvh] p-0 rounded-none border-0',
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
