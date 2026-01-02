import { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface OnboardingTourProps {
  start: boolean;
}

export function OnboardingTour({ start }: OnboardingTourProps) {
  useEffect(() => {
    if (!start) return;

    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (hasSeenOnboarding) return;

    // Determine which add habit row is visible
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    const addHabitSelector = isMobile ? '#add-habit-mobile' : '#add-habit-desktop';

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: 'Get Started',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      onDestroyed: () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
      },
      steps: [
        { 
          popover: { 
            title: 'Welcome to TruelyTech!', 
            description: 'Your personal habit tracker and productivity companion. Let\'s take a quick tour.',
            side: "center", 
            align: 'center' 
          } 
        },
        { 
          element: addHabitSelector, 
          popover: { 
            title: 'Add New Habits', 
            description: 'Start by adding a new habit here. Just type a name and click Add.',
            side: "bottom", 
            align: 'start' 
          } 
        },
        { 
          element: '#hide-habit-btn', 
          popover: { 
            title: 'Hide & Show Habits', 
            description: 'Use this eye icon to toggle the visibility of hidden habits.',
            side: "left", 
            align: 'start' 
          } 
        },
        { 
          element: '#journal-btn', 
          popover: { 
            title: 'Journaling', 
            description: 'Click here to access your daily journal.',
            side: "left", 
            align: 'start' 
          } 
        },
        { 
          element: '#user-menu-btn', 
          popover: { 
            title: 'Profile', 
            description: 'Access your profile and account settings.',
            side: "left", 
            align: 'start' 
          } 
        },
        { 
          element: '#theme-toggle-btn', 
          popover: { 
            title: 'Theme', 
            description: 'Switch between light and dark mode.',
            side: "left", 
            align: 'start' 
          } 
        }
      ]
    });

    // Small delay to ensure DOM is ready and modal is fully gone
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 500);

    return () => clearTimeout(timer);
  }, [start]);

  return null;
}
