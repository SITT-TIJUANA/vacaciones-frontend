import { useState, useEffect } from 'react';

export function useTema() {
  const [esMexico, setEsMexico] = useState(false);

  useEffect(() => {
    const check = () => setEsMexico(document.body.classList.contains('tema-mexico'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const headerStyle = (colorNormal) => esMexico
    ? { background: 'linear-gradient(135deg,#004d35,#006847,#CE1126)' }
    : { background: colorNormal };

  return { esMexico, headerStyle };
}
