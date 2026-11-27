import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MarketCode, isOverseasMarket } from '../types/market';

const { height } = Dimensions.get('window');

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

export interface LineOverlayData {
    time: string; // 'YYYY-MM-DD'
    value: number;
}

export interface LineOverlay {
    data: LineOverlayData[];
    color: string;
    lineWidth?: number;
    title?: string;
}

// 일목균형표 구름 — 두 선(a, b) 사이를 칠한다. a >= b 면 양운(bullColor), a < b 면 음운(bearColor)
export interface CloudPoint {
    time: string; // 'YYYY-MM-DD'
    a: number;    // 선행스팬 A
    b: number;    // 선행스팬 B
}

export interface CloudOverlay {
    points: CloudPoint[];
    bullColor?: string;
    bearColor?: string;
}

export interface VisibleRange {
    from: string;
    to: string;
    fromIdx: number;
}

export interface StockChartProps {
    data: CandleData[];
    markers?: ChartMarker[];
    chartType?: 'line' | 'candlestick';
    lineOverlays?: LineOverlay[];
    cloud?: CloudOverlay | null;   // 일목균형표 구름 (lightweight-charts 4.1 에는 두 선 사이 채우기가 없어 캔버스로 칠한다)
    onVisibleRangeChange?: (range: VisibleRange) => void;
    webViewRef?: React.RefObject<WebView | null>;
    mrktCode?: MarketCode;   // 통화·소수점 표시 기준 (기본: 국내)
}

