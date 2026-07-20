const fs = require('fs');

let dbTs = fs.readFileSync('server/db.ts', 'utf-8');

// 1. Add imports
const importsToAdd = `
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfigPath = path.resolve('firebase-applet-config.json');
let dbFirestore: any = null;
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    const app = initializeApp(firebaseConfig);
    dbFirestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase Firestore initialized for persistent DB sync.");
  } catch (e) {
    console.error("Firebase config error:", e);
  }
}
`;

dbTs = dbTs.replace("const DB_FILE_PATH = path.resolve('db.json');", "const DB_FILE_PATH = path.resolve('db.json');\n" + importsToAdd);

// 2. Extract merge logic
const loadRegex = /private load\(\) \{\s*try \{\s*if \(fs\.existsSync\(DB_FILE_PATH\)\) \{\s*const fileContent = fs\.readFileSync\(DB_FILE_PATH, 'utf-8'\);\s*const parsed = JSON\.parse\(fileContent\);([\s\S]*?)\/\/ Always save back to keep db\.json perfectly seeded and up to date\s*this\.save\(\);\s*\} else \{\s*this\.save\(\);\s*\}\s*\} catch \(e\) \{\s*console\.error\('Error loading database file, using in-memory fallback:', e\);\s*\}\s*\}/;

const match = dbTs.match(loadRegex);
if (!match) {
  console.error("Could not find load() method");
  process.exit(1);
}

const mergeLogicBody = match[1];

const newMethods = `
  private load() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.mergeParsedData(parsed);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading database file, using in-memory fallback:', e);
    }
  }

  private mergeParsedData(parsed: any) {
    try {
      ${mergeLogicBody}
      this.saveLocal();
    } catch (e) {
      console.error("Error in mergeParsedData:", e);
    }
  }

  public async loadFromFirestore() {
     if (!dbFirestore) return;
     try {
       console.log("Syncing database from Firestore...");
       const snapshot = await getDoc(doc(dbFirestore, 'system', 'database'));
       if (snapshot.exists()) {
          const docData = snapshot.data();
          if (docData && docData.data) {
             const parsed = JSON.parse(docData.data);
             this.mergeParsedData(parsed);
             console.log("Successfully synced database from Firestore.");
          }
       }
     } catch (e) {
        console.error("Error loading from Firestore:", e);
     }
  }

  private saveLocal() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving local database file:', e);
    }
  }

  public save() {
    this.saveLocal();
    try {
      if (dbFirestore) {
         setDoc(doc(dbFirestore, 'system', 'database'), { 
            data: JSON.stringify(this.data),
            updatedAt: new Date().toISOString()
         }).catch(e => console.error("Firestore background sync error", e));
      }
    } catch (e) {
      console.error('Error triggering Firestore sync:', e);
    }
  }
`;

dbTs = dbTs.replace(match[0], newMethods);

// replace public save()
const saveRegex = /public save\(\) \{\s*try \{\s*fs\.writeFileSync\(DB_FILE_PATH, JSON\.stringify\(this\.data, null, 2\), 'utf-8'\);\s*\} catch \(e\) \{\s*console\.error\('Error saving database file:', e\);\s*\}\s*\}/;
// Since we already injected a replacement save(), we need to remove the original one if it exists outside the replaced block. Oh wait, the match was only for load().
// Actually, `loadRegex` matches `private load() { ... }`, the original `public save()` is below it.
// Let's remove the original `public save() { ... }` 
dbTs = dbTs.replace(saveRegex, "");


fs.writeFileSync('server/db.ts', dbTs);
console.log("server/db.ts updated");
