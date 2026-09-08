const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const label = toggle.querySelector(".theme-label");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

root.classList.add("theme-ready");

function getCurrentTheme() {
    return root.dataset.theme || (systemTheme.matches ? "dark" : "light");
}

function updateToggle() {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    const action = `Use ${nextTheme} mode`;

    toggle.dataset.nextTheme = nextTheme;
    toggle.setAttribute("aria-label", action);
    label.textContent = action;
}

toggle.addEventListener("click", () => {
    const theme = toggle.dataset.nextTheme;
    root.dataset.theme = theme;

    try {
        localStorage.setItem("portfolio-theme", theme);
    } catch (error) {
        console.warn("Unable to save the color theme.", error);
    }

    updateToggle();
});

systemTheme.addEventListener("change", updateToggle);
updateToggle();
