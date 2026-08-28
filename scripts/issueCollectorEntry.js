const collectorIntroLayer = document.querySelector(".collector-intro-layer");

if (collectorIntroLayer && document.documentElement.classList.contains("collector-intro-active")) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finishCollectorIntro();
    else collectorIntroLayer.addEventListener("animationend", finishCollectorIntro, { once: true });
}


/** Removes the finished intro without changing the visible Issue Collector screen. */
function finishCollectorIntro() {
    collectorIntroLayer?.remove();
    document.documentElement.classList.remove("collector-intro-active");
}
