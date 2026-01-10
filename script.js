/* ============================================================
   SETTING & STATE
============================================================ */
const bg = document.getElementById("bg"),
    ctx = bg.getContext("2d");
const textEl = document.getElementById("text"),
    creditsEl = document.getElementById("credits");
const startOverlay = document.getElementById("startOverlay"),
    musicEl = document.getElementById("music");
const countdownEl = document.getElementById("countdown");

let t = 0,
    partyActive = false,
    partyBlend = 0,
    audioCtx = null,
    analyser = null;
let beat = 0,
    beatEnv = 0,
    showPhase = 0,
    fireworksActive = false,
    fireworksPhase = 0;

// Santa    
let santaVisible = false,
    santaReveal = 0,
    santaDancing = false,
    spotlightActive = false;
let santaReady = false;
// Santa Smoothing voor zijn bewegingen
let santaTargetX = 0;
let santaTargetY = 0;
let santaTargetRot = 0;
let santaSmoothX = 0;
let santaSmoothY = 0;
let santaSmoothRot = 0;
let santaAlpha = 0;

let spotlightFade = 1; // 1 = volledig zichtbaar, 0 = onzichtbaar

// hills - colorshift in party-mode
let hillPulse = 0;
let hillColorShift = 0;

let stars = [],
    hills = [],
    snow = [],
    snowAccum = [],
    fireworks = [],
    fireParticles = [],
    confetti = [];

// Voeg toe bij de andere variabelen (rond regel 50):
//let cheeringActive = false;
//let cheeringStartTime = 0;











    let fireworkTimer,
    finaleStartTime,
    confettiActive = false,
    confettiSpawnRate = 1;

let particlesAllFaded = false;
let fadeCheckInterval = null;

/* Replay-button ****************** */
let replayButtonShown = false;
let showComplete = false;
let animationId = null;
/* ************************************** */ 




let lastFinaleExplosion = 0;

  
//    let snowAccumSmooth = [];
//    const SNOW_BIN = 8;
//    let snowBins = [];
   
//let hillEnergy = 0;
//let hillFlash = 0;
let santaEnergy = 0;

const santaImg = new Image();
santaImg.src = "assets/santa.png";
const santa = {
    x: 0,
    y: 0,
    drawX: 0,
    drawY: 0,
    rot: 0
};


function drawSanta(){
    if(!santaReady) return;

    const w = 180;
    const h = santaImg.height * (w / santaImg.width);

    ctx.save();
    ctx.globalAlpha = santaAlpha;   // đ fade uit donker
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


const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lerp = (a, b, t) => a + (b - a) * t;



/* ============================================================
   Play cheering sound
============================================================ */

function playCheeringSound() {
    console.log("🎊 Playing cheering sound");
    
    const cheeringSound = document.getElementById('cheering');
    
    // Eerst: activeer het visuele effect ZEKER
    cheeringActive = true;
    cheeringStartTime = performance.now();
    
    // Stop cheering na 5 seconden (visueel effect)
    setTimeout(() => {
        cheeringActive = false;
        console.log("🔇 Cheering visual effect ended");
    }, 5000);
    
    // Probeer geluid alleen als het element bestaat
    if (cheeringSound && cheeringSound.src) {
        cheeringSound.currentTime = 0;
        cheeringSound.volume = 0.7;
        
        cheeringSound.play().then(() => {
            console.log("✅ Cheering audio playing");
        }).catch(error => {
            console.warn("⚠️ Cheering audio blocked, continuing with visual only");
        });
    } else {
        console.log("ℹ️ No cheering audio found, using visual effect only");
    }
}

// Helper functie voor smooth fade-out van cheering
function fadeOutCheeringSound(soundElement, fadeDuration = 1000) {
    const startVolume = soundElement.volume;
    const startTime = performance.now();
    
    function fadeStep() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / fadeDuration, 1);
        
        // Exponentiële fade voor smooth result
        const fadeFactor = 1 - Math.pow(progress, 2);
        soundElement.volume = startVolume * fadeFactor;
        
        if (progress < 1) {
            requestAnimationFrame(fadeStep);
        } else {
            // Stop geluid volledig
            soundElement.pause();
            soundElement.currentTime = 0;
            soundElement.volume = 0.8; // Reset voor volgende keer
            console.log("🔇 Cheering sound faded out smoothly");
        }
    }
    
    requestAnimationFrame(fadeStep);
}

// Fallback als cheering sound niet werkt

function playCheeringFallback() {
    console.log("🎊 PLAYING CHEERING FALLBACK");
    
    // ZEKER visueel effect activeren
    cheeringActive = true;
    cheeringStartTime = performance.now();
    
    console.log("✅ Visual cheering effect ACTIVATED");
    
    // Speel 3 zachte bassbooms op verschillende tijden
    const playSoftBassboom = (delay, volume = 0.25) => {
        setTimeout(() => {
            const bassboom = document.getElementById('bassboom');
            if (bassboom) {
                console.log(`   Playing soft bassboom at ${delay}ms (vol: ${volume})`);
                bassboom.volume = volume;
                bassboom.currentTime = 0;
                bassboom.play().catch(e => {
                    // Geen probleem als dit faalt
                });
            }
        }, delay);
    };
    
    // Cheering pattern: 3 zachte bassen
    playSoftBassboom(0, 0.3);
    playSoftBassboom(350, 0.2);
    playSoftBassboom(700, 0.15);
    
    // Stop visueel effect na 5 seconden
    setTimeout(() => {
        cheeringActive = false;
        console.log("🔇 Cheering fallback finished");
    }, 5000);
}
/* ============================================================
   Replay-button
============================================================ */


