import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';

// Lista de emails de administradores
const ADMIN_EMAILS = [
  'admin@admin.com',
  'admin@cursivo.com',
  'cursivo@admin.com',
  // Adicione aqui os emails dos administradores que devem ter acesso
];

export default function AdminRoute({ children }) {
  const { currentUser } = useAuth();

  // Log para debug
  console.log('AdminRoute - Current User:', currentUser);
  console.log('AdminRoute - User Email:', currentUser?.email);
  console.log('AdminRoute - Is Admin:', currentUser && ADMIN_EMAILS.includes(currentUser?.email));

  // Se não houver usuário logado, redireciona para a página de login
  if (!currentUser) {
    console.log('AdminRoute - Usuário não logado, redirecionando para /');
    return <Navigate to="/" />;
  }

  // Se o usuário não for admin, redireciona para a página inicial
  if (!ADMIN_EMAILS.includes(currentUser.email)) {
    console.log('AdminRoute - Usuário não é admin:', currentUser.email);
    return <Navigate to="/" />;
  }

  // Se chegou aqui, o usuário é admin
  console.log('AdminRoute - Acesso permitido para:', currentUser.email);
  return <AdminLayout>{children}</AdminLayout>;
}
