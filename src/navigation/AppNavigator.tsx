import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import CreateReminderScreen from '../screens/CreateReminderScreen';
import ReminderDetailsScreen from '../screens/ReminderDetailsScreen';
import { Colors } from '../utils/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.bgCard,
        },
        headerTintColor: Colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        contentStyle: {
          backgroundColor: Colors.bg,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="CreateReminder"
        component={CreateReminderScreen}
        options={{ title: 'RemindMe' }}
      />
      <Stack.Screen
        name="ReminderDetails"
        component={ReminderDetailsScreen}
        options={{
          title: 'Reminder Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}
