import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function TopNav({ title, showBackButton = true }) {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 bg-card border-b z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>
    </div>
  );
}

export default TopNav;
