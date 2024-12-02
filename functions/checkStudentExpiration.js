const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

// Initialize Firebase Admin
initializeApp();

// Cloud Function that runs daily at midnight
exports.checkStudentExpiration = onSchedule(
  {
    schedule: "0 0 * * *", // Runs at midnight every day (UTC)
    timeZone: "America/Sao_Paulo", // Set to Brazil timezone
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async (context) => {
    try {
      const db = getFirestore();
      const now = Timestamp.now();

      // Get all users except admins
      const usersRef = db.collection("users");
      const query = usersRef.where("role", "==", "student");
      const snapshot = await query.get();

      const batch = db.batch();
      let updatedCount = 0;

      snapshot.forEach((doc) => {
        const userData = doc.data();

        // Skip if user has lifetime plan
        if (userData.plan === "vitalicio") {
          return;
        }

        // Check if plan has expired
        if (
          userData.planEndDate &&
          userData.planEndDate.toDate() < now.toDate()
        ) {
          batch.update(doc.ref, {
            planStatus: "expired",
            status: "inactive",
            lastModified: now,
            lastModifiedBy: "system",
          });
          updatedCount++;
        }
      });

      // Commit all updates
      if (updatedCount > 0) {
        await batch.commit();
        console.log(`Updated ${updatedCount} expired student accounts`);
      }

      return null;
    } catch (error) {
      console.error("Error checking student expiration:", error);
      throw error;
    }
  }
);
