//Navigation.js
import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
//icons
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

//screens
import HomeScreen from '../screens/HomeScreen';
import RetoMapaScreen from '../screens/RetoMapaScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Auth
import { useAuth, AuthProvider } from '../context/AuthContext';
import AuthNavigation from './AuthNavigation';

const Tab = createBottomTabNavigator();

function MyTabs(){
    return(
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
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name='home' color={color} size={size} />
                    ),
                    //tabBarBadge: 10,
                    //headerShown: false, //borrar el heder
                }}
            />
            <Tab.Screen 
                name='RetoMapa' 
                component={RetoMapaScreen}
                options={{
                    tabBarLabel: 'RetoMapa',
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name='map-legend' color={color} size={size} />
                    ),
                    //tabBarBadge: 10,
                    //headerShown: false, //borrar el heder
                }}
            />
            <Tab.Screen 
                name='Mi perfil' 
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Mi perfil',
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name='account' color={color} size={size} />
                    ),
                    //tabBarBadge: 10,
                    //headerShown: false, //borrar el heder
                }}
            />
            
        </Tab.Navigator>
    )   
}

// Componente principal que decide qué navegación mostrar según el estado de autenticación
function NavigationContent() {
    const { currentUser } = useAuth();
    
    return (
        <NavigationContainer>
            {currentUser ? <MyTabs /> : <AuthNavigation />}
        </NavigationContainer>
    );
}

// Componente que envuelve la navegación con el proveedor de autenticación
export default function Navigation() {
    return (
        <AuthProvider>
            <NavigationContent />
        </AuthProvider>
    );
}