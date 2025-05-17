import { Tabs } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#B5EAD7', headerShown: false }}>
            <Tabs.Screen
                name="home"
                options={{
                    tabBarIcon: ({ color }) => <AntDesign size={28} name="home" color={color} />,
                    tabBarLabel: 'HOME',
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    tabBarIcon: ({ color }) => <AntDesign name="creditcard" size={28} color={color} />,
                    tabBarLabel: 'ACCOUNT',
                }}
            />
            <Tabs.Screen
                name="user"
                options={{
                    tabBarIcon: ({ color }) => <AntDesign name="user" size={28} color={color} />,
                    tabBarLabel: 'MY',
                }}
            />
        </Tabs>
    );
}
