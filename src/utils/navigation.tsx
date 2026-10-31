import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

export function navigate(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const AUTH_RETURN_PARAM = 'returnTo';

export function getCurrentPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function sanitizeReturnPath(
  path: string | null | undefined,
  fallback = '/',
): string {
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

export function getAuthHref(
  authPath: string,
  returnTo: string = getCurrentPath(),
): string {
  const params = new URLSearchParams({
    [AUTH_RETURN_PARAM]: sanitizeReturnPath(returnTo),
  });
  return `${authPath}?${params.toString()}`;
}

export function getAuthReturnPath(fallback = '/'): string {
  const params = new URLSearchParams(window.location.search);
  return sanitizeReturnPath(params.get(AUTH_RETURN_PARAM), fallback);
}

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children?: ReactNode;
}

export function Link({ href, className, children, onClick, ...props }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (props.target && props.target !== '_self') ||
      props.download !== undefined
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