function showReplayButton() {
    console.log("=== SHOW REPLAY BUTTON ===");
    console.log("replayButtonShown was:", replayButtonShown);
    
    if (replayButtonShown) {
        console.log("Button al getoond, skipping");
        return;
    }
    
    replayButtonShown = true;
    showComplete = true;
    
    // Korte delay om zeker te zijn dat alles klaar is
    setTimeout(() => {
        const replayButton = document.getElementById('replayButton');
        
        if (!replayButton) {
            console.error("❌ CRITICAL: Replay button niet gevonden in DOM!");
            // Maak de button aan als hij niet bestaat
            createReplayButtonFallback();
            return;
        }
        
        console.log("✅ Replay button gevonden, toon hem");
        
        // DEBUG: Toon alle styles voor debugging
        console.log("Button voor show:", {
            display: window.getComputedStyle(replayButton).display,
            opacity: window.getComputedStyle(replayButton).opacity,
            visibility: window.getComputedStyle(replayButton).visibility,
            zIndex: window.getComputedStyle(replayButton).zIndex
        });
        
        // Forceer zichtbaarheid
        replayButton.style.display = 'block';
        replayButton.style.visibility = 'visible';
        replayButton.style.opacity = '0.01'; // Bijna onzichtbaar
        
        // Force reflow
        replayButton.offsetHeight;
        
        // Voeg show class toe
        replayButton.classList.add('show');
        
        // DEBUG na toevoegen
        setTimeout(() => {
            console.log("Button na show class:", {
                classList: replayButton.className,
                computedOpacity: window.getComputedStyle(replayButton).opacity,
                rect: replayButton.getBoundingClientRect()
            });
        }, 50);
        
        // Pulse animatie
        replayButton.style.animation = 'buttonPulse 2s infinite alternate';
        
        console.log("✅ Replay button zou nu zichtbaar moeten zijn");
        
    }, 2000); // 2 seconden wachten
}

// Noodfallback: maak button aan als hij niet bestaat
function createReplayButtonFallback() {
    console.log("🛠️ Maak replay button aan...");
    
    const buttonDiv = document.createElement('div');
    buttonDiv.id = 'replayButton';
    buttonDiv.innerHTML = '<button onclick="restartShow()">Opnieuw afspelen</button>';
    
    // Voeg CSS classes toe
    buttonDiv.className = '';
    
    document.body.appendChild(buttonDiv);
    
    console.log("✅ Button aangemaakt, probeer opnieuw te tonen");
    
    // Probeer opnieuw na korte delay
    setTimeout(() => {
        showReplayButton();
    }, 500);
}


// Voeg pulse animatie toe aan CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes buttonPulse {
        0% { transform: translateX(-50%) scale(1); }
        100% { transform: translateX(-50%) scale(1.05); }
    }
