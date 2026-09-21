import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import AppTouchable from '../common/AppTouchable';
import HighlightText from '../common/HighlightText';
import { StockStatus } from '../../types/stock';
import { Colors, Shadows, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

interface StockListItemProps {
    item: StockStatus;
    onPress: (stockName: string, stCode: string, mrktCode: string) => void;
    /** 이 결과를 만들어낸 검색어. 일치 구간을 강조하는 데만 쓴다. */
    query?: string;
}

/**
 * 종목 리스트 아이템 컴포넌트 (Presentational)
 */
function StockListItem({ item, onPress, query = '' }: StockListItemProps) {
    return (
        <AppTouchable
            style={styles.container}
            onPress={() => onPress(item.ST_NM, item.ST_CODE, item.MRKT_CODE)}
        >
            <View style={styles.row}>
                {/* 종목코드로 검색했는지 종목명으로 검색했는지 알 수 없으므로 둘 다 대조한다 */}
                <View style={styles.codeBadge}>
                    <HighlightText
                        text={item.ST_CODE}
                        query={query}
                        style={styles.codeText}
                        highlightStyle={styles.highlight}
                    />
                </View>
                <HighlightText
                    text={item.ST_NM}
                    query={query}
                    style={styles.nameText}
                    highlightStyle={styles.highlight}
                    numberOfLines={1}
                />
            </View>
        </AppTouchable>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.sm,
    },
    codeBadge: {
        marginRight: Spacing.md,
        backgroundColor: Colors.borderLight,
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.xl,
        ...Shadows.small,
    },
    codeText: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    nameText: {
        flex: 1,
        fontSize: FontSizes.lg,
        color: Colors.textPrimary,
    },
    // 일치 구간 강조 — fontSize 는 건드리지 않는다. 줄 높이가 바뀌면 리스트 행이 들썩인다
    highlight: {
        color: Colors.primaryDark,
        fontWeight: 'bold',
    },
});

export default memo(StockListItem);