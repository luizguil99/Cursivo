import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

function AdminPage() {
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">
            Bem-vindo ao Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-2">
            Selecione uma opção no menu lateral para começar
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