`;
document.head.appendChild(style);

// OPTIE 8: Verbeterde restart met fade-out
function restartShow() {
    console.log("=== RESTART SHOW ===");
    
    // 🔴 FASE 1: Reset de replay button VISUEEL
    const replayButton = document.getElementById('replayButton');
    if (replayButton) {
        console.log("Fase 1: Reset replay button visueel");
        
        // Eerst: fade-out animatie als button zichtbaar is
        if (replayButton.classList.contains('show')) {
            console.log("Button is zichtbaar, start fade-out");
            replayButton.style.transition = 'opacity 0.3s ease-out, visibility 0.3s ease-out';
            replayButton.style.opacity = '0';
            replayButton.style.visibility = 'hidden';
            
            // Wacht tot fade-out klaar is
            setTimeout(() => {
                replayButton.classList.remove('show');
                replayButton.style.animation = '';
                replayButton.style.display = 'none';
                
                // Force reflow
                replayButton.offsetHeight;
                
                // Ga verder met de rest
                continueRestart();
            }, 300);
        } else {
            // Button was al verborgen, ga direct verder
            replayButton.classList.remove('show');
            replayButton.style.display = 'none';
            replayButton.style.visibility = 'hidden';
            replayButton.style.opacity = '0';
            replayButton.style.animation = '';
            
            // Force reflow
            replayButton.offsetHeight;
            
            continueRestart();
        }
    } else {
        // Geen button gevonden, ga direct verder
        console.log("Geen replay button gevonden, ga direct verder");
        continueRestart();
    }
    
    // 🔴 FASE 2: De eigenlijke restart logica
function continueRestart() {
    console.log("Fase 2: Start eigenlijke restart");
    
    // 🔴 Stop animation loop
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // 🔴 RESET ALLE VARIABELEN NAAR BEGINWAARDEN
    t = 0;
    partyActive = false;
    partyBlend = 0;
    showPhase = 0;
    fireworksActive = false;
    fireworksPhase = 0;
    santaVisible = false;
    santaReveal = 0;
    santaDancing = false;
    spotlightActive = false;
    replayButtonShown = false;
    showComplete = false;
    particlesAllFaded = false;
    lastFinaleExplosion = 0;
    confettiActive = false;
    confettiSpawnRate = 1;
    hillPulse = 0;
    hillColorShift = 0;
    santaEnergy = 0;
    santaAlpha = 0;
    
    // 🔴 NIEUW: Zet cheering op false bij restart
    //cheeringActive = false;
        cheeringStartTime = 0;






        // Reset smooth beweging variabelen
        santaSmoothX = bg.width / 2;
        santaSmoothY = 0;
        santaSmoothRot = 0;
        santaTargetX = bg.width / 2;
        santaTargetY = 0;
        santaTargetRot = 0;
        
        // 🔴 Leeg alle particle arrays
        stars = [];
        snow = [];
        snowAccum = new Array(bg.width).fill(0);
        fireworks = [];
        fireParticles = [];
        confetti = [];
        
        // 🔴 Stop alle intervallen
        if (fireworkTimer) {
            clearInterval(fireworkTimer);
            fireworkTimer = null;
        }
        if (fadeCheckInterval) {
            clearInterval(fadeCheckInterval);
            fadeCheckInterval = null;
        }
        
        // 🔴 Reset audio
        if (musicEl) {
            musicEl.pause();
            musicEl.currentTime = 0;
            musicEl.volume = 1;
            console.log("Audio gereset");
        }
        
        // 🔴 Reset tekst elementen
        if (textEl) {
            textEl.innerHTML = '';
            textEl.style.opacity = '0';
            textEl.className = '';
            textEl.style.transition = '';
        }
        
        if (creditsEl) {
            creditsEl.innerHTML = '';
            creditsEl.className = '';
            creditsEl.style.display = 'none';
        }
        
        // 🔴 Reset countdown
        const countdownInner = document.getElementById('countdownInner');
        if (countdownInner) {
            countdownInner.textContent = '';
            countdownInner.style.opacity = '0';
        }
        
        // 🔴 Reset canvas effects
        document.querySelectorAll('#bg, #fx').forEach(el => {
            el.classList.remove('shake');
        });
        
        // 🔴 Reset overlay (start scherm)
        if (startOverlay) {
            startOverlay.style.display = 'none';
            startOverlay.classList.remove('active');
        }
        
        // 🔴 Clear het canvas - teken zwart
        ctx.clearRect(0, 0, bg.width, bg.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, bg.width, bg.height);
        
        // 🔴 Herinitialiseer de scene
        initScene();    // Maakt nieuwe sterren, sneeuw, hills
        resize();       // Zet canvas op juiste grootte
        
        // 🔴 Korte pauze, dan starten
        setTimeout(() => {
            // Start de animation loop opnieuw
            if (!animationId) {
                console.log("Start nieuwe animation loop");
                animationId = requestAnimationFrame(loop);
            }
            
            // Teken direct de scene (achtergrond, sneeuw, hills)
            setTimeout(() => {
                drawScene();
                console.log("Eerste scene getekend na restart");
                
                // Toon het start scherm
                if (startOverlay) {
                    startOverlay.style.display = 'block';
                    startOverlay.classList.add('active');
                    console.log("Overlay getoond - klaar voor klik");
                }
                
                // Debug info
                console.log("Restart compleet. Variabelen:");
                console.log("- showPhase:", showPhase);
                console.log("- santaVisible:", santaVisible);
                console.log("- replayButtonShown:", replayButtonShown);
                console.log("- animationId:", animationId ? "running" : "stopped");
                
            }, 50);
            
        }, 100);
    }
}





// Maak een aparte functie voor de party sequence
async function startPartySequence() {
    await wait(15000);
    await startCountdown(3);
    
    fireworksActive = true;
    fireworksPhase = 1;
    
    // 🚀 4 gewone rockets
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            spawnFirework();
            const boom = document.getElementById("boom");
            if (boom) {
                boom.currentTime = 0;
                boom.play();
            }
        }, i * 2500);
    }
    
    await wait(10200);
    
    fireworksPhase = 2;
    finaleStartTime = performance.now();
    const finaleBoomEl = document.getElementById("finaleboom");
    if (finaleBoomEl) {
        finaleBoomEl.currentTime = 0;
        finaleBoomEl.play();
        
        finaleBoomEl.onended = () => {
            fireworksPhase = 0;
            fireworksActive = false;
            startParticleFadeOut();
        };
    }
}


/* ============================================================
   INITIALISATIE
============================================================ */
function resize() {
    const oldWidth = bg.width;
    const oldSnow = snowAccum;

    bg.width = innerWidth;
    bg.height = innerHeight;

    if (!oldSnow || oldWidth === 0) {
        snowAccum = new Array(bg.width).fill(0);
    } else {
        snowAccum = new Array(bg.width).fill(0);
        const minW = Math.min(oldWidth, bg.width);
        for (let i = 0; i < minW; i++) {
            snowAccum[i] = oldSnow[i];
        }
    }
}





window.addEventListener("resize", resize);
resize();

function initScene() {
    stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * bg.width,
        y: Math.random() * bg.height * 0.6,
        r: 0.5 + Math.random(),
        t: Math.random() * Math.PI * 2,
    }));
    snow = Array.from({ length: 240 }, () => ({
        x: Math.random() * bg.width,
        y: Math.random() * bg.height,
        vy: 0.6 + Math.random() * 0.8,
        r: Math.random() * Math.PI * 2,
        s: 4 + Math.random() * 4,
        hue: Math.random() * 360,
    }));
    hills = [{ y: 0.75, baseAmp: 40, color: "#4b2b82" }];
}





function getHillY(x) {
    if (!hills || !hills.length) {
        return bg.height * 0.75; // veilige fallback
    }

    const h = hills[0];
    const amp = lerp(
        h.baseAmp,
        h.baseAmp + Math.sin(t * 2) * 12 + beat * 22,
        partyBlend
    );

    return bg.height * h.y + Math.sin(x * 0.01 + t) * amp;
}



/* ============================================================
   Text
============================================================ */

function fadeOutText(duration = 400) {
    textEl.style.transition = `opacity ${duration}ms ease-out`;
    textEl.style.opacity = 0;
}

/* ============================================================
   AUDIO & FX
============================================================ */
function connectAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const src = audioCtx.createMediaElementSource(musicEl);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);
}

function playSound(id) {
    console.log("🔊 playSound called for:", id);
    
    const s = document.getElementById(id);
    if (s) {
        console.log("  Audio element found:", s);
        console.log("  Source:", s.src);
        console.log("  Ready state:", s.readyState);
        
        // Reset en speel
        s.currentTime = 0;
        
        // Probeer te spelen met error handling
        const playPromise = s.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("  ✅ Sound playing:", id);
            }).catch(error => {
                console.warn("  ⚠️ Could not play", id, ":", error.name);
                
                // Voor bassboom: probeer opnieuw met user interaction fallback
                if (id === 'bassboom') {
                    console.log("  🔄 Setting up bassboom fallback");
                    document.body.addEventListener('click', function playOnce() {
                        s.play().then(() => {
                            console.log("  ✅ Bassboom played after click");
                            document.body.removeEventListener('click', playOnce);
                        });
                    }, { once: true });
                }
            });
        } else {
            // Oude browser fallback
            try {
                s.play();
                console.log("  ✅ Sound playing (old browser):", id);
            } catch (error) {
                console.warn("  ⚠️ Old browser error:", error);
            }
        }
    } else {
        console.error("  ❌ Sound element not found:", id);
    }
}



function detectBeat() {
    if (!analyser) return;
    const d = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(d);
    let bass = 0;
    for (let i = 0; i < 40; i++) bass += d[i];
    beat = Math.min((bass / 40 / 255) * 1.6, 1);
    beatEnv = Math.max(beatEnv * 0.9, beat);
}

function fadeOutAudio(el, duration = 2000) {
    const startVol = el.volume;
    const start = performance.now();

    function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        el.volume = startVol * (1 - t);
        if (t < 1) requestAnimationFrame(tick);
        else el.pause();
    }

    requestAnimationFrame(tick);
}




/* ============================================================
   PARTICLE SYSTEMS (Firework & Confetti)
============================================================ */
function spawnFirework() {
    const x = bg.width * (0.2 + Math.random() * 0.6);
    fireworks.push({
        x,
        y: getHillY(x) - (snowAccum[Math.floor(x)] || 0) + 6,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(8 + Math.random() * 3),
        exploded: false,
    });
    playSound("boom");
}

function explodeFirework(x, y, isFinale = false) {
    const rings = isFinale ? 10 : 6;
    const pPerRing = isFinale ? 18 : 14;

    const baseSpeed = isFinale ? 1.2 : 1.1;
    const ringStep  = isFinale ? 0.45 : 0.4;

    for (let r = 0; r < rings; r++) {
        const hue = Math.random() * 360;
        const speed = baseSpeed + r * ringStep;

        for (let i = 0; i < pPerRing; i++) {
            const angle = (i / pPerRing) * Math.PI * 2;
            const speedJitter = speed * (0.85 + Math.random() * 0.3);

            fireParticles.push({
                x,
                y,
                vx: Math.cos(angle) * speedJitter,
                vy: Math.sin(angle) * speedJitter,
                life: isFinale ? 120 : 90,
                max: isFinale ? 120 : 90,
                hue,
                radius: 0,
                ring: r,
            });
        }
    }
}


// Pas de spawnConfetti functie iets aan voor consistentie:
function spawnConfetti() {
    const count = Math.floor(80 * confettiSpawnRate); // Iets minder per frame voor consistentie
    for (let i = 0; i < count; i++) {
        confetti.push({
            x: Math.random() * bg.width,
            y: -10 - Math.random() * 20, // Start boven het scherm
            vy: 0.4 + Math.random() * 1.0, // Langzamere val
            vx: (Math.random() - 0.5) * 0.8, // Minder horizontale beweging
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.04,
            hue: Math.random() * 360,
            life: 500, // Langer leven voor langzamere confetti
            maxLife: 500
        });
    }
}



function startParticleFadeOut() {
    console.log("🔥=== START PARTICLE FADE OUT ===");
    console.log("FireParticles count:", fireParticles.length);
    
    const fadeDuration = 3000;
    
    // Markeer alle bestaande particles voor fade-out
    fireParticles.forEach(p => {
        p.fading = true;
        p.fadeStartTime = performance.now();
        p.fadeDuration = fadeDuration;
        p.originalMax = p.max;
        p.originalLife = p.life;
    });
    
    // Start interval om te checken wanneer alle particles weg zijn
    particlesAllFaded = false;
    
    if (fadeCheckInterval) {
        clearInterval(fadeCheckInterval);
    }
    
    fadeCheckInterval = setInterval(() => {
        console.log("Checking particles:", fireParticles.length, "remaining");
        
        if (fireParticles.length === 0) {
            console.log("✅ All particles gone! Calling triggerBassBoomWithConfetti");
            particlesAllFaded = true;
            clearInterval(fadeCheckInterval);
            triggerBassBoomWithConfetti(); // Start de bassboom nu
        }
    }, 100);
}

function cleanupFadedParticles() {
    const beforeLength = fireParticles.length;
    
    // Verwijder particles die klaar zijn met faden
    fireParticles = fireParticles.filter(p => {
        if (p.fading) {
            const fadeProgress = performance.now() - p.fadeStartTime;
            if (fadeProgress >= p.fadeDuration) {
                return false; // Verwijderen
            }
        }
        return true; // Behouden
    });
    
    // Log voor debugging
    if (fireParticles.length === 0 && beforeLength > 0) {
        console.log("Alle particles zijn weg!");
    }
}


// Voeg toe bij de andere functies (ergens na startParticleFadeOut)
function fadeOutSantaAndSpotlight() {
    console.log("Start smooth fade-out van Santa en spotlight");
    
    let fadeProgress = 0;
    const fadeDuration = 2000; // 2 seconden fade-out
    const startTime = performance.now();
    
    function fadeStep() {
        const elapsed = performance.now() - startTime;
        fadeProgress = Math.min(elapsed / fadeDuration, 1);
        
        // Santa langzaam laten stoppen met dansen
        if (santaDancing) {
            // Verminder dans intensiteit geleidelijk
            santaEnergy = Math.max(0, santaEnergy * (1 - fadeProgress * 0.1));
        }
        
        // Spotlight geleidelijk dimmen
        spotlightFade = 1 - fadeProgress;
        
        // Stop santa dansen op 50% van fade
        if (fadeProgress > 0.5 && santaDancing) {
            santaDancing = false;
            console.log("Santa stopped dancing at 50% fade");
        }
        
        // Stop spotlight volledig aan het einde
        if (fadeProgress >= 1) {
            spotlightActive = false;
            console.log("Spotlight fully faded out");
        } else {
            requestAnimationFrame(fadeStep);
        }
    }
    
    requestAnimationFrame(fadeStep);
}





// Pas de triggerBassBoomWithConfetti functie aan voor replay-button
function triggerBassBoomWithConfetti() {
    console.log("Alle particles weg, bassboom start!");
    
    // Santa en spotlight zijn al aan het faden via fadeOutSantaAndSpotlight()
    
    // Korte pauze...
    setTimeout(() => {
        // 💥 BASSBOOM (impact)
        playSound("bassboom");

        document
            .querySelectorAll("#bg, #fx")
            .forEach((l) => l.classList.add("shake"));

        // 🎉 confetti + tekst NA impact
        setTimeout(() => {
            confettiActive = true;
            confettiSpawnRate = 0.6; // 👈 start burst

            textEl.innerHTML = "✨ Gelukkig nieuwjaar ✨";
            textEl.classList.add("glowText", "newyear", "breathe");
            textEl.style.opacity = 1;

            // 🎊 CHEERING GELUID ONLY - geen visueel effect
          // 🎊 BETROUWBARE CHEERING (alleen geluid)
setTimeout(() => {
    console.log("🎊 Starting cheering sequence");
    
    const cheeringSound = document.getElementById('cheering');
    
    if (cheeringSound && cheeringSound.src) {
        // Controleer of audio geladen is
        if (cheeringSound.readyState >= 2) { // 2 = HAVE_CURRENT_DATA
            console.log("✅ Cheering audio is loaded, attempting to play");
            
            cheeringSound.currentTime = 0;
            cheeringSound.volume = 0.7;
            
            const playPromise = cheeringSound.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("✅ Cheering sound started");
                    
                    // Auto-stop na 5 seconden
                    setTimeout(() => {
                        cheeringSound.pause();
                        cheeringSound.currentTime = 0;
                        console.log("🔇 Cheering sound auto-stopped");
                    }, 5000);
                    
                }).catch(error => {
                    console.log("ℹ️ Cheering autoplay blocked, user interaction required");
                    // Laat het maar - we doen zonder cheering
                });
            }
        } else {
            console.log("ℹ️ Cheering audio not ready, skipping");
        }
    } else {
        console.log("ℹ️ No cheering audio available");
    }
}, 300);

// Kleine delay na confetti start

            // Verlaag spawn rate na initiële burst
            setTimeout(() => {
                confettiSpawnRate = 0.2; // Langzame constante confetti
            }, 700);

            // 🎶 Muziek langzaam uitfaden (3 seconden)
            setTimeout(() => {
                fadeOutAudio(musicEl, 3000);
            }, 2000);

            // 🔄 Toon replay button NA muziek fade
            setTimeout(() => {
                showReplayButton();
            }, 6000);

        }, 200); // Korte delay na bassboom

    }, 500); // Pauze tussen particles weg en bassboom
}





/* ============================================================
   DRAWING FUNCTIONS
============================================================ */
function drawScene() {
    // BG
    const g = ctx.createLinearGradient(0, 0, 0, bg.height);
    g.addColorStop(0, partyBlend > 0 ? `rgba(60,30,90,${0.45 * partyBlend})` : "rgb(12,12,30)");
    g.addColorStop(1, "rgb(5,5,15)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, bg.width, bg.height);
    
    // 🔴🔴🔴 VISUEEL CHEERING EFFECT - PLAATS HIER 🔴🔴🔴
    // (direct na background, voor alle andere tekeningen)
   // In drawScene(), direct na de background:
// In drawScene(), direct na de background:
// In drawScene(), DIRECT na de background (rond regel 650 in jouw code):
// In drawScene(), direct na de background:

    // 🔴🔴🔴 EINDE CHEERING EFFECT 🔴🔴🔴
   
   
   
   
   
   
   
   
   
    // Stars & Hills
    stars.forEach((s) => {
        s.t += 0.02;
        ctx.fillStyle = `rgba(255,200,255,${0.35 + Math.sin(s.t) * 0.35})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // hill beat energy (slow decay)
    // hillEnergy = Math.max(beatEnv, hillEnergy * 0.92);
    // hillEnergy = 1;

    // Vervang de huidige hill-drawing code in drawScene() met dit:
  // In drawScene(), bij de hill sectie:
