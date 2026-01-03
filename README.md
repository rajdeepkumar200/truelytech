# Daily Habits Tracker

A beautiful daily habit tracker to build consistency and track your weekly progress. Simple, elegant, and effective.

## Features

- Track daily habits
- Weekly progress visualization
- Habit statistics
- Goal setting
- Reminders and notifications
- Dark/Light mode
- PWA support

## Getting Started

### Prerequisites

- Node.js & npm installed

### Installation

1. Clone the repository:
   ```sh
   git clone <YOUR_GIT_URL>
   ```

2. Navigate to the project directory:
   ```sh
   cd <YOUR_PROJECT_NAME>
   ```

3. Install dependencies:
   ```sh
   npm install
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase values (from Firebase Console → Project settings)

4. Start the development server:
   ```sh
   npm run dev
   ```

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- Firebase Auth + Firestore
- TanStack Query

## Firebase / Firestore setup

- Create a Firebase project
- Enable Auth providers (Google + Email/Password)
- Create a Firestore database
- Apply the rules from `firestore.rules` in Firebase Console (Firestore → Rules)

## License

This project is open source.
