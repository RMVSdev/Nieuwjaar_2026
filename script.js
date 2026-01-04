
//console.log("🔥 NIEUWE SCRIPT.JS LOOPT 🔥");
//console.log("🎅 drawSanta()");

//console.log("SCRIPT LOADED");





/* ============================================================
   CANVAS & DOM
============================================================ */
const bg = document.getElementById("bg");
const ctx = bg.getContext("2d");

const textEl = document.getElementById("text");
const creditsEl = document.getElementById("credits");
const startOverlay = document.getElementById("startOverlay");

const musicEl = document.getElementById("music");

/* ============================================================
   STATE
============================================================ */
let t = 0;
let partyActive = false;
let partyBlend = 0;

let audioCtx = null;
let analyser = null;
let beat = 0;
let beatEnv = 0;

let partySequenceStarted = false;
let countdownRunning = false;
let finaleStarted = false;

const wait = ms => new Promise(r => setTimeout(r, ms));


/* ============================================================
   SANTA
============================================================ */

let santaFadeIn = false;
let partyStartTime = 0;

let santaVisible = false;     // is hij überhaupt te zien
let santaReveal = 0;         // opduiken (klik 1)
let santaDancing = false;    // dansen (klik 2)
let spotlightActive = false;
let santaAlpha = 0;


/* ============================================================
   SANTA (CANVAS SPRITE)
============================================================ */
const santaImg = new Image();
santaImg.src = "assets/santa.png";
let santaReady = false;

santaImg.onload = () => santaReady = true;

const santa = {
    x: 0,
    y: 0,
    drawX: 0,
    drawY: 0,
    rot: 0
};

/* ============================================================
   SCENE
============================================================ */
let stars = [];
let hills = [];
let snow = [];
let snowAccum = [];

/* ============================================================
   Fireworks
============================================================ */
let fireworks = [];
let fireParticles = [];

let fireworksActive = false;
let showPhase = 0;
// 0 = nog niet gestart
// 1 = teksten + "KLAAR… ?"
// 2 = party gestart
let fireworkTimer = null;
let fireworksPhase = 0;
// 0 = uit
// 1 = gewone rockets (boom.mp3)
// 2 = finale (finaleboom.mp3, geen rockets)

let bassboomTriggered = false;
let bassboomScheduled = false;



/* ============================================================
   Finale Vuurwerk
============================================================ */

let finaleActive = false;
let finaleStartTime = 0;
let finaleTimer = null;

/* ============================================================
   Confetti
============================================================ */

let confetti = [];
let confettiActive = false;
let confettiStartTime = 0;
let confettiSpawnRate = 1; // start vol


/* ============================================================
   Pauzetoetsen voor debug
============================================================ */

let paused = false;





//console.log("drawSanta", santa.drawX, santa.drawY);
//console.trace("startCountdown called");


/* ============================================================
   HELPERS
============================================================ */
//const wait = ms => new Promise(r => setTimeout(r, ms));

