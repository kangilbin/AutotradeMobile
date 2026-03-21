import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import TopHeader from "../../components/TopHeader";
import {SafeAreaProvider} from "react-native-safe-area-context";
import { registerPushTokenToServer, setupNotificationListeners } from "../../utils/pushNotification";

export default function TabLayout() {
    useEffect(() => {
        registerPushTokenToServer().catch(console.error);

        const cleanup = setupNotificationListeners(
            (notification) => {
                console.log('알림 수신:', notification.request.content);
            },
            (response) => {
                const data = response.notification.request.content.data;
                console.log('알림 탭:', data);
                // TODO: data 기반 화면 이동 (딥링크)
            },
        );

        return cleanup;
    }, []);

    return (
        <SafeAreaProvider>
            <TopHeader />
            <Tabs screenOptions={{ tabBarActiveTintColor: '#B5EAD7', headerShown: false }}>
                <Tabs.Screen
                    name="home"
                    options={{
                        tabBarIcon: ({ color }) => <AntDesign size={28} name="home" color={color} />,
                        tabBarLabel: 'HOME',
                    }}
                />
                <Tabs.Screen
                    name="stock"
                    options={{
                        tabBarIcon: ({ color }) => <AntDesign name="bar-chart" size={28} color={color} />,
                        tabBarLabel: 'STOCK',
                    }}
                />
                <Tabs.Screen
                    name="swing"
                    options={{
                        tabBarIcon: ({ color }) => <Ionicons name="repeat" size={28} color={color} />,
                        tabBarLabel: 'SWING',
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
        </SafeAreaProvider>
    );
}
