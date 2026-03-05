(function () {

async function krynetAudit(){

const ua = navigator.userAgent;
const platform = navigator.platform;
const vendor = navigator.vendor || "";

let os="Unknown";
let browser="Unknown";
let engine="Unknown";
let device="Desktop";


// --------------------------
// DEVICE TYPE
// --------------------------

if(/mobile|android|iphone|ipad/i.test(ua))
device="Mobile";


// --------------------------
// OS DETECTION
// --------------------------

if(/windows/i.test(ua)){

if(/windows nt 10/i.test(ua)) os="Windows 10/11";
else if(/windows nt 6.3/i.test(ua)) os="Windows 8.1";
else if(/windows nt 6.2/i.test(ua)) os="Windows 8";
else if(/windows nt 6.1/i.test(ua)) os="Windows 7";
else os="Windows";

}

else if(/android/i.test(ua)) os="Android";

else if(/iphone|ipad|ipod/i.test(ua)) os="iOS";

else if(/mac/i.test(platform)) os="macOS";

else if(/linux/i.test(ua) || /linux/i.test(platform)){

if(/ubuntu/i.test(ua)) os="Ubuntu";
else if(/arch/i.test(ua)) os="Arch Linux";
else if(/fedora/i.test(ua)) os="Fedora";
else if(/debian/i.test(ua)) os="Debian";
else os="Linux";

}


// --------------------------
// ENGINE DETECTION
// --------------------------

if(/gecko\/\d/i.test(ua) && !/like gecko/i.test(ua))
engine="Gecko";

else if(/applewebkit/i.test(ua) && !/chrome|chromium|edg|opr|vivaldi|brave/i.test(ua))
engine="WebKit";

else if(/chrome|chromium|crios|edg|opr|vivaldi|brave/i.test(ua))
engine="Blink";


// --------------------------
// BROWSER DETECTION
// --------------------------

if(/librewolf/i.test(ua)) browser="LibreWolf";

else if(/waterfox/i.test(ua)) browser="Waterfox";

else if(/pale moon/i.test(ua)) browser="Pale Moon";

else if(/basilisk/i.test(ua)) browser="Basilisk";

else if(/torbrowser/i.test(ua)) browser="Tor Browser";

else if(/mull/i.test(ua)) browser="Mull";

else if(/floorp/i.test(ua)) browser="Floorp";

else if(/firefox/i.test(ua)) browser="Firefox";

else if(navigator.brave && await navigator.brave.isBrave()) browser="Brave";

else if(/vivaldi/i.test(ua)) browser="Vivaldi";

else if(/edg/i.test(ua)) browser="Edge";

else if(/opr|opera/i.test(ua)) browser="Opera";

else if(/chrome/i.test(ua)) browser="Chrome";

else if(/safari/i.test(ua) && !/chrome/i.test(ua)) browser="Safari";


// --------------------------
// PRIVACY SIGNALS
// --------------------------

const privacySignals={

doNotTrack: navigator.doNotTrack==="1",

globalPrivacyControl: navigator.globalPrivacyControl===true,

cookies: navigator.cookieEnabled

};


// --------------------------
// ADBLOCK / TRACKER BLOCK
// --------------------------

const adblock = await new Promise(resolve=>{

const bait=document.createElement("div");
bait.className="ads ad adsbox doubleclick ad-placement";
bait.style.height="1px";

document.body.appendChild(bait);

setTimeout(()=>{
resolve(bait.offsetHeight===0);
bait.remove();
},100);

});


// --------------------------
// WEBRTC LEAK RISK
// --------------------------

const webRTCLeak = !!(
window.RTCPeerConnection ||
window.webkitRTCPeerConnection
);


// --------------------------
// CANVAS FINGERPRINT TEST
// --------------------------

function canvasTest(){

try{

const canvas=document.createElement("canvas");
const ctx=canvas.getContext("2d");

ctx.font="16px Arial";
ctx.fillText("KrynetFP",10,10);

return canvas.toDataURL().length;

}catch{

return null;

}

}


// --------------------------
// WEBGL FINGERPRINT
// --------------------------

function webglTest(){

try{

const canvas=document.createElement("canvas");
const gl=canvas.getContext("webgl");

if(!gl) return null;

const debug=gl.getExtension("WEBGL_debug_renderer_info");

if(!debug) return null;

return{

vendor: gl.getParameter(debug.UNMASKED_VENDOR_WEBGL),
renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)

};

}catch{

return null;

}

}


// --------------------------
// TOR HEURISTIC
// --------------------------

const torLikely=

screen.width===1000 &&
screen.height===1000 &&
navigator.hardwareConcurrency<=2;


// --------------------------
// VPN / PROXY HEURISTIC
// --------------------------

const proxyHint=

navigator.connection &&
navigator.connection.rtt &&
navigator.connection.rtt>400;


// --------------------------
// INTERNAL SCORING
// --------------------------

let privacyScore=0;
let securityScore=0;


// OS

if(os.includes("Linux")){
privacyScore+=35;
securityScore+=30;
}

if(os==="macOS"){
privacyScore+=15;
securityScore+=20;
}

if(os.includes("Windows")){
privacyScore-=10;
securityScore+=10;
}

if(os==="Android"||os==="iOS"){
privacyScore+=10;
securityScore+=15;
}


// ENGINE

if(engine==="Gecko"){
privacyScore+=30;
securityScore+=20;
}

if(engine==="WebKit"){
privacyScore+=20;
securityScore+=20;
}

if(engine==="Blink"){
privacyScore-=20;
securityScore+=20;
}


// BROWSER

switch(browser){

case "Tor Browser":
privacyScore+=70;
securityScore+=40;
break;

case "LibreWolf":
privacyScore+=55;
securityScore+=30;
break;

case "Mull":
privacyScore+=55;
securityScore+=30;
break;

case "Firefox":
privacyScore+=35;
securityScore+=25;
break;

case "Brave":
privacyScore+=25;
securityScore+=25;
break;

case "Safari":
privacyScore+=20;
securityScore+=30;
break;

case "Edge":
privacyScore-=20;
securityScore+=15;
break;

case "Chrome":
privacyScore-=25;
securityScore+=20;
break;

case "Opera":
privacyScore-=35;
securityScore+=10;
break;

}


// privacy protections

if(privacySignals.doNotTrack) privacyScore+=5;
if(privacySignals.globalPrivacyControl) privacyScore+=5;
if(adblock) privacyScore+=10;
if(torLikely) privacyScore+=30;


// fingerprint exposure

if(canvasTest()) privacyScore-=5;
if(webglTest()) privacyScore-=5;


// --------------------------
// RESULT OBJECT
// --------------------------

return{

os,
browser,
engine,
device,

privacySignals,
adblock,

webRTCLeak,
proxyHint,
torLikely,

canvas:canvasTest(),
webgl:webglTest(),

privacyScore,
securityScore

};

}



// --------------------------
// ADVISORY UI
// --------------------------

async function showAdvisory(){

const env = await krynetAudit();

if(env.privacyScore>60 && env.securityScore>60)
return;

const overlay=document.createElement("div");

overlay.style.position="fixed";
overlay.style.top="0";
overlay.style.left="0";
overlay.style.right="0";
overlay.style.bottom="0";
overlay.style.background="#0a0a0a";
overlay.style.color="white";
overlay.style.zIndex="999999";
overlay.style.padding="40px";
overlay.style.fontFamily="system-ui";
overlay.style.overflow="auto";

overlay.innerHTML=`

<h1>Krynet Privacy Advisory</h1>

<h2>Detected Environment</h2>

<ul>
<li>OS: ${env.os}</li>
<li>Browser: ${env.browser}</li>
<li>Engine: ${env.engine}</li>
<li>Device: ${env.device}</li>
<li>Adblock: ${env.adblock}</li>
<li>WebRTC Leak Risk: ${env.webRTCLeak}</li>
</ul>

<h2>Why This May Affect Your Krynet Account</h2>

<p>
Krynet provides end-to-end encrypted messaging, however some operating
systems and browsers expose metadata that can weaken privacy protections.
</p>

<ul>
<li>Telemetry systems may record application usage.</li>
<li>Browser fingerprinting can uniquely identify your device.</li>
<li>WebRTC can leak network identifiers.</li>
<li>Closed ecosystems may collect behavioral analytics.</li>
</ul>

<p>
While your messages remain encrypted, these mechanisms can allow
correlation between devices and Krynet accounts.
</p>

<h2>Recommended Platforms</h2>

<div style="display:flex;gap:30px;flex-wrap:wrap">

<div>
<img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png" width="60">
<div>Linux</div>
</div>

<div>
<img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Firefox_logo%2C_2019.png" width="60">
<div>Firefox</div>
</div>

<div>
<img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Firefox_LibreWolf_Logo.svg" width="60">
<div>LibreWolf</div>
</div>

<div>
<img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Tor_Browser_Logo.svg" width="60">
<div>Tor Browser</div>
</div>

</div>

<h2>Privacy Discussion</h2>

<iframe width="100%" height="500"
src="https://www.youtube.com/embed/n1SryR13CnY"
frameborder="0"
allowfullscreen>
</iframe>

`;

document.body.appendChild(overlay);

}

showAdvisory();

})();
