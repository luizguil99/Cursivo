// Função para gerar URL do avatar
export function getAvatarUrl(user, style, seed) {
  if (!user) return null;

  // Se for um avatar personalizado, retorna a URL direta
  if (user.avatar_url) {
    return user.avatar_url;
  }

  // Se recebeu style e seed específicos (usado na seleção de avatar)
  if (style && seed) {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }

  // Se tiver metadata, usa as configurações de lá
  if (user.user_metadata?.avatar_style) {
    const userStyle = user.user_metadata.avatar_style;
    const userSeed = user.user_metadata.avatar_seed;
    return `https://api.dicebear.com/7.x/${userStyle}/svg?seed=${encodeURIComponent(
      userSeed
    )}`;
  }

  // Configuração padrão
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
    user.id || "default"
  )}`;
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
  return (
    user.nome ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuário"
  );
}