hills.forEach((h) => {
    const topY = bg.height * h.y - 80;
    const bottomY = bg.height;

    // 🔴 BELANGRIJK: Zorg dat hillPulse en hillColorShift bestaan
    if (typeof hillPulse === 'undefined') hillPulse = 0;
    if (typeof hillColorShift === 'undefined') hillColorShift = 0;

    // Animatie waardes voor party-mode
    if (partyActive) {
        hillPulse = Math.sin(t * 2) * 0.5 + 0.5; // Puls op muziek
        hillColorShift = (hillColorShift + 0.5) % 360; // Kleurverschuiving
    } else {
        hillPulse = 0;
    }

    // Base colors met animatie in party-mode
    let topColor, bottomColor;
    
    if (partyActive) {
        // Party-mode: dynamische kleuren die verschuiven
        const hue = (240 + hillColorShift) % 360; // Blauw-paars spectrum
        const saturation = 70 + (beatEnv || 0) * 30;
        const lightness = 35 + (beatEnv || 0) * 15;
        
        topColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        bottomColor = `hsl(${hue - 20}, ${saturation - 20}%, ${lightness - 20}%)`;
    } else {
        // Normale mode
        topColor = "#5a3a9e";
        bottomColor = "#2a163f";
    }

    // Gradient met animatie
    const hg = ctx.createLinearGradient(0, topY, 0, bottomY);
    
    if (partyActive) {
        // Multi-color gradient in party-mode
        hg.addColorStop(0, topColor);
        hg.addColorStop(0.3, `hsl(${(hillColorShift + 60) % 360}, 70%, 40%)`);
        hg.addColorStop(0.7, `hsl(${(hillColorShift + 120) % 360}, 60%, 30%)`);
        hg.addColorStop(1, bottomColor);
    } else {
        // Normale gradient
        hg.addColorStop(0, topColor);
        hg.addColorStop(1, bottomColor);
    }
    
    ctx.fillStyle = hg;

    // Hill path tekenen
    ctx.beginPath();
    ctx.moveTo(0, bg.height);
    
    for (let x = 0; x <= bg.width; x += 20) {
        let hillY = getHillY(x);
        
        // Extra wave effect in party-mode
        if (partyActive) {
            hillY += Math.sin(x * 0.02 + t * 3) * 15 * (beatEnv || 0);
        }
        
        ctx.lineTo(x, hillY);
    }
    
    ctx.lineTo(bg.width, bg.height);
    ctx.closePath();
    ctx.fill();

    // Extra glow effect in party-mode
    if (partyActive && (beatEnv || 0) > 0.2) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (beatEnv || 0) * 0.3;
        
        const glowGradient = ctx.createLinearGradient(0, topY, 0, bottomY);
        glowGradient.addColorStop(0, `rgba(255, 200, 255, ${(beatEnv || 0) * 0.5})`);
        glowGradient.addColorStop(1, "transparent");
        
        ctx.fillStyle = glowGradient;
        ctx.fill();
        ctx.restore();
    }
});

    // Snow Flakes
    snow.forEach((f) => {
        if (partyActive) f.hue = (f.hue + 2) % 360;
        ctx.strokeStyle = partyActive ? `hsla(${f.hue},100%,75%,0.6)` : "rgba(255,255,255,0.6)";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3 + f.r;
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(f.x + Math.cos(a) * f.s, f.y + Math.sin(a) * f.s);
        }
        ctx.stroke();
        f.y += f.vy * (partyBlend > 0 ? 1.6 : 1);
        if (f.y > getHillY(f.x) - (snowAccum[Math.floor(f.x)] || 0)) {
            f.y = -10;

            const ix = Math.floor(f.x);

            snowAccum[ix]     = Math.min((snowAccum[ix]     || 0) + 4.0, 200);
            snowAccum[ix - 1] = Math.min((snowAccum[ix - 1] || 0) + 2.5, 200);
            snowAccum[ix + 1] = Math.min((snowAccum[ix + 1] || 0) + 2.5, 200);
        }
    });
    
    if (partyActive) snowAccum = snowAccum.map((s) => Math.max(s - 0.02, 0));

    // Santa & Spotlight
    if (santaVisible) {
        if (santaReveal < 1) santaReveal += 0.015;
        
        // BELANGRIJK: Bereken baseY op basis van hill
        const baseX = bg.width / 2;
        const hillY = getHillY(baseX);
        const baseY = hillY - (snowAccum[Math.floor(baseX)] || 0);
        
        // Startpositie: BOVEN scherm bij reveal = 0
        const startY = baseY - 200; // Start 200px boven de hill
        
        if (santaDancing) {
            // Dans logica...
            const kick = Math.pow(beatEnv, 1.3) * 0.3;
            const bounce = Math.sin(t * 6) * 1.5;
            
            santaTargetX = baseX + Math.sin(t * 1.2) * 5;
            santaTargetY = baseY - (kick * 10) - bounce;
            santaTargetRot = Math.sin(t * 5) * (kick * 0.06);
            
            // Smooth naar doelen
            santaSmoothX = lerp(santaSmoothX, santaTargetX, 0.1);
            santaSmoothY = lerp(santaSmoothY, santaTargetY, 0.15);
            santaSmoothRot = lerp(santaSmoothRot, santaTargetRot, 0.08);
            
        } else {
            // Rustpositie: animeer van startY naar baseY
            const targetY = santaReveal < 1 ? baseY : baseY;
            const currentY = santaReveal < 1 ? 
                startY + (targetY - startY) * santaReveal : 
                targetY;
            
            santaSmoothX = lerp(santaSmoothX, baseX, 0.05);
            santaSmoothY = lerp(santaSmoothY, currentY, 0.05);
            santaSmoothRot = lerp(santaSmoothRot, 0, 0.05);
        }
        
        santa.drawX = santaSmoothX;
        santa.drawY = santaSmoothY;
        santa.rot = santaSmoothRot;
        santaAlpha = santaReveal;
        
        // Teken Santa
        ctx.save();
        ctx.globalAlpha = santaAlpha;
        ctx.translate(santa.drawX, santa.drawY);
        ctx.rotate(santa.rot);
        
        const sw = 180;
        const sh = santaImg.height * (sw / santaImg.width);
        ctx.drawImage(santaImg, -sw / 2, -sh - 8, sw, sh);
        ctx.restore();
    }

    // 🔦 Spotlight (aparte check, werkt ook als Santa nog niet helemaal zichtbaar is)
    if (spotlightActive && santaVisible) {
        const cx = santa.drawX;
        const cy = santa.drawY - 80;
        
        // Maak spotlight subtieler in party-mode
        const baseRad = 220;
        const beatRad = beatEnv * 120;
        const rad = baseRad + beatRad * partyBlend;
        
        const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        
        // Kleur aanpassen aan party-mode
        if (partyActive) {
            sg.addColorStop(0, `rgba(255, 255, 230, ${0.35 + beatEnv * 0.2})`);
            sg.addColorStop(0.6, `rgba(255, 200, 255, ${0.2 + beatEnv * 0.15})`);
            sg.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
            sg.addColorStop(0, "rgba(255, 255, 230, 0.35)");
            sg.addColorStop(1, "rgba(0, 0, 0, 0)");
        }
        
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Particles (Fireworks & Confetti)
    fireParticles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.8;
        p.life--;
        
        // Bereken alpha met fade-out als particle aan het verdwijnen is
        let lifeAlpha = p.life / p.max;
        
        // Als particle aan het fade-out is
        if (p.fading) {
            const fadeProgress = Math.min(1, (performance.now() - p.fadeStartTime) / p.fadeDuration);
            lifeAlpha *= (1 - fadeProgress);
            
            // Verwijder particle als fade klaar is
            if (fadeProgress >= 1) {
                p.life = -1; // Markeer voor verwijdering
            }
        }
        
        const ringFade = 1 - (p.ring ?? 0) / 12;
        ctx.strokeStyle = `hsla(${p.hue},100%,70%,${lifeAlpha * Math.max(0.35, ringFade)})`;
        ctx.lineWidth = 1.2;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
    });

    // Voeg toe ergens na de particles drawing:
    if (fireParticles.length > 0 && fireworksPhase === 0) {
        // Toon een subtiele "wachten op fade" indicator
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Fading ${fireParticles.length} particles...`, bg.width / 2, bg.height - 50);
        ctx.restore();
    }

    fireParticles = fireParticles.filter((p) => p.life > 0);

    confetti.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.vr;
        c.life -= 0.5; // Langzamer vervagen
        
        // Verwijder confetti die onderaan het scherm is of uitgefaded
        if (c.y > bg.height + 50 || c.life <= 0) {
            c.life = -1; // Mark voor verwijdering
        }
        
        const alpha = Math.max(0, c.life / (c.maxLife || 500));
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = `hsla(${c.hue}, 100%, 60%, ${alpha})`;
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
    });

    // Filter confetti die klaar is:
    confetti = confetti.filter((c) => c.life > 0);
    
    if (confettiActive) {
        spawnConfetti();
        confettiSpawnRate *= 0.99; // confettidrop was =1.0, eventeel op *=0.5 zetten
    }
} 

// Einde van drawScene functie

/* ============================================================
   MAIN LOOP & FLOW
============================================================ */
function loop() {
 // Debug: log show phase
    if (t % 5 < 0.016) { // Log elke 5 seconden
        console.log("Show phase:", showPhase, "Santa visible:", santaVisible, "Santa reveal:", santaReveal);
    }

    t += 0.016;
  // Voeg toe in de loop() functie, ergens aan het begin:
  if (partyActive) {
    hillPulse = Math.sin(t * 2) * 0.5 + 0.5;
    hillColorShift += 0.5;
}
  
  
    detectBeat();
    // duidelijke hill flash (test)
//if (partyActive && beatEnv > 0.25) {
//    hillFlash = 1;
//}
//hillFlash *= 0.85; // snelle maar zichtbare decay
//****************************************** */


// Santa energy: snelle aanval, trage release
santaEnergy = Math.max(beatEnv, santaEnergy * 0.88);

    partyBlend = Math.max(0, Math.min(1, partyBlend + (partyActive ? 0.01 : -0.01)));

    // Opruimen van uitgefade particles
    cleanupFadedParticles();

    drawScene();

 // Update fireworks
    if (fireworksActive) {
        fireworks.forEach((f, i) => {
            f.x += f.vx;
            f.y += f.vy;
            f.vy += 0.04;
            if (f.vy > -3 || f.y < bg.height * 0.25) {
                explodeFirework(f.x, f.y);
                fireworks.splice(i, 1);
            }
            ctx.strokeStyle = "white";
            ctx.beginPath();
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(f.x - f.vx * 3, f.y - f.vy * 3);
            ctx.stroke();
        });


     if (fireworksPhase === 2) {
            const now = performance.now();
            if (now - lastFinaleExplosion > 700) {
                lastFinaleExplosion = now;
                const x = bg.width * (0.15 + Math.random() * 0.7);
                const y = bg.height * (0.2 + Math.random() * 0.4);
                explodeFirework(x, y, true);
            }
        }
    }
    
    // BELANGRIJK: Sla de animation ID op
    animationId = requestAnimationFrame(loop);
}

// einde loop

// Vervang de huidige onFinaleEnded() functie met:
function onFinaleEnded() {
    // Deze functie wordt nu minder belangrijk omdat bassboom later komt
    // Maar we houden hem voor andere zaken die direct moeten
    
    // 🎅 stop Santa-dance (al gedaan, maar voor zekerheid)
    santaDancing = false;
    
    // 🎶 muziek uitfaden wordt nu in startFinaleSequenceAfterFade() gedaan
}

/* ============================================================
   SHOW FLOW
============================================================ */
async function runShow() {
    console.log("=== RUN SHOW START ===");
    
    // 🔴 Zorg dat santa NIET zichtbaar is tot we klaar zijn
    santaVisible = false;
    santaReveal = 0;
    
    // 🔴 BELANGRIJK: Start de animation loop ALS HIJ NOG NIET DRAAT
    if (!animationId) {
        console.log("Starting animation loop in runShow");
        animationId = requestAnimationFrame(loop);
    }
    
    // 🔴 Teken EERST de scene voordat we wachten
    drawScene();
    
    await wait(1500); // Kortere wachttijd
    
    // 🔴 NU santa zichtbaar maken (komt van boven)
    santaVisible = true;
    console.log("Santa visible gemaakt");
    
    await showText("Beste familie"); 
    await wait(3500);
    await showText("We wensen jullie een gelukkig en gezond 2026"); 
    await wait(1800);
    await showCredits("mie en Ciske");
    await hideText(); 
    await hideCredits();
    await showText("We gaan er een lap op geven zie !"); 
    await wait(1800);
    await hideText();
    await showText("Ben je er klaar voor ?...");
    
    // 🔴 Toon overlay voor volgende klik
    if (startOverlay) {
        startOverlay.classList.add("active");
        startOverlay.style.display = "block";
    }
    
    console.log("=== RUN SHOW END ===");
}


/* ============================================================
   UI & TEXT FLOW
============================================================ */
async function showText(msg) {
    textEl.textContent = msg;
    textEl.style.opacity = 1;
}

async function hideText() {
    textEl.style.opacity = 0;
    await wait(1200);
}

async function showCredits(txt) {
    creditsEl.textContent = txt;
    creditsEl.classList.remove("exit");
    creditsEl.classList.add("enter"); // Gebruik CSS class voor soepele fly-in
    creditsEl.style.display = "block";
    await wait(3500);
}

async function hideCredits() {
    creditsEl.classList.remove("enter");
    creditsEl.classList.add("exit");
    await wait(1500);
    creditsEl.style.display = "none";
}


async function startCountdown(seconds) {
    const el = document.getElementById("countdownInner");
    if (!el) return;

    el.style.opacity = 1;
    el.style.transform = "scale(1)";
    el.style.transition = "none";

    for (let i = seconds; i >= 0; i--) {
        const isGo = i === 0;

        el.textContent = isGo ? "GO!" : i;

        // 🎨 kleur
        el.style.color = isGo
            ? "#ff2a2a"
            : `hsl(${40 + i * 40},100%,60%)`;

        // reset
        el.style.transition = "none";
        el.style.transform = "scale(0.6)";
        el.style.opacity = 0;

        // force reflow
        el.offsetHeight;

        // 🎬 in-animatie
        el.style.transition = "transform 300ms ease-out, opacity 300ms ease-out";
        el.style.transform = isGo ? "scale(2.4)" : "scale(1.4)";
        el.style.opacity = 1;

        await wait(isGo ? 500 : 800);

        // 🎬 out-animatie (niet voor GO)
        if (!isGo) {
            el.style.transition = "opacity 200ms ease-in";
            el.style.opacity = 0;
            await wait(200);
        }
    }

    // opruimen
    el.style.transition = "opacity 400ms ease-out";
    el.style.opacity = 0;
    await wait(400);
    el.textContent = "";
}


// Pas startFinaleSequenceAfterFade aan:
function startFinaleSequenceAfterFade() {
    console.log("Start finale sequence na fade");
    
    // 🎅 Santa en spotlight stoppen AL hier
 //   santaDancing = false;
 //   spotlightActive = false;

// 🎅 Santa en spotlight SMOOTH fade-out
    fadeOutSantaAndSpotlight();



    
    // 🎶 Muziek uitfaden wordt NU in triggerBassBoomWithConfetti gedaan
    // NIETS anders doen, wacht op particles fade
}





/* ============================================================
   EVENTS
============================================================ */
// Dit is de nieuwe functie die we hebben gemaakt
function handleStartOverlayClick() {
    if (showPhase === 0) {
        showPhase = 1;
        startOverlay.style.display = "none";
        connectAudio();
        if (audioCtx) {
            audioCtx.resume();
        }
        santaVisible = true;
        runShow();
    } else if (showPhase === 1) {
        showPhase = 2;
        fadeOutText(400);
        startOverlay.style.display = "none";
        
        const musicEl = document.getElementById('music');
        if (musicEl) {
            musicEl.play();
        }
        
        partyActive = true;
        setTimeout(() => (spotlightActive = true), 4200);
        setTimeout(() => (santaDancing = true), 7200);
        
        // Start de countdown en fireworks flow
        startPartySequence();
    }
}

// En dan deze regel (DEZE MOET JE WEL UITVOEREN):
startOverlay.addEventListener("click", handleStartOverlayClick);


// Voeg touch event toe voor betere mobiele ervaring
// Pas het DOMContentLoaded event aan:

/*
document.addEventListener('DOMContentLoaded', function() {
    // Herstel de overlay event listener
    const startOverlay = document.getElementById('startOverlay');
    if (startOverlay) {
        startOverlay.addEventListener("click", handleStartOverlayClick);
    }
    
    // Touch feedback voor replay button
    const replayButton = document.getElementById('replayButton');
    if (replayButton) {
        const button = replayButton.querySelector('button');
        if (button) {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        }
    }
    
    // Reset santa image
    santaImg.onload = function() {
        santaReady = true;
    };
    santaImg.src = "assets/santa.png";
    
    // Start initial animation loop
    setTimeout(() => {
        if (!animationId) {
            console.log("Starting initial animation loop");
            animationId = requestAnimationFrame(loop);
        }
    }, 100);
});
*/
// Voeg dit toe aan het einde van je script, voor DOMContentLoaded:
// Initialiseer de scene bij het laden
window.addEventListener('load', function() {
    console.log("Window loaded, initializing...");
    resize();
    initScene();
    
    // Start de loop
    if (!animationId) {
        console.log("Starting animation loop from window load");
        animationId = requestAnimationFrame(loop);
    }
    
    // Toon overlay
    if (startOverlay) {
        startOverlay.style.display = "block";
        startOverlay.classList.add("active");
    }
});







/*
window.addEventListener("keydown", e => {
    if (e.code === "Space") paused = !paused;
});
*/


// ============================================================
// INITIELE START - Zorg dat alles getekend wordt bij het laden
// ============================================================

// Start de animation loop wanneer de DOM geladen is
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔵 DOM geladen - start initialisatie");
    
    // 1. Zorg dat de canvas de juiste grootte heeft
    resize();
    
    // 2. Initialiseer de scene (sterren, sneeuw, hills)
    initScene();
    
    // 3. Start de animation loop ALS HIJ NOG NIET DRAAT
    if (!animationId) {
        console.log("🔵 Start initiële animation loop");
        animationId = requestAnimationFrame(loop);
    }
    
    // 4. Teken direct één frame zodat we iets zien
    setTimeout(() => {
        console.log("🔵 Forceer eerste drawScene()");
        drawScene();
    }, 100);
    
    // 5. Zorg dat de overlay zichtbaar is
    const startOverlay = document.getElementById('startOverlay');
    if (startOverlay) {
        startOverlay.style.display = "block";
        startOverlay.classList.add("active");
        console.log("🔵 Overlay klaar voor klik");
    }
    
    // 6. Herstel de overlay event listener
    if (startOverlay) {
        startOverlay.addEventListener("click", handleStartOverlayClick);
    }
    
    // 7. Touch feedback voor replay button
    const replayButton = document.getElementById('replayButton');
    if (replayButton) {
        const button = replayButton.querySelector('button');
        if (button) {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        }
    }
    
    // 8. Santa image laden
    santaImg.onload = function() {
        santaReady = true;
        console.log("🔵 Santa image geladen");
    };
    santaImg.src = "assets/santa.png";
});


// Test functie - roep deze aan in console om te testen
// Voeg toe na alle andere functies (aan het einde van je script)
function testCheering() {
    console.log("=== 🧪 TEST CHEERING ===");
    
    // Reset eerst
    cheeringActive = false;
    
    // 1. Test visueel effect
    console.log("1. Testing visual effect...");
    cheeringActive = true;
    cheeringStartTime = performance.now();
    
    // Laat het 3 seconden zien
    setTimeout(() => {
        cheeringActive = false;
        console.log("✅ Visual effect test completed");
    }, 3000);
    
    // 2. Test audio element
    console.log("2. Testing audio element...");
    const cheeringSound = document.getElementById('cheering');
    if (cheeringSound) {
        console.log("✅ Audio element found");
        console.log("   Source:", cheeringSound.src);
        console.log("   Duration:", cheeringSound.duration, "seconds");
        console.log("   Ready state:", cheeringSound.readyState);
        
        // Probeer te laden
        cheeringSound.load();
        
        // Check voor errors
        cheeringSound.onerror = function() {
            console.error("❌ Audio load error:", cheeringSound.error);
        };
        
        cheeringSound.onloadeddata = function() {
            console.log("✅ Audio loaded successfully");
        };
    } else {
        console.error("❌ Audio element NOT FOUND");
        console.log("💡 Make sure this is in your HTML:");
        console.log('<audio id="cheering" src="assets/cheering.mp3"></audio>');
    }
    
    // 3. Test fallback
    console.log("3. Testing fallback in 4 seconds...");
    setTimeout(() => {
        console.log("Testing fallback sound...");
        playCheeringFallback();
    }, 4000);
    
    console.log("=== TEST RUNNING ===");
    console.log("You should see a yellow glow for 3 seconds");
}



// Voeg toe aan het einde van je script (tijdelijk voor debugging)
// Voeg dit toe aan het einde van je script.js (voor de laatste closing tags)
function testBassboom() {
    console.log("=== 🧪 TEST BASSSBOOM ===");
    
    const bassboom = document.getElementById('bassboom');
    console.log("Bassboom element:", bassboom);
    
    if (bassboom) {
        console.log("Source:", bassboom.src);
        console.log("Duration:", bassboom.duration);
        console.log("Ready state:", bassboom.readyState);
        
        // Test het geluid
        bassboom.currentTime = 0;
        bassboom.volume = 0.5;
        
        bassboom.play().then(() => {
            console.log("✅ Bassboom sound played successfully");
        }).catch(error => {
            console.error("❌ Could not play bassboom:", error);
        });
    } else {
        console.error("❌ Bassboom audio element not found!");
        console.log("💡 Check if this is in your HTML:");
        console.log('<audio id="bassboom" src="assets/bassboom.mp3"></audio>');
    }
}

// Maak het beschikbaar in console
console.log("🎮 Debug functions available:");
console.log("  - testBassboom()     - Test bassboom sound");
console.log("  - testCheering()     - Test cheering effect");








// Laatste regel van het script - geen extra code hierna









