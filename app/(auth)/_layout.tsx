import { Stack } from 'expo-router';

export default function StackLayout() {
    return (
        <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ title: '회원 가입' }} />
        </Stack>
    );
}