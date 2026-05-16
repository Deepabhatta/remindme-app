export interface Reminder {
  id: string;
  message: string;
  createdAt: number;
  scheduledAt: number;
  notificationId?: string;
  status: 'pending' | 'delivered' | 'viewed';
}

export type RootStackParamList = {
  CreateReminder: undefined;
  ReminderDetails: { reminderId: string };
};
