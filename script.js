
/* ========= BASIS ========= */

/* FIX: snowAccum moet bestaan vóór resize() wordt uitgevoerd */
let snowAccum = [];

const bg=document.getElementById("bg"),
      fx=document.getElementById("fx"),
      bctx=bg.getContext("2d"),
      fctx=fx.getContext("2d"),
      santa=document.getElementById("santa"),
      text=document.getElementById("text"),
      credits=document.getElementById("credits"),
      countdown=document.getElementById("countdown"),
      partyBtn=document.getElementById("partyBtn"),
      outroBtn=document.getElementById("outroBtn"),
      music=document.getElementById("music"),
      boom=document.getElementById("boom"),
      bell=document.getElementById("bell"),
      startOverlay=document.getElementById("startOverlay"),
      fadeOverlay=document.getElementById("fadeOverlay");

function resize(){
    bg.width = fx.width = innerWidth;
    bg.height = fx.height = innerHeight;

    // snowAccum veilig opnieuw aanmaken
    snowAccum = new Array(innerWidth).fill(0);
}
resize();
addEventListener("resize", resize);

/* ========= MODES ========= */
let audioUnlocked=false;
let partyMode=false;
let outroStarted=false;
let slowMotion=false;
let glitter=[];

/* ========= START ========= */
startOverlay.onclick=()=>{
    startOverlay.style.display="none";
    audioUnlocked=true;

    connectAudio();
    audioCtx.resume();

    music.currentTime=0;
    music.volume=1;
    music.play().catch(()=>{});

    setTimeout(()=>document.body.classList.add("show"),50);
    setTimeout(()=>credits.classList.add("show"),1500);
};

/* ========= PARTY TOGGLE ========= */
partyBtn.onclick=()=>{
    partyMode=!partyMode;
    if(partyMode){
        partyBtn.textContent="Party mode: AAN";
        partyBtn.classList.add("on");
    }else{
        partyBtn.textContent="Party mode: UIT";
        partyBtn.classList.remove("on");
    }
};

/* ========= OUTRO ========= */
function startOutro(){
    if(outroStarted) return;
    outroStarted=true;

    // Slow motion
    setTimeout(()=>{ slowMotion = true; }, 3500);
    setTimeout(()=>{ slowMotion = false; }, 6500);

    // Muziek fade-out
    let vol = music.volume;
    const fade = setInterval(()=>{
        vol -= 0.02;
        if(vol <= 0){
            vol = 0;
            clearInterval(fade);
        }
        music.volume = vol;
    }, 50);

    // Tekst & credits fade-out
    text.style.transition = "opacity 2s";
    text.style.opacity = 0;
    credits.style.transition = "opacity 2s";
    credits.style.opacity = 0;

    // Sneeuw stopt
    snow.forEach(f => f.vy = 0);

    // Bel meerdere keren
    let bellCount = 0;
    const bellInterval = setInterval(()=>{
        bell.currentTime = 0;
        bell.play();
        bellCount++;
        if(bellCount >= 5) clearInterval(bellInterval);
    }, 700);

    // Finale vuurwerk
    setTimeout(()=>{
        for(let i=0; i<12; i++){
            setTimeout(()=>{
                rockets.push({
                    x: innerWidth * (0.1 + Math.random()*0.8),
                    y: bg.height * 0.95,
                    vy: -12 - Math.random()*4,
                    target: innerHeight * (0.2 + Math.random()*0.3)
                });
                boom.currentTime = 0;
                boom.play();
            }, i * 200);
        }
    }, 1500);

    // Fade naar goud/wit
    setTimeout(()=>{
        fadeOverlay.style.background = "linear-gradient(180deg, gold, white)";
        fadeOverlay.style.opacity = 1;
    }, 4200);

    // Grote knal + camera shake
    setTimeout(()=>{
        rockets.push({
            x: innerWidth/2,
            y: bg.height*.95,
            vy: -16,
            target: innerHeight*0.25
        });
        boom.currentTime = 0;
        boom.play();

        document.body.classList.add("shake");
        setTimeout(()=>document.body.classList.remove("shake"),700);
    }, 4500);

    // Fade overlay terug
    setTimeout(()=>{
        fadeOverlay.style.opacity = 0;
    }, 6000);

    // Glitterregen
    setTimeout(()=>{
        const glitterInterval = setInterval(()=>{
            spawnGlitter();
        }, 200);
        setTimeout(()=>clearInterval(glitterInterval), 3000);
    }, 5000);

    // Nieuwjaar-tekst
    setTimeout(()=>{
        const msg = document.createElement("div");
        msg.innerHTML = "🎆 Gelukkig Nieuwjaar! 🎆";
        msg.style.position = "absolute";
        msg.style.top = "40%";
        msg.style.width = "100%";
        msg.style.textAlign = "center";
        msg.style.fontSize = "4em";
        msg.style.color = "gold";
        msg.style.fontFamily = "'Dancing Script', cursive";
        msg.style.opacity = 0;
        msg.style.transition = "opacity 3s";
        msg.style.zIndex = 9999;
        document.body.appendChild(msg);

        setTimeout(()=> msg.style.opacity = 1, 50);
    }, 5000);
}

