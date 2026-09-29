import React, { memo, useMemo } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { splitByQuery } from '../../utils/highlight';

interface HighlightTextProps {
    text: string;
    query: string;
    style?: StyleProp<TextStyle>;
    /** 일치 구간에만 덧입힐 스타일 (색/굵기 등) */
    highlightStyle?: StyleProp<TextStyle>;
    numberOfLines?: number;
}

/**
 * 검색어와 일치하는 구간만 강조해서 보여주는 텍스트 (Presentational)
 * 중첩 Text 로 그리므로 줄바꿈·말줄임은 바깥 Text 기준 그대로 동작한다.
 */
function HighlightText({ text, query, style, highlightStyle, numberOfLines }: HighlightTextProps) {
    const segments = useMemo(() => splitByQuery(text, query), [text, query]);

    return (
        <Text style={style} numberOfLines={numberOfLines}>
            {segments.map((segment, index) =>
                segment.matched ? (
                    <Text key={index} style={highlightStyle}>
                        {segment.text}
                    </Text>
                ) : (
                    segment.text
                )
            )}
        </Text>
    );
}

export default memo(HighlightText);