function fadeOut(element, duration = 500) {
    return new Promise(resolve => {
        const start = performance.now();

        function tick(now) {
            const t = Math.min((now - start) / duration, 1);
            element.style.opacity = 1 - t;

            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(tick);
    });
}



async function startCountdown(seconds) {
   
    console.log("⏳ startCountdown Enter");
    if (countdownRunning) return;
    countdownRunning = true;

    

    const container = document.getElementById("countdown");
    const el = document.getElementById("countdownInner");

    if (!container || !el) return;

    container.style.opacity = 1;
    el.style.transform = "scale(1)";
    el.style.color = "white";

    for (let i = seconds; i >= 0; i--) {
        const isGo = i === 0;

        el.textContent = isGo ? "GO!" : i;
        el.style.color = isGo ? "#ff2a2a" : pastelCountdownColor(i, seconds);

    if (isGo) {
        console.count("GO triggered");
    }




        if (!isGo) {
            el.style.transition = "transform 180ms ease-out";
            el.style.transform = `scale(${1 + beatEnv * 0.18})`;
            await wait(1000);
            el.style.transform = "scale(1)";
        } else {
            // GO impact
            el.style.transition = "transform 260ms ease-out";
            el.style.transform = "scale(2.4)";
            await wait(360);

            // GO explosie

            el.style.transition = "transform 620ms cubic-bezier(.15,.8,.15,1)";
            el.style.transform = "scale(8)";
            await wait(500);
        }
    }

    // fade parent (1×, gegarandeerd)
    container.style.transition = "opacity 500ms ease-out";
    container.style.opacity = 0;
    await wait(500);

    el.textContent = "";
    countdownRunning = false;
}


function resize(){
    bg.width = innerWidth;
    bg.height = innerHeight;
    snowAccum = new Array(bg.width).fill(0);
}

window.addEventListener("resize", resize);

function lerp(a,b,t){ return a + (b-a)*t; }


//let partySequenceStarted = false;

async function startPartyToFinaleSequence() {
    if (partySequenceStarted) return;
    partySequenceStarted = true;

    console.log("▶ party → finale sequence start");

    // party loopt even
    await wait(30000);

    // aankondiging
    await showText("Hier komt de lap!");
    await wait(1200);
    await hideText();

    // countdown
    await startCountdown(10);

    // 💥 finale — EXACT ÉÉN KEER
  //  startFinale();

  startFinaleFireworks();


}



function fadeOutMusic(duration = 18000) {
    const start = performance.now();
    const startVol = musicEl.volume;

    function step(now) {
        const p = Math.min((now - start) / duration, 1);
        musicEl.volume = startVol * (1 - p);

        if (p < 1) {
            requestAnimationFrame(step);
        } else {
            musicEl.pause();
            musicEl.volume = startVol;
        }
    }
    requestAnimationFrame(step);
}


function showNewYearText() {
    textEl.innerHTML = "✨ Gelukkig nieuwjaar ✨";

    // reset alles
    textEl.className = "";
    textEl.style.opacity = 0;
    textEl.style.display = "block";

    // 🔥 force reflow zodat animatie opnieuw start
    void textEl.offsetHeight;

    // stijl + animatie
    textEl.classList.add("glowText", "newyear");
    textEl.classList.add("breathe");
    textEl.style.opacity = 1;
    textEl.style.zIndex = 2000;
}


function spawnConfetti() {
    for (let i = 0; i < 120 * confettiSpawnRate; i++) {

   confetti.push({
    x: Math.random() * bg.width,
    y: -20,
    vy: 0.6 + Math.random() * 1.4,
    vx: (Math.random() - 0.5) * 1.2,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.06,
    hue: Math.random() * 360,
    life: 360,
    maxLife: 360
});

    }
}

function updateConfetti() {
    confetti.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.vr;
        c.life -= 0.8;   // was 1
    });

    confetti = confetti.filter(c => c.life > 0);
}

function drawConfetti() {
    ctx.save();

    // 🔒 canvas reset
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";

    confetti.forEach(c => {
        const alpha = c.life / c.maxLife;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);

        // 🌈 expliciet HSL
        ctx.fillStyle = `hsl(${c.hue}, 100%, 60%)`;
        ctx.globalAlpha = alpha;

        ctx.fillRect(-5, -5, 10, 10);

        ctx.restore();
    });

    ctx.restore();
}





function pastelCountdownColor(step, max) {
    const t = 1 - step / max; // 0 → 1

    // pastel wit → pastel rood
    const r = Math.round(lerp(255, 255, t));
    const g = Math.round(lerp(255, 140, t));
    const b = Math.round(lerp(255, 140, t));

    return `rgb(${r},${g},${b})`;
}