outroBtn.onclick = startOutro;

// Simulatie via toets "o"
addEventListener("keydown",e=>{
    if(e.key.toLowerCase() === "o") startOutro();
});

/* ========= AUDIO ANALYSER ========= */
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
const analyser=audioCtx.createAnalyser();
analyser.fftSize=256;

let sourceConnected=false;
let dataArray=new Uint8Array(analyser.frequencyBinCount);

function connectAudio(){
    if(sourceConnected) return;
    const source=audioCtx.createMediaElementSource(music);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    sourceConnected=true;
}

/* ========= BEAT DETECTIE ========= */
let beatStrength = 0;
let highKick = 0;

function detectBeat(){
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const avg = sum / dataArray.length || 0;

    beatStrength = beatStrength * 0.8 + (avg / 255) * 0.2;

    let high = 0;
    const start = Math.floor(dataArray.length * 0.6);
    for(let i = start; i < dataArray.length; i++){
        high += dataArray[i];
    }
    high /= (dataArray.length - start);
    highKick = high / 255;
}

/* ========= SANTA ========= */
const SANTA_HEIGHT=180;

function updateSanta(t){
    const santaX = innerWidth * 0.5;

    const ix = Math.max(0, Math.min(innerWidth - 1, Math.floor(santaX)));
    const hillBase = bg.height * hills[0].y + Math.sin(santaX * .01 + t * .5) * hills[0].amp;
    const snowTop = hillBase - (snowAccum[ix] || 0);

    let santaY = snowTop - SANTA_HEIGHT + 14;
    santaY = Math.max(innerHeight * .35, Math.min(innerHeight - SANTA_HEIGHT - 5, santaY));

    santa.style.left = santaX + "px";
    santa.style.top = santaY + "px";

    const DANCE_POWER = 18;
    const kick = highKick * 35;
    const danceOffset = Math.sin(t * 12) * DANCE_POWER * beatStrength - kick;

    santa.style.setProperty(
        "transform",
        `translateX(-50%) translateY(${danceOffset}px)`,
        "important"
    );

    if(beatStrength > 0.15) santa.classList.add("disco");
    else santa.classList.remove("disco");

    if(beatStrength > 0.15) text.classList.add("beat");
    else text.classList.remove("beat");
}

/* ========= COUNTDOWN ========= */
function updateCountdown(){
    const now=new Date();
    const year=now.getMonth()===11?now.getFullYear()+1:now.getFullYear();
    const target=new Date(year,0,1);
    const diff=target-now;

    if(diff<=0){
        countdown.textContent="🎆 Gelukkig Nieuwjaar!";
        startOutro();
        return;
    }
    const d=Math.floor(diff/86400000);
    const h=Math.floor(diff/3600000)%24;
    const m=Math.floor(diff/60000)%60;
    const s=Math.floor(diff/1000)%60;
    countdown.textContent=`Nog ${d}d ${h}u ${m}m ${s}s`;
}
setInterval(updateCountdown,1000); updateCountdown();

/* ========= STERREN ========= */
const stars=[...Array(500)].map(()=>({
    x:Math.random()*innerWidth,
    y:Math.random()*innerHeight,
    r:Math.random()*1.5,
    t:Math.random()*6
}));

/* ========= SNEEUW ========= */
const snow=[...Array(180)].map(()=>({
    x:Math.random()*innerWidth,
    y:Math.random()*innerHeight,
    vy:1+Math.random()*1.2,
    vx:(Math.random()-.5)*.4,
    r:Math.random()*Math.PI,
    s:4+Math.random()*5
}));

/* ========= HEUVELS ========= */
const hills=[
    {y:.78,amp:40,color:"#e6f2ff"},
    {y:.86,amp:60,color:"#d4e8ff"},
    {y:.92,amp:80,color:"#c0dcff"}
];

/* ========= VUURWERK ========= */
let rockets=[],particles=[],lastBoom=0;

addEventListener("pointerdown",e=>{
    if(!audioUnlocked || outroStarted) return;
    if(Date.now()-lastBoom<150) return;
    lastBoom=Date.now();
    rockets.push({x:e.clientX,y:bg.height*.95,vy:-12,target:e.clientY});
    boom.currentTime=0; boom.play();
});

/* ========= GLITTER ========= */
function spawnGlitter(){
    for(let i=0;i<40;i++){
        glitter.push({
            x: Math.random()*innerWidth,
            y: -20,
            vy: 2 + Math.random()*3,
            size: 2 + Math.random()*3,
            hue: Math.random()*360,
            life: 200 + Math.random()*100
        });
    }
}

