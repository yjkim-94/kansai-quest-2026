(() => {
  const el = document.getElementById('weather');
  const cities = [
    {name:'오사카',lat:34.6937,lon:135.5023},
    {name:'교토',lat:35.0116,lon:135.7681},
    {name:'고베',lat:34.6901,lon:135.1956}
  ];
  const japanDate = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
  const cityForDate = date => cities[date==='2026-10-11'?1:date>='2026-10-12'?2:0];
  const condition = (code,isDay) => {
    if(code===0)return [isDay?'☀️':'🌙','맑음'];
    if(code===1||code===2)return [isDay?'🌤️':'☁️','구름 조금'];
    if(code===3)return ['☁️','흐림'];
    if(code===45||code===48)return ['🌫️','안개'];
    if(code>=95)return ['⛈️','뇌우'];
    if([71,73,75,77,85,86].includes(code))return ['🌨️','눈'];
    if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return ['🌧️','비'];
    return ['☁️','날씨'];
  };
  let cache;try{cache=JSON.parse(localStorage.getItem('kansai-weather'))}catch{}
  let pending=false;
  function paint(city,date,stale=false) {
    const valid=cache?.city===city.name&&cache?.date===date;
    el.replaceChildren();
    const add=(className,text)=>{const node=document.createElement('span');node.className=className;node.textContent=text;el.append(node);return node};
    add('weather-city',city.name);
    if(!valid){add('weather-range',stale?'날씨 연결 대기':'날씨 불러오는 중…');return}
    const [icon,label]=condition(cache.code,cache.isDay);
    const iconNode=add('weather-icon',icon);iconNode.setAttribute('role','img');iconNode.setAttribute('aria-label',label);
    add('weather-temperature',Math.round(cache.temperature)+'°C');
    add('weather-range','최저 '+Math.round(cache.min)+'° · 최고 '+Math.round(cache.max)+'°');
    const updated=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(cache.updated));
    add('weather-updated',(stale?'저장된 날씨 · ':'갱신 ') + updated);
    el.title=label+' · 해당 도시 현재 기온 · 오늘 최저/최고 예보';
  }
  async function refresh() {
    if(pending)return;
    const date=japanDate(),city=cityForDate(date);
    const valid=cache?.city===city.name&&cache?.date===date;
    const age=valid?Date.now()-cache.updated:Infinity;
    paint(city,date,age>=15*60*1000);
    if(age<15*60*1000)return;
    pending=true;
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
    try {
      const params=new URLSearchParams({latitude:city.lat,longitude:city.lon,current:'temperature_2m,weather_code,is_day',daily:'temperature_2m_max,temperature_2m_min',timezone:'Asia/Tokyo',forecast_days:'1'});
      const response=await fetch('https://api.open-meteo.com/v1/forecast?'+params,{signal:controller.signal});
      if(!response.ok)throw new Error('Weather unavailable');
      const data=await response.json();
      const next={city:city.name,date,temperature:data.current?.temperature_2m,code:data.current?.weather_code,isDay:data.current?.is_day,min:data.daily?.temperature_2m_min?.[0],max:data.daily?.temperature_2m_max?.[0],updated:Date.now()};
      if(data.daily?.time?.[0]!==date||!data.current?.time?.startsWith(date)||![next.temperature,next.code,next.min,next.max].every(Number.isFinite))throw new Error('Invalid weather');
      if(japanDate()!==date)return;
      cache=next;try{localStorage.setItem('kansai-weather',JSON.stringify(cache))}catch{}
      paint(city,date);
    }catch{paint(cityForDate(japanDate()),japanDate(),true)}
    finally{clearTimeout(timer);pending=false}
  }
  refresh();setInterval(refresh,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  window.addEventListener('online',refresh);
})();
