/**
 * PIGEON-FLY — Tabs Layout (Zrównoważony układ 5 sekcji hodowlanych)
 * Stado • Rozpłód • Żywienie • Loty • Zdrowie
 */

import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { t } from '../../src/lib/i18n';

export default function TabsLayout() {
  const router = useRouter();

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={() => router.push('/ustawienia')}
      style={{ paddingRight: 16 }}
      accessibilityRole="button"
      accessibilityLabel={t('Ustawienia')}
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
          title: t('Pigeon-Fly'),
          tabBarLabel: t('Stado'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🕊️</Text>,
        }}
      />
      <Tabs.Screen
        name="rozplod"
        options={{
          title: t('Rozpłód'),
          tabBarLabel: t('Rozpłód'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🥚</Text>,
        }}
      />
      <Tabs.Screen
        name="zywienie"
        options={{
          title: t('Żywienie'),
          tabBarLabel: t('Żywienie'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌾</Text>,
        }}
      />
      <Tabs.Screen
        name="loty"
        options={{
          title: t('Loty i Treningi'),
          tabBarLabel: t('Loty i Treningi'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏁</Text>,
        }}
      />
      <Tabs.Screen
        name="zdrowie"
        options={{
          title: t('Zdrowie'),
          tabBarLabel: t('Zdrowie'),
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
