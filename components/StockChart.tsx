import React, { useMemo } from 'react';
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

export interface ChartMarker {
    time: string;       // 'YYYY-MM-DD'
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'arrowUp' | 'arrowDown' | 'circle';
    text: string;
}

export interface StockChartProps {
    data: CandleData[];
    markers?: ChartMarker[];
    chartType?: 'line' | 'candlestick';
}

export default function StockChart({ data, markers, chartType = 'line' }: StockChartProps) {
    const chartHTML = useMemo(() => {
        const dataJSON = JSON.stringify(data);
        const markersJSON = JSON.stringify(markers || []);

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
html,body{margin:0;padding:0;height:100%;overflow:hidden;font-family:sans-serif}
#chart{position:absolute;inset:0}
#debug{position:absolute;top:4px;left:4px;z-index:999;font-size:10px;color:#999;pointer-events:none}
#err{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:red;font-size:14px;text-align:center;display:none;z-index:1000}
</style>
</head>
<body>
<div id="debug">loading...</div>
<div id="err"></div>
<div id="chart"></div>
<script>
(function(){
  var dbg=document.getElementById('debug');
  var errEl=document.getElementById('err');
  function log(msg){dbg.textContent=msg;}
  function showErr(msg){errEl.style.display='block';errEl.textContent=msg;}

  try{
    var CHART_TYPE='${chartType}';
    var RAW_DATA=${dataJSON};
    var RAW_MARKERS=${markersJSON};
    log('data:'+RAW_DATA.length+' markers:'+RAW_MARKERS.length+' type:'+CHART_TYPE);
  }catch(e){
    showErr('DATA PARSE ERROR: '+e.message);
    return;
  }

  function toBD(s){
    try{var p=s.split('-').map(Number);return(p[0]&&p[1]&&p[2])?{year:p[0],month:p[1],day:p[2]}:null}catch(e){return null}
  }

  function toCandles(raw){
    var o=[];
    for(var i=0;i<raw.length;i++){
      var r=raw[i],bd=toBD(r.time);if(!bd)continue;
      var op=Number(r.open),hi=Number(r.high),lo=Number(r.low),cl=Number(r.close);
      if(isNaN(op)||isNaN(hi)||isNaN(lo)||isNaN(cl))continue;
      o.push({time:bd,open:op,high:hi,low:lo,close:cl});
    }
    return o;
  }

  function toLine(raw){
    var o=[];
    for(var i=0;i<raw.length;i++){
      var bd=toBD(raw[i].time);var v=Number(raw[i].close);
      if(bd&&!isNaN(v))o.push({time:bd,value:v});
    }
    return o;
  }

  function toMkrs(raw,dataSet){
    if(!raw||!raw.length)return[];
    var times={};
    for(var i=0;i<dataSet.length;i++){
      var t=dataSet[i].time;
      times[t.year+'-'+t.month+'-'+t.day]=true;
    }
    var o=[];
    for(var i=0;i<raw.length;i++){
      var bd=toBD(raw[i].time);
      if(!bd)continue;
      o.push({time:bd,position:raw[i].position,color:raw[i].color,shape:raw[i].shape,text:raw[i].text});
    }
    return o;
  }

  log('loading CDN...');
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/lightweight-charts@4.1.0/dist/lightweight-charts.standalone.production.js';

  s.onload=function(){
    log('CDN loaded, LWC='+(typeof LightweightCharts));
    if(!window.LightweightCharts){showErr('LightweightCharts undefined after CDN load');return;}

    try{
      var el=document.getElementById('chart');
      var w=Math.max(1,el.clientWidth||window.innerWidth);
      var h=Math.max(1,el.clientHeight||window.innerHeight);
      log('chart el: '+w+'x'+h);

      var chart=LightweightCharts.createChart(el,{
        width:w,height:h,
        layout:{background:{color:'#FFFFFF'},textColor:'#64748B'},
        grid:{vertLines:{color:'#F1F5F9'},horzLines:{color:'#F1F5F9'}},
        timeScale:{timeVisible:false,secondsVisible:false,borderColor:'#F1F5F9'},
        rightPriceScale:{borderColor:'#F1F5F9'},
        crosshair:{mode:LightweightCharts.CrosshairMode.Normal}
      });
      log('chart created');

      var series;
      if(CHART_TYPE==='candlestick'){
        series=chart.addCandlestickSeries({
          upColor:'#FF6B6B',downColor:'#3498DB',
          borderUpColor:'#FF6B6B',borderDownColor:'#3498DB',
          wickUpColor:'#FF6B6B',wickDownColor:'#3498DB'
        });
        var candles=toCandles(RAW_DATA);
        log('candlestick series, candles:'+candles.length);
        series.setData(candles);
      }else{
        series=chart.addLineSeries({color:'#4ECDC4',lineWidth:2});
        var lines=toLine(RAW_DATA);
        log('line series, points:'+lines.length);
        series.setData(lines);
      }

      if(RAW_MARKERS.length>0){
        try{
          var mapped=toMkrs(RAW_MARKERS,series.data?series.data():[]);
          log('markers mapped:'+mapped.length);
          if(mapped.length>0)series.setMarkers(mapped);
          log('markers set OK');
        }catch(me){
          log('markers error(ignored): '+me.message);
        }
      }

      chart.timeScale().fitContent();
      log('done! candles='+(CHART_TYPE==='candlestick'?toCandles(RAW_DATA).length:toLine(RAW_DATA).length));

      window.addEventListener('resize',function(){
        chart.applyOptions({width:el.clientWidth||window.innerWidth,height:el.clientHeight||window.innerHeight});
      });
    }catch(e){
      showErr('CHART ERROR: '+e.message);
      log('error: '+e.message);
    }
  };

  s.onerror=function(){
    showErr('CDN LOAD FAILED');
    log('CDN load failed');
  };

  document.head.appendChild(s);
})();
</script>
</body>
</html>`;
    }, [data, markers, chartType]);

    return (
        <View style={styles.container}>
            <WebView
                key={`chart-${data.length}-${chartType}`}
                originWhitelist={['*']}
                source={{ html: chartHTML }}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                style={styles.webview}
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    webview: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
});