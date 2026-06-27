export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
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
