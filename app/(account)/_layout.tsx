import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen
                name="index"
                options={{
                    title: '계좌',
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{ title: '설정' }}
            />
        </Tabs>
    );
}
