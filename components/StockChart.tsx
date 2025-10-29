import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

export interface CandleData {
    time: string; // 'YYYY-MM-DD'
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface StockChartProps {
    data: CandleData[];
}

export default function StockChart({ data }: StockChartProps) {
    const webviewRef = useRef<WebView>(null);

    const chartHTML = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"
      />
      <style>
        :root{
          --bg:#FFFFFF;
          --grid:#F1F5F9;
          --axis:#64748B;
          --line:#4ECDC4;
        }
        html, body {
          margin:0; padding:0; height:100%;
        }
        #root {
          position:absolute; inset:0;
        }
        #chart {
          position:absolute; inset:0;
        }
      </style>
    </head>
    <body>
      <div id="root">
        <div id="chart"></div>
      </div>

      <script>
        // RN 로그 포워딩(필요시 콘솔로 확인)
        (function () {
          const rn = window.ReactNativeWebView;
          ['log','warn','error'].forEach((k) => {
            const orig = console[k].bind(console);
            console[k] = function () {
              try { rn && rn.postMessage(JSON.stringify({ type: 'console', level: k, args: Array.from(arguments).map(a => String(a)) })); } catch(_) {}
              orig.apply(console, arguments);
            };
          });
          window.onerror = function (msg, src, line, col, err) {
            try { rn && rn.postMessage(JSON.stringify({ type: 'js-error', msg, src, line, col, stack: err && err.stack })); } catch(_) {}
          };
        })();

        // 날짜 'YYYY-MM-DD' -> BusinessDay
        function toBusinessDay(s) {
          try {
            const [y, m, d] = s.split('-').map(Number);
            if (!y || !m || !d) return null;
            return { year: y, month: m, day: d };
          } catch (_) { return null; }
        }

        function mapToLine(raw) {
          const out = [];
          for (let i = 0; i < (raw?.length || 0); i++) {
            const r = raw[i];
            const bd = toBusinessDay(r.time);
            const v = Number(r.close);
            if (!bd || Number.isNaN(v)) continue;
            out.push({ time: bd, value: v });
          }
          return out;
        }

        let chart, lineSeries;

        function createChart() {
          const el = document.getElementById('chart');
          const w = Math.max(1, el.clientWidth || window.innerWidth);
          const h = Math.max(1, el.clientHeight || window.innerHeight);

          chart = LightweightCharts.createChart(el, {
            width: w,
            height: h,
            layout: {
              background: { color: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#FFFFFF' },
              textColor: '#64748B'
            },
            grid: {
              vertLines: { color: '#F1F5F9' },
              horzLines: { color: '#F1F5F9' },
            },
            timeScale: {
              timeVisible: false,
              secondsVisible: false,
              borderColor: '#F1F5F9'
            },
            rightPriceScale: {
              borderColor: '#F1F5F9'
            },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
          });

          // 라인 시리즈(환경에 따라 addSeries(type: 'Line')만 제공될 수도 있어 분기)
          lineSeries = chart.addLineSeries({
            color: '#4ECDC4',
            lineWidth: 2,
          });
        

          window.addEventListener('resize', () => {
            const nel = document.getElementById('chart');
            const nw = Math.max(1, nel.clientWidth || window.innerWidth);
            const nh = Math.max(1, nel.clientHeight || window.innerHeight);
            chart.applyOptions({ width: nw, height: nh });
          });
        }

        // RN에서 전체/단건 업데이트 API
        window.receiveAll = function(json) {
          try {
            const arr = typeof json === 'string' ? JSON.parse(json) : json;
            if (!lineSeries) return;
            const data = mapToLine(arr);
            lineSeries.setData(data);
            chart && chart.timeScale().fitContent();
          } catch (e) { console.error('receiveAll error', e); }
        };
        window.receiveOne = function(json) {
          try {
            const c = typeof json === 'string' ? JSON.parse(json) : json;
            if (!lineSeries) return;
            const bd = toBusinessDay(c.time);
            const v = Number(c.close);
            if (!bd || Number.isNaN(v)) return;
            lineSeries.update({ time: bd, value: v });
          } catch (e) { console.error('receiveOne error', e); }
        };

        // Lightweight Charts 로드
        (function loadLwCharts() {
          var s = document.createElement('script');
          // 안정적인 standalone 빌드 사용
          s.src = 'https://cdn.jsdelivr.net/npm/lightweight-charts@4.1.0/dist/lightweight-charts.standalone.production.js';

          s.onload = function () {
            try {
              if (!window.LightweightCharts) {
                console.error('LightweightCharts not available after load');
                return;
              }
              // 다음 프레임에서 초기화
              requestAnimationFrame(() => {
                createChart();
                // 초기 데이터 1회 세팅(React에서 onLoadEnd로 또 전달하므로 여기서는 noop 가능)
                try {
                  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'lifecycle', event: 'lw-ready' }));
                } catch(_) {}
              });
            } catch (e) {
              console.error('init error', e);
            }
          };
          s.onerror = function () {
            console.error('Failed to load Lightweight Charts CDN');
          };
          document.head.appendChild(s);
        })();
      </script>
    </body>
  </html>
  `;

    // 초기 전체 데이터 세팅
    const handleLoadEnd = () => {
        if (!webviewRef.current) return;
        const payload = JSON.stringify(data);
        webviewRef.current.injectJavaScript(`
      (function(){
        if (window.receiveAll) {
          window.receiveAll(${JSON.stringify(payload)});
        } else {
          // 준비 안되었으면 약간 지연 후 재시도
          setTimeout(function(){
            if (window.receiveAll) window.receiveAll(${JSON.stringify(payload)});
          }, 120);
        }
      })();
      true;
    `);
    };

    // 데이터 변경 시 마지막 포인트 업데이트
    useEffect(() => {
        if (!webviewRef.current || data.length === 0) return;
        const last = data[data.length - 1];
        webviewRef.current.injectJavaScript(`
      (function(){
        if (window.receiveOne) {
          window.receiveOne(${JSON.stringify(JSON.stringify(last))});
        }
      })();
      true;
    `);
    }, [data]);

    return (
        <View style={styles.container}>
            <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: chartHTML }}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                style={styles.webview}
                onLoadEnd={handleLoadEnd}
                androidLayerType="software"
                mixedContentMode="always"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width,
        height: Math.max(300, height * 0.45),
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        // Android elevation
        elevation: 4,
    },
    webview: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
});
