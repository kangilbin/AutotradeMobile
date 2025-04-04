// In App.js in a new project

import * as React from 'react';
import {View, Text, Pressable} from 'react-native';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from "./pages/Login";
import {useCallback} from "react";


function HomeScreen() {
    const navigation = useNavigation();
    const onClick = () => {
        navigation.navigate('Login');
    }
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Pressable onPress={onClick} style={{paddingHorizontal:40, paddingVertical:20, backgroundColor:'blue'}}>
                <Text style={{color: 'white'}}>Home Screen</Text>
            </Pressable>
        </View>
    );
}

const Stack = createNativeStackNavigator();

function RootStack() {
    return (
        <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: '' }}
            />
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: '' }}/>
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <NavigationContainer>
            <RootStack />
        </NavigationContainer>
    );
}