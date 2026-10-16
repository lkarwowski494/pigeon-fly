/**
 * PIGEON-FLY — Tabs Layout
 * High-contrast tab navigation designed for quick thumb switching.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
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
          fontSize: 20,
        },
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
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Stado',
          tabBarLabel: 'Stado',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🕊️</Text>,
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
        name="kalkulator"
        options={{
          title: 'Kalkulator',
          tabBarLabel: 'Kalkulator',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⏱️</Text>,
        }}
      />
      <Tabs.Screen
        name="zdrowie"
        options={{
          title: 'Zdrowie',
          tabBarLabel: 'Zdrowie',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💊</Text>,
        }}
      />
      <Tabs.Screen
        name="ustawienia"
        options={{
          title: 'Ustawienia',
          tabBarLabel: 'Gołębnik',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
