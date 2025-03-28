import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Consulta from './components/Consulta'
//import Settings from './components/Settings'
import Ionicons from 'react-native-vector-icons/Ionicons';
//galeria https://github.com/oblador/react-native-vector-icons/blob/master/glyphmaps/Ionicons.json
require('moment/locale/es.js');

function ConsultaAgenda() { 
    return (
        <Consulta/>
    );
}

function SettingsScreen() {
    return (
        <Settings/>
    );
}

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        if (route.name === 'Agenda') {
                            iconName = focused ? 'ios-calendar' : 'ios-calendar-outline';
                        }
                        // You can return any component that you like here!
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
                tabBarOptions={{
                    activeTintColor: '#673ab7',
                    inactiveTintColor: 'gray',
                }}
            >
                <Tab.Screen name="Agenda" component={ConsultaAgenda} />
            </Tab.Navigator>
        </NavigationContainer>
    );
  }
