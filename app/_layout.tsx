import {Stack, useRouter} from 'expo-router';
import {useEffect, useState} from "react";
import * as SecureStore from "expo-secure-store";
import {refreshAccessToken} from "../contexts/backEndApi";

export default function StackLayout() {
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);


    useEffect(() => {
        if (isRedirecting) return;

        (async () => {
            const token = await SecureStore.getItemAsync('refresh_token');
            if (token) {
                try {
                    const response = await refreshAccessToken(token);
                    return router.replace(response ? '/(account)/account' : '/(auth)/login');
                } catch {
                    console.error('Error refreshing token');
                }
            }
            router.replace('/(auth)/login');
        })();
    }, [isRedirecting, router]);

    return <Stack />;
}
