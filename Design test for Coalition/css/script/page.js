(() => {
    const root = document.documentElement;
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
        themeColorMeta = document.createElement("meta");
        themeColorMeta.name = "theme-color";
        document.head.append(themeColorMeta);
    }
    const savedTheme = (() => {
        try {
            return window.localStorage.getItem("edris-theme");
        } catch (error) {
            return null;
        }
    })();
    const themeButton = document.createElement("button");
    themeButton.className = "icon-button theme-toggle page-theme-toggle";
    themeButton.type = "button";
    themeButton.innerHTML = '<span aria-hidden="true" class="theme-icon"></span>';
    document.querySelector(".checkout-header").insertBefore(themeButton, document.querySelector(".content-nav"));
    const pageTools = document.createElement("div");
    pageTools.className = "page-header-tools";
    const searchButton = document.createElement("button");
    searchButton.className = "icon-button page-search-toggle";
    searchButton.type = "button";
    searchButton.setAttribute("aria-label", "Search products");
    searchButton.setAttribute("aria-expanded", "false");
    searchButton.textContent = "⌕";
    const searchForm = document.createElement("form");
    searchForm.className = "search-panel page-search-panel";
    searchForm.setAttribute("role", "search");
    searchForm.hidden = true;
    searchForm.innerHTML = '<label class="visually-hidden" for="page-product-search">Search products</label><input id="page-product-search" type="search" placeholder="Search cameras, lenses, and more"><button class="button button--small" type="submit">Search</button>';
    pageTools.append(searchButton, themeButton);
    document.querySelector(".checkout-header").insertBefore(pageTools, document.querySelector(".content-nav"));
    searchButton.addEventListener("click", () => {
        searchForm.hidden = !searchForm.hidden;
        searchButton.setAttribute("aria-expanded", String(!searchForm.hidden));
        if (!searchForm.hidden) searchForm.querySelector("input").focus();
    });
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = searchForm.querySelector("input").value.trim();
        if (!query) {
            searchForm.querySelector("input").focus();
            return;
        }
        window.location.href = `../Index.html?search=${encodeURIComponent(query)}#featured`;
    });
    document.querySelector(".checkout-header").append(searchForm);

    function setTheme(theme, persist) {
        root.dataset.theme = theme;
        themeButton.querySelector(".theme-icon").textContent = theme === "dark" ? "☾" : "☼";
        themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
        themeColorMeta.setAttribute("content", theme === "dark" ? "#171918" : "#f4f3ef");
        if (persist) {
            try {
                window.localStorage.setItem("edris-theme", theme);
            } catch (error) {
                // Theme selection remains active for this page when storage is unavailable.
            }
        }
    }

    setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), false);
    themeButton.addEventListener("click", () => {
        setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });

    const pageContent = {
        cameras: ["Cameras for every kind of curious", "Explore compact everyday cameras, capable mirrorless systems, dependable DSLR bodies, and professional tools. Start with what you love to photograph, then find a camera that feels right in your hands.", "Shop featured cameras", "../Index.html#featured", "SHOP"],
        lenses: ["Find your focus", "Build a camera kit around the way you see. Discover bright primes, versatile zoom lenses, wide-angle perspectives, and telephoto reach for portraits, travel, landscapes, wildlife, and action.", "Explore featured lenses", "../Index.html#featured", "SHOP"],
        accessories: ["The details make the difference", "Complete your setup with camera bags, memory cards, tripods, straps, lighting, and useful everyday essentials. The right accessories keep your gear protected, organized, and ready for the next frame.", "Shop featured gear", "../Index.html#featured", "SHOP"],
        "new-arrivals": ["New things in focus", "Discover the latest additions to the Edris Camera Co. collection, including fresh camera bodies, lenses, and practical accessories for your next creative project.", "See featured products", "../Index.html#featured", "SHOP"],
        bestsellers: ["Community favorites", "Start with the gear photographers return to: thoughtful camera designs, versatile lenses, and dependable accessories that earn a place in the camera bag.", "Browse featured gear", "../Index.html#featured", "SHOP"],
        "film-cameras": ["A little more feeling in every frame", "Explore film and instant cameras for tactile, intentional image-making. Slow down, experiment with color, and bring photographs into the world as prints you can hold.", "Shop featured gear", "../Index.html#featured", "SHOP"],
        lighting: ["Shape the light, shape the story", "Explore compact on-camera flash, creative studio lighting, and light-shaping tools for portraits, products, events, and everything in between.", "Shop featured gear", "../Index.html#featured", "SHOP"],
        "tripods-support": ["Steady support for big ideas", "Find dependable tripods, heads, straps, and camera supports for landscapes, long exposures, studio work, and days spent exploring.", "Shop featured gear", "../Index.html#featured", "SHOP"],
        "contact-us": ["We’re here to help", "Have a question about choosing a camera or using this storefront demo? Send a note to hello@edriscamera.co. Our demonstration support inbox is ready for your questions.", "Email Edris Camera Co.", "mailto:hello@edriscamera.co", "CUSTOMER SUPPORT"],
        "shipping-information": ["Shipping, without the guesswork", "This storefront is a demonstration and orders are not dispatched. A live store shipping page should outline delivery regions, estimated arrival windows, tracking details, and any applicable fees.", "View the demo checkout", "../Checkout.html", "CUSTOMER SUPPORT"],
        "returns-refunds": ["A straightforward return experience", "This mock store does not accept or fulfil real orders. A live returns policy should clearly explain eligibility, return periods, product condition requirements, refund timing, and the steps to contact support.", "Contact customer support", "contact-us.html", "CUSTOMER SUPPORT"],
        warranty: ["Help that lasts beyond the first shot", "Warranty coverage depends on the product and its manufacturer. Keep your proof of purchase and product details available, then contact the seller or manufacturer for the applicable service terms.", "Contact customer support", "contact-us.html", "CUSTOMER SUPPORT"],
        faqs: ["A few good questions", "Can I buy products here? This is a front-end demo. Does checkout charge me? No. Card, PayPal, GCash, and bank transfer are selectable examples only. Where can I replace product photos? Edit each image src in the HTML file where it appears.", "See demo payment options", "../Checkout.html", "CUSTOMER SUPPORT"],
        "about-us": ["For the way you see", "Edris Camera Co. is a photography-first retail concept for the curious, the considered, and the moments in between. We bring useful gear, clear guidance, and creative inspiration together in one welcoming place.", "Meet the featured gear", "../Index.html#featured", "DISCOVER"],
        "photography-guides": ["Make the most of every frame", "Learn the basics of choosing a camera, understanding focal lengths, working with available light, and building a kit that grows alongside your photography.", "Browse featured gear", "../Index.html#featured", "DISCOVER"],
        blog: ["Notes from behind the lens", "This is the home for stories, field notes, gear perspectives, and ideas from the world of photography. It is ready for future articles, creator interviews, and dispatches from the field.", "Explore the store", "../Index.html#featured", "DISCOVER"],
        brands: ["Good gear, thoughtfully chosen", "Our concept collection highlights camera systems, lenses, and accessories from the makers photographers trust. Browse the featured range and discover the tools that suit your vision.", "Browse featured products", "../Index.html#featured", "DISCOVER"],
        "buying-guides": ["Choose gear with confidence", "Start with what you want to photograph, then consider size, handling, lens options, and budget. Our buying guides help you compare the details that matter before building a kit.", "Explore featured gear", "../Index.html#featured", "DISCOVER"],
        "privacy-policy": ["Your privacy matters", "This static storefront demo does not send personal details to a server. Newsletter and checkout forms provide local demonstration feedback only. A live store must publish its full privacy notice and securely process personal information.", "Return to the store", "../Index.html", "STORE INFORMATION"],
        "terms-of-service": ["Terms of service", "This website is a non-transactional demonstration. Product descriptions, prices, discounts, checkout, and payment methods are sample content only. No real purchase or payment is made.", "Return to the store", "../Index.html", "STORE INFORMATION"]
    };

    const pageId = document.body.dataset.page;
    const page = pageContent[pageId];
    const pageImage = document.querySelector(".content-image img");
    if (pageImage) {
        const video = document.createElement("video");
        video.src = "../camera-vip.mp4";
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.setAttribute("aria-hidden", "true");
        pageImage.replaceWith(video);
    }

    if (!page) {
        document.querySelector(".content-heading").textContent = "This page is unavailable";
        document.querySelector(".content-copy").textContent = "Use the store links to return to Edris Camera Co.";
        return;
    }

    const [heading, description, buttonLabel, buttonHref, section] = page;
    document.querySelector(".content-kicker").textContent = section;
    document.querySelector(".content-heading").textContent = heading;
    document.querySelector(".content-copy").textContent = description;
    const action = document.querySelector(".content-cta");
    action.href = buttonHref;
    action.innerHTML = `${buttonLabel} <span aria-hidden="true">↗</span>`;
    document.title = `${document.querySelector(".content-title-text").textContent} — Edris Camera Co.`;

    const revealTargets = document.querySelectorAll(
        ".content-title, .content-panel, .content-image, .content-backlinks, .checkout-footer"
    );
    observeScrollReveal(revealTargets);
    installBackToTop();

    function observeScrollReveal(targets) {
        targets.forEach((target) => target.classList.add("scroll-reveal"));
        if (!("IntersectionObserver" in window)) {
            targets.forEach((target) => target.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-visible", entry.isIntersecting);
            });
        }, { threshold: 0.08 });
        targets.forEach((target) => observer.observe(target));
    }

    function installBackToTop() {
        const button = document.createElement("button");
        button.className = "back-to-top";
        button.type = "button";
        button.setAttribute("aria-label", "Back to top");
        button.textContent = "↑";
        document.body.append(button);

        const updateVisibility = () => {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            const threshold = Math.min(400, Math.max(80, scrollableHeight * 0.25));
            button.classList.toggle("is-visible", window.scrollY > threshold);
        };
        window.addEventListener("scroll", updateVisibility, { passive: true });
        updateVisibility();
        button.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
            });
        });
    }
})();
