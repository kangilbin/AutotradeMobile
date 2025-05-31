import {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import AccountBox from '../../../components/AccountBox';
import {AccountStatus, getAccountList} from '../../../contexts/backEndApi';
import {useSetRecoilState} from 'recoil';
import {accountAtom} from '../../../atoms/account';

export default function AccountListScreen() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<AccountStatus[]>([]);
    const setAccount = useSetRecoilState(accountAtom);
    useEffect(() => {
        const fetchAccountList = async () => {
            const response = await getAccountList();
            setAccounts(response?.data || []);
        };
        fetchAccountList();
    }, []);

    const handleAccountPress = (account) => {
        // 계정 박스 클릭 시 처리 로직
        setAccount(account);
        router.push('home');
    }
    return (
        <View style={styles.container}>
            {/* 상단 코드 박스 */}
            {accounts.map((account, index) => (
                <AccountBox key={index} account={account} onPress={() => handleAccountPress(account)} />
            ))}
            {/* 플러스 버튼 */}
            <TouchableOpacity style={styles.plusBox} onPress={() => router.push('account/add')}>
                <Feather name='plus' size={32} color='#2B4C59' />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    plusBox: {
        width: '90%',
        backgroundColor: '#B5EAD7',
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
});

