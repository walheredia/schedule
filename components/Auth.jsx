import React, {Component, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Actions} from 'react-native-router-flux';

export default function Auth(){
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    
    const userLogin = () => {
        Actions.Home();
    }

    return(
        <View >
        <Text > Welcome </Text>

        <View >
          <TextInput
            editable={true}
            onChangeText={(username) => setUsername({username})}
            placeholder='Username'
            ref='username'
            returnKeyType='next'
            value={username}
          />

          <TextInput
            editable={true}
            onChangeText={(password) => setPassword({password})}
            placeholder='Password'
            ref='password'
            returnKeyType='next'
            secureTextEntry={true}
            value={password}
          />

          <TouchableOpacity onPress={userLogin()}>
            <Text > Log In </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
}

/*
<NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        if (route.name === 'Agenda') {
                            iconName = focused ? 'ios-information-circle' : 'ios-information-circle-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'list-circle' : 'list-circle-outline';
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
*/