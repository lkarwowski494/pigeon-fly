/**
 * PIGEON-FLY — Tabs Layout (Zrównoważony układ 5 sekcji hodowlanych)
 * Stado • Rozpłód • Żywienie • Loty • Zdrowie
 */

import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

export default function TabsLayout() {
  const router = useRouter();

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={() => router.push('/ustawienia')}
      style={{ paddingRight: 16 }}
      accessibilityRole="button"
      accessibilityLabel="Ustawienia i Chmura"
    >
      <Text style={{ fontSize: 20 }}>⚙️</Text>
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#121417',
          borderBottomWidth: 1,
          borderBottomColor: '#262930',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 19,
        },
        headerRight: renderHeaderRight,
        tabBarStyle: {
          backgroundColor: '#121417',
          borderTopWidth: 1,
          borderTopColor: '#262930',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#E5A93C',
        tabBarInactiveTintColor: '#8E94A0',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes Stada',
          tabBarLabel: 'Stado',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🕊️</Text>,
        }}
      />
      <Tabs.Screen
        name="rozplod"
        options={{
          title: 'Rozpłód i Lęgi',
          tabBarLabel: 'Rozpłód',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🥚</Text>,
        }}
      />
      <Tabs.Screen
        name="zywienie"
        options={{
          title: 'Żywienie i Dieta',
          tabBarLabel: 'Żywienie',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌾</Text>,
        }}
      />
      <Tabs.Screen
        name="loty"
        options={{
          title: 'Loty i Treningi',
          tabBarLabel: 'Loty',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏁</Text>,
        }}
      />
      <Tabs.Screen
        name="zdrowie"
        options={{
          title: 'Zdrowie i Pierzenie',
          tabBarLabel: 'Zdrowie',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💊</Text>,
        }}
      />
      <Tabs.Screen
        name="kalkulator"
        options={{
          href: null, // Hidden from bottom tabs, accessed from Loty
        }}
      />
      <Tabs.Screen
        name="ustawienia"
        options={{
          href: null, // Hidden from bottom tabs, accessed from header gear icon
        }}
      />
    </Tabs>
  );
}
