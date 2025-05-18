import { Stack } from 'expo-router';

export default function StackLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="add" options={{ title: '계좌 등록' }} />
        </Stack>
    );
}