function drawSpotlight(x, y){
    const radius = 220 + beatEnv * 120;

    const g = ctx.createRadialGradient(
        x, y, 0,
        x, y, radius
    );

    g.addColorStop(0, "rgba(255,255,230,0.35)");
    g.addColorStop(0.35, "rgba(255,220,200,0.18)");
    g.addColorStop(0.6, "rgba(180,140,255,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}



// textbehandeling -------------------------
async function showText(msg){
    textEl.textContent = msg;
    textEl.style.opacity = 1;
}

async function hideText(){
    textEl.style.opacity = 0;
    await wait(1200);
}

async function showCredits(txt){
    creditsEl.textContent = txt;

    // start rechts buiten beeld
  //  creditsEl.style.transition = "none";
    creditsEl.style.transform = "translateX(120vw)";
    creditsEl.style.opacity = 1;

    // force reflow
    creditsEl.getBoundingClientRect();

    // vlieg naar midden
//    creditsEl.style.transition =
//        "transform 3s cubic-bezier(0.16,1,0.3,1), opacity 2s ease";
    creditsEl.style.transform = "translateX(-50%)";

    await wait(3000);
}

async function hideCredits(){
    creditsEl.style.transform = "translateX(-140vw)";
    creditsEl.style.opacity = 0;
    await wait(2200);
}




/* ============================================================
   AUDIO
============================================================ */
function connectAudio(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;

    const src = audioCtx.createMediaElementSource(musicEl);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);
}

function detectBeat(){
    if(!analyser){ beat = 0; return; }
    const d = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(d);

    let bass = 0;
    for(let i=0;i<40;i++) bass += d[i];
    beat = Math.min((bass/40)/255*1.6,1);
    beatEnv = Math.max(beatEnv * 0.9, beat);
}

/* ============================================================
   SCENE INIT
============================================================ */
function initScene(){
    stars = Array.from({length:120},()=>({
        x:Math.random()*bg.width,
        y:Math.random()*bg.height*0.6,
        r:0.5+Math.random()*1,
        t:Math.random()*Math.PI*2
    }));

    hills = [{ y:0.75, baseAmp:40, color:"#4b2b82" }];

    snow = Array.from({length:240},()=>({
        x:Math.random()*bg.width,
        y:Math.random()*bg.height,
        vy:0.6+Math.random()*0.8,
        r:Math.random()*Math.PI*2,
        s:4+Math.random()*4,
        hue:Math.random()*360
    }));
}

/* ============================================================
   GEOMETRY
============================================================ */
function getHillY(x){
    const h = hills[0];
    const partyAmp = h.baseAmp + Math.sin(t*2)*12 + beat*22;
    const amp = lerp(h.baseAmp, partyAmp, partyBlend);
    return bg.height*h.y + Math.sin(x*0.01 + t)*amp;
}

/* ============================================================
   DRAW
============================================================ */


function drawBackground(){
    const g = ctx.createLinearGradient(0,0,0,bg.height);
    g.addColorStop(0,"rgb(12,12,30)");
    g.addColorStop(1,"rgb(5,5,15)");

    if(partyBlend>0){
        const pulse = Math.sin(t*0.4)*0.15;
        g.addColorStop(0,`rgba(60,30,90,${(0.45+pulse)*partyBlend})`);
        g.addColorStop(1,`rgba(0,0,0,${(0.7+pulse)*partyBlend})`);
    }

    ctx.fillStyle = g;
    ctx.fillRect(0,0,bg.width,bg.height);
}

/* ============================================================
   Fireworks helpers
============================================================ */

function launchFirework(){
    spawnFirework();
}

function triggerBassboom() {
    if (bassboomTriggered) return;
    bassboomTriggered = true;

    console.log("💥 BASSBOOM");

    // audio
    const bass = document.getElementById("bassboom");
    bass.currentTime = 0;
    bass.play();

    // MASSIEVE EXPLOSIE (centrum)
    const x = bg.width / 2;
    const y = bg.height * 0.35;

    explodeFirework(x, y, true);

    // schermschok
    const layers = document.querySelectorAll("#bg, #fx, #creditsTrail");
    layers.forEach(l => l.classList.add("shake"));

    setTimeout(() => {
        layers.forEach(l => l.classList.remove("shake"));
        }, 600);


    // confetti iets later
    setTimeout(() => {
    confettiActive = true;
    confettiStartTime = performance.now();
    spawnConfetti();          // 🔥 1 burst
    showNewYearText();
}, 600);

}


function startFinaleFireworks() {
    console.log("🔥 FINALE START");

    finaleActive = true;
    finaleStartTime = performance.now();

    // stop losse pijlen (fase 1)
    clearInterval(fireworkTimer);

    // start finale audio
    const finaleBoom = document.getElementById("finaleboom");
    finaleBoom.currentTime = 0;
    finaleBoom.play();

    // vuurwerkregen
    finaleTimer = setInterval(() => {
        // meerdere pijlen tegelijk
        for (let i = 0; i < 3; i++) {
            spawnFirework(true); // true = finale
        }
    }, 450); // snelle regen
}

function startFinale() {
    if (finaleStarted) return;
    finaleStarted = true;

    console.log("🔥 FINALE START");

    // stop party vuurwerk
    clearInterval(fireworkTimer);

    // 💥 bassboom (geluid + effect)
    triggerBassboom();

    // 🎆 zichtbare finale-pijlen
    for (let i = 0; i < 6; i++) {
        setTimeout(spawnFirework, i * 250);
    }

    // 🚀 doorlopend heftig vuurwerk
    fireworkTimer = setInterval(() => {
        spawnFirework();
    }, 600);
}



function spawnFinaleExplosion() {
    const x = bg.width * (0.1 + Math.random() * 0.8);
    const y = bg.height * (0.15 + Math.random() * 0.45);

    explodeFirework(x, y, true); // true = finale
}


function spawnFirework(){
    // startpositie vd rockets
    const x = bg.width * (0.2 + Math.random() * 0.6);
    const ix = Math.floor(x);
    const y = getHillY(x) - (snowAccum[ix] || 0) + 6; // net op de sneeuwrand


    fireworks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: - (8 + Math.random() * 3),
        exploded: false,
        fuse: 0
    });

    // schel geluid bij vertrek
    const boom = document.getElementById("boom");
    boom.currentTime = 0;
    boom.play();
}


