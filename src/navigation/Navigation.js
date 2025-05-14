//Navigation.js
import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
//icons
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

//screens
import HomeScreen from '../screens/HomeScreen';
import EjemploScreen from '../screens/EjemploScreen';

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
                name='Ejemplo' 
                component={EjemploScreen}
                options={{
                    tabBarLabel: 'Ejemplo',
                    tabBarIcon: ({color, size}) => (
                        <MaterialCommunityIcons name='image-search' color={color} size={size} />
                    ),
                    //tabBarBadge: 10,
                    //headerShown: false, //borrar el heder
                }}
            />
            
        </Tab.Navigator>
    )   
}

export default function Navigation(){
    return(
        <NavigationContainer>
            <MyTabs />
        </NavigationContainer>
    )
}