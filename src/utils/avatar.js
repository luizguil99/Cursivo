// Função para gerar URL do avatar
export function getAvatarUrl(user) {
  if (!user) return null;

  // Se for um avatar personalizado, retorna a URL direta
  if (user.avatar_url) {
    return user.avatar_url;
  }

  // Se tiver metadata, usa as configurações de lá
  if (user.user_metadata?.avatar_style) {
    const style = user.user_metadata.avatar_style;
    const seed = user.user_metadata.avatar_seed || user.id?.slice(0, 8) || "default";
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  }

  // Configuração padrão
  const style = "adventurer";
  const seed = user.id?.slice(0, 8) || "default";
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Função para obter iniciais do nome
export function getInitials(user) {
  if (!user) return "?";
  
  // Tenta diferentes fontes de nome em ordem de prioridade
  const name = user.nome || user.user_metadata?.full_name || user.email || "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Função para obter nome de exibição
export function getDisplayName(user) {
  if (!user) return "Usuário";
  
  // Tenta diferentes fontes de nome em ordem de prioridade
  return user.nome || 
         user.user_metadata?.full_name || 
         user.email?.split("@")[0] || 
         "Usuário";
}
