// ==UserScript==
// @name         Brainly Enhancer
// @namespace    https://brainly.lat/
// @version      2026.05.21
// @description  Google Search flotante + miniaturas automáticas de adjuntos en Brainly
// @downloadURL  https://github.com/wernser412/Google-Search-on-Brainly/raw/refs/heads/main/Google%20Search%20in%20Movable%20&%20Resizable%20Box%20on%20Brainly.user.js
// @icon         https://github.com/wernser412/Google-Search-on-Brainly/raw/refs/heads/main/ICONO.ico
// @author       wernser412
// @match        https://brainly.lat/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    let searchBox, searchFrame, searchIcon, resizeHandle;

    //////////////////////////////////////////////////////////////////////
    // GOOGLE SEARCH BOX
    //////////////////////////////////////////////////////////////////////

    function createSearchUI() {

        searchIcon = document.createElement("img");

        searchIcon.src = "https://www.google.com/favicon.ico";

        searchIcon.style.cssText = `
            position: absolute;
            width: 24px;
            height: 24px;
            cursor: pointer;
            background: white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            padding: 4px;
            display: none;
            z-index: 999999;
        `;

        document.body.appendChild(searchIcon);

        searchBox = document.createElement("div");

        searchBox.style.cssText = `
            position: fixed;
            width: 500px;
            height: 400px;
            background: white;
            border: 1px solid #ccc;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            overflow: hidden;
            z-index: 999999;
            display: none;
            top: 50px;
            left: 50px;
            border-radius: 10px;
        `;

        let titleBar = document.createElement("div");

        titleBar.style.cssText = `
            width: 100%;
            height: 30px;
            background: #0078D7;
            color: white;
            font-size: 14px;
            font-weight: bold;
            display: flex;
            align-items: center;
            padding-left: 10px;
            cursor: grab;
            user-select: none;
        `;

        titleBar.innerText = "Google Search";

        let closeButton = document.createElement("span");

        closeButton.innerText = "✖";

        closeButton.style.cssText = `
            margin-left: auto;
            margin-right: 10px;
            cursor: pointer;
        `;

        closeButton.onclick = () => {
            searchBox.style.display = "none";
        };

        titleBar.appendChild(closeButton);

        searchBox.appendChild(titleBar);

        searchFrame = document.createElement("iframe");

        searchFrame.style.cssText = `
            width: 100%;
            height: calc(100% - 30px);
            border: none;
        `;

        searchBox.appendChild(searchFrame);

        resizeHandle = document.createElement("div");

        resizeHandle.style.cssText = `
            width: 15px;
            height: 15px;
            background: #0078D7;
            position: absolute;
            bottom: 0;
            right: 0;
            cursor: se-resize;
        `;

        searchBox.appendChild(resizeHandle);

        titleBar.onmousedown = function(event) {

            let startX = event.clientX;
            let startY = event.clientY;

            let startLeft = searchBox.offsetLeft;
            let startTop = searchBox.offsetTop;

            function moveAt(event) {

                let newLeft = startLeft + (event.clientX - startX);
                let newTop = startTop + (event.clientY - startY);

                searchBox.style.left = newLeft + "px";
                searchBox.style.top = newTop + "px";

            }

            function stopMove() {

                document.removeEventListener("mousemove", moveAt);
                document.removeEventListener("mouseup", stopMove);

            }

            document.addEventListener("mousemove", moveAt);
            document.addEventListener("mouseup", stopMove);

        };

        resizeHandle.onmousedown = function(event) {

            event.preventDefault();

            let startX = event.clientX;
            let startY = event.clientY;

            let startWidth = searchBox.offsetWidth;
            let startHeight = searchBox.offsetHeight;

            let resize = (event) => {

                requestAnimationFrame(() => {

                    let newWidth = Math.max(
                        300,
                        startWidth + (event.clientX - startX)
                    );

                    let newHeight = Math.max(
                        200,
                        startHeight + (event.clientY - startY)
                    );

                    searchBox.style.width = newWidth + "px";
                    searchBox.style.height = newHeight + "px";

                });

            };

            let stopResize = () => {

                document.removeEventListener("mousemove", resize);
                document.removeEventListener("mouseup", stopResize);

            };

            document.addEventListener("mousemove", resize);
            document.addEventListener("mouseup", stopResize);

        };

        document.body.appendChild(searchBox);

    }

    function onTextSelect() {

        let selectedText = window.getSelection().toString().trim();

        if (selectedText.length > 0) {

            let rect = window
                .getSelection()
                .getRangeAt(0)
                .getBoundingClientRect();

            searchIcon.style.left =
                `${rect.right + window.scrollX + 5}px`;

            searchIcon.style.top =
                `${rect.top + window.scrollY}px`;

            searchIcon.style.display = "block";

            searchIcon.onclick = () => {

                searchFrame.src =
                    `https://www.google.com/search?igu=1&q=${
                        encodeURIComponent(selectedText)
                    }`;

                searchBox.style.display = "block";

            };

        } else {

            searchIcon.style.display = "none";

        }

    }

    //////////////////////////////////////////////////////////////////////
    // MINIATURAS DE ADJUNTOS
    //////////////////////////////////////////////////////////////////////

    const imageCache = new Map();

    async function obtenerAdjunto(url) {

        return new Promise((resolve) => {

            const iframe = document.createElement("iframe");

            iframe.style.display = "none";

            iframe.src = url;

            document.body.appendChild(iframe);

            iframe.onload = () => {

                const buscar = () => {

                    try {

                        const doc =
                            iframe.contentDocument ||
                            iframe.contentWindow.document;

                        const img = doc.querySelector(
                            'img[data-testid="attachments-viewer-image-preview"]'
                        );

                        if (img?.src) {

                            iframe.remove();

                            resolve(img.src);

                            return;

                        }

                    } catch (e) {}

                    setTimeout(buscar, 300);

                };

                buscar();

            };

        });

    }

    function agregarMiniatura(item, src) {

        if (item.querySelector(".brainly-miniatura"))
            return;

        const container = document.createElement("div");

        container.className = "brainly-miniatura";

        container.style.cssText = `
            margin-top: 10px;
        `;

        const img = document.createElement("img");

        img.src = src;

        img.style.cssText = `
            width: 160px;
            max-height: 160px;
            object-fit: cover;
            border-radius: 10px;
            cursor: pointer;
            border: 1px solid #ccc;
            transition: .2s;
        `;

        img.onmouseenter = () => {
            img.style.transform = "scale(1.05)";
        };

        img.onmouseleave = () => {
            img.style.transform = "scale(1)";
        };

        img.onclick = () => {

            window.open(src, "_blank");

        };

        container.appendChild(img);

        const content = item.querySelector(
            ".brn-feed-item__content"
        );

        if (content) {

            content.appendChild(container);

        }

    }

    async function iniciarMiniaturas() {

        const items = document.querySelectorAll(
            ".brn-feed-item-wrapper"
        );

        for (const item of items) {

            if (item.dataset.miniReady)
                continue;

            item.dataset.miniReady = "1";

            const attachment = item.querySelector(
                ".brn-feed-item__attachment"
            );

            if (!attachment)
                continue;

            const link = item.querySelector(
                'a[data-test="feed-item-link"]'
            );

            if (!link)
                continue;

            const url = link.href;

            if (!imageCache.has(url)) {

                obtenerAdjunto(url).then(src => {

                    if (!src)
                        return;

                    imageCache.set(url, src);

                    agregarMiniatura(item, src);

                });

            } else {

                agregarMiniatura(
                    item,
                    imageCache.get(url)
                );

            }

        }

    }

    //////////////////////////////////////////////////////////////////////
    // INIT
    //////////////////////////////////////////////////////////////////////

    document.addEventListener(
        "mouseup",
        onTextSelect
    );

    createSearchUI();

    iniciarMiniaturas();

    new MutationObserver(() => {

        iniciarMiniaturas();

    }).observe(document.body, {
        childList: true,
        subtree: true
    });

})();
