export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const AUTH_RETURN_PARAM = 'returnTo';

export function getCurrentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function sanitizeReturnPath(path, fallback = '/') {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }

  try {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    if (['/login', '/signup', '/logout'].includes(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getAuthHref(authPath, returnTo = getCurrentPath()) {
  const params = new URLSearchParams({
    [AUTH_RETURN_PARAM]: sanitizeReturnPath(returnTo),
  });
  return `${authPath}?${params.toString()}`;
}

export function getAuthReturnPath(fallback = '/') {
  const params = new URLSearchParams(window.location.search);
  return sanitizeReturnPath(params.get(AUTH_RETURN_PARAM), fallback);
}

export function Link({ href, className, children, ...props }) {
  function handleClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(href);
  }

  return (
    <a href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
