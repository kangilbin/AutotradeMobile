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
    price?: number;     // 정확한 거래 가격
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
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;overflow:hidden;font-family:-apple-system,sans-serif;-webkit-text-size-adjust:100%}
#chart{position:absolute;top:36px;left:0;right:0;bottom:0}
#ohlc{
  position:absolute;top:0;left:0;right:0;height:34px;z-index:10;
  display:flex;align-items:center;justify-content:center;padding:0;gap:14px;
  background:#FFFFFF;border-bottom:1px solid #F1F5F9;
  font-size:12px;color:#64748B;
}
#ohlc .lbl{color:#95A5A6}
#ohlc .val{font-weight:600;margin-left:2px}
#ohlc .up{color:#FF6B6B}
#ohlc .down{color:#3498DB}
#err{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:red;font-size:14px;text-align:center;display:none;z-index:1000}
#tooltip{
  position:absolute;display:none;z-index:100;
  padding:6px 10px;border-radius:6px;
  font-size:11px;font-weight:600;color:#fff;
  pointer-events:none;white-space:nowrap;
  box-shadow:0 2px 8px rgba(0,0,0,0.15);
}
.trade-dot{
  position:absolute;width:10px;height:10px;border-radius:50%;
  pointer-events:none;z-index:50;margin-left:-5px;margin-top:-5px;
}
.trade-dot.buy{background:#4ECDC4}
.trade-dot.sell{background:transparent;border:2px solid #4ECDC4}
</style>
</head>
<body>
<div id="ohlc">
  <span><span class="lbl">시</span><span class="val" id="ohlc-o">-</span></span>
  <span><span class="lbl">고</span><span class="val" id="ohlc-h">-</span></span>
  <span><span class="lbl">저</span><span class="val" id="ohlc-l">-</span></span>
  <span><span class="lbl">종</span><span class="val" id="ohlc-c">-</span></span>
</div>
<div id="err"></div>
<div id="tooltip"></div>
<div id="chart"></div>
<script>
(function(){
  var errEl=document.getElementById('err');
  function showErr(msg){errEl.style.display='block';errEl.textContent=msg;}

  try{
    var CHART_TYPE='${chartType}';
    var RAW_DATA=${dataJSON};
    var RAW_MARKERS=${markersJSON};
  }catch(e){showErr('DATA PARSE ERROR: '+e.message);return;}

  function toBD(s){
    try{var p=s.split('-').map(Number);return(p[0]&&p[1]&&p[2])?{year:p[0],month:p[1],day:p[2]}:null}catch(e){return null}
  }
  function bdStr(bd){return bd.year+'.'+String(bd.month).padStart(2,'0')+'.'+String(bd.day).padStart(2,'0')}
  function fmt(n){return n.toLocaleString()}

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

  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/lightweight-charts@4.1.0/dist/lightweight-charts.standalone.production.js';

  s.onload=function(){
    if(!window.LightweightCharts){showErr('LightweightCharts undefined');return;}

    try{
      var el=document.getElementById('chart');
      var w=Math.max(1,el.clientWidth||window.innerWidth);
      var h=Math.max(1,el.clientHeight||window.innerHeight);

      var chart=LightweightCharts.createChart(el,{
        width:w,height:h,
        layout:{background:{color:'#FFFFFF'},textColor:'#64748B'},
        grid:{vertLines:{color:'#F1F5F9'},horzLines:{color:'#F1F5F9'}},
        timeScale:{timeVisible:false,secondsVisible:false,borderColor:'#F1F5F9',
          tickMarkFormatter:function(time){return time.month+'월 '+time.day+'일'}
        },
        localization:{
          timeFormatter:function(time){return time.month+'월 '+time.day+'일'}
        },
        rightPriceScale:{borderColor:'#F1F5F9'},
        crosshair:{mode:LightweightCharts.CrosshairMode.Normal}
      });

      var series;
      var candleData;
      if(CHART_TYPE==='candlestick'){
        series=chart.addCandlestickSeries({
          upColor:'#FF6B6B',downColor:'#3498DB',
          borderUpColor:'#FF6B6B',borderDownColor:'#3498DB',
          wickUpColor:'#FF6B6B',wickDownColor:'#3498DB'
        });
        candleData=toCandles(RAW_DATA);
        series.setData(candleData);
      }else{
        series=chart.addLineSeries({color:'#4ECDC4',lineWidth:2});
        series.setData(toLine(RAW_DATA));
      }

      // 매수/매도를 정확한 거래 가격에 원으로 표시
      // 매수: 채워진 원, 매도: 테두리만 있는 원
      var tradeMap={};
      var tradeDots=[];
      if(RAW_MARKERS.length>0 && candleData && candleData.length>0){
        for(var i=0;i<RAW_MARKERS.length;i++){
          var m=RAW_MARKERS[i];
          var bd=toBD(m.time);
          if(!bd)continue;
          var isBuy=m.shape==='arrowUp';
          var price=m.price||0;
          var key=bd.year+'-'+bd.month+'-'+bd.day;
          tradeMap[key]={isBuy:isBuy,text:m.text,price:price};
          var dot=document.createElement('div');
          dot.className='trade-dot '+(isBuy?'buy':'sell');
          el.appendChild(dot);
          tradeDots.push({dot:dot,time:bd,price:price});
        }
        function updateDots(){
          for(var j=0;j<tradeDots.length;j++){
            var td=tradeDots[j];
            var x=chart.timeScale().timeToCoordinate(td.time);
            var y=series.priceToCoordinate(td.price);
            if(x===null||y===null){td.dot.style.display='none';continue;}
            td.dot.style.display='block';
            td.dot.style.left=x+'px';
            td.dot.style.top=y+'px';
          }
        }
        updateDots();
        chart.timeScale().subscribeVisibleLogicalRangeChange(updateDots);
        chart.subscribeCrosshairMove(function(){updateDots()});
      }

      // OHLC 표시 + 툴팁
      var oO=document.getElementById('ohlc-o');
      var oH=document.getElementById('ohlc-h');
      var oL=document.getElementById('ohlc-l');
      var oC=document.getElementById('ohlc-c');
      var tooltip=document.getElementById('tooltip');

      function updateOHLC(param){
        if(!param||!param.time){
          tooltip.style.display='none';
          if(candleData&&candleData.length>0){
            var last=candleData[candleData.length-1];
            showOHLC(last.time,last.open,last.high,last.low,last.close);
          }
          return;
        }
        var d=param.seriesData.get(series);
        if(d){
          showOHLC(param.time,d.open,d.high,d.low,d.close);
        }
        // 매수/매도 툴팁 표시
        var key=param.time.year+'-'+param.time.month+'-'+param.time.day;
        var trade=tradeMap[key];
        if(trade&&param.point){
          var label=trade.isBuy?'매수':'매도';
          tooltip.textContent=label+' '+fmt(trade.price)+'원 ('+trade.text+')';
          tooltip.style.background='#4ECDC4';
          tooltip.style.display='block';
          var tx=Math.min(param.point.x,el.clientWidth-140);
          tooltip.style.left=Math.max(4,tx)+'px';
          tooltip.style.top=(param.point.y-32)+'px';
        }else{
          tooltip.style.display='none';
        }
      }

      function showOHLC(time,o,h,l,c){
        var isUp=c>=o;
        var cls=isUp?'val up':'val down';
        oO.className=cls;oO.textContent=fmt(o);
        oH.className=cls;oH.textContent=fmt(h);
        oL.className=cls;oL.textContent=fmt(l);
        oC.className=cls;oC.textContent=fmt(c);
      }

      chart.subscribeCrosshairMove(updateOHLC);

      // 초기에 마지막 캔들 OHLC 표시
      if(candleData&&candleData.length>0){
        var last=candleData[candleData.length-1];
        showOHLC(last.time,last.open,last.high,last.low,last.close);
      }

      // 초기 표시: 최근 50개 캔들
      var totalBars=RAW_DATA.length;
      var visibleCount=Math.min(50,totalBars);
      chart.timeScale().setVisibleLogicalRange({from:totalBars-visibleCount,to:totalBars});

      window.addEventListener('resize',function(){
        chart.applyOptions({width:el.clientWidth||window.innerWidth,height:el.clientHeight||window.innerHeight});
      });
    }catch(e){
      showErr('CHART ERROR: '+e.message);
    }
  };

  s.onerror=function(){showErr('CDN LOAD FAILED');};
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