export default function StockChart({ data, markers, chartType = 'line', lineOverlays, cloud, onVisibleRangeChange, webViewRef, mrktCode = 'J' }: StockChartProps) {
    const internalWebViewRef = useRef<WebView | null>(null);
    const effectiveRef = webViewRef || internalWebViewRef;
    const prevDataLenRef = useRef<number>(0);
    const prevCloudLenRef = useRef<number>(0);
    const isInitializedRef = useRef(false);

    // 초기 HTML은 한 번만 생성 (chartType 변경 시에만 재생성)
    const chartHTML = useMemo(() => {
        const overseas = isOverseasMarket(mrktCode);
        const dataJSON = JSON.stringify(data);
        const markersJSON = JSON.stringify(markers || []);
        const overlaysJSON = JSON.stringify(lineOverlays || []);
        const cloudJSON = JSON.stringify(cloud || null);

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;overflow:hidden;font-family:-apple-system,sans-serif;-webkit-text-size-adjust:100%}
#chart{position:absolute;top:36px;left:0;right:0;bottom:0;overflow:hidden}
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
#cloud{position:absolute;top:36px;left:0;right:0;bottom:0;pointer-events:none;z-index:5}
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
<canvas id="cloud"></canvas>
<script>
(function(){
  var errEl=document.getElementById('err');
  function showErr(msg){errEl.style.display='block';errEl.textContent=msg;}

  try{
    var CHART_TYPE='${chartType}';
    var OVERSEAS=${overseas};
    var RAW_DATA=${dataJSON};
    var RAW_MARKERS=${markersJSON};
    var RAW_OVERLAYS=${overlaysJSON};
    var RAW_CLOUD=${cloudJSON};
  }catch(e){showErr('DATA PARSE ERROR: '+e.message);return;}

  function toBD(s){
    try{var p=s.split('-').map(Number);return(p[0]&&p[1]&&p[2])?{year:p[0],month:p[1],day:p[2]}:null}catch(e){return null}
  }
  function bdStr(bd){return bd.year+'.'+String(bd.month).padStart(2,'0')+'.'+String(bd.day).padStart(2,'0')}
  // 숫자만 (가격축·OHLC 헤더) — 미국은 소수점 2자리 유지, 국내는 정수
  function fmt(n){return OVERSEAS?n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):Math.round(n).toLocaleString()}
  // 통화 단위 포함 (툴팁) — 미국 '$1,234.56' / 국내 '1,234원'
  function fmtMoney(n){return OVERSEAS?'$'+fmt(n):fmt(n)+'원'}

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

  // 오버레이 데이터 변환
  function toOverlayData(ovDataArr){
    var o=[];
    for(var li=0;li<ovDataArr.length;li++){
      var ld=ovDataArr[li];
      var ovBd=toBD(ld.time);
      var ovVal=Number(ld.value);
      if(ovBd&&!isNaN(ovVal))o.push({time:ovBd,value:ovVal});
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

      // window에 노출하여 injectJavaScript로 접근 가능하게 함
      window._chart=LightweightCharts.createChart(el,{
        width:w,height:h,
        layout:{background:{color:'#FFFFFF'},textColor:'#64748B'},
        grid:{vertLines:{color:'#F1F5F9'},horzLines:{color:'#F1F5F9'}},
        timeScale:{timeVisible:false,secondsVisible:false,borderColor:'#F1F5F9',
          tickMarkFormatter:function(time){return time.month+'월 '+time.day+'일'}
        },
        localization:{
          timeFormatter:function(time){return time.month+'월 '+time.day+'일'},
          priceFormatter:function(price){return fmt(price)}
        },
        rightPriceScale:{borderColor:'#F1F5F9'},
        crosshair:{mode:LightweightCharts.CrosshairMode.Normal}
      });
      var chart=window._chart;

      window._series=null;
      window._candleData=null;
      window._overlaySeries=[];
      window._cloud=RAW_CLOUD;

      if(CHART_TYPE==='candlestick'){
        window._series=chart.addCandlestickSeries({
          upColor:'#FF6B6B',downColor:'#3498DB',
          borderUpColor:'#FF6B6B',borderDownColor:'#3498DB',
          wickUpColor:'#FF6B6B',wickDownColor:'#3498DB'
        });
        window._candleData=toCandles(RAW_DATA);
        window._series.setData(window._candleData);
      }else{
        window._series=chart.addLineSeries({color:'#4ECDC4',lineWidth:2});
        window._series.setData(toLine(RAW_DATA));
      }
      var series=window._series;
      var candleData=window._candleData;

      // 라인 오버레이 (EMA 등)
      for(var oi=0;oi<RAW_OVERLAYS.length;oi++){
        var ov=RAW_OVERLAYS[oi];
        var ovSeries=chart.addLineSeries({
          color:ov.color||'#FF9800',
          lineWidth:ov.lineWidth||2,
          crosshairMarkerVisible:false,
          priceLineVisible:false,
          lastValueVisible:false
        });
        ovSeries.setData(toOverlayData(ov.data));
        window._overlaySeries.push(ovSeries);
      }

      // 매수/매도를 정확한 거래 가격에 원으로 표시
      window._tradeMap={};
      window._tradeDots=[];
      var _rafId=null;
      var _isInteracting=false;
      function setupDots(markers,cData){
        // rAF cleanup
        if(_rafId){cancelAnimationFrame(_rafId);_rafId=null;}
        _isInteracting=false;
        // 기존 dot 제거
        for(var d=0;d<window._tradeDots.length;d++){
          var dd=window._tradeDots[d].dot;
          if(dd.parentNode)dd.parentNode.removeChild(dd);
        }
        window._tradeMap={};
        window._tradeDots=[];
        if(!markers||markers.length===0||!cData||cData.length===0)return;
        for(var i=0;i<markers.length;i++){
          var m=markers[i];
          var bd=toBD(m.time);
          if(!bd)continue;
          var isBuy=m.shape==='arrowUp';
          var price=m.price||0;
          var key=bd.year+'-'+bd.month+'-'+bd.day;
          window._tradeMap[key]={isBuy:isBuy,text:m.text,price:price};
          var dot=document.createElement('div');
          dot.className='trade-dot '+(isBuy?'buy':'sell');
          el.appendChild(dot);
          window._tradeDots.push({dot:dot,time:bd,price:price});
        }
      }
      setupDots(RAW_MARKERS,candleData);

      function updateDots(){
        var plotW=chart.timeScale().width();
        var plotH=el.clientHeight;
        for(var j=0;j<window._tradeDots.length;j++){
          var td=window._tradeDots[j];
          var x=chart.timeScale().timeToCoordinate(td.time);
          var y=series.priceToCoordinate(td.price);
          if(x===null||y===null||x<0||x>plotW||y<0||y>plotH){td.dot.style.display='none';continue;}
          td.dot.style.display='block';
          td.dot.style.left=x+'px';
          td.dot.style.top=y+'px';
        }
        drawCloud(); // 도트와 같은 시점(드래그·줌·범위 변경·데이터 갱신)에 구름도 좌표를 다시 계산한다
      }

      // ── 일목 구름 (선행스팬 A/B 사이 채우기) ──
      // 시간·가격을 화면 좌표로 바꿔 캔버스에 직접 칠한다. 양운↔음운이 바뀌는 지점은 두 선이 만나는 곳에서 끊어 색을 나눈다.
      function drawCloud(){
        var cv=document.getElementById('cloud');
        if(!cv)return;
        var w=el.clientWidth,h=el.clientHeight;
        var dpr=window.devicePixelRatio||1;
        if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){
          cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
          cv.style.width=w+'px';cv.style.height=h+'px';
        }
        var ctx=cv.getContext('2d');
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.clearRect(0,0,w,h);
        var cl=window._cloud;
        if(!cl||!cl.points||cl.points.length<2)return;
        var ts=chart.timeScale();
        var plotW=ts.width();
        var plotH=h-(ts.height?ts.height():0);
        var pts=[];
        for(var i=0;i<cl.points.length;i++){
          var p=cl.points[i],bd=toBD(p.time);
          if(!bd){pts.push(null);continue;}
          var x=ts.timeToCoordinate(bd);
          var ya=series.priceToCoordinate(p.a);
          var yb=series.priceToCoordinate(p.b);
          pts.push((x===null||ya===null||yb===null)?null:{x:x,ya:ya,yb:yb,a:p.a,b:p.b,bull:p.a>=p.b});
        }
        var runs=[],cur=null;
        for(var k=0;k<pts.length;k++){
          var q=pts[k];
          if(!q){cur=null;continue;}
          if(!cur){cur={bull:q.bull,top:[[q.x,q.ya]],bot:[[q.x,q.yb]]};runs.push(cur);continue;}
          var prev=pts[k-1];
          if(q.bull===cur.bull){
            cur.top.push([q.x,q.ya]);cur.bot.push([q.x,q.yb]);
          }else{
            // 부호가 바뀐 구간 — 두 선이 만나는 점(a=b)을 보간해 앞 구름은 거기서 닫고 새 구름을 거기서 시작한다
            var d0=prev.a-prev.b,d1=q.a-q.b,t=d0/(d0-d1);
            var xc=prev.x+t*(q.x-prev.x),yc=prev.ya+t*(q.ya-prev.ya);
            cur.top.push([xc,yc]);cur.bot.push([xc,yc]);
            cur={bull:q.bull,top:[[xc,yc],[q.x,q.ya]],bot:[[xc,yc],[q.x,q.yb]]};runs.push(cur);
          }
        }
        ctx.save();
        ctx.beginPath();ctx.rect(0,0,plotW,plotH);ctx.clip(); // 가격축·시간축 위로 번지지 않게 플롯 영역만
        for(var r=0;r<runs.length;r++){
          var run=runs[r];
          if(run.top.length<2)continue;
          ctx.fillStyle=run.bull?(cl.bullColor||'rgba(255,107,107,0.16)'):(cl.bearColor||'rgba(52,152,219,0.16)');
          ctx.beginPath();
          ctx.moveTo(run.top[0][0],run.top[0][1]);
          for(var t1=1;t1<run.top.length;t1++)ctx.lineTo(run.top[t1][0],run.top[t1][1]);
          for(var t2=run.bot.length-1;t2>=0;t2--)ctx.lineTo(run.bot[t2][0],run.bot[t2][1]);
          ctx.closePath();ctx.fill();
        }
        ctx.restore();
      }
      // rAF 기반 인터랙션 동기화 (가격축 드래그/핀치 줌 등 모든 인터랙션 대응)
      function rafLoop(){
        if(_isInteracting){updateDots();_rafId=requestAnimationFrame(rafLoop);}
        else{_rafId=null;}
      }
      function startSync(){
        _isInteracting=true;
        if(!_rafId)_rafId=requestAnimationFrame(rafLoop);
      }
      function stopSync(){
        setTimeout(function(){_isInteracting=false;updateDots();},200);
      }
      el.addEventListener('pointerdown',startSync);
      el.addEventListener('pointermove',function(e){if(e.buttons>0)startSync();});
      document.addEventListener('pointerup',stopSync);
      document.addEventListener('pointercancel',stopSync);
      el.addEventListener('wheel',function(){
        startSync();
        clearTimeout(window._wheelTimer);
        window._wheelTimer=setTimeout(stopSync,300);
      },{passive:true});

      // 프로그래밍적 스크롤(scrollToDate 등) 대응
      chart.timeScale().subscribeVisibleLogicalRangeChange(updateDots);

      // updateDots는 setVisibleLogicalRange 이후 double rAF로 호출 (초기 좌표 오류 방지)

      // OHLC 표시 + 툴팁
      var oO=document.getElementById('ohlc-o');
      var oH=document.getElementById('ohlc-h');
      var oL=document.getElementById('ohlc-l');
      var oC=document.getElementById('ohlc-c');
      var tooltip=document.getElementById('tooltip');

      function updateOHLC(param){
        var cd=window._candleData;
        if(!param||!param.time){
          tooltip.style.display='none';
          if(cd&&cd.length>0){
            var last=cd[cd.length-1];
            showOHLC(last.time,last.open,last.high,last.low,last.close);
          }
          return;
        }
        var d=param.seriesData.get(series);
        if(d){
          showOHLC(param.time,d.open,d.high,d.low,d.close);
        }
        var key=param.time.year+'-'+param.time.month+'-'+param.time.day;
        var trade=window._tradeMap[key];
        if(trade&&param.point){
          var label=trade.isBuy?'매수':'매도';
          tooltip.textContent=label+' '+fmtMoney(trade.price)+' ('+trade.text+')';
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

      if(candleData&&candleData.length>0){
        var last=candleData[candleData.length-1];
        showOHLC(last.time,last.open,last.high,last.low,last.close);
      }

      // visible range 변경 이벤트 → React Native 전달
      chart.timeScale().subscribeVisibleLogicalRangeChange(function(range){
        var cd=window._candleData;
        if(range && cd && cd.length>0 && window.ReactNativeWebView){
          var fromIdx=Math.max(0,Math.floor(range.from));
          var toIdx=Math.min(cd.length-1,Math.ceil(range.to));
          var fromTime=cd[fromIdx]?bdStr(cd[fromIdx].time):'';
          var toTime=cd[toIdx]?bdStr(cd[toIdx].time):'';
          if(fromTime&&toTime){
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type:'visibleRangeChange',from:fromTime,to:toTime,fromIdx:fromIdx
            }));
          }
        }
      });

      // 외부에서 특정 날짜로 차트 스크롤
      window.scrollToDate=function(dateStr){
        var cd=window._candleData;
        if(!cd||cd.length===0)return;
        var parts=dateStr.replace(/\\./g,'-').split('-').map(Number);
        var ty=parts[0],tm=parts[1],td=parts[2];
        var bestIdx=0,bestDiff=Infinity;
        for(var ci=0;ci<cd.length;ci++){
          var c=cd[ci].time;
          var diff=Math.abs((c.year-ty)*10000+(c.month-tm)*100+(c.day-td));
          if(diff<bestDiff){bestDiff=diff;bestIdx=ci;}
          if(diff===0)break;
        }
        var half=25;
        chart.timeScale().setVisibleLogicalRange({from:bestIdx-half,to:bestIdx+half});
      };

      // ── 증분 데이터 업데이트 (WebView 재생성 없이) ──
      window.updateChartData=function(newDataJSON,newMarkersJSON,newOverlaysJSON,newCloudJSON){
        try{
          var newRaw=JSON.parse(newDataJSON);
          var newMarkers=JSON.parse(newMarkersJSON);
          var newOverlays=JSON.parse(newOverlaysJSON);
          window._cloud=newCloudJSON?JSON.parse(newCloudJSON):null; // 구름은 setupDots/updateDots 단계에서 다시 그려진다

          // 현재 보이는 범위 저장: from 날짜 + 봉 수(배율) 보존
          var visRange=chart.timeScale().getVisibleLogicalRange();
          var cd=window._candleData;
          var savedFromDate=null;
          var savedBarCount=50; // 기본값
          if(visRange){
            savedBarCount=visRange.to-visRange.from; // 현재 배율(보이는 봉 수) 보존
            if(cd && cd.length>0){
              var fi=Math.max(0,Math.floor(visRange.from));
              if(cd[fi])savedFromDate=cd[fi].time;
            }
          }

          // 시리즈 데이터 업데이트
          if(CHART_TYPE==='candlestick'){
            var newCandles=toCandles(newRaw);
            window._candleData=newCandles;
            window._series.setData(newCandles);
          }else{
            window._series.setData(toLine(newRaw));
            window._candleData=null;
          }

          // 오버레이 업데이트
          for(var oi=0;oi<window._overlaySeries.length && oi<newOverlays.length;oi++){
            window._overlaySeries[oi].setData(toOverlayData(newOverlays[oi].data));
          }
          // 오버레이가 추가된 경우
          for(var ni=window._overlaySeries.length;ni<newOverlays.length;ni++){
            var nov=newOverlays[ni];
            var novSeries=chart.addLineSeries({
              color:nov.color||'#FF9800',
              lineWidth:nov.lineWidth||2,
              crosshairMarkerVisible:false,
              priceLineVisible:false,
              lastValueVisible:false
            });
            novSeries.setData(toOverlayData(nov.data));
            window._overlaySeries.push(novSeries);
          }

          // 마커(도트) 재설정
          setupDots(newMarkers,window._candleData);
          updateDots();

          // 스크롤 위치 복원: from 날짜 기준 인덱스 + 기존 봉 수(배율) 유지
          var newCd=window._candleData;
          if(savedFromDate && newCd && newCd.length>0){
            var newFromIdx=findDateIdx(newCd,savedFromDate);
            if(newFromIdx!==null){
              chart.timeScale().setVisibleLogicalRange({from:newFromIdx,to:newFromIdx+savedBarCount});
            }
          }
        }catch(e){
          showErr('UPDATE ERROR: '+e.message);
        }
      };

      function findDateIdx(cd,dateObj){
        var bestIdx=null,bestDiff=Infinity;
        for(var i=0;i<cd.length;i++){
          var c=cd[i].time;
          var diff=Math.abs((c.year-dateObj.year)*10000+(c.month-dateObj.month)*100+(c.day-dateObj.day));
          if(diff<bestDiff){bestDiff=diff;bestIdx=i;}
          if(diff===0)break;
        }
        return bestIdx;
      }

      // 초기 표시: 최근 50개 캔들
      var totalBars=RAW_DATA.length;
      var visibleCount=Math.min(50,totalBars);
      // 일목 구름은 마지막 캔들 뒤 26칸으로 뻗는다 — 그 칸 수만큼 오른쪽을 더 보여 준다
      var futureBars=0;
      if(RAW_CLOUD&&RAW_CLOUD.points&&totalBars>0){
        var lastBd=toBD(RAW_DATA[totalBars-1].time);
        if(lastBd){
          var lastKey=lastBd.year*10000+lastBd.month*100+lastBd.day;
          for(var fi=0;fi<RAW_CLOUD.points.length;fi++){
            var fb=toBD(RAW_CLOUD.points[fi].time);
            if(fb&&(fb.year*10000+fb.month*100+fb.day)>lastKey)futureBars++;
          }
        }
      }
      chart.timeScale().setVisibleLogicalRange({from:totalBars-visibleCount,to:totalBars+futureBars});
      // 차트 레이아웃 완료 후 도트 위치 계산 (double rAF로 렌더 사이클 보장)
      requestAnimationFrame(function(){ requestAnimationFrame(updateDots); });

      // 초기화 완료 신호
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'chartReady'}));
      }

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
    // chartHTML은 초기 렌더용이므로 chartType·mrktCode(통화 포맷)만 의존
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartType, mrktCode]);

    // data/markers/overlays 변경 시 WebView를 재생성하지 않고 injectJavaScript로 업데이트
    useEffect(() => {
        if (!isInitializedRef.current) {
            // 첫 렌더 시에는 HTML에 이미 데이터가 포함되어 있으므로 스킵
            prevDataLenRef.current = data.length;
            prevCloudLenRef.current = cloud?.points.length ?? 0;
            isInitializedRef.current = true;
            return;
        }

        // 데이터(또는 구름)가 실제로 변경되었을 때만 업데이트
        const cloudLen = cloud?.points.length ?? 0;
        if (data.length === prevDataLenRef.current && cloudLen === prevCloudLenRef.current) return;
        prevDataLenRef.current = data.length;
        prevCloudLenRef.current = cloudLen;

        const ref = effectiveRef;
        if (!ref.current) return;

        const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
        const dataJSON = escape(JSON.stringify(data));
        const markersJSON = escape(JSON.stringify(markers || []));
        const overlaysJSON = escape(JSON.stringify(lineOverlays || []));
        const cloudJSON = escape(JSON.stringify(cloud || null));

        ref.current.injectJavaScript(
            `window.updateChartData && window.updateChartData('${dataJSON}','${markersJSON}','${overlaysJSON}','${cloudJSON}'); true;`
        );
    }, [data, markers, lineOverlays, cloud, effectiveRef]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'visibleRangeChange' && onVisibleRangeChange) {
                onVisibleRangeChange({ from: msg.from, to: msg.to, fromIdx: msg.fromIdx });
            }
        } catch {}
    }, [onVisibleRangeChange]);

    return (
        <View style={styles.container}>
            <WebView
                ref={effectiveRef}
                key={`chart-${chartType}-${mrktCode}`}
                originWhitelist={['*']}
                source={{ html: chartHTML }}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                style={styles.webview}
                androidLayerType="software"
                mixedContentMode="always"
                onMessage={handleMessage}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch',
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