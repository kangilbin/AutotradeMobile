import {Stack, useRouter} from 'expo-router';
import {useEffect} from "react";
import * as SecureStore from "expo-secure-store";
import {refreshAccessToken} from "../contexts/backEndApi";
import { Stack, useRouter } from 'expo-router';

export default function StackLayout() {

    return (
        <Stack>
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="account/index" options={{ headerShown: false }} />
        </Stack>
    );
}
