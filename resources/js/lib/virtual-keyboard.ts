// Keeps focused fields visible above the mobile on-screen keyboard.
//
// Android Chrome shrinks the layout viewport itself (see
// `interactive-widget=resizes-content` in app.blade.php), but iOS Safari only
// shrinks the visual viewport, leaving `fixed bottom-0` elements (bottom
// sheets, footers) hidden behind the keyboard. This module measures the
// keyboard through `window.visualViewport` and exposes it to CSS:
//
// - `--keyboard-inset` on <html>: how much of the layout viewport the keyboard
//   covers, for lifting fixed elements (`bottom-(--keyboard-inset)`).
// - `data-keyboard-open` on <html>: drives the `keyboard-open:` Tailwind
//   variant, e.g. to hide the bottom nav while typing.
//
// It also scrolls the focused field back into view once the keyboard settles.

const KEYBOARD_MIN_HEIGHT = 120;
const SETTLE_DELAY_MS = 300;

const NON_TYPING_INPUT_TYPES = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
]);

function isTypingField(element: Element | null): element is HTMLElement {
    if (!(element instanceof HTMLElement)) {
        return false;
    }

    if (element.isContentEditable) {
        return true;
    }

    if (element instanceof HTMLTextAreaElement) {
        return !element.disabled && !element.readOnly;
    }

    if (element instanceof HTMLInputElement) {
        return (
            !element.disabled &&
            !element.readOnly &&
            !NON_TYPING_INPUT_TYPES.has(element.type)
        );
    }

    return false;
}

export function initializeVirtualKeyboard(): void {
    if (
        typeof window === 'undefined' ||
        !window.visualViewport ||
        !window.matchMedia('(pointer: coarse)').matches
    ) {
        return;
    }

    const viewport = window.visualViewport;
    const root = document.documentElement;

    // Viewport height with no keyboard showing, refreshed whenever nothing is
    // focused so orientation and browser toolbar changes are picked up.
    let fullHeight = viewport.height * viewport.scale;
    let pendingField: HTMLElement | null = null;
    let revealTimer: number | undefined;

    const syncKeyboardState = (): void => {
        const height = viewport.height * viewport.scale;
        const hasTypingFocus = isTypingField(document.activeElement);

        if (!hasTypingFocus) {
            fullHeight = height;
        }

        const inset = Math.max(
            0,
            window.innerHeight - viewport.height - viewport.offsetTop,
        );
        const isOpen =
            hasTypingFocus &&
            (fullHeight - height > KEYBOARD_MIN_HEIGHT ||
                inset > KEYBOARD_MIN_HEIGHT);

        root.style.setProperty(
            '--keyboard-inset',
            `${isOpen ? Math.round(inset) : 0}px`,
        );
        root.toggleAttribute('data-keyboard-open', isOpen);
    };

    const revealPendingField = (): void => {
        const field = pendingField;
        pendingField = null;

        if (!field || field !== document.activeElement) {
            return;
        }

        const rect = field.getBoundingClientRect();
        const style = window.getComputedStyle(field);
        const visibleTop =
            viewport.offsetTop + (parseFloat(style.scrollMarginTop) || 0);
        const visibleBottom =
            viewport.offsetTop +
            viewport.height -
            (parseFloat(style.scrollMarginBottom) || 0);

        if (rect.top < visibleTop || rect.bottom > visibleBottom) {
            field.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    };

    const scheduleReveal = (delay: number): void => {
        window.clearTimeout(revealTimer);
        revealTimer = window.setTimeout(revealPendingField, delay);
    };

    const handleViewportChange = (): void => {
        syncKeyboardState();

        // The keyboard animates in over several resize events; wait for
        // them to stop before measuring where the field ended up.
        if (pendingField) {
            scheduleReveal(100);
        }
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);

    document.addEventListener('focusin', (event) => {
        if (!isTypingField(event.target as Element | null)) {
            return;
        }

        pendingField = event.target as HTMLElement;
        syncKeyboardState();
        scheduleReveal(SETTLE_DELAY_MS);
    });

    // `activeElement` only moves to the next field after `focusout`, so defer.
    document.addEventListener('focusout', () => {
        window.setTimeout(syncKeyboardState, 0);
    });
}
