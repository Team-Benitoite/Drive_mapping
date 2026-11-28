import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export interface HelpTipProps {
  title: string;
  description: string;
  usage?: string;
  className?: string;
}

const HELP_OPEN_EVENT = 'dm_helptip_open';

export default function HelpTip({
  title,
  description,
  usage,
  className = '',
}: HelpTipProps) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    arrowLeft: number;
    placement: 'top' | 'bottom';
  }>({
    top: 0,
    left: 12,
    arrowLeft: 24,
    placement: 'bottom',
  });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const rect = trigger.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const gap = 10;

    const triggerCenterX = rect.left + rect.width / 2;
    const maxLeft = Math.max(margin, vw - popRect.width - margin);
    const left = Math.min(
      Math.max(triggerCenterX - popRect.width / 2, margin),
      maxLeft,
    );
    const arrowLeft = Math.min(
      Math.max(triggerCenterX - left, 18),
      popRect.width - 18,
    );

    const spaceBelow = vh - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const fitsBelow = rect.bottom + gap + popRect.height <= vh - margin;
    const placeBottom = fitsBelow || spaceBelow >= spaceAbove;

    const rawTop = placeBottom
      ? rect.bottom + gap
      : rect.top - popRect.height - gap;
    const maxTop = Math.max(margin, vh - popRect.height - margin);
    const top = Math.min(Math.max(rawTop, margin), maxTop);

    setCoords({
      top,
      left,
      arrowLeft,
      placement: placeBottom ? 'bottom' : 'top',
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, title, description, usage, updatePosition]);

  useEffect(() => {
    function handleAnotherOpen(event: Event) {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail !== tipId) {
        setOpen(false);
      }
    }

    window.addEventListener(HELP_OPEN_EVENT, handleAnotherOpen);
    return () => window.removeEventListener(HELP_OPEN_EVENT, handleAnotherOpen);
  }, [tipId]);

  useEffect(() => {
    if (!open) return undefined;

    function handleOutsidePointer(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    function handleViewportChange() {
      updatePosition();
    }

    document.addEventListener('mousedown', handleOutsidePointer);
    document.addEventListener('touchstart', handleOutsidePointer, {
      passive: true,
    });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer);
      document.removeEventListener('touchstart', handleOutsidePointer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, updatePosition]);

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!open) {
      window.dispatchEvent(new CustomEvent(HELP_OPEN_EVENT, { detail: tipId }));
      setOpen(true);
    } else {
      setOpen(false);
    }
  }

  return (
    <span
      className={`help-tip-anchor ${className}`.trim()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`help-tip-trigger ${open ? 'is-open' : ''}`}
        aria-label={`${title}の説明を表示`}
        aria-expanded={open}
        aria-controls={open ? tipId : undefined}
        onClick={handleToggle}
      >
        ?
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            id={tipId}
            role="dialog"
            aria-label={`${title}の説明`}
            className={`help-tip-popover is-${coords.placement}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <span
              className="help-tip-arrow"
              style={{ left: `${coords.arrowLeft}px` }}
              aria-hidden="true"
            />
            <div className="help-tip-header">
              <div className="help-tip-title-wrap">
                <span className="help-tip-badge" aria-hidden="true">
                  ?
                </span>
                <strong className="help-tip-title">{title}</strong>
              </div>
              <button
                type="button"
                className="help-tip-close"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpen(false);
                }}
                aria-label="説明を閉じる"
              >
                ×
              </button>
            </div>
            <p className="help-tip-desc">{description}</p>
            {usage && (
              <div className="help-tip-usage">
                <span className="help-tip-usage-label">使い方</span>
                <p>{usage}</p>
              </div>
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
