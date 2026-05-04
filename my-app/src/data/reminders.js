export const starterReminders = [
  {
    id: 1,
    title: 'Morning blood pressure pill',
    category: 'Medication',
    time: '8:00 AM',
    notes: 'Take with breakfast and a full glass of water.',
    status: 'Pending',
    needsConfirmation: true,
  },
  {
    id: 2,
    title: 'Physical therapy appointment',
    category: 'Appointment',
    time: '11:30 AM',
    notes: 'Bring insurance card and comfortable shoes.',
    status: 'Pending',
    needsConfirmation: false,
  },
  {
    id: 3,
    title: 'Call pharmacy for refill',
    category: 'Task',
    time: '3:00 PM',
    notes: 'Ask about automatic refill options.',
    status: 'Done',
    needsConfirmation: false,
  },
];

export const categoryDetails = {
  Medication: {
    label: 'Medication',
    accent: 'mint',
  },
  Appointment: {
    label: 'Appointment',
    accent: 'blue',
  },
  Task: {
    label: 'Task',
    accent: 'coral',
  },
};
