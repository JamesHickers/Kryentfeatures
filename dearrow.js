(function () {

const LICENSE = "FR3Lo-e986a";

/* universal youtube id detection */

const YT_REGEX =
/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|piped\.[^/]+\/watch\?v=|invidious\.[^/]+\/watch\?v=)([a-zA-Z0-9_-]{11})/;

/* fallback detection */

function extractID(url){

    const match = url.match(YT_REGEX);
    if(match) return match[1];

    const id = url.match(/[a-zA-Z0-9_-]{11}/);
    return id ? id[0] : null;
}

/* fetch DeArrow branding */

async function fetchBranding(id){

    try{

        const res = await fetch(
        `https://sponsor.ajay.app/api/branding?videoID=${id}&license=${LICENSE}`
        );

        if(!res.ok) return null;

        return await res.json();

    }catch{

        return null;

    }

}

/* smarter element detection */

function findTitle(container){

    return (
        container.querySelector("[data-embed-title]") ||
        container.querySelector(".embed-title") ||
        container.querySelector("a[href]")
    );

}

function findThumbnail(container){

    return (
        container.querySelector("[data-embed-thumbnail]") ||
        container.querySelector(".embed-thumbnail") ||
        container.querySelector("img")
    );

}

/* apply DeArrow */

async function processEmbed(container){

    if(container.__dearrowDone) return;

    const iframe = container.querySelector("iframe");
    const video = container.querySelector("video");

    let url = iframe?.src || video?.src;

    if(!url) return;

    const id = extractID(url);

    if(!id) return;

    const data = await fetchBranding(id);

    if(!data) return;

    const titleEl = findTitle(container);
    const thumbEl = findThumbnail(container);

    if(!titleEl && !thumbEl) return;

    const orig = {
        title: titleEl?.textContent,
        thumb: thumbEl?.src
    };

    const newTitle =
        data.titles?.[0]?.votes >= 0
        ? data.titles[0].title.replace(/(^|\s)>(\S)/g,"$1$2")
        : null;

    const newThumb =
        data.thumbnails?.[0]?.votes >= 0 &&
        !data.thumbnails[0].original
        ? `https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=${id}&time=${data.thumbnails[0].timestamp}&license=${LICENSE}`
        : null;

    if(!newTitle && !newThumb) return;

    /* apply automatically */

    if(titleEl && newTitle) titleEl.textContent = newTitle;
    if(thumbEl && newThumb) thumbEl.src = newThumb;

    /* toggle button */

    const btn = document.createElement("button");

    btn.textContent = "DeArrow";

    Object.assign(btn.style,{
        position:"absolute",
        top:"6px",
        right:"6px",
        background:"#2f3136",
        color:"#fff",
        border:"none",
        borderRadius:"6px",
        fontSize:"11px",
        padding:"3px 6px",
        cursor:"pointer",
        zIndex:"10"
    });

    btn.dataset.state = "dearrow";

    btn.onclick = () => {

        if(btn.dataset.state === "dearrow"){

            if(titleEl && newTitle) titleEl.textContent = orig.title;
            if(thumbEl && newThumb) thumbEl.src = orig.thumb;

            btn.dataset.state = "original";

        }else{

            if(titleEl && newTitle) titleEl.textContent = newTitle;
            if(thumbEl && newThumb) thumbEl.src = newThumb;

            btn.dataset.state = "dearrow";

        }

    };

    container.style.position ||= "relative";
    container.appendChild(btn);

    container.__dearrowDone = true;

}

/* scan Krynet embeds */

function scan(){

    const embeds = document.querySelectorAll("iframe, video");

    embeds.forEach(node=>{

        const container =
        node.closest(".embed") ||
        node.closest(".message") ||
        node.parentElement;

        if(container) processEmbed(container);

    });

}

/* observe dynamic embeds */

const observer = new MutationObserver(scan);

observer.observe(document.body,{
    childList:true,
    subtree:true
});

/* initial run */

scan();

})();
