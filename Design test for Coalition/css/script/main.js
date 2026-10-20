(() => {
    const root = document.documentElement;
    const header = document.querySelector(".site-header");
    const themeToggle = document.querySelector(".theme-toggle");
    const themeIcon = document.querySelector(".theme-icon");
    const menuToggle = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".primary-navigation");
    const megaItems = [...document.querySelectorAll(".nav-item--mega")];
    const searchToggle = document.querySelector(".search-toggle");
    const searchPanel = document.querySelector(".search-panel");
    const searchInput = searchPanel.querySelector('input[type="search"]');
    const searchClear = searchPanel.querySelector(".search-clear");
    const progressBar = document.querySelector(".scroll-progress__bar");
    const progressLabel = document.querySelector(".scroll-progress__label");
    const backToTop = document.querySelector(".back-to-top");
    const cartCount = document.querySelector(".cart-count");
    const bagLink = document.querySelector(".bag-link");
    const toast = document.querySelector(".toast");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
    const cartStorageKey = "edris-camera-cart";
    const favoritesStorageKey = "edris-camera-favorites";
    let cart = readCart();
    let favorites = readFavorites();
    let cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    let toastTimeout;
    let scrollFrame = false;

    function readCart() {
        try {
            const saved = JSON.parse(window.localStorage.getItem(cartStorageKey) || "[]");
            return Array.isArray(saved) ? saved.filter((item) =>
                item && typeof item.name === "string" && Number.isFinite(item.price) &&
                Number.isInteger(item.quantity) && item.quantity > 0) : [];
        } catch (error) {
            return [];
        }
    }

    function readFavorites() {
        try {
            const saved = JSON.parse(window.localStorage.getItem(favoritesStorageKey) || "[]");
            return Array.isArray(saved)
                ? [...new Set(saved.filter((name) => typeof name === "string"))]
                : [];
        } catch (error) {
            return [];
        }
    }

    function saveCart() {
        try {
            window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
        } catch (error) {
            showToast("Your bag could not be saved in this browser.");
        }
    }

    function addProductToCart(name, price, quantity) {
        const existing = cart.find((item) => item.name === name);
        if (existing) existing.quantity += quantity;
        else cart.push({ name, price, quantity });
        cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = String(cartItems);
        bagLink.setAttribute("aria-label", `Shopping bag, ${cartItems} ${cartItems === 1 ? "item" : "items"}`);
        saveCart();
        renderShoppingLists();
    }

    cartCount.textContent = String(cartItems);
    bagLink.setAttribute("aria-label", `Shopping bag, ${cartItems} ${cartItems === 1 ? "item" : "items"}`);

    function getSavedTheme() {
        try {
            return window.localStorage.getItem("edris-theme");
        } catch (error) {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            window.localStorage.setItem("edris-theme", theme);
        } catch (error) {
            // Theme switching still works for this visit when storage is unavailable.
        }
    }

    function setTheme(theme, persist) {
        root.dataset.theme = theme;
        const isDark = theme === "dark";
        themeIcon.textContent = isDark ? "☾" : "☼";
        themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#171918" : "#f4f3ef");
        if (persist) saveTheme(theme);
    }

    setTheme(getSavedTheme() || (systemDarkMode.matches ? "dark" : "light"), false);

    themeToggle.addEventListener("click", () => {
        setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });

    function setMenuOpen(open) {
        navigation.classList.toggle("is-open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        if (!open) megaItems.forEach((item) => setMegaOpen(item, false));
    }

    function setMegaOpen(item, open) {
        item.classList.toggle("is-open", open);
        item.querySelector(".mega-toggle").setAttribute("aria-expanded", String(open));
    }

    menuToggle.addEventListener("click", () => {
        setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    megaItems.forEach((item) => {
        item.querySelector(".mega-toggle").addEventListener("click", () => {
            const open = item.querySelector(".mega-toggle").getAttribute("aria-expanded") !== "true";
            megaItems.forEach((otherItem) => setMegaOpen(otherItem, otherItem === item && open));
        });
    });

    navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            if (window.matchMedia("(max-width: 760px)").matches) setMenuOpen(false);
            else megaItems.forEach((item) => setMegaOpen(item, false));
        });
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".nav-item--mega")) {
            megaItems.forEach((item) => setMegaOpen(item, false));
        }
        if (!searchPanel.contains(event.target) && !searchToggle.contains(event.target)) {
            searchPanel.hidden = true;
            searchToggle.setAttribute("aria-expanded", "false");
        }
        if (window.matchMedia("(max-width: 760px)").matches &&
            !navigation.contains(event.target) && !menuToggle.contains(event.target)) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setMenuOpen(false);
            megaItems.forEach((item) => setMegaOpen(item, false));
            searchPanel.hidden = true;
            searchToggle.setAttribute("aria-expanded", "false");
        }
    });

    searchToggle.addEventListener("click", () => {
        const open = searchPanel.hidden;
        searchPanel.hidden = !open;
        searchToggle.setAttribute("aria-expanded", String(open));
        if (open) searchPanel.querySelector("input").focus();
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        window.clearTimeout(toastTimeout);
        toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
    }

    searchPanel.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = searchInput.value.trim();
        if (!query) {
            searchInput.focus();
            return;
        }
        showProductResults(query);
        document.querySelector("#featured").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
        searchPanel.hidden = true;
        searchToggle.setAttribute("aria-expanded", "false");
        const url = new URL(window.location.href);
        url.searchParams.set("search", query);
        window.history.replaceState({}, "", url);
    });

    const productCards = [...document.querySelectorAll(".product-card")];
    const productSearchFeedback = document.querySelector(".product-search-feedback");
    const productGrid = document.querySelector(".product-grid");
    const productModal = document.querySelector(".product-modal");
    const modalImage = productModal.querySelector(".product-modal__image");
    const modalClose = productModal.querySelector(".product-modal__close");
    const modalAddButton = productModal.querySelector(".modal-add-to-cart");
    const modalBuyButton = productModal.querySelector(".modal-buy-now");
    let activeProduct = null;
    let previousFocus = null;
    let imageScale = 1;
    let imageRotation = 0;
    let pointerStart = null;

    function updateSearchResults(value) {
        const query = value.trim();
        searchClear.hidden = query.length === 0;
        if (!query) {
            productCards.forEach((card) => { card.hidden = false; });
            productGrid.classList.remove("is-searching");
            productSearchFeedback.textContent = "";
            productSearchFeedback.classList.remove("is-empty");
            const url = new URL(window.location.href);
            url.searchParams.delete("search");
            window.history.replaceState({}, "", url);
            return;
        }
        showProductResults(query, false);
        const url = new URL(window.location.href);
        url.searchParams.set("search", query);
        window.history.replaceState({}, "", url);
    }

    function showProductResults(query, announce = true) {
        const normalizedQuery = query.trim().toLowerCase();
        const terms = normalizedQuery.split(/\s+/).filter(Boolean);
        productGrid.classList.toggle("is-searching", terms.length > 0);
        const matches = productCards.filter((card) => {
            const searchableText = `${card.innerText} ${card.querySelector("img").alt}`.toLowerCase();
            const isMatch = terms.every((term) => searchableText.includes(term));
            card.hidden = !isMatch;
            return isMatch;
        });
        productSearchFeedback.textContent = matches.length
            ? `${matches.length} ${matches.length === 1 ? "product" : "products"} found for “${query}”.`
            : `No products found for “${query}”. Try camera, lens, bag, tripod, light, or film.`;
        productSearchFeedback.classList.toggle("is-empty", matches.length === 0);
        if (announce) showToast(productSearchFeedback.textContent);
    }

    searchInput.addEventListener("input", () => updateSearchResults(searchInput.value));
    searchClear.addEventListener("click", () => {
        searchInput.value = "";
        updateSearchResults("");
        searchInput.focus();
    });

    const initialSearch = new URLSearchParams(window.location.search).get("search");
    if (initialSearch) {
        searchInput.value = initialSearch;
        searchClear.hidden = false;
        showProductResults(initialSearch, false);
        window.setTimeout(() => {
            document.querySelector("#featured").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
        }, 100);
    }

    function getProductInformation(card) {
        const name = card.querySelector("h3").textContent.trim();
        const lowerName = name.toLowerCase();
        const rating = card.querySelector(".product-card__rating span:last-child")?.textContent || "4.8";
        const badge = card.querySelector(".product-badge")?.textContent.trim() || "Featured";
        const priceMarkup = card.querySelector(".product-price").innerHTML;
        const info = {
            description: `Meet the ${name}, thoughtfully selected for dependable performance and an easy fit in your creative kit. Designed to help you spend more time making images and less time second-guessing your gear.`,
            features: ["Thoughtfully selected for everyday creative work", "Reliable, easy-to-use design", "A considered addition to a growing camera kit"],
            specs: [["Category", "Photography gear"], ["Collection", "Edris Camera Co."], ["Rating", `${rating} / 5`], ["Availability", "In stock"]]
        };

        if (lowerName.includes("camera")) {
            info.description = `${name} puts a capable imaging tool within reach for everyday storytelling, travel, and creative projects. A versatile choice for photographers building a kit around the moments they love to capture.`;
            info.features = ["Versatile camera for stills and creative projects", "Comfortable size for everyday carrying", "Works as the center of a flexible camera kit"];
            info.specs = [["Product type", "Digital camera"], ["Use", "Travel & everyday"], ["Collection", "Edris Camera Co."], ["Rating", `${rating} / 5`]];
        } else if (lowerName.includes("lens")) {
            info.description = `${name} gives you another way to shape a frame, with a focal-length choice suited to expressive portraits, travel details, and considered everyday photography.`;
            info.features = ["Dedicated focal-length perspective", "A useful creative pairing for compatible camera bodies", "Designed for portraits, travel, or everyday scenes"];
            info.specs = [["Product type", "Camera lens"], ["Focal range", name.match(/\d+mm[^ ]*/i)?.[0] || "Prime / zoom"], ["Mount", "Check camera compatibility"], ["Rating", `${rating} / 5`]];
        } else if (lowerName.includes("tripod")) {
            info.description = `${name} gives your camera steady support for landscapes, long exposures, self portraits, and carefully composed frames. A practical companion for studio sessions and trips alike.`;
            info.features = ["Steady support for considered compositions", "Useful for landscapes and low-light scenes", "Pairs with a range of camera setups"];
            info.specs = [["Product type", "Camera support"], ["Use", "Studio & outdoors"], ["Setup", "Adjustable support"], ["Rating", `${rating} / 5`]];
        } else if (lowerName.includes("bag")) {
            info.description = `${name} keeps your everyday camera essentials close and organized, with a travel-friendly format for days spent moving between locations.`;
            info.features = ["Convenient everyday carry", "Space for essential photography gear", "Made for travel and day-to-day exploring"];
            info.specs = [["Product type", "Camera bag"], ["Use", "Travel & everyday"], ["Storage", "Camera essentials"], ["Rating", `${rating} / 5`]];
        } else if (lowerName.includes("light") || lowerName.includes("flash")) {
            info.description = `${name} helps you add and shape light for portraits, product images, and creative video. Keep it close for extra control when available light is not enough.`;
            info.features = ["Adds creative control over your lighting", "Useful for portraits and close-up work", "Compact accessory for a flexible kit"];
            info.specs = [["Product type", "Lighting accessory"], ["Use", "Photo & video"], ["Setup", "Portable lighting"], ["Rating", `${rating} / 5`]];
        } else if (lowerName.includes("memory")) {
            info.description = `${name} gives your camera kit practical room for more photographs and video clips, ready for a full day of creating.`;
            info.features = ["Convenient storage for photo and video files", "Compact addition to your camera bag", "Useful spare media for travel and events"];
            info.specs = [["Product type", "Memory card"], ["Capacity", "128GB"], ["Use", "Photo & video storage"], ["Rating", `${rating} / 5`]];
        } else if (lowerName.includes("instant")) {
            info.description = `${name} brings the fun of making a photograph you can hold, with a simple, hands-on approach to everyday memories and creative snapshots.`;
            info.features = ["A tangible take on everyday photography", "Fun for celebrations and travel", "An easy creative companion"];
            info.specs = [["Product type", "Instant camera"], ["Use", "Everyday snapshots"], ["Format", "Instant photography"], ["Rating", `${rating} / 5`]];
        }

        return {
            name,
            rating,
            badge,
            price: Number(card.querySelector(".add-to-cart").dataset.price),
            priceMarkup,
            image: card.querySelector(".product-card__visual img").src,
            alt: card.querySelector(".product-card__visual img").alt,
            ...info
        };
    }

    const shoppingListDialog = document.querySelector(".shopping-list-dialog");
    const favoritesToggle = document.querySelector(".favorites-toggle");
    const favoriteCount = document.querySelector(".favorites-count");
    const favoritesItems = shoppingListDialog.querySelector(".favorites-items");
    const bagItems = shoppingListDialog.querySelector(".bag-items");
    let listReturnFocus = null;

    function saveFavorites() {
        try {
            window.localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
        } catch (error) {
            showToast("Your favorites could not be saved in this browser.");
        }
    }

    function updateFavoriteButtons() {
        productCards.forEach((card) => {
            const name = card.querySelector("h3").textContent.trim();
            const button = card.querySelector(".wishlist-button");
            const isSaved = favorites.includes(name);
            button.setAttribute("aria-pressed", String(isSaved));
            button.setAttribute("aria-label", `${isSaved ? "Remove" : "Add"} ${name} ${isSaved ? "from" : "to"} favorites`);
            button.textContent = isSaved ? "♥" : "♡";
        });
        favoriteCount.textContent = String(favorites.length);
        favoritesToggle.setAttribute("aria-label", `Favorites, ${favorites.length} ${favorites.length === 1 ? "item" : "items"}`);
        shoppingListDialog.querySelector(".favorites-count-text").textContent = String(favorites.length);
    }

    function createListItem(name, price, quantity, imageSource, type) {
        const row = document.createElement("article");
        row.className = "shopping-list-item";
        const image = document.createElement("img");
        image.alt = "";
        image.loading = "lazy";
        if (imageSource) image.src = imageSource;

        const details = document.createElement("div");
        details.className = "shopping-list-item__details";
        const title = document.createElement("h3");
        title.textContent = name;
        const amount = document.createElement("p");
        amount.className = "shopping-list-item__price";
        amount.textContent = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
            .format(price * quantity);
        details.append(title, amount);
        row.append(image, details);

        const actions = document.createElement("div");
        actions.className = "shopping-list-item__actions";
        if (type === "bag") {
            const quantityControl = document.createElement("div");
            quantityControl.className = "quantity-control";
            quantityControl.setAttribute("aria-label", `Quantity for ${name}`);
            const decrease = document.createElement("button");
            decrease.type = "button";
            decrease.textContent = "−";
            decrease.setAttribute("aria-label", `Decrease ${name} quantity`);
            decrease.dataset.listAction = "decrease";
            decrease.dataset.name = name;
            const quantityLabel = document.createElement("span");
            quantityLabel.textContent = String(quantity);
            const increase = document.createElement("button");
            increase.type = "button";
            increase.textContent = "+";
            increase.setAttribute("aria-label", `Increase ${name} quantity`);
            increase.dataset.listAction = "increase";
            increase.dataset.name = name;
            quantityControl.append(decrease, quantityLabel, increase);
            actions.append(quantityControl);
        } else {
            const addButton = document.createElement("button");
            addButton.type = "button";
            addButton.className = "shopping-list-add";
            addButton.textContent = "Add to bag";
            addButton.dataset.listAction = "add-to-bag";
            addButton.dataset.name = name;
            actions.append(addButton);
        }
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "shopping-list-remove";
        removeButton.textContent = type === "favorites" ? "Unfavorite" : "Remove";
        removeButton.dataset.listAction = "remove";
        removeButton.dataset.name = name;
        actions.append(removeButton);
        row.append(actions);
        return row;
    }

    function renderShoppingLists() {
        const savedBag = cart;
        const subtotal = savedBag.reduce((sum, item) => sum + item.price * item.quantity, 0);
        updateFavoriteButtons();

        favoritesItems.replaceChildren(...favorites.map((name) => {
            const card = productCards.find((item) => item.querySelector("h3").textContent.trim() === name);
            if (!card) return null;
            const product = getProductInformation(card);
            return createListItem(product.name, product.price, 1, product.image, "favorites");
        }).filter(Boolean));
        shoppingListDialog.querySelector(".favorites-empty").hidden = favoritesItems.children.length > 0;

        bagItems.replaceChildren(...savedBag.map((item) => {
            const card = productCards.find((entry) => entry.querySelector("h3").textContent.trim() === item.name);
            const imageSource = card ? card.querySelector(".product-card__visual img").src : "";
            return createListItem(item.name, item.price, item.quantity, imageSource, "bag");
        }));
        shoppingListDialog.querySelector(".bag-empty").hidden = savedBag.length > 0;
        shoppingListDialog.querySelector(".bag-count-text").textContent = String(cartItems);
        shoppingListDialog.querySelector(".bag-subtotal").textContent =
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(subtotal);
        cartCount.textContent = String(cartItems);
        bagLink.setAttribute("aria-label", `Shopping bag, ${cartItems} ${cartItems === 1 ? "item" : "items"}`);
    }

    function openShoppingList(tab) {
        listReturnFocus = document.activeElement;
        shoppingListDialog.showModal();
        setShoppingListTab(tab);
        shoppingListDialog.querySelector(`[role="tab"][data-list-tab="${tab}"]`).focus();
    }

    function setShoppingListTab(tab) {
        shoppingListDialog.querySelectorAll('[role="tab"]').forEach((button) => {
            const selected = button.dataset.listTab === tab;
            button.setAttribute("aria-selected", String(selected));
            button.tabIndex = selected ? 0 : -1;
        });
        shoppingListDialog.querySelectorAll(".shopping-list-panel").forEach((panel) => {
            panel.hidden = panel.dataset.panel !== tab;
        });
        shoppingListDialog.querySelector("#shopping-list-title").innerHTML =
            tab === "favorites" ? "Saved <em>for you.</em>" : "Your <em>bag.</em>";
    }

    document.querySelectorAll(".list-toggle").forEach((button) => {
        button.addEventListener("click", () => openShoppingList(button.dataset.listTab));
    });
    shoppingListDialog.querySelector(".shopping-list-close").addEventListener("click", () => shoppingListDialog.close());
    shoppingListDialog.querySelectorAll('[role="tab"]').forEach((button) => {
        button.addEventListener("click", () => setShoppingListTab(button.dataset.listTab));
        button.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const nextTab = button.dataset.listTab === "favorites" ? "bag" : "favorites";
            setShoppingListTab(nextTab);
            shoppingListDialog.querySelector(`[role="tab"][data-list-tab="${nextTab}"]`).focus();
        });
    });
    shoppingListDialog.addEventListener("click", (event) => {
        if (event.target === shoppingListDialog) shoppingListDialog.close();
    });
    shoppingListDialog.addEventListener("close", () => {
        if (listReturnFocus instanceof HTMLElement) listReturnFocus.focus({ preventScroll: true });
    });
    shoppingListDialog.addEventListener("click", (event) => {
        const button = event.target.closest("[data-list-action]");
        if (!button) return;
        const { listAction, name } = button.dataset;
        if (listAction === "remove" && button.closest(".favorites-items")) {
            favorites = favorites.filter((item) => item !== name);
            saveFavorites();
            renderShoppingLists();
            return;
        }
        if (listAction === "add-to-bag") {
            const card = productCards.find((item) => item.querySelector("h3").textContent.trim() === name);
            if (card) {
                const product = getProductInformation(card);
                addProductToCart(product.name, product.price, 1);
                showToast(`${product.name} added to your bag.`);
            }
            return;
        }
        if (listAction === "remove") {
            cart = cart.filter((item) => item.name !== name);
        } else {
            const item = cart.find((entry) => entry.name === name);
            if (!item) return;
            item.quantity += listAction === "increase" ? 1 : -1;
            if (item.quantity < 1) cart = cart.filter((entry) => entry !== item);
        }
        cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        saveCart();
        renderShoppingLists();
    });
    renderShoppingLists();

    function openProductModal(card) {
        activeProduct = getProductInformation(card);
        previousFocus = document.activeElement;
        imageScale = 1;
        imageRotation = 0;
        pointerStart = null;
        modalImage.src = activeProduct.image;
        modalImage.alt = activeProduct.alt;
        modalImage.draggable = false;
        modalImage.classList.remove("is-dragging");
        modalImage.style.transform = "scale(1) rotate(0deg)";
        productModal.querySelector(".product-modal__badge").textContent = activeProduct.badge;
        productModal.querySelector(".product-modal__rating").textContent = `★★★★★  ${activeProduct.rating} / 5`;
        productModal.querySelector("#product-modal-title").textContent = activeProduct.name;
        productModal.querySelector(".product-modal__price").innerHTML = activeProduct.priceMarkup;
        productModal.querySelector(".product-modal__description").textContent = activeProduct.description;
        productModal.querySelector(".product-modal__features").replaceChildren(
            ...activeProduct.features.map((feature) => {
                const item = document.createElement("li");
                item.textContent = feature;
                return item;
            })
        );
        const specifications = productModal.querySelector(".product-modal__specifications");
        specifications.replaceChildren(...activeProduct.specs.map(([label, value]) => {
            const entry = document.createElement("div");
            const term = document.createElement("dt");
            const detail = document.createElement("dd");
            term.textContent = label;
            detail.textContent = value;
            entry.append(term, detail);
            return entry;
        }));
        productModal.querySelector(".product-modal__benefit").textContent =
            `Why it’s worth a look: ${activeProduct.name} is a practical, considered choice to help your creative kit do more.`;
        modalAddButton.dataset.product = activeProduct.name;
        modalAddButton.dataset.price = String(activeProduct.price);
        modalBuyButton.dataset.product = activeProduct.name;
        modalBuyButton.dataset.price = String(activeProduct.price);
        productModal.showModal();
        modalClose.focus();
    }

    function closeProductModal() {
        if (!productModal.open) return;
        productModal.close();
        if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    }

    function updateProductView() {
        imageScale = Math.min(2.5, Math.max(1, imageScale));
        modalImage.style.transform = `scale(${imageScale}) rotate(${imageRotation}deg)`;
    }

    productCards.forEach((card) => {
        card.tabIndex = 0;
        card.setAttribute("aria-label", `View details for ${card.querySelector("h3").textContent}`);
        card.addEventListener("click", (event) => {
            if (event.target.closest("button, a")) return;
            openProductModal(card);
        });
        card.addEventListener("keydown", (event) => {
            if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
            event.preventDefault();
            openProductModal(card);
        });
    });

    modalClose.addEventListener("click", closeProductModal);
    productModal.addEventListener("click", (event) => {
        if (event.target === productModal) closeProductModal();
    });
    productModal.addEventListener("close", () => {
        if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    });
    productModal.querySelectorAll("[data-viewer-action]").forEach((button) => {
        button.addEventListener("click", () => {
            switch (button.dataset.viewerAction) {
                case "zoom-in": imageScale += .25; break;
                case "zoom-out": imageScale -= .25; break;
                case "rotate-left": imageRotation -= 45; break;
                case "rotate-right": imageRotation += 45; break;
                default: imageScale = 1; imageRotation = 0;
            }
            updateProductView();
        });
    });

    const imageStage = productModal.querySelector(".product-modal__stage");
    imageStage.addEventListener("pointerdown", (event) => {
        pointerStart = event.clientX;
        modalImage.classList.add("is-dragging");
        imageStage.setPointerCapture(event.pointerId);
    });
    imageStage.addEventListener("pointerup", (event) => {
        if (pointerStart === null) return;
        imageRotation += Math.round((event.clientX - pointerStart) / 3);
        pointerStart = null;
        modalImage.classList.remove("is-dragging");
        updateProductView();
    });
    imageStage.addEventListener("pointercancel", () => {
        pointerStart = null;
        modalImage.classList.remove("is-dragging");
    });

    modalAddButton.addEventListener("click", () => {
        if (!activeProduct) return;
        addProductToCart(activeProduct.name, activeProduct.price, 1);
        showToast(`${activeProduct.name} added to your bag.`);
        closeProductModal();
    });
    modalBuyButton.addEventListener("click", () => {
        if (!activeProduct) return;
        addProductToCart(activeProduct.name, activeProduct.price, 1);
        window.location.href = "Checkout.html";
    });

    document.querySelectorAll(".add-to-cart").forEach((button) => {
        button.addEventListener("click", () => {
            addProductToCart(button.dataset.product, Number(button.dataset.price), 1);
            showToast(`${button.dataset.product} added to your bag.`);
        });
    });

    document.querySelectorAll(".buy-now").forEach((button) => {
        button.addEventListener("click", () => {
            addProductToCart(button.dataset.product, Number(button.dataset.price), 1);
            window.location.href = "Checkout.html";
        });
    });

    document.querySelectorAll(".wishlist-button").forEach((button) => {
        button.addEventListener("click", () => {
            const name = button.closest(".product-card").querySelector("h3").textContent.trim();
            const isSaved = !favorites.includes(name);
            favorites = isSaved
                ? [...favorites, name]
                : favorites.filter((item) => item !== name);
            saveFavorites();
            renderShoppingLists();
            showToast(isSaved ? "Added to your favorites." : "Removed from your favorites.");
        });
    });

    const newsletterForm = document.querySelector(".newsletter-form");
    const emailInput = document.querySelector("#newsletter-email");
    const feedback = document.querySelector(".form-feedback");

    newsletterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        feedback.classList.remove("is-success");
        if (!emailInput.value.trim() || !emailInput.validity.valid) {
            feedback.textContent = "Please enter a valid email address.";
            emailInput.setAttribute("aria-invalid", "true");
            emailInput.focus();
            return;
        }
        emailInput.removeAttribute("aria-invalid");
        feedback.textContent = "You’re on the list. Watch your inbox for a little inspiration.";
        feedback.classList.add("is-success");
        newsletterForm.reset();
    });

    emailInput.addEventListener("input", () => {
        emailInput.removeAttribute("aria-invalid");
        feedback.textContent = "";
        feedback.classList.remove("is-success");
    });

    function updateScrollState() {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percentage = scrollableHeight > 0
            ? Math.min(100, Math.max(0, Math.round((window.scrollY / scrollableHeight) * 100)))
            : 0;
        progressBar.style.width = `${percentage}%`;
        progressLabel.textContent = `${percentage}%`;
        header.classList.toggle("is-scrolled", window.scrollY > 20);
        const backToTopThreshold = Math.min(400, Math.max(80, scrollableHeight * 0.25));
        backToTop.classList.toggle("is-visible", window.scrollY > backToTopThreshold);
        scrollFrame = false;
    }

    function requestScrollUpdate() {
        if (scrollFrame) return;
        scrollFrame = true;
        window.requestAnimationFrame(updateScrollState);
    }

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
    updateScrollState();

    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    });

    document.querySelectorAll("img").forEach((image) => {
        image.addEventListener("error", () => {
            if (image.dataset.fallbackApplied) return;
            image.dataset.fallbackApplied = "true";
            image.src = "Images/img1camera.png";
        });
    });

    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
        [...categoryGrid.querySelectorAll(".category-card")]
            .sort((a, b) => Number(a.querySelector(".category-card__number").textContent) -
                Number(b.querySelector(".category-card__number").textContent))
            .forEach((card) => categoryGrid.append(card));

        document.querySelectorAll(".carousel-button").forEach((button) => {
            button.addEventListener("click", () => {
                const card = categoryGrid.querySelector(".category-card");
                const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(categoryGrid).columnGap);
                const direction = button.dataset.direction === "next" ? 1 : -1;
                const visibleCards = window.matchMedia("(max-width: 760px)").matches ? 1 : 3;
                categoryGrid.scrollBy({
                    left: direction * step * visibleCards,
                    behavior: reducedMotion.matches ? "auto" : "smooth"
                });
            });
        });
    }

    const revealTargets = document.querySelectorAll(
        ".hero__copy, .hero__visual, .section-heading, .category-card, .product-card, " +
        ".story-copy, .story-image, .promo-copy, .newsletter-copy, .newsletter-form, " +
        ".footer-brand, .footer-column, .footer-bottom"
    );
    revealTargets.forEach((target) => target.classList.add("scroll-reveal"));
    if (!("IntersectionObserver" in window)) {
        revealTargets.forEach((target) => target.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-visible", entry.isIntersecting);
            });
        }, { threshold: 0.08 });
        revealTargets.forEach((target) => revealObserver.observe(target));
    }
})();