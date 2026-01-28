import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import pkg from '../../package.json';

interface VersionInfo {
    version: string;
    buildNumber: number;
    apkUrl: string;
}

export function AppUpdater() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [remoteVersion, setRemoteVersion] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');

    useEffect(() => {
        const checkForUpdates = async () => {
            // Only check on native Android devices
            if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
                return;
            }

            try {
                const response = await fetch('https://truelytechtechnologies.vercel.app/version.json', {
                    cache: 'no-store'
                });
                if (!response.ok) return;

                const data: VersionInfo = await response.json();
                const currentVersion = pkg.version;

                if (compareVersions(data.version, currentVersion) > 0) {
                    setRemoteVersion(data.version);
                    setDownloadUrl(data.apkUrl);
                    setUpdateAvailable(true);
                }
            } catch (error) {
                console.error('Failed to check for updates:', error);
            }
        };

        // Check on mount
        checkForUpdates();

        // Check every hour if app stays open
        const interval = setInterval(checkForUpdates, 3600000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdate = () => {
        if (downloadUrl) {
            window.open(downloadUrl, '_system');
        }
    };

    // Semver comparison
    const compareVersions = (v1: string, v2: string) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    };

    return (
        <Dialog open={updateAvailable} onOpenChange={setUpdateAvailable}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Available</DialogTitle>
                    <DialogDescription>
                        A new version of Habitency ({remoteVersion}) is available.
                        Update now to get the latest features and fixes.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start">
                    <Button onClick={handleUpdate} className="w-full bg-green-600 hover:bg-green-700">
                        <Download className="mr-2 h-4 w-4" />
                        Update Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
