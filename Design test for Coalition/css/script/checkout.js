(() => {
    const root = document.documentElement;
    const themeButton = document.querySelector(".theme-toggle");
    const themeIcon = themeButton.querySelector(".theme-icon");
    const checkoutHeader = document.querySelector(".checkout-header");
    const headerTools = document.createElement("div");
    headerTools.className = "page-header-tools";
    const searchButton = document.createElement("button");
    searchButton.className = "icon-button page-search-toggle";
    searchButton.type = "button";
    searchButton.setAttribute("aria-label", "Search products");
    searchButton.setAttribute("aria-expanded", "false");
    searchButton.textContent = "⌕";
    headerTools.append(searchButton, themeButton);
    checkoutHeader.insertBefore(headerTools, checkoutHeader.querySelector(".text-link"));

    const searchForm = document.createElement("form");
    searchForm.className = "search-panel page-search-panel";
    searchForm.setAttribute("role", "search");
    searchForm.hidden = true;
    searchForm.innerHTML = '<label class="visually-hidden" for="checkout-product-search">Search products</label><input id="checkout-product-search" type="search" placeholder="Search cameras, lenses, and more"><button class="button button--small" type="submit">Search</button>';
    checkoutHeader.append(searchForm);
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
        window.location.href = `Index.html?search=${encodeURIComponent(query)}#featured`;
    });
    const savedTheme = (() => {
        try {
            return window.localStorage.getItem("edris-theme");
        } catch (error) {
            return null;
        }
    })();

    function setTheme(theme, persist) {
        root.dataset.theme = theme;
        themeIcon.textContent = theme === "dark" ? "☾" : "☼";
        themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
        document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#171918" : "#f4f3ef");
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

    const cartKey = "edris-camera-cart";
    const itemsContainer = document.querySelector(".order-items");
    const subtotalElement = document.querySelector(".order-subtotal");
    const totalElement = document.querySelector(".order-grand-total");
    const emptyMessage = document.querySelector(".empty-cart-message");
    const form = document.querySelector("#checkout-form");
    const feedback = document.querySelector(".checkout-feedback");

    function readCart() {
        try {
            const value = JSON.parse(window.localStorage.getItem(cartKey) || "[]");
            return Array.isArray(value) ? value.filter((item) =>
                item && typeof item.name === "string" && Number.isFinite(item.price) &&
                Number.isInteger(item.quantity) && item.quantity > 0) : [];
        } catch (error) {
            return [];
        }
    }

    function formatPrice(value) {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
    }

    function renderOrder() {
        const cart = readCart();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        itemsContainer.replaceChildren();
        emptyMessage.hidden = cart.length > 0;
        form.querySelector(".checkout-submit").disabled = cart.length === 0;

        cart.forEach((item) => {
            const row = document.createElement("div");
            row.className = "order-item";
            const details = document.createElement("div");
            const name = document.createElement("strong");
            name.textContent = item.name;
            const quantity = document.createElement("span");
            quantity.textContent = `Qty ${item.quantity}`;
            const price = document.createElement("strong");
            price.textContent = formatPrice(item.price * item.quantity);
            details.append(name, quantity);
            row.append(details, price);
            itemsContainer.append(row);
        });

        subtotalElement.textContent = formatPrice(subtotal);
        totalElement.textContent = formatPrice(subtotal);
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const cart = readCart();
        if (cart.length === 0) {
            feedback.textContent = "Add an item to your bag before placing an order.";
            return;
        }

        const method = new FormData(form).get("payment");
        feedback.textContent = `Demo order confirmed using ${method}. No payment was charged.`;
        feedback.classList.add("is-success");
        try {
            window.localStorage.removeItem(cartKey);
        } catch (error) {
            feedback.textContent = "Demo order confirmed, but the local bag could not be cleared.";
            feedback.classList.remove("is-success");
        }
        renderOrder();
        form.querySelector(".checkout-submit").disabled = true;
    });

    renderOrder();

    const revealTargets = document.querySelectorAll(
        ".checkout-title, .checkout-panel, .checkout-footer"
    );
    revealTargets.forEach((target) => target.classList.add("scroll-reveal"));
    if (!("IntersectionObserver" in window)) {
        revealTargets.forEach((target) => target.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-visible", entry.isIntersecting);
            });
        }, { threshold: 0.08 });
        revealTargets.forEach((target) => observer.observe(target));
    }

    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.type = "button";
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.textContent = "↑";
    document.body.append(backToTop);
    const updateBackToTop = () => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const threshold = Math.min(400, Math.max(80, scrollableHeight * 0.25));
        backToTop.classList.toggle("is-visible", window.scrollY > threshold);
    };
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();
    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
    });
})();