function updateFireworks(){
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const f = fireworks[i];

        if (!f.exploded) {
            f.x += f.vx;
            f.y += f.vy;
            f.vy += 0.04;

            if (f.vy > -3 || f.y < bg.height * 0.25) {
                // 💥 explodeert
                explodeFirework(f.x, f.y);

                // ❌ rocket weg
                fireworks.splice(i, 1);
            }
        }
    }
}


function drawFireworks(){
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;

    fireworks.forEach(f => {
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x - f.vx * 3, f.y - f.vy * 3);
        ctx.stroke();
    });

    ctx.restore();
}


function updateFireParticles() {
    fireParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        p.radius += 0.8 + p.ring * 0.25;
        p.life--;
    });

    fireParticles = fireParticles.filter(p => p.life > 0);
}


function drawFireParticles() {
    fireParticles.forEach(p => {

        const alpha = p.life / p.maxLife;

        ctx.strokeStyle =
            `hsla(${p.hue},100%,70%,${alpha})`;

        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
}


function explodeFirework(x, y, isFinale = false) {
    const rings = 6 + Math.floor(Math.random() * 3); // 6–8 ringen
  //  const particlesPerRing = 42;                     // dichter
const ringCount = isFinale
    ? Math.floor(9 + Math.random() * 4)   // 9–12 ringen
    : Math.floor(5 + Math.random() * 3);

const particlesPerRing = isFinale ? 18 : 14;

for (let r = 0; r < ringCount; r++) {

    const baseSpeed = 1.4 + r * 0.6;
    const hueBase = Math.random() * 360;

    for (let i = 0; i < particlesPerRing; i++) {

        const angle = (i / particlesPerRing) * Math.PI * 2;

        fireParticles.push({
            x,
            y,
            vx: Math.cos(angle) * baseSpeed,
            vy: Math.sin(angle) * baseSpeed,
            life: isFinale ? 120 : 90,
            maxLife: isFinale ? 120 : 90,

            hue: (hueBase + r * 28) % 360,
            ring: r,
            radius: 0
        });
    }
}


}

// einde Fireworks helper







/* test vignette -----------------*/
function drawVignette(strength = 0.5){
    const g = ctx.createRadialGradient(
        bg.width / 2,
        bg.height * 0.55,
        bg.height * 0.3,
        bg.width / 2,
        bg.height * 0.55,
        bg.height * 0.9
    );

    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1,
        `rgba(10,0,20,${strength})`
    );

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, bg.width, bg.height);
}


