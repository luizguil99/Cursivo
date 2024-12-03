import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getDiscussions } from "@/lib/supabase";

const CommunityContext = createContext({});

export function CommunityProvider({ children }) {
  const { currentUser } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDiscussions = async () => {
    try {
      const data = await getDiscussions();
      setDiscussions(data);
    } catch (error) {
      console.error("Erro ao carregar discussões:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDiscussions();
    }
  }, [currentUser]);

  const value = {
    discussions,
    loading,
    refreshDiscussions: fetchDiscussions,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error(
      "useCommunity deve ser usado dentro de um CommunityProvider"
    );
  }
  return context;
};
