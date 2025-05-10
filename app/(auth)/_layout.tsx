import { Stack } from 'expo-router';

export default function StackLayout() {
    return (
        <Stack
            screenOptions={{
            headerShown: false, // 헤더 완전 숨기기
            title: '',          // 타이틀 비우기 (필요 시)
        }}>
            <Stack.Screen name="login"  />
            <Stack.Screen name="signup" options={{ title: '회원 가입' }} />
        </Stack>
    );
}