/* ========= LOOP ========= */
let t=0;
function loop(){
    t += slowMotion ? 0.006 : 0.016;

    if(audioUnlocked) detectBeat();
    updateSanta(t);

    /* hemel */
    let g;
    if(partyMode){
        const flash = Math.min(beatStrength * 200, 80);
        const R = flash;
        const Gc = 16 + flash * 0.6;
        const B = 48 + flash * 0.3;

        g = bctx.createLinearGradient(0,0,0,bg.height);
        g.addColorStop(0, `rgb(${R}, ${Gc}, ${B})`);
        g.addColorStop(1, `rgb(${R*0.2}, ${Gc*0.2}, ${B*0.2})`);
    }else{
        const pulse = 20 * beatStrength;
        g = bctx.createLinearGradient(0,0,0,bg.height);
        g.addColorStop(0,`rgb(${pulse},${16+pulse},${48+pulse})`);
        g.addColorStop(1,`rgb(${2+pulse},${2+pulse},${16+pulse})`);
    }
    bctx.fillStyle=g;
    bctx.fillRect(0,0,bg.width,bg.height);

    /* sterren */
    stars.forEach(s=>{
        s.t+=.02;
        bctx.fillStyle=`rgba(255,255,255,${.4+Math.sin(s.t)*.4})`;
        bctx.beginPath();
        bctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        bctx.fill();
    });

    /* sneeuw */
    const stormFactor = partyMode ? 1 + beatStrength * 3 : 1 + beatStrength * 0.5;

    snow.forEach(f=>{
        f.y += f.vy * stormFactor;
        f.x += f.vx * stormFactor;

        const ix=Math.floor(f.x);
        const hillY=bg.height*hills[0].y+Math.sin(f.x*.01+t*.5)*hills[0].amp;
        if(f.y>=hillY-(snowAccum[ix]||0)){
            if(ix>=0 && ix<snowAccum.length){
                snowAccum[ix]=(snowAccum[ix]||0)+.6;
            }
            f.y=-10; f.x=Math.random()*innerWidth;
        }
        bctx.strokeStyle="rgba(255,255,255,.8)";
        bctx.beginPath();
        for(let i=0;i<6;i++){
            const a=i*Math.PI/3+f.r;
            bctx.moveTo(f.x,f.y);
            bctx.lineTo(f.x+Math.cos(a)*f.s,f.y+Math.sin(a)*f.s);
        }
        bctx.stroke();
    });

    /* heuvels */
    hills.forEach(h=>{
        bctx.fillStyle=h.color;
        bctx.beginPath();
        bctx.moveTo(0,bg.height);
        for(let x=0;x<=bg.width;x+=20){
            bctx.lineTo(x,bg.height*h.y+Math.sin(x*.01+t*.5)*h.amp);
        }
        bctx.lineTo(bg.width,bg.height);
        bctx.fill();
    });

    /* vuurwerk */
    fctx.clearRect(0,0,fx.width,fx.height);

    rockets.forEach((r,i)=>{
        r.y+=r.vy;
        fctx.fillStyle="white";
        fctx.fillRect(r.x,r.y,3,8);

        if(r.y<r.target){
            rockets.splice(i,1);

            const rings=3;
            for(let ring=1;ring<=rings;ring++){
                const count=24+ring*24;
                const speed=2+ring*1.2;
                const size=2+ring*.8;

                for(let a=0;a<count;a++){
                    const rad=a*2*Math.PI/count;
                    particles.push({
                        x:r.x,
                        y:r.y,
                        vx:Math.cos(rad)*speed*(.8+Math.random()*.4),
                        vy:Math.sin(rad)*speed*(.8+Math.random()*.4),
                        life:60+Math.random()*30,
                        size:size,
                        hue:Math.random()*360
                    });
                }
            }
        }
    });

    particles.forEach((p,i)=>{
        p.x+=p.vx;
        p.y+=p.vy;
        p.life--;
        const a=p.life/80;
        fctx.fillStyle=`hsla(${p.hue},100%,70%,${a})`;
        fctx.beginPath();
        fctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        fctx.fill();
        if(p.life<=0) particles.splice(i,1);
    });

    /* Glitterregen */
    glitter.forEach((glt,i)=>{
        glt.y += glt.vy;
        glt.life--;
        fctx.fillStyle = `hsla(${glt.hue},100%,70%,${glt.life/300})`;
        fctx.beginPath();
        fctx.arc(glt.x, glt.y, glt.size, 0, Math.PI*2);
        fctx.fill();
        if(glt.life <= 0) glitter.splice(i,1);
    });

    requestAnimationFrame(loop);
}
loop();

/* Failsafe fade-in */
setTimeout(()=>document.body.classList.add("show"),300);
