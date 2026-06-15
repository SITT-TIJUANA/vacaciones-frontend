// Lee el tema una sola vez — sin MutationObserver que causa re-renders
export function useTema() {
  const esMexico = typeof document !== 'undefined' &&
    (document.body.classList.contains('tema-mexico') ||
     sessionStorage.getItem('mx-tema') === '1' ||
     localStorage.getItem('mx-tema') === '1');

  const headerStyle = (colorNormal) => esMexico
    ? { background: 'linear-gradient(135deg,#004d35,#006847,#CE1126)' }
    : { background: colorNormal };

  return { esMexico, headerStyle };
}
