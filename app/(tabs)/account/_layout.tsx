import { Stack } from 'expo-router';

export default function StackLayout() {
    return (
        <Stack ScreenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="add"/>
        </Stack>
    );
}