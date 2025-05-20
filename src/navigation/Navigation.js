// Navigation.js
import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from "@react-navigation/native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import RetoMapaScreen from '../screens/RetoMapaScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RetoFoto from '../screens/RetoFoto';

// Auth
import { useAuth, AuthProvider } from '../context/AuthContext';
import AuthNavigation from './AuthNavigation';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MyTabs() {
    return (
        <Tab.Navigator
            initialRouteName='Home'
            screenOptions={{
                tabBarActiveTintColor: '#e91e63',
                tabBarStyle: { backgroundColor: "#f9f9f9", borderTopWidth: 0 },
            }}
        >
            <Tab.Screen 
                name='Home' 
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name='home' color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen 
                name='RetoMapa' 
                component={RetoMapaScreen}
                options={{
                    tabBarLabel: 'RetoMapa',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name='map-legend' color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen 
                name='Mi perfil' 
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Mi perfil',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name='account' color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

function MainStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="MainTabs" 
                component={MyTabs} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="RetoFoto" 
                component={RetoFoto} 
                options={{ title: 'Reto Foto' }} 
            />
        </Stack.Navigator>
    );
}

function NavigationContent() {
    const { currentUser } = useAuth();

    return (
        <NavigationContainer>
            {currentUser ? <MainStack /> : <AuthNavigation />}
        </NavigationContainer>
    );
}

export default function Navigation() {
    return (
        <AuthProvider>
            <NavigationContent />
        </AuthProvider>
    );
}