function drawStars(){
    stars.forEach(s=>{
        s.t+=0.02;
        ctx.fillStyle=`rgba(255,200,255,${0.35+Math.sin(s.t)*0.35})`;
        ctx.beginPath();
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fill();
    });
}

function drawHills(){
    hills.forEach(h=>{
        ctx.fillStyle=h.color;
        ctx.beginPath();
        ctx.moveTo(0,bg.height);
        for(let x=0;x<=bg.width;x+=20){
            ctx.lineTo(x,getHillY(x));
        }
        ctx.lineTo(bg.width,bg.height);
        ctx.fill();
    });
}

function updateSnow(){
    snow.forEach(f=>{
        f.y+=f.vy*(partyBlend>0?1.6:1);
        const ix=Math.floor(f.x);
        if(ix<0||ix>=snowAccum.length) return;

        const hillY=getHillY(f.x)-(snowAccum[ix]||0);
        if(f.y>hillY){
            for(let dx=-2;dx<=2;dx++){
                const j=ix+dx;
                if(j>=0&&j<snowAccum.length)
                    snowAccum[j]=Math.min(snowAccum[j]+0.6,80);
            }
            f.y=-10;
            f.x=Math.random()*bg.width;
        }
    });

    if(partyActive){
        for(let i=0;i<snowAccum.length;i++)
            snowAccum[i]=Math.max(snowAccum[i]-0.02,0);
    }
}

function drawSnow(){
    snow.forEach(f=>{
        if(partyActive) f.hue=(f.hue+2)%360;
        ctx.strokeStyle = partyActive
            ? `hsla(${f.hue},100%,75%,0.6)`
            : "rgba(255,255,255,0.6)";
        ctx.beginPath();
        for(let i=0;i<6;i++){
            const a=i*Math.PI/3+f.r;
            ctx.moveTo(f.x,f.y);
            ctx.lineTo(f.x+Math.cos(a)*f.s,f.y+Math.sin(a)*f.s);
        }
        ctx.stroke();
    });
}

