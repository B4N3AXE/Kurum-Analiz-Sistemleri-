# Database Sync via Firestore
The local database `db.json` is now configured to automatically push changes to Firebase Firestore (via `server/db.ts`). When the applet boots up, it will fetch the latest saved `db.json` state from Firestore and merge it, thereby persisting the state across cold starts and deployments.
