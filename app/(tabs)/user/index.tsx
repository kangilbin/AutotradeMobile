import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { Ionicons } from "@expo/vector-icons";
import { useAccountStore } from "../../../stores/useAccountStore";
import { JwtPayload } from "../../../types/auth";

export default function UserScreen() {
    const account = useAccountStore((state) => state.account);
    const [userName, setUserName] = useState<string>('');
    const [userPhone, setUserPhone] = useState<string>('');
    const [profileImage, setProfileImage] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            const fetchUserInfo = async () => {
                const accessToken = await SecureStore.getItemAsync('access_token');
                if (accessToken) {
                    const decodedToken = jwtDecode<JwtPayload>(accessToken);
                    setUserName(decodedToken.user_claims?.USER_NAME || '');
                    setUserPhone(decodedToken.user_claims?.PHONE || '');
                }
                const picture = await SecureStore.getItemAsync('google_picture');
                setProfileImage(picture);
            };
            fetchUserInfo();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            "로그아웃",
            "정말 로그아웃 하시겠습니까?",
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "로그아웃",
                    style: "destructive",
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('access_token');
                        await SecureStore.deleteItemAsync('refresh_token');
                        await SecureStore.deleteItemAsync('google_refresh_token');
                        await SecureStore.deleteItemAsync('google_picture');
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        router.push('/(tabs)/user/edit');
    };

    const handleNotificationSettings = () => {
        router.push('/(tabs)/user/notifications');
    };

    const handleHelpSupport = () => {
        Alert.alert("알림", "고객 지원 기능은 준비 중입니다.");
    };

    const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }: {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        subtitle?: string;
        onPress: () => void;
        showArrow?: boolean;
        danger?: boolean;
    }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color={danger ? "#FF6B6B" : "#4ECDC4"} 
                    />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={styles.menuSubtitle}>{subtitle}</Text>
                    )}
                </View>
            </View>
            {showArrow && (
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* User Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        {profileImage ? (
                            <Image
                                source={{ uri: profileImage }}
                                style={styles.profileImage}
                                contentFit="cover"
                                transition={200}
                            />
                        ) : (
                            <View style={styles.profileImage}>
                                <Ionicons name="person" size={40} color="#4ECDC4" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.userPhone}>{userPhone}</Text>
                    <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
                        <Text style={styles.editProfileText}>프로필 수정</Text>
                    </TouchableOpacity>
                </View>

                {/* Account Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="card" size={20} color="#4ECDC4" />
                        <Text style={styles.cardTitle}>계좌 정보</Text>
                    </View>
                    <View style={styles.accountInfo}>
                        <View style={styles.accountRow}>
                            <Text style={styles.accountLabel}>계좌번호</Text>
                            <Text style={styles.accountValue}>
                                {account?.ACCOUNT_NO ? 
                                    `${account.ACCOUNT_NO.slice(0, -2)}-${account.ACCOUNT_NO.slice(-2)}` : 
                                    '계좌 정보 없음'
                                }
                            </Text>
                        </View>
                        <View style={styles.accountRow}>
                            <Text style={styles.accountLabel}>투자 모드</Text>
                            <View style={[
                                styles.modeBadge,
                                account?.SIMULATION_YN === 'Y' ? styles.simulationMode : styles.realMode
                            ]}>
                                <Text style={[
                                    styles.modeText,
                                    account?.SIMULATION_YN === 'Y' ? styles.simulationText : styles.realText
                                ]}>
                                    {account?.SIMULATION_YN === 'Y' ? '모의투자' : '실전투자'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menu */}
                <View style={styles.card}>
                    <MenuItem
                        icon="notifications-outline"
                        title="알림 설정"
                        subtitle="푸시 알림 관리"
                        onPress={handleNotificationSettings}
                    />
                    <MenuItem
                        icon="help-circle-outline"
                        title="고객 지원"
                        subtitle="문의 및 도움말"
                        onPress={handleHelpSupport}
                    />
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },

    profileSection: {
        backgroundColor: "#fff",
        alignItems: "center",
        paddingVertical: 32,
        marginBottom: 16,
    },
    profileImageContainer: {
        position: "relative",
        marginBottom: 16,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F0F8F6",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#4ECDC4",
    },
    userName: {
        fontSize: 20,
        fontWeight: "600",
        color: "#2F3E46",
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        color: "#6C757D",
        marginBottom: 16,
    },
    editProfileButton: {
        backgroundColor: "#A8D5BA",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    editProfileText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2F3E46",
        marginLeft: 8,
    },
    accountInfo: {
        gap: 12,
    },
    accountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    accountLabel: {
        fontSize: 14,
        color: "#6C757D",
    },
    accountValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2F3E46",
    },
    modeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    simulationMode: {
        backgroundColor: "#FFF3CD",
    },
    realMode: {
        backgroundColor: "#D1ECF1",
    },
    modeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    simulationText: {
        color: "#856404",
    },
    realText: {
        color: "#0C5460",
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F8F9FA",
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F0F8F6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    iconContainerDanger: {
        backgroundColor: "#FFF5F5",
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: "500",
        color: "#2F3E46",
        marginBottom: 2,
    },
    menuTitleDanger: {
        color: "#FF6B6B",
    },
    menuSubtitle: {
        fontSize: 12,
        color: "#6C757D",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FF6B6B",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutText: {
        color: "#FF6B6B",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    bottomSpacing: {
        height: 20,
    },
});