function drawSnowAccum(){
    ctx.fillStyle = "rgba(255,255,255,0.93)";
    ctx.beginPath();

    let prevY = null;

    for(let x = 0; x <= bg.width; x += 0.5){   // 👈 FIJNER
        const d = snowAccum[Math.floor(x)] || 0;
        let y = getHillY(x) - d;

        if(prevY !== null){
            y = prevY * 0.8 + y * 0.2;        // 👈 MEER smoothing
        }
        prevY = y;

        if(x === 0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    }

    for(let x = bg.width; x >= 0; x -= 2){
        ctx.lineTo(x, getHillY(x));
    }

    ctx.closePath();
    ctx.fill();
}


function drawSanta(){
    if(!santaReady) return;

    const w = 180;
    const h = santaImg.height * (w / santaImg.width);

    ctx.save();
    ctx.globalAlpha = santaAlpha;   // 👈 fade uit donker
    ctx.translate(santa.drawX, santa.drawY);
    ctx.rotate(santa.rot);

    ctx.drawImage(
        santaImg,
        -w / 2,
        -h - 8,
        w,
        h
    );

ctx.restore();
}

console.log("MID SCRIPT");

/* ============================================================
   LOOP
============================================================ */
function loop(){
/*
    console.log("loop draait, fireworks:", fireworks.length);

console.log(
  "phase", showPhase,
  "party", partyActive,
  "fwActive", fireworksActive,
  "fwCount", fireworks.length
); */

/*
console.log(
  "party:", partyActive,
  "spot:", spotlightActive,
  "dance:", santaDancing
);

*/


/*

if (spotlightActive) {
    console.log("⚠️ spotlightActive is TRUE in loop");
}

*/

//  debug ------------------
if (paused) {
        requestAnimationFrame(loop);
        return;
    }

// einde debug -----------------




/* test firework 
  if (fireParticles.length > 0) {
    console.log(
        "particles:",
        fireParticles.length,
        fireParticles[0]
    );
}*/

/* einde test firework*/



 // was en test op rood vierkant cop canvas   
 //  ctx.fillStyle = "red";
 //   ctx.fillRect(0,0,50,50);

   
   
    t+=0.016;
    detectBeat();

    partyBlend += partyActive ? 0.01 : -0.01;
    partyBlend = Math.max(0,Math.min(1,partyBlend));

    drawBackground();
   
  //  drawVignette(partyActive ? 0.35 : 0.65);

//    if(!partyActive) drawVignette(0.55);
//    if(partyActive) drawVignette(0.35);

    drawStars();
    drawHills();

    updateSnow();
    drawSnowAccum();
    drawSnow();

    // Santa position + dance
    const x=bg.width/2;
    const y=getHillY(x)-(snowAccum[Math.floor(x)]||0);

    santa.x=x;
    santa.y=y;

// santa-dance- blok -------------------------------

/*
// 🎅 Santa dance — smooth & musical
if (partyBlend > 0) {

    // beat-envelope: punchy maar smooth
    const kick = Math.pow(beatEnv, 2.2);

    // kleine, gecontroleerde bewegingen
    const maxJump = 26;     // px
    const maxRot  = 0.18;   // rad ≈ 10°

    santa.drawX = x;  // ❗ nooit zijwaarts schuiven
    santa.drawY = y - kick * maxJump * partyBlend;

    // rotatie: zacht + terug naar nul
    santa.rot = kick * maxRot * partyBlend;

} else {
    santa.drawX = x;
    santa.drawY = y;
    santa.rot = 0;
}

*/


// =================================================
// 🎅 SANTA POSITION & OPDUIKEN
// =================================================

const baseX = bg.width / 2;
const ix = Math.floor(baseX);
const baseY = getHillY(baseX) - (snowAccum[ix] || 0);

// X-positie is altijd vast
santa.drawX = baseX;

// OPDUIKEN: alleen na klik 1
if (santaVisible && santaReveal < 1) {
    santaReveal = Math.min(santaReveal + 0.015, 1);
}

// 🎭 fade-in uit het donker
santaAlpha = santaReveal;


// hoe ver Santa nog “onder” zit
const emerge = santaVisible ? (1 - santaReveal) : 1;

// Y-positie (opduiken)
santa.drawY = baseY + emerge * 60;

// 🔴 DEBUG (mag straks weg)
ctx.fillStyle = "red";
ctx.beginPath();
ctx.arc(santa.drawX, santa.drawY, 5, 0, Math.PI * 2);
ctx.fill();

// tekenen
drawSanta();


    if(spotlightActive){
        drawSpotlight(
        santa.drawX,
        santa.drawY - 80
        );
    }

// Fireworks -------------------------------------

// Fireworks -------------------------------------
// Fireworks -------------------------------------
if (fireworksPhase === 2) {

    // regen van explosies
    if (Math.random() < 0.18) {
        const x = bg.width * (0.1 + Math.random() * 0.8);
        const y = bg.height * (0.15 + Math.random() * 0.45);
        explodeFirework(x, y, true);
    }

    // ⛔ finale STOPPEN na 18s
    if (performance.now() - finaleStartTime > 18000) {

        fireworksPhase = 3;              // 🔕 stilte
        fireworksActive = false;         // ⛔ geen nieuwe rockets
        confettiActive = false;          // (nog niet)
        console.log("🔥 FINALE STOP");

        onFinaleEnded();                 // 👉 timing buiten loop
    }
}


// confetti
if (confettiActive) {
    updateConfetti();
    drawConfetti();

    // langzaam minder spawn
    confettiSpawnRate *= 0.985;

    if (confettiSpawnRate < 0.05 && confetti.length === 0) {
        confettiActive = false;
    }
}

// nieuw ------------------
// 🎅 Santa dance — ALLEEN als santaDancing true is
if (santaDancing) {

    const kick = Math.pow(beatEnv, 2.2);

    const maxJump = 26;
    const maxRot  = 0.18;

    santa.drawX = baseX;
    santa.drawY = baseY - kick * maxJump;
    santa.rot   = kick * maxRot;

} else {
    // idle / stil
    santa.drawX = baseX;
    santa.drawY = baseY;
    santa.rot   = 0;
}

// end nieuw ------------------------------------

if (fireworksActive) {
    updateFireworks();
    updateFireParticles();

    drawFireworks();            // zichtbaar
    drawFireParticles();        // explosie
}



    drawVignette(partyActive ? 0.35 : 0.6);
    requestAnimationFrame(loop);
}

// einde loop ----------------------------------

function onFinaleEnded() {

    // ⏱️ 2 seconden stilte na finale
    setTimeout(() => {

        // 💥 BASSBOOM
        fireworksPhase = 4;
        triggerBassboom();     // geluid + shake

        // 🎵 muziek fade-out NA bassboom
        fadeOutMusic(8000);

        // ⏱️ na bassboom → laatste visuele knal + confetti
        setTimeout(() => {

            // 🎆 LAATSTE FINALE EXPLOSIE (éénmalig)
            fireworksActive = true;   // 🔑 belangrijk!
            fireworksPhase = 99;      // speciale visuele fase (maakt niets uit)

            const x = bg.width / 2;
            const y = bg.height * 0.3;
            explodeFirework(x, y, true); // rijk, rainbow

            // 🎊 CONFETTI
            fireworksPhase = 5;
            confettiActive = true;

            showNewYearText(); // “Gelukkig nieuwjaar”

        }, 2000);

    }, 2000);
}



/* ============================================================
   FLOW
============================================================ */

async function runShow() {
    console.log("runShow START");

    resize();
    initScene();
    loop();

    await wait(2000);

    await showText("Beste familie");
    await wait(2000);

    await showText("We wensen jullie een gelukkig nieuw jaar");
    await wait(1800);

    await showCredits("mie en Ciske");
    await hideText();
    await hideCredits();

    await showText("We gaan er nu een lap op geven");
    await wait(1800);
    await hideText();

    await showText("KLAAR… ?");
    
    // 2e klik
    startOverlay.classList.add("active");
    startOverlay.style.display = "block";

    await new Promise(resolve =>
        startOverlay.addEventListener("click", resolve, { once: true })
    );

    startOverlay.style.display = "none";
    await hideText();


    // 🎉 PARTY START
    fireworksActive = true;
    fireworksPhase = 1;

    // ⏱ start countdown → finale sequence
    startPartyToFinaleSequence();
}


// einde runShow

/* ============================================================
   START
============================================================ */
//startOverlay.classList.add("active");
//startOverlay.style.display="block";

startOverlay.addEventListener("click", async () => {

    // =========================
    // KLIK 1 — START SHOW
    // =========================
    if (showPhase === 0) {

        showPhase = 1;

        startOverlay.classList.remove("active");
        startOverlay.style.display = "none";

        connectAudio();
        await audioCtx.resume();

    // 🎅 Santa verschijnt hier (maar danst nog niet!)
        santaVisible = true;
        santaReveal = 0;     // start opduiken
        santaDancing = false;
        spotlightActive = false;

        runShow();
        return;
    }

 
// =========================
// KLIK 2 — PARTY MODE
// =========================
if (showPhase === 1) {

    showPhase = 2;

    startOverlay.classList.remove("active");
    startOverlay.style.display = "none";

    // 🔒 reset ALLES
    partyActive = false;
    spotlightActive = false;
    santaDancing = false;

    // 🎵 muziek
    musicEl.currentTime = 0;
    musicEl.volume = 1;
    musicEl.play();

    console.log("🎵 play()");

    const AUDIO_OFFSET = 1200;

    // 🕺 party aan (maar nog geen dans!)
    partyActive = true;

    // 💡 spotlight
    setTimeout(() => {
        console.log("💡 spotlight ON");
        spotlightActive = true;
    }, 3000 + AUDIO_OFFSET);

    // 🕺 santa dans
    setTimeout(() => {
        console.log("🕺 santa dancing ON");
        santaDancing = true;
    }, 6000 + AUDIO_OFFSET);
}



}); 



/* ============================================================
   DEBUG / CONTROLS
============================================================ */

// pauze-flag (bovenaan in state)
// let paused = false;

window.addEventListener("keydown", e => {
    if (e.code === "Space") {
        paused = !paused;
        console.log(paused ? "⏸️ PAUSED" : "▶️ RESUMED");
    }
});











// einde script
