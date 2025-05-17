// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font/build/FontHooks';
import LoadingIndicator from "../components/LoadingIndicator";

SplashScreen.preventAutoHideAsync(); // 앱 시작 시 Splash 유지
export default function RootLayout() {
    const [loaded, error] = useFonts({
        'Nanum-Regular': require('../assets/fonts/NanumBrushScript-Regular.ttf'),
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return <LoadingIndicator />;
    }

    return (
        <RecoilRoot>
            <StatusBar style="auto" />
            <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </RecoilRoot>
    );
}
