/**
 * PIGEON-FLY — Root Layout
 * Offline-first dark theme, safe areas, and Field Mode keep-awake handling.
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { activateKeepAwakeAsync } from 'expo-keep-awake';

export default function RootLayout() {
  useEffect(() => {
    // Keep screen awake in loft / field mode
    activateKeepAwakeAsync().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121417" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#121417',
          },
          headerTintColor: '#E5A93C',
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: '#121417',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal/scan"
          options={{
            presentation: 'modal',
            title: 'Skaner QR w Gołębniku',
          }}
        />
        <Stack.Screen
          name="modal/new-pigeon"
          options={{
            presentation: 'modal',
            title: 'Karta Nowego Ptaka',
          }}
        />
      </Stack>
    </>
  );
}
