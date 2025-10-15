import admin from "firebase-admin";
import { env } from "./env";

let firebaseApp: admin.app.App;

/**
 * Ініціалізація Firebase Admin SDK (Singleton pattern)
 */
export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccount = JSON.parse(env.firebaseServiceAccount);

    // Виправлення символів нового рядка в приватному ключі
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n"
      );
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.firebaseProjectId || serviceAccount.project_id,
    });

    console.log("✅ Firebase Admin SDK ініціалізовано");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Помилка ініціалізації Firebase:", error);
    throw error;
  }
}

/**
 * Отримання Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
}

/**
 * Отримання Auth instance
 */
export function getAuth(): admin.auth.Auth {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
}

/**
 * Отримання FieldValue для Firestore операцій
 */
export const FieldValue = admin.firestore.FieldValue;

/**
 * Отримання Timestamp для Firestore
 */
export const Timestamp = admin.firestore.Timestamp;
