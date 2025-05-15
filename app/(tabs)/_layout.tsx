import { Tabs } from 'expo-router';
export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="account" options={{ headerShown: false }} />
            />
        </Tabs>
    );
}
