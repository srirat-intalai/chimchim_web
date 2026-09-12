// chimchim-settings.js
// หน้าตั้งค่า (settings.html): สลับ Light/Dark และ EN/TH — เก็บค่าไว้ผ่าน chimchim-i18n.js

function refreshSettingsUI() {
	var theme = getTheme();
	document.querySelectorAll("#themeToggle .settopt").forEach(function(btn) {
		btn.classList.toggle("active", btn.getAttribute("data-theme-choice") === theme);
	});
	var lang = getLang();
	document.querySelectorAll("#langToggle .settopt").forEach(function(btn) {
		btn.classList.toggle("active", btn.getAttribute("data-lang-choice") === lang);
	});
}

document.querySelectorAll("#themeToggle .settopt").forEach(function(btn) {
	btn.addEventListener("click", function() {
		setTheme(this.getAttribute("data-theme-choice"));
		refreshSettingsUI();
	});
});

document.querySelectorAll("#langToggle .settopt").forEach(function(btn) {
	btn.addEventListener("click", function() {
		setLang(this.getAttribute("data-lang-choice"));
		refreshSettingsUI();
		if (typeof showToast === "function") {
			showToast(getLang() === "th" ? "เปลี่ยนเป็นภาษาไทยแล้ว 🇹🇭" : "Switched to English 🇬🇧");
		}
	});
});

refreshSettingsUI();
