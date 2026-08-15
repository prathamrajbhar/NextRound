'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface ApiNotification {
  id: string;
  type: string;
  text: string;
  time: string;
  link: string;
  read: boolean;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<ApiNotification[]>('/notifications'),
  });
}

export function useNotificationCount() {
  const query = useNotifications();
  const notifications = Array.isArray(query.data) ? query.data : [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  return { ...query, notifications, unreadCount };
}