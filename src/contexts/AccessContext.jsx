import { createContext, useContext, useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const AccessContext = createContext({});

export function AccessProvider({ children }) {
  const [userAccess, setUserAccess] = useState({
    loading: true,
    hasAccess: false,
    planDetails: null,
    userData: null,
  });

  const auth = getAuth();
  const db = getFirestore();

  const checkUserAccess = (userData) => {
    if (!userData) return false;

    // Se for plano vitalício, sempre tem acesso
    if (userData.plan === "vitalicio") return true;

    // Se o plano estiver inativo ou expirado, não tem acesso
    if (userData.planStatus !== "active") return false;

    // Se tiver data de expiração, verifica se ainda é válida
    if (userData.planEndDate) {
      const now = new Date();
      const endDate = new Date(userData.planEndDate.seconds * 1000);
      return now < endDate;
    }

    return false;
  };

  const updateAccessStatus = async (user) => {
    if (!user) {
      setUserAccess({
        loading: false,
        hasAccess: false,
        planDetails: null,
        userData: null,
      });
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      
      const hasAccess = checkUserAccess(userData);
      
      let daysRemaining = null;
      if (userData.planEndDate) {
        const now = new Date();
        const endDate = new Date(userData.planEndDate.seconds * 1000);
        daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      }

      setUserAccess({
        loading: false,
        hasAccess,
        planDetails: {
          plan: userData.plan,
          status: userData.planStatus,
          endDate: userData.planEndDate ? new Date(userData.planEndDate.seconds * 1000) : null,
          daysRemaining: userData.plan === "vitalicio" ? "∞" : daysRemaining,
        },
        userData,
      });
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      setUserAccess({
        loading: false,
        hasAccess: false,
        planDetails: null,
        userData: null,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      updateAccessStatus(user);
    });

    return () => unsubscribe();
  }, []);

  const refreshAccess = () => {
    const user = auth.currentUser;
    if (user) {
      updateAccessStatus(user);
    }
  };

  return (
    <AccessContext.Provider value={{ ...userAccess, refreshAccess }}>
      {children}
    </AccessContext.Provider>
  );
}

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccess deve ser usado dentro de um AccessProvider");
  }
  return context;
};
