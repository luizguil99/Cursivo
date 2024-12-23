// Cache global para notificações
const notificationsCache = {
  data: null,
  lastFetch: null,
  expirationTime: 5 * 60 * 1000, // 5 minutos
};

export const getNotificationsFromCache = () => {
  const now = Date.now();
  if (
    notificationsCache.data &&
    notificationsCache.lastFetch &&
    now - notificationsCache.lastFetch < notificationsCache.expirationTime
  ) {
    return notificationsCache.data;
  }
  return null;
};

export const setNotificationsCache = (data) => {
  notificationsCache.data = data;
  notificationsCache.lastFetch = Date.now();
};

export const invalidateNotificationsCache = () => {
  notificationsCache.lastFetch = null;
};
