(function () {

async function detectEnvironment(){

const ua = navigator.userAgent;
const platform = navigator.platform;

let os = "Unknown";
let browser = "Unknown";
let engine = "Unknown";


// -----------------------------
// OPERATING SYSTEM DETECTION
// -----------------------------

if(/windows/i.test(ua)){

if(/windows nt 10/i.test(ua)) os = "Windows 10/11";
else if(/windows nt 6.3/i.test(ua)) os = "Windows 8.1";
else if(/windows nt 6.2/i.test(ua)) os = "Windows 8";
else if(/windows nt 6.1/i.test(ua)) os = "Windows 7";
else os = "Windows";

}

else if(/android/i.test(ua)) os = "Android";

else if(/iphone|ipad|ipod/i.test(ua)) os = "iOS";

else if(/mac/i.test(platform)) os = "macOS";

else if(/linux/i.test(platform) || /linux/i.test(ua)){

if(/ubuntu/i.test(ua)) os="Ubuntu";
else if(/arch/i.test(ua)) os="Arch Linux";
else if(/fedora/i.test(ua)) os="Fedora";
else if(/debian/i.test(ua)) os="Debian";
else os="Linux";

}


// -----------------------------
// BROWSER ENGINE DETECTION
// -----------------------------

if(/gecko\/\d/i.test(ua) && !/like gecko/i.test(ua))
engine="Gecko";

else if(/applewebkit/i.test(ua) && !/chrome|chromium|edg|opr|vivaldi/i.test(ua))
engine="WebKit";

else if(/chrome|chromium|crios|edg|opr|vivaldi|brave/i.test(ua))
engine="Blink";


// -----------------------------
// BROWSER DETECTION
// -----------------------------

if(/librewolf/i.test(ua)) browser="LibreWolf";

else if(/waterfox/i.test(ua)) browser="Waterfox";

else if(/pale moon/i.test(ua)) browser="Pale Moon";

else if(/basilisk/i.test(ua)) browser="Basilisk";

else if(/torbrowser/i.test(ua)) browser="Tor Browser";

else if(/mull/i.test(ua)) browser="Mull";

else if(/floorp/i.test(ua)) browser="Floorp";

else if(/firefox/i.test(ua)) browser="Firefox";

else if(navigator.brave && await navigator.brave.isBrave())
browser="Brave";

else if(/vivaldi/i.test(ua)) browser="Vivaldi";

else if(/edg/i.test(ua)) browser="Edge";

else if(/opr|opera/i.test(ua)) browser="Opera";

else if(/chrome/i.test(ua)) browser="Chrome";

else if(/safari/i.test(ua) && !/chrome/i.test(ua))
browser="Safari";


// -----------------------------
// PRIVACY SIGNALS
// -----------------------------

const privacySignals = {

doNotTrack: navigator.doNotTrack==="1",
cookiesEnabled: navigator.cookieEnabled,
globalPrivacyControl: navigator.globalPrivacyControl===true

};


// -----------------------------
// ADBLOCK DETECTION
// -----------------------------

const adblock = await new Promise(resolve=>{

const bait=document.createElement("div");
bait.className="ads ad adsbox doubleclick";
bait.style.height="1px";

document.body.appendChild(bait);

setTimeout(()=>{

resolve(bait.offsetHeight===0);
bait.remove();

},100);

});


// -----------------------------
// WEBRTC RISK
// -----------------------------

const webRTCLeak =
!!(window.RTCPeerConnection || window.webkitRTCPeerConnection);


// -----------------------------
// TOR HEURISTIC
// -----------------------------

const torLikely =
screen.width===1000 &&
screen.height===1000 &&
navigator.hardwareConcurrency<=2;


// -----------------------------
// INTERNAL PRIVACY SCORING
// -----------------------------

let privacyScore=0;
let securityScore=0;


// OS evaluation

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

if(os==="Android" || os==="iOS"){
privacyScore+=10;
securityScore+=15;
}


// engine evaluation

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


// browser evaluation

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


// privacy features

if(privacySignals.doNotTrack) privacyScore+=5;
if(privacySignals.globalPrivacyControl) privacyScore+=5;
if(adblock) privacyScore+=10;
if(torLikely) privacyScore+=30;


return{
os,
browser,
engine,
privacySignals,
adblock,
webRTCLeak,
torLikely,
privacyScore,
securityScore
};

}



// -----------------------------
// ADVISORY UI
// -----------------------------

async function showAdvisory(){

const env = await detectEnvironment();

if(env.privacyScore>60 && env.securityScore>60)
return;


// overlay

const overlay=document.createElement("div");

overlay.style.position="fixed";
overlay.style.top="0";
overlay.style.left="0";
overlay.style.right="0";
overlay.style.bottom="0";
overlay.style.background="rgba(0,0,0,0.92)";
overlay.style.zIndex="999999";
overlay.style.color="white";
overlay.style.fontFamily="system-ui";
overlay.style.overflow="auto";
overlay.style.padding="40px";


// recommended icons

const recommended=`

<h2>Krynet Recommended Platforms</h2>

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

`;


// explanation

const explanation=`

<h2>Why your environment may not meet Krynet standards</h2>

<p>
Krynet is a privacy-first end-to-end encrypted communication platform.
Certain operating systems and browsers collect telemetry,
behavior analytics, or diagnostic data that may expose
metadata related to encrypted communication activity.
</p>

<p>
Examples include background telemetry, system activity logging,
and browser fingerprinting mechanisms that can be used to
correlate encrypted sessions with device identities.
</p>

<p>
These mechanisms may increase risk to Krynet users by enabling:
</p>

<ul>

<li>Device fingerprint correlation with encrypted sessions</li>
<li>Telemetry logs revealing application usage</li>
<li>Metadata analysis linking accounts to devices</li>
<li>Potential browser-level exploit surface in closed ecosystems</li>

</ul>

`;


// video

const video=`

<h2>Example Privacy Discussion</h2>

<iframe width="100%" height="500"
src="https://www.youtube.com/embed/n1SryR13CnY"
frameborder="0"
allowfullscreen>
</iframe>

`;


// environment summary

const summary=`

<h2>Detected Environment</h2>

<ul>

<li>Operating System: ${env.os}</li>
<li>Browser: ${env.browser}</li>
<li>Engine: ${env.engine}</li>
<li>Adblock Detected: ${env.adblock}</li>
<li>WebRTC Leak Risk: ${env.webRTCLeak}</li>

</ul>

`;

overlay.innerHTML=`

<h1>Krynet Privacy Advisory</h1>

${summary}

${explanation}

${recommended}

${video}

`;

document.body.appendChild(overlay);

}


showAdvisory();

})();
