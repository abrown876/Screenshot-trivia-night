const BRANDING = {
  sponsor: {
    name: "Chilitos Jamexican Food",
    logo: "chilitos.jpg",
    link: "https://www.chilitosjamexican.com/",
    label: "Sponsored by Chilitos"
  }
};

function applyBranding() {
  const wraps = document.querySelectorAll('.partner-wrap, .sponsor-wrap');
  const logos = document.querySelectorAll('.partner-logo, .sponsor-logo');
  const labels = document.querySelectorAll('.partner-label, .sponsor-label');
  const links = document.querySelectorAll('.partner-link, .sponsor-link');
  const footers = document.querySelectorAll('.footer-text');

  logos.forEach(l => l.src = BRANDING.sponsor.logo);
  labels.forEach(l => l.textContent = BRANDING.sponsor.label);
  links.forEach(a => a.href = BRANDING.sponsor.link);
  wraps.forEach(w => w.style.display = 'block');
  footers.forEach(f => f.textContent = '© Screenshot Interactive');